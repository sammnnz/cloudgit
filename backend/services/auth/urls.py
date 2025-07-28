from django.contrib import admin
from django.urls import path
from ninja import NinjaAPI

from apps.authentication.views import router
from parser import ORJSONParser

api = NinjaAPI(parser=ORJSONParser(), csrf=True)
api.add_router('auth', router)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api.urls)
]
