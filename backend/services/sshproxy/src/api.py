import aiohttp

from .schemas import SSHKeyInSchema, StorageInSchema
from .utils import get_service_url


async def get_csrf():
    async with aiohttp.ClientSession() as session:
        async with session.get(
                get_service_url('auth') + '/session/csrf/'
        ) as response:
            return response.status, response.headers['X-CSRF-Token'], response.cookies


async def get_sshkeys(username: str):
    async with aiohttp.ClientSession() as session:
        _, token, cookies = await get_csrf()
        async with session.post(
                get_service_url('auth') + f'/user/sshkey/get/',
                json={'username': username},
                headers={'X-CSRF-Token': token},
                cookies=cookies,
        ) as response:
            if response.status != 200:
                return response.status, await response.text()

            data = await response.json()
            if data is None:
                return 200, None

            if isinstance(data, list):
                return 200, [SSHKeyInSchema(**key) if isinstance(key, dict) else None for key in data]


async def get_storage(username: str, reponame: str):
    async with aiohttp.ClientSession() as session:
        async with session.get(
                get_service_url('repo') + f'/storage/info?username={username}&reponame={reponame}'
        ) as response:
            if response.status != 200:
                raise RuntimeError(f"Failed to get storage for user '{username}', repo '{reponame}'.")

            data = await response.json()
            return StorageInSchema(**data)
