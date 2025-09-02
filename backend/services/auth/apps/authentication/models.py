from common.managers import BaseManager
from django.contrib.auth.models import AbstractUser, UserManager as _UserManager
from django.core.exceptions import MultipleObjectsReturned, ObjectDoesNotExist
from django.db import models
from django.utils.translation import gettext_lazy as _


class UserManager(_UserManager):
    def get_safe(self, **kwargs):
        try:
            return self.model.objects.get(**kwargs)
        except MultipleObjectsReturned:
            raise
        except ObjectDoesNotExist:
            return None

    async def aget_safe(self, **kwargs):
        try:
            return await self.model.objects.aget(**kwargs)
        except MultipleObjectsReturned:
            raise
        except ObjectDoesNotExist:
            return None


class User(AbstractUser):
    """
    Users within the Django authentication system are represented by this
    model.

    Username and password are required. Other fields are optional.
    """
    email = models.EmailField(
        _("email address"),
        blank=True,
        unique=True,
        # validators=[validate_email],
        # error_messages={
        #     "unique": _("A user with that email already exists."),
        # }
    )

    objects = UserManager()

    class Meta(AbstractUser.Meta):
        db_table = 'auth_user'


class SSHKeyManager(BaseManager):
    pass


class SSHKey(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    keyname = models.CharField(blank=False, max_length=32)
    sshkey = models.CharField(blank=False, max_length=256)
    fingerprint = models.TextField(blank=True, null=True)

    objects = SSHKeyManager()

    class Meta:
        db_table = 'ssh_key'
        unique_together = ('user', 'keyname')
