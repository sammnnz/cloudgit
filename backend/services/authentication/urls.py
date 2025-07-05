from django.contrib import admin
from django.urls import path, include

from . import views

api = [
    path('csrf/', views.csrf_view, name='api-csrf'),
    path('session/clear/', views.session_clear_view, name='api-session-clear'),
    path('session/info/', views.session_info_view, name='api-session-info'),
    path('session/login/', views.session_login_view, name='api-session-login'),
    path('session/logout/', views.session_logout_view, name='api-session-logout'),
    path('user/check', views.user_check_view, name='api-user-check'),
    path('user/check(?name)', views.user_check_view, name='api-user-check'),
    path('user/create/', views.user_create_view, name='api-user-create'),
    path('user/info/', views.user_info_view, name='api-user-info'),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include(api)),
]
