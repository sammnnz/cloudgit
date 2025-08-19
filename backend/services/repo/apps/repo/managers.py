import logging

from common.managers import BaseManager
from common.ssh import connections
from common.utils import check_path
from django.core.exceptions import MultipleObjectsReturned
from django.db import models
from typing import Literal, Optional, TypeVar, Any, Coroutine
from utils import get_storage_from_settings, check_storage
from .bash_api import git_checkout_and_gdsjson, git_init, rm

LOGGER = logging.getLogger('repo')
Repo = TypeVar('Repo', 'RepoManager', models.Model)
Storage = TypeVar('Storage', 'StorageManager', models.Model)
User = TypeVar('User', 'AuthUserExternalManager', models.Model)


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
                            repo_name: str,
                            access: Literal['PR', 'PU'],
                            description: str,
                            path: str,
                            general_size: int):
        repo = self.model(user_id=user_id, storage_id=storage_id, repo_name=repo_name,
                          access=access, description=description, path=path,
                          general_size=general_size, used_size=0)
        await repo.asave(using=self._db)
        return repo

    async def acreate_repo(self,
                           user: User,
                           storage: Storage,
                           repo_name: str,
                           access: Literal['PR', 'PU'],
                           description: str,
                           general_size: int,
                           **kwargs):
        if not isinstance(repo_name, str) and repo_name == "":
            raise TypeError("'repo_name' must be not empty string.")

        try:
            RepoAccessEnum(access)
        except ValueError:
            raise ValueError("'access' must be 'private' or 'public'.")

        if not isinstance(description, str):
            raise TypeError("'description' must be a string.")

        if not isinstance(general_size, int) or general_size < 0:
            raise TypeError("'general_size' must be a positive integer.")

        path = storage.path + '/' + user.username + '/' + repo_name
        if not check_path(path):
            raise TypeError("'path' is not valid.")

        await self.acreate_repo_folder(storage_name=storage.name, path=path)
        try:
            return await self._acreate_repo(user.pk,
                                            storage.pk,
                                            repo_name,
                                            access,
                                            description,
                                            path,
                                            general_size)
        except Exception as e:
            await self.adelete_repo_folder(storage_name=storage.name, path=path)
            raise e

    async def adelete_repo(self, repo: Repo):
        await repo.adelete(using=self._db)

    @staticmethod
    async def acreate_repo_folder(storage_name: str, path: str, logs: bool = False):
        output = await git_init(storage_name, path, logs)
        LOGGER.info(output)

    @staticmethod
    async def adelete_repo_folder(storage_name: str, path: str, logs: bool = False):
        output = await rm(storage_name, path, logs)
        LOGGER.info(output)

    @staticmethod
    async def aget_repo_data_json(storage_name: str, path: str, branch: str, depth: int = -1):
        json = await git_checkout_and_gdsjson(name=storage_name, path=path, branch=branch, depth=depth)
        return json


class StorageTypeEnum(models.TextChoices):
    LOCAL = 'LO', 'local'
    REMOTE = 'RE', 'remote'


class StorageManager(BaseManager):
    use_in_migrations = True

    async def _acreate_storage(self,
                               name: str,
                               **kwargs):
        try:
            storage = get_storage_from_settings(name)
        except TypeError:
            storage = None

        if storage is None:
            storage = kwargs.get('storage', None)
            try:
                check_storage(storage)
            except TypeError:
                raise TypeError("Has no valid params for connect/create storage.")

        ssh = storage['ssh']
        path = storage['path']
        storage = self.model(name=name,
                             path=path,
                             ssh_host=ssh['host'],
                             ssh_port=ssh['port'],
                             ssh_username=ssh['username'])
        await storage.asave(using=self._db)
        return storage

    async def aget_or_create_storage(self,
                                     name: str,
                                     *,
                                     raise_on_exists: bool = False,
                                     **kwargs):
        if not isinstance(name, str):
            raise TypeError("'name' must be string.")

        storage = await self.aget_safe(name=name)
        if storage is not None:
            if raise_on_exists:
                raise MultipleObjectsReturned(f"Storage '{name}' already exists.")

            return storage

        return await self._acreate_storage(name, **kwargs)

    async def aget_or_create_first_available_storage(self, required_size: int) -> Coroutine[Any, Any, Storage] | None:
        if not isinstance(required_size, int) or required_size < 0:
            raise TypeError("'required_size' must be a positive integer.")

        for name in connections:
            storage = await self.aget_safe(name=name)
            if storage is None:
                storage = await self._acreate_storage(name)

            if await storage.is_available(required_size):
                return storage

        return
