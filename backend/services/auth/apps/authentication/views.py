import json

from common.rabbitmq import ARabbitMQService
from common.utils import json_to_bytes
from django.contrib.auth import aauthenticate, alogin, alogout
from django.contrib.auth.decorators import login_required
from django.contrib.sessions.models import Session
from django.http import JsonResponse, HttpResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST, require_GET
from .models import User

rabbit = ARabbitMQService()


@require_GET
def csrf_view(request):
    """
    API endpoint for get CSRF Token.
    """
    response = HttpResponse()
    response['X-CSRF-Token'] = get_token(request)
    return response


@login_required
@require_GET
async def session_clear_view(request):
    sessions = Session.objects.all()
    await sessions.adelete()

    return HttpResponse(status=200)


@ensure_csrf_cookie
@require_GET
def session_info_view(request):
    response = {
        'is_authenticated': False,
        'username': '',
        'user_id': 0
    }
    if not request.user.is_authenticated:
        return JsonResponse(response)

    response['is_authenticated'] = True
    response['username'] = request.user.username
    response['user_id'] = request.user.id
    return JsonResponse(response)


@require_POST
async def session_login_view(request):
    data = json.loads(request.body)
    username = data.get('username')
    password = data.get('password')
    if username is None or password is None:
        return HttpResponse(status=400)

    user = await aauthenticate(username=username, password=password)
    if user is None:
        return HttpResponse(status=400)

    await alogin(request, user)
    return HttpResponse()


@login_required
@require_GET
async def session_logout_view(request):
    await alogout(request)
    return HttpResponse(status=200)


@require_GET
async def user_check_view(request, *args, **kwargs):
    name = request.GET.get('name', '')
    await rabbit.send(queues=['to_repo'], message=json_to_bytes(
        {
            "user": {
                "action": 'check',
                "username": name
            }
         }
    ))  # DEBUG
    user = await User.aget_user(name=name)
    if user is not None:
        return HttpResponse(1)

    return HttpResponse(0)


@require_POST
async def user_create_view(request, *args, **kwargs):
    data = json.loads(request.body)
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    if username is None or email is None or password is None:
        return HttpResponse(status=400)

    new_user = User(username=username, email=email)
    new_user.set_password(password)
    await new_user.asave()
    await rabbit.send(queues=['to_repo'], message=json_to_bytes(
        {
            "user": {
                "action": 'check',
                "id": new_user.pk
            }
        }
    ))
    return HttpResponse(status=200)


@login_required
@require_GET
def user_info_view(request):
    return JsonResponse({'username': request.user.username})
