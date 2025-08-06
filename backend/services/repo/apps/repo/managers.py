import os

from common.managers import BaseManager
from django.core.exceptions import MultipleObjectsReturned
from django.db import models
from pathlib import Path
from types import NoneType
from typing import Literal, Optional


class AuthUserExternalManager(BaseManager):
    use_in_migrations = True

    async def acreate_user(self, user_id: Optional[int] = None, username: str = None, **kwargs):
        if not isinstance(user_id, int):
            raise TypeError("'user_id' must be an integer.")

        if not isinstance(username, str):
            raise TypeError("'username' must be an string.")

        user = self.model(user_id=user_id, username=username)
        await user.asave(using=self._db)
        return user

    async def adelete_user(self, user_id: Optional[int] = None, username: str = None, **kwargs):
        if not isinstance(user_id, int):
            raise TypeError("'user_id' must be an integer.")

        if not isinstance(username, str):
            raise TypeError("'username' must be an string.")

        try:
            user: models.Model = await self.aget_safe(user_id=user_id, username=username)
        except MultipleObjectsReturned:
            raise

        if user is None:
            return None

        await user.adelete(using=self._db)
        return user


class MaitainerAccessEnum(models.TextChoices):
    FULL = 'f', 'full'
    PARTIAL = 'p', 'partial'


class RepoAccessEnum(models.TextChoices):
    PRIVATE = 'PR', 'private'
    PUBLIC = 'PU', 'public'


class RepoManager(BaseManager):
    use_in_migrations = True

    async def _acreate_repo(self,
                            user_id: int,
                            storage_id: int,
                            storage_path: str,
                            repo_name: str,
                            access: Literal['private', 'public'],
                            description: str,
                            path: str,
                            **kwargs):
        path = os.path.join(storage_path, path)
        repo = self.model(user_id=user_id, storage_id=storage_id,
                          repo_name=repo_name, access=access,
                          description=description, path=path)
        await repo.asave(using=self._db)
        return repo

    async def acreate_repo(self,
                           user_id: int,
                           storage_id: int,
                           storage_path: str,
                           repo_name: str,
                           access: Literal['private', 'public'],
                           description: str,
                           path: str,
                           **kwargs):
        if not isinstance(user_id, int):
            raise TypeError("'user_id' must be an integer.")

        if not isinstance(storage_id, int):
            raise TypeError("'storage_id' must be an integer.")

        try:
            Path(storage_path)
        except (ValueError, OSError):
            raise TypeError("'storage_path' must be a path.")

        if not isinstance(repo_name, str) and repo_name == "":
            raise TypeError("'repo_name' must be not empty string.")

        if access not in ('private', 'public'):
            raise ValueError("'access' must be 'private' or 'public'.")

        if not isinstance(description, str):
            raise TypeError("'description' must be a string.")

        try:
            Path(path)
        except (ValueError, OSError):
            raise TypeError("'path' must be a path.")

        return await self._acreate_repo(user_id, storage_id, storage_path,
                                        repo_name, getattr(RepoAccessEnum, access.upper()),
                                        description, path, **kwargs)


class StorageTypeEnum(models.TextChoices):
    LOCAL = 'LO', 'local'
    REMOTE = 'RE', 'remote'


class StorageManager(BaseManager):
    use_in_migrations = True

    async def _acreate_storage(self,
                               name: str,
                               link: Optional[str],
                               type: Literal['local', 'remote'],
                               path: Optional[str], **kwargs):
        storage = self.model(name=name, link=link, type=type, path=path)
        await storage.asave(using=self._db)
        return storage

    async def acreate_storage(self,
                              name: str = 'default',
                              link: Optional[str] = None,
                              type: Literal['local', 'remote'] = 'local',
                              path: Optional[str] = None,
                              **kwargs):
        if not isinstance(name, str):
            raise TypeError("'name' must be string.")

        if not isinstance(link, (str, NoneType)):
            raise TypeError("'link' must be string or None.")

        if type not in ('local', 'remote'):
            raise TypeError("'type' value must be 'local or 'remote'.")

        if not isinstance(path, str):
            raise TypeError("'path' must be string.")

        try:
            Path(path)
        except (ValueError, OSError):
            raise TypeError("'path' must be a path.")

        return await self._acreate_storage(name, link, getattr(StorageTypeEnum, type.upper()), path, **kwargs)
