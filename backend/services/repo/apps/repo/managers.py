from common.managers import BaseManager
from django.core.exceptions import MultipleObjectsReturned
from django.db import models
from typing import Optional


class AuthUserExternalManager(BaseManager):
    use_in_migrations = True

    async def acreate_user(self, _id: Optional[int] = None, username: str = None, **kwargs):
        if not isinstance(_id, int):
            raise TypeError("'_id' must be an integer.")

        if not isinstance(username, str):
            raise TypeError("'username' must be an string.")

        user = self.model(user_id=_id, username=username)
        await user.asave(using=self._db)
        return user

    async def adelete_user(self, _id: Optional[int] = None, username: str = None, **kwargs):
        if not isinstance(_id, int):
            raise TypeError("'_id' must be an integer.")

        if not isinstance(username, str):
            raise TypeError("'username' must be an string.")

        try:
            user: models.Model = await self.aget_safe(user_id=_id, username=username)
        except MultipleObjectsReturned:
            raise

        if user is None:
            return None

        await user.adelete(using=self._db)
        return user


class StorageManager(BaseManager):
    use_in_migrations = True
