from typing import Union, List

import aiohttp
from asgiref.sync import sync_to_async
from django.core.exceptions import SynchronousOnlyOperation
from django.db import IntegrityError

from common.rabbitmq import ARabbitMQService
from common.utils import json_to_bytes
from ninja import Router
from .models import AuthUserExternal, Storage, Repo
from .schemas import *
from .utils import get_service_url, get_storage

rabbit = ARabbitMQService()
router = Router()


@router.get('/repo/check', response={200: bool})
async def repo_check(request, username: str, reponame: str):
    """ Return True if repo exists. Else return False. """
    user = await AuthUserExternal.objects.aget_safe(username=username)
    if user is None:
        return 200, False

    repo = await Repo.objects.aget_safe(user_id=user.pk, repo_name=reponame)
    if repo is not None:
        return 200, True

    return 200, False


@router.post('/repo/create/', response={200: None, 404: str, 422: str})
async def repo_create(request, data: RepoCreateInSchema):
    user = await AuthUserExternal.objects.aget_safe(username=data.username)
    if user is None:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                    get_service_url('auth') + f'/user/info?username={data.username}'
            ) as response:
                if response.status != 200:
                    return 404, (f"The repository could not be created because "
                                 f"the user {data.username} no longer exists.")
                _data = await response.json()
                user = await AuthUserExternal.objects.acreate_user(user_id=_data["id"], username=_data["username"])

    storage = await Storage.objects.aget_safe(name='default')
    if storage is None:
        storage = await Storage.objects.acreate_storage(**get_storage(name='default'))

    try:
        await Repo.objects.acreate_repo(user_id=user.pk,
                                        storage_id=storage.pk,
                                        storage_path=storage.path,
                                        repo_name=data.reponame,
                                        access=data.access,
                                        description=data.description,
                                        path="/")
    except IntegrityError:
        return 422, f"Repository '{data.reponame}' already exists."

    return 200, None


@router.post('/repo/get/', response={200: List[RepoGetOutSchema], 404: str})
async def repo_get(request, data: RepoGetInSchema):
    user = await AuthUserExternal.objects.aget_safe(username=data.username)
    if data.reponame is None:
        if data.access is None:
            repos = await Repo.objects.aget_safe(multi_return=True, user=user)
        else:
            repos = await Repo.objects.aget_safe(multi_return=True, user=user, access=data.access)
    else:
        try:
            repos = await Repo.objects.aget_safe(user=user, repo_name=data.reponame)
        except Repo.DoesNotExist:
            repos = None

    if repos is None:
        return 404, f"Repository '{data.reponame}' could not be found."

    if isinstance(repos, Repo):
        try:
            repos.user = user
        except SynchronousOnlyOperation:
            sync_to_async(lambda r, u: setattr(r, "user", u))(repos, user)

        repos = [repos]
    else:
        async for repo in repos:
            repo.user = user

    return 200, repos


@router.post('/storage/create/')
async def storage_create(request):
    pass
