import aiohttp

from apps.repo.schemas import AuthUserInSchema
from apps.repo.utils import get_service_url


async def get_user_info(username: str):
    async with aiohttp.ClientSession() as session:
        async with session.get(
                get_service_url('auth') + f'/user/info?username={username}'
        ) as response:
            if response.status != 200:
                return response.status, f"User {username} not found."

            data = await response.json()
            return 200, AuthUserInSchema(**data)
