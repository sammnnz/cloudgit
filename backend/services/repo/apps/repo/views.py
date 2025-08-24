from asgiref.sync import sync_to_async
from common.rabbitmq import ARabbitMQService
from django.core.exceptions import SynchronousOnlyOperation
from django.db import IntegrityError
from ninja import Router
from typing import List, cast, Type
from .api.auth import get_user_info
from .schemas import *

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
    status, user = await get_user_info(data.username)
    user_ext = await AuthUserExternal.objects.aget_safe(username=data.username)
    if status != 200:
        if user_ext is not None:

            await AuthUserExternal.objects.adelete_user(user_id=user_ext.user_id, username=user_ext.username)

        return 404, (f"The repository could not be created because "
                     f"the user {data.username} no longer exists.")

    if user_ext is None:
        user_ext = await AuthUserExternal.objects.acreate_user(user_id=user.id, username=user.username)
    elif user.id != user_ext.user_id:
        await AuthUserExternal.objects.adelete_user(user_id=user_ext.user_id, username=user_ext.username)
        user_ext = await AuthUserExternal.objects.acreate_user(user_id=user.id, username=user.username)

    repo = await Repo.objects.aget_safe(user_id=user_ext.pk, repo_name=data.reponame)
    if repo is not None:
        return 422, f"Repository '{data.reponame}' already exists."

    storage = await Storage.objects.aget_or_create_first_available_storage(50 * 1024)  # 50MB to KB
    if storage is None:
        return 404, "Doesn't available storages."

    try:
        await Repo.objects.acreate_repo(user=user_ext,
                                        storage=storage,
                                        repo_name=data.reponame,
                                        access=data.access,
                                        description=data.description,
                                        general_size=50 * 1024)
    except IntegrityError:
        return 422, f"Repository '{data.reponame}' already exists or problems with database."
    except RuntimeError:
        return 404, f"Problems with storage '{storage.name}'."

    return 200, None


@router.post('/repo/delete/', response={200: None, 404: str, 422: str})
async def repo_delete(request, data: RepoDeleteInSchema):
    status, user = await get_user_info(data.username)
    user_ext = await AuthUserExternal.objects.aget_safe(username=data.username)
    if status != 200:
        if user_ext is not None:
            await AuthUserExternal.objects.adelete_user(user_id=user_ext.user_id, username=user_ext.username)

        return 200, None

    if user_ext is None:
        await AuthUserExternal.objects.acreate_user(user_id=user.id, username=user.username)
        return 200, None

    if user.id != user_ext.user_id:
        await AuthUserExternal.objects.adelete_user(user_id=user_ext.user_id, username=user_ext.username)
        await AuthUserExternal.objects.acreate_user(user_id=user.id, username=user.username)
        return 200, None

    repo = await Repo.objects.aget_safe(user_id=user_ext.pk, repo_name=data.reponame)
    if repo is None:
        return 200, None

    try:
        await Repo.objects.adelete_repo(repo)
    except Exception as e:
        return 404, str(e)

    return 200, None


@router.post('/repo/data/get/', response={200: list, 404: str})
async def repo_data_get(request, data: RepoDataGetInSchema):
    status, user = await get_user_info(data.username)
    user_ext = await AuthUserExternal.objects.aget_safe(username=data.username)
    if status != 200:
        if user_ext is not None:
            await AuthUserExternal.objects.adelete_user(user_id=user_ext.user_id, username=user_ext.username)

        return 404, (f"The repository '{data.reponame}' could not be found "
                     f"because the user '{data.username}' no longer exists.")

    if user_ext is None:
        await AuthUserExternal.objects.acreate_user(user_id=user.id, username=user.username)
        return 404, f"Repository '{data.reponame}' could not be found."

    if user.id != user_ext.user_id:
        await AuthUserExternal.objects.adelete_user(user_id=user_ext.user_id, username=user_ext.username)
        await AuthUserExternal.objects.acreate_user(user_id=user.id, username=user.username)
        return 404, f"Repository '{data.reponame}' could not be found."

    repo = await Repo.objects.aget_safe(user=user_ext, repo_name=data.reponame)
    if repo is None:
        return 404, f"Repository '{data.reponame}' could not be found."

    storage = await Storage.objects.aget_safe(id=repo.storage_id)
    try:
        repo_data = await Repo.objects.aget_repo_data_json(storage_name=storage.name,
                                                           path=repo.path,
                                                           dir=data.dir,
                                                           branch=data.branch,
                                                           depth=-1)
        return 200, repo_data
    except RuntimeError as e:
        try:
            return 404, "Problem with getting repo data."
        finally:
            raise e


@router.post('/repo/get/', response={200: List[RepoGetOutSchema], 404: str})
async def repo_get(request, data: RepoGetInSchema):
    status, user = await get_user_info(data.username)
    user_ext = await AuthUserExternal.objects.aget_safe(username=data.username)
    if status != 200:
        if user_ext is not None:
            await AuthUserExternal.objects.adelete_user(user_id=user_ext.user_id, username=user_ext.username)

        return 404, f"User '{data.username}' no longer exists."

    if user_ext is None:
        await AuthUserExternal.objects.acreate_user(user_id=user.id, username=user.username)
        return 404, "Repositories could not be found."

    if user.id != user_ext.user_id:
        await AuthUserExternal.objects.adelete_user(user_id=user_ext.user_id, username=user_ext.username)
        await AuthUserExternal.objects.acreate_user(user_id=user.id, username=user.username)
        return 404, "Repositories could not be found."

    if data.reponame is None:
        if data.access is None:
            repos = await Repo.objects.aget_safe(multi_return=True, user=user_ext)
        else:
            repos = await Repo.objects.aget_safe(multi_return=True, user=user_ext, access=data.access)
    else:
        try:
            repos = await Repo.objects.aget_safe(user=user_ext, repo_name=data.reponame)
        except Repo.DoesNotExist:
            repos = None

    if repos is None:
        return 404, f"Repository '{data.reponame}' could not be found."

    if isinstance(repos, Repo):
        try:
            repos.user = user_ext
        except SynchronousOnlyOperation:
            sync_to_async(lambda r, u: setattr(r, "user", u))(repos, user_ext)

        repos = [repos]
    else:
        async for repo in repos:
            repo.user = user_ext

    return 200, repos


@router.post('/storage/create/')
async def storage_create(request):
    pass


@router.get('/storage/info', response={200: StorageOutSchema, 400: str})
async def storage_info(request, username: str, reponame: str):
    status, user = await get_user_info(username)
    user_ext = await AuthUserExternal.objects.aget_safe(username=username)
    if status != 200:
        if user_ext is not None:
            await AuthUserExternal.objects.adelete_user(user_id=user_ext.user_id, username=user_ext.username)

        return 400, (f"User '{username}' no longer exists.")

    if user_ext is None:
        await AuthUserExternal.objects.acreate_user(user_id=user.id, username=user.username)
        return 400, f"Repository '{reponame}' could not be found."

    if user.id != user_ext.user_id:
        await AuthUserExternal.objects.adelete_user(user_id=user_ext.user_id, username=user_ext.username)
        await AuthUserExternal.objects.acreate_user(user_id=user.id, username=user.username)
        return 400, f"Repository '{reponame}' could not be found."

    repo = await Repo.objects.aget_safe(select_related="storage", user_id=user_ext.pk, repo_name=reponame)
    if repo is None:
        return 400, f"Repository '{reponame}' could not be found."

    return cast(tuple[int, Type[Storage]], (200, repo.storage))
