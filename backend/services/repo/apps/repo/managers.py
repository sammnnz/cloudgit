import os

from common.managers import BaseManager
from django.conf import settings
from django.core.exceptions import MultipleObjectsReturned
from django.db import models
from typing import Literal, Optional, TypeVar
from common.utils import get_storage, check_storage, check_path
from common.ssh import ssh_exec, ssh_parse_output

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
                            **kwargs):
        repo = self.model(user_id=user_id, storage_id=storage_id, repo_name=repo_name,
                          access=access, description=description, path=path)
        await repo.asave(using=self._db)
        return repo

    @staticmethod
    async def _acreate_repo_folder(path: str):
        commands = [
            f"mkdir -p {path}",
            f"cd {path}",
            "git init"
        ]
        run = await ssh_exec(commands)
        ssh_parse_output(run, commands)

    @staticmethod
    async def _adelete_repo_folder(path: str):
        commands = [f"rm {path}"]
        run = await ssh_exec(commands)
        ssh_parse_output(run, commands)

    async def acreate_repo(self,
                           user: User,
                           storage: Storage,
                           repo_name: str,
                           access: Literal['PR', 'PU'],
                           description: str,
                           **kwargs):
        if not isinstance(repo_name, str) and repo_name == "":
            raise TypeError("'repo_name' must be not empty string.")

        try:
            RepoAccessEnum(access)
        except ValueError:
            raise ValueError("'access' must be 'private' or 'public'.")

        if not isinstance(description, str):
            raise TypeError("'description' must be a string.")

        path = storage.path + '/' + user.username + '/' + repo_name
        if not check_path(path):
            raise TypeError("'path' is not valid.")

        await self._acreate_repo_folder(path=path)
        try:
            return await self._acreate_repo(user.pk,
                                            storage.pk,
                                            repo_name,
                                            access,
                                            description,
                                            path,
                                            ** kwargs)
        except Exception as e:
            await self._adelete_repo_folder(path=path)
            raise e


class StorageTypeEnum(models.TextChoices):
    LOCAL = 'LO', 'local'
    REMOTE = 'RE', 'remote'


class StorageManager(BaseManager):
    use_in_migrations = True

    async def _acreate_storage(self,
                               name: str,
                               **kwargs):
        try:
            storage_info = get_storage(settings, name)
        except TypeError:
            storage_info = None

        if storage_info is None:
            try:
                check_storage(kwargs.get('storage', None))
            except TypeError:
                raise TypeError("Has no valid params for connect/create storage.")

        ssh = storage_info['ssh']
        path = storage_info['path']
        size = storage_info['size']
        if size < 500:
            raise ValueError("'size' must be greater than 500.")

        path = os.path.join(path)
        commands = [
            f"mkdir -p {path}",
            f"cd {path}",
            "df --out=target --output=avail"
        ]
        run = await ssh_exec(commands)
        ssh_parse_output(run, commands)
        storage = self.model(name=name,
                             general_size=size,
                             used_size=0,
                             path=path,
                             ssh_host=ssh['host'],
                             ssh_port=ssh['port'],
                             ssh_username=ssh['username'])
        await storage.asave(using=self._db)
        return storage

    async def acreate_storage(self,
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
