import logging

from aio_pika.abc import AbstractIncomingMessage
from common.rabbitmq import consume_callback, CancelAcknowledge
from common.utils import bytes_to_json
from django.db import models, IntegrityError
from django.utils.translation import gettext_lazy as _
# https://pypi.org/project/django-enum/
from django_enum import EnumField
from .managers import AuthUserExternalManager, StorageManager

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
        await fn(**{"_id": _id, "username": username})
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
    class AccessEnum(models.TextChoices):
        FULL = 'f', 'full'
        PARTIAL = 'p', 'partial'

    id = models.BigAutoField(primary_key=True)
    repo = models.ForeignKey('Repo', on_delete=models.CASCADE)
    user = models.ForeignKey(AuthUserExternal, on_delete=models.CASCADE, db_index=False)
    access = EnumField(AccessEnum, db_comment='values: full, partial')

    class Meta:
        db_table = 'maintainer'


class Repo(models.Model):
    class AccessEnum(models.TextChoices):
        PRIVATE = 'PR', 'private'
        PUBLIC = 'PU', 'public'

    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(AuthUserExternal, on_delete=models.CASCADE, db_comment='repo holder')
    storage = models.ForeignKey('Storage', on_delete=models.SET_NULL, blank=True, null=True,
                                db_comment='`NULL` when repo store locale')
    name = models.CharField(max_length=32)
    access = EnumField(AccessEnum, db_index=True, db_comment='values: private, public')
    path = models.CharField(max_length=255, db_comment='path into storage')

    class Meta:
        db_table = 'repo'


class Storage(models.Model):
    id = models.BigAutoField(primary_key=True)
    link = models.CharField(max_length=255, blank=False)

    objects = StorageManager()

    class Meta:
        db_table = 'storage'
