from django.urls import path, include

from . import views

api = [

]

urlpatterns = [
    path('api/repo/', include(api)),
]
