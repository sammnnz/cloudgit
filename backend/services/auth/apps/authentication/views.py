from common.rabbitmq import ARabbitMQService
from common.schemas import RabbitSchema
from common.utils import json_to_bytes
from django.contrib.auth import aauthenticate, alogin, alogout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from ninja import Router
from .models import User
from .schemas import SessionInfoOut, SessionLoginIn, UserOutSchema, UserInSchema

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
