import logging

from aio_pika.abc import AbstractIncomingMessage
from django.db.models import F, Value, Func
from django.db.models.functions import Concat

from common.rabbitmq import consume_callback, CancelAcknowledge
from common.utils import bytes_to_json
from django.db import models, IntegrityError
from django.utils.translation import gettext_lazy as _
# https://pypi.org/project/django-enum/
from django_enum import EnumField
from .managers import AuthUserExternalManager, MaitainerAccessEnum, RepoAccessEnum, RepoManager, StorageManager

LOGGER = logging.getLogger('repo')


@consume_callback(queues=['to_repo'], ack=True)
async def _on_change_user(msg: AbstractIncomingMessage):
    """
    Note:
        If raise IntegrityError in 'acreate' or 'adelete', then incomming message is acknowledged.
        It means, that this callback don't apply force changes.
    """
    data: dict = bytes_to_json(msg.body)
    if not data.get('service', '').startswith('auth'):
        raise CancelAcknowledge

    if not data.get('table', '').endswith('user'):
        raise CancelAcknowledge

    _id = data.get('id', None)
    if not _id:
        raise CancelAcknowledge

    username = data.get('info', {}).get('username', None)
    if not username:
        raise CancelAcknowledge

    action = data.get('action', '')
    fn = getattr(AuthUserExternal.objects, 'a' + action + '_user', None)
    if fn is None:
        raise CancelAcknowledge

    try:
        await fn(**{"user_id": _id, "username": username})
    except IntegrityError:
        LOGGER.warning(f"Failed on {action} of user '{username}', "
                       f"but incoming message is acknowledged.")
        return None

    LOGGER.info(f"Success {action} of user '{username}'.")


class AuthUserExternal(models.Model):
    id = models.AutoField(_("id"), primary_key=True)
    user_id = models.IntegerField(_("user id"), unique=True, blank=False)
    username = models.CharField(_("username"), max_length=150, blank=False)

    objects = AuthUserExternalManager()

    class Meta:
        db_table = 'auth_user_external'


class Branch(models.Model):
    id = models.BigAutoField(primary_key=True)
    repo = models.ForeignKey('Repo', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    is_default = models.BooleanField(db_index=True)

    class Meta:
        db_table = 'branch'


class File(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255)
    path = models.CharField(max_length=255, db_comment='relative path into repo')
    ext = models.CharField(max_length=255, blank=True, null=True, db_index=True,
                           db_comment='`NULL` equal without extension')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)

    class Meta:
        db_table = 'file'


class Maintainer(models.Model):
    id = models.BigAutoField(primary_key=True)
    repo = models.ForeignKey('Repo', on_delete=models.CASCADE)
    user = models.ForeignKey(AuthUserExternal, on_delete=models.CASCADE, db_index=False)
    access = EnumField(MaitainerAccessEnum, db_comment='values: full, partial')

    class Meta:
        db_table = 'maintainer'


class Repo(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(AuthUserExternal, on_delete=models.CASCADE, db_comment='repo holder')
    storage = models.ForeignKey('Storage', on_delete=models.SET_NULL, blank=False, null=True,
                                db_comment='local or remote')
    repo_name = models.CharField(
        blank=False,
        max_length=32,
        error_messages={
            'max_length': _("Repo name must be less than 32 characters."),
        }
    )
    access = EnumField(RepoAccessEnum, db_index=True, db_comment='values: private, public')
    description = models.CharField(_("repo description"), blank=False, max_length=50)
    path = models.CharField(_("repo path into storage"), blank=False, max_length=255)

    objects = RepoManager()

    class Meta:
        db_table = 'repo'
        unique_together = ('user', 'repo_name')


class Storage(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(
        max_length=32,
        unique=True,
        blank=False,
        help_text=_(
            "Required. May be unique."
        ),
        error_messages={
            'max_length': _("Storage name must be less than 32 characters."),
        }
    )
    general_size = models.PositiveIntegerField(
        _("Storage size in KB."),
        blank=False,
    )
    used_size = models.PositiveIntegerField(
        _("Storage used size in KB."),
        blank=False,
    )
    available_size = models.GeneratedField(
        expression=F("general_size") - F("used_size"),
        output_field=models.PositiveIntegerField(),
        db_persist=True,  # for postgres
        db_comment="If < 500mb, then storage will not be available for creating new repositories."
    )
    path = models.CharField(max_length=255, blank=False)
    ssh_host = models.CharField(max_length=128, blank=False)
    ssh_port = models.IntegerField(blank=True, null=True)
    ssh_username = models.CharField(max_length=32, blank=False)
    # ssh_password = models.CharField(max_length=128, blank=False)

    objects = StorageManager()

    class Meta:
        db_table = 'storage'
