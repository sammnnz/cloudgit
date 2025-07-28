from django.contrib.auth.models import AbstractUser, UserManager as _UserManager
from django.core.exceptions import MultipleObjectsReturned, ObjectDoesNotExist
from django.db.models import EmailField
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
    email = EmailField(
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
