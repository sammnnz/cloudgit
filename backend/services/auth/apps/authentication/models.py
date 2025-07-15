from django.contrib.auth.models import AbstractUser
from django.core.exceptions import MultipleObjectsReturned, ObjectDoesNotExist


class User(AbstractUser):
    """
    Users within the Django authentication system are represented by this
    model.

    Username and password are required. Other fields are optional.
    """

    class Meta(AbstractUser.Meta):
        db_table = 'auth_user'

    @classmethod
    def get_user(cls, name):
        try:
            return cls.objects.get(username=name)
        except MultipleObjectsReturned as e:
            raise e
        except ObjectDoesNotExist:
            return

    @classmethod
    async def aget_user(cls, name):
        try:
            return await cls.objects.aget(username=name)
        except MultipleObjectsReturned as e:
            raise e
        except ObjectDoesNotExist:
            return
