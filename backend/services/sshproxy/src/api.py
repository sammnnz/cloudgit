import aiohttp

from .schemas import StorageInSchema
from .utils import get_service_url


async def get_storage(username: str, reponame: str):
    async with aiohttp.ClientSession() as session:
        async with session.get(
                get_service_url('repo') + f'/storage/info?username={username}&reponame={reponame}'
        ) as response:
            if response.status != 200:
                raise RuntimeError(f"Failed to get storage for user '{username}', repo '{reponame}'.")

            data = await response.json()
            return StorageInSchema(**data)
