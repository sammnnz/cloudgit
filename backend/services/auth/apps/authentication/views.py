import logging

from asgiref.sync import sync_to_async
from common.rabbitmq import ARabbitMQService
from common.schemas import RabbitSchema
from common.utils import json_to_bytes
from django.contrib.auth import aauthenticate, alogin, alogout
from django.contrib.auth.decorators import login_required
from django.core.exceptions import SynchronousOnlyOperation
from django.db import IntegrityError
from django.http import HttpResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from ninja import Router
from typing import Optional
from .models import User, SSHKey
from .schemas import SessionInfoOut, SessionLoginIn, UserOutSchema, UserInSchema, UserSSHKeyAddInSchema, \
    UserSSHKeysInSchema, UserSSHKeyOutSchema

logger = logging.getLogger('repo')
rabbit = ARabbitMQService()
router = Router()


@router.get('/session/csrf/')
@ensure_csrf_cookie
def session_csrf(request):
    """
    API endpoint for get CSRF Token.
    """
    response = HttpResponse()
    response['X-CSRF-Token'] = get_token(request)
    return response


@router.get('/session/info/', response=SessionInfoOut)
def session_info(request):
    return request.user


@router.post('/session/login/', response={204: None, 422: str})
async def session_login(request, data: SessionLoginIn):
    user = await aauthenticate(username=data.username, password=data.password)
    if user is None:
        return 422, "Username or password invalid."

    await alogin(request, user)
    return 204, None


@router.get('/session/logout/', response={200: None})
@login_required
async def session_logout(request):
    await alogout(request)
    return 200, None


@router.get('/user/check', response={200: bool})
async def user_check(request, username: str):
    """ Return True if user exists. Else return False. """
    user = await User.objects.aget_safe(username=username)
    if user is not None:
        return 200, True

    return 200, False


@router.post('/user/create/', response={204: None, 422: str})
async def user_create(request, data: UserInSchema):
    try:
        user = await User.objects.acreate_user(
            data.username, data.email, data.password
        )
    except IntegrityError:
        return 422, f"User with username '{data.username}' or email '{data.email}' already exists."

    msg = RabbitSchema.create(user, info={"username": data.username}).model_dump()
    await rabbit.send(queues=['to_repo'], message=json_to_bytes(msg))
    return 204, None


@router.post('/user/delete/', response={200: None, 422: str})
@login_required
async def user_delete(request):
    user = await getattr(request, "auser")()
    msg = RabbitSchema.delete(user, info={"username": user.username}).model_dump()
    await user.adelete()
    await rabbit.send(queues=['to_repo'], message=json_to_bytes(msg))
    return 200, None


@router.get('/user/info', response={200: UserOutSchema, 404: str})
async def user_info(request, username: str):
    user = await User.objects.aget_safe(username=username)
    if user is not None:
        return 200, user

    return 404, "User not found."


@router.post('/user/sshkey/add/', response={200: None, 403: str, 500: str})
async def user_sshkey_add(request, data: UserSSHKeyAddInSchema):
    user = await User.objects.aget_safe(username=data.username)
    if user is None:
        return 403, f"User '{data.username}' not exists."

    sshkey = SSHKey(user_id=user.pk, keyname=data.keyname, sshkey=data.sshkey, fingerprint=None)
    try:
        await sshkey.asave()
    except IntegrityError:
        return 500, f"SSH key '{data.keyname}' already exists."
    except Exception:
        logger.warning(f"Failed to add SSH key '{data.keyname}'", exc_info=True)
        return 500, f"Failed to add SSH key '{data.keyname}'."

    return 200, None


@router.post('/user/sshkey/get/', response={200: Optional[list[UserSSHKeyOutSchema]], 500: str})
async def user_sshkey_get(request, data: UserSSHKeysInSchema):
    user = await User.objects.aget_safe(username=data.username)
    if user is None:
        return 500, f"User '{data.username}' not exists."

    if data.keyname is None:
        sshkeys = await sync_to_async(SSHKey.objects.filter)(user_id=user.pk)
        if not await sshkeys.aexists():
            return 200, None
    else:
        sshkeys = await SSHKey.objects.aget_safe(user_id=user.pk, keyname=data.keyname)
        if sshkeys is None:
            return 200, None

    if isinstance(sshkeys, SSHKey):
        try:
            sshkeys.user = user
        except SynchronousOnlyOperation:
            sync_to_async(lambda s, u: setattr(s, "user", u))(sshkeys, user)

        sshkeys = [sshkeys]
    else:
        async for key in sshkeys:
            key.user = user

    return 200, sshkeys
