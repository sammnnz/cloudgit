from common.utils import check_path
from django.conf import settings
from functools import lru_cache
from typing import Any


def _storage_ssh_requires():
    yield "host", str
    yield "port", (int, str)
    yield "username", str
    yield "client_keys", list


def check_storage(storage: Any):
    if not isinstance(storage, dict):
        raise TypeError("Settings has no valid 'STORAGES' object.")

    if not isinstance(storage.get('ssh', None), dict):
        raise TypeError('ssh must be a dict')

    ssh = storage.get('ssh', None)
    if not isinstance(ssh, dict):
        raise TypeError('ssh must be a dict')

    for k, t in _storage_ssh_requires():
        if not isinstance(ssh.get(k, None), t):
            raise TypeError(f"ssh '{k}' must be a '{t}'")

    if not check_path(storage.get('path', None)):
        raise TypeError("invalid path")


@lru_cache
def get_storage_from_settings(name: str):
    storages = getattr(settings, 'STORAGES', {})
    if not isinstance(storages, dict):
        raise TypeError("'STORAGES' must be a dictionary.")

    storage = storages.get(name, None)
    check_storage(storage)
    return storage


def get_storages_from_settings():
    storages = getattr(settings, 'STORAGES', {})
    if not isinstance(storages, dict):
        raise TypeError("'STORAGES' must be a dictionary.")

    for name in storages:
        storage = storages[name]
        check_storage(storage)
        yield name, storage
