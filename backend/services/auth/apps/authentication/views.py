# from rest_framework.authentication import SessionAuthentication, BasicAuthentication
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response
# from rest_framework.views import APIView
#
#
# class UsersView(APIView):
#     authentication_classes = [SessionAuthentication, BasicAuthentication]
#     permission_classes = [IsAuthenticated]
#
#     def get(self, request, format=None):
#         content = {
#             'user': str(request.user),  # `django.contrib.auth.User` instance.
#             'auth': str(request.auth),  # None
#         }
#         return Response(content)

import json

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.sessions.models import Session
from django.http import JsonResponse, HttpResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST, require_GET
from common import rabbitmq
# class CSRFView(generics.ListAPIView):
#     """
#     API endpoint for get CSRF Token.
#     """
#
#     def get(self, request, *args, **kwargs):
#         response = HttpResponse()
#         response['X-CSRF-Token'] = get_token(request)
#         return response


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
def session_clear_view(request):
    sessions = Session.objects.all()
    sessions.delete()

    return HttpResponse(status=200)


@ensure_csrf_cookie
@require_GET
def session_info_view(request):
    # sleep(5)
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
def session_login_view(request):
    data = json.loads(request.body)
    username = data.get('username')
    password = data.get('password')
    if username is None or password is None:
        return HttpResponse(status=400)

    user = authenticate(username=username, password=password)
    if user is None:
        return HttpResponse(status=400)

    login(request, user)
    return HttpResponse()


@login_required
@require_GET
def session_logout_view(request):
    if not request.user.is_authenticated:
        return HttpResponse(status=400)

    logout(request)
    return HttpResponse(status=200)


@require_GET
def user_check_view(request, *args, **kwargs):
    user = User.objects.filter(username=request.GET.get('name', ''))
    if user.exists():
        return HttpResponse(1)

    return HttpResponse(0)


@require_POST
def user_create_view(request, *args, **kwargs):
    data = json.loads(request.body)
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    if username is None or email is None or password is None:
        return HttpResponse(status=400)

    new_user = User(username=username, email=email)
    new_user.set_password(password)
    new_user.save()
    return HttpResponse(status=200)


@login_required
@require_GET
def user_info_view(request):
    return JsonResponse({'username': request.user.username})
