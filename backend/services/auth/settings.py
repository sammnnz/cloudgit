"""
Django prod settings for authentication service.

"""
import os

from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent  # auth/

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DJANGO_DEBUG')

ALLOWED_HOSTS = []

# CORS
CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    'Content-Type',
    'X-CSRF-Token',
]

CORS_ALLOWED_ORIGINS = [
    os.getenv('REMOTE_SERVER_URL')
]

CORS_EXPOSE_HEADERS = [
    'Content-Type',
    'X-CSRF-Token',
]

CSRF_HEADER_NAME = 'HTTP_X_CSRF_TOKEN'
# !CORS

# CSRF
CSRF_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SAMESITE = 'Lax'

# For development with `HTTP`
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_HTTPONLY = True

# For production with `HTTPS`
# CSRF_COOKIE_SECURE = True
# SESSION_COOKIE_SECURE = True

CSRF_TRUSTED_ORIGINS = [
    os.getenv('REMOTE_SERVER_URL')
]

SESSION_COOKIE_AGE = 60 * 60 * 24 * 7  # 1 week
# !CSRF

# Application definition

AUTH_USER_MODEL = "authentication.User"

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.messages',  # for admin
    'django.contrib.sessions',
    'corsheaders',
    'rest_framework',
    'apps.authentication',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',  # for admin
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'corsheaders.middleware.CorsMiddleware'
]

RABBITMQ = {
    'host': os.getenv('DJANGO_RABBITMQ_HOST'),
    'port': os.getenv('DJANGO_RABBITMQ_PORT'),
    'user': os.getenv('DJANGO_RABBITMQ_USER'),
    'password': os.getenv('DJANGO_RABBITMQ_PASS'),
    'vhost': os.getenv('DJANGO_RABBITMQ_VHOST'),
    'heartbeat': 60,
    'defaults': {
        'exchange': 'cloudgit',
        'queues': [

        ]
    }
}

ROOT_URLCONF = 'urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

ASGI_APPLICATION = 'server.asgi.application'
WSGI_APPLICATION = 'server.wsgi.application'

# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': os.getenv('DJANGO_POSTGRES_DB_NAME'),
        'USER': os.getenv('DJANGO_POSTGRES_USER'),
        'PASSWORD': os.getenv('DJANGO_POSTGRES_PASSWORD'),
        'HOST': os.getenv('DJANGO_POSTGRES_HOST'),
        'PORT': os.getenv('DJANGO_POSTGRES_PORT')
    },
}

# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Europe/Moscow'

USE_I18N = True

USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = 'static/'

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
