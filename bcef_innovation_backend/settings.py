import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

# Charger les variables d'environnement depuis un fichier .env
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# Sécurité
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'django-insecure-y&(jgap66un9%r+bs^3@-&7xg9_k_*moh=h(6cbf97o)2t8(ng'
)  # Remplacer en prod via .env
DEBUG = os.getenv('DJANGO_DEBUG', 'False').lower() in ['true', '1', 't']

# Configuration des hôtes autorisés. Optionel pour le développement
ALLOWED_HOSTS = os.getenv('DJANGO_ALLOWED_HOSTS', 'localhost').split(',')

# Configuration REST Framework avec JWT
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

# Email configuration sécurisée
EMAIL_BACKEND = os.getenv('DJANGO_EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = os.getenv('DJANGO_EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('DJANGO_EMAIL_PORT', 587))
EMAIL_USE_TLS = os.getenv('DJANGO_EMAIL_USE_TLS', 'True').lower() in ['true', '1', 't']
EMAIL_HOST_USER = os.getenv('DJANGO_EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('DJANGO_EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = os.getenv('DJANGO_DEFAULT_FROM_EMAIL', 'sizeofkings@gmail.com')


# Redis configuration pour Celery et cache
CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'
CELERY_TIMEZONE = 'UTC'

# Configuration du cache avec Redis pour accélérer les performances
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": os.getenv('REDIS_CACHE_LOCATION', "redis://127.0.0.1:6379/1"),
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        }
    }
}

# Applications installées
INSTALLED_APPS = [
    'rest_framework_simplejwt',
    'django_ratelimit',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'users',
    'innovations',
    'django_celery_beat',
    'django_celery_results',
    'corsheaders',
    'rest_framework_simplejwt.token_blacklist',
]

# Authentification
AUTHENTICATION_BACKENDS = ['django.contrib.auth.backends.ModelBackend']
AUTH_USER_MODEL = 'users.User'

# Middleware
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# CORS
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:3000').split(',')
CORS_ALLOW_CREDENTIALS = True

ROOT_URLCONF = 'bcef_innovation_backend.urls'

# Templates
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

WSGI_APPLICATION = 'bcef_innovation_backend.wsgi.application'

# Base de données
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('POSTGRES_DB', 'bcef_database'),
        'USER': os.getenv('POSTGRES_USER', 'lazarus_db'),
        'PASSWORD': os.getenv('POSTGRES_PASSWORD', '1234'),
        'HOST': os.getenv('POSTGRES_HOST', 'localhost'),
        'PORT': os.getenv('POSTGRES_PORT', '5432'),
        'OPTIONS': {
            'client_encoding': 'UTF8',
        },
    }
}

# Validators mots de passe
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',},
]

# Internationalisation
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = 'static/'
STATIC_ROOT = os.getenv('STATIC_ROOT', BASE_DIR / 'staticfiles')  # Pour déploiement
MEDIA_URL = '/media/'
MEDIA_ROOT = os.getenv('MEDIA_ROOT', BASE_DIR / 'media')

# Default auto field
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Celery beat schedule pour planifier les tâches
CELERY_BEAT_SCHEDULE = {
    'clean-expired-tokens': {
        'task': 'users.tasks.clean_expired_tokens',
        'schedule': timedelta(hours=24),
    },
}


# Logging configuration
# Le dossier 'logs' existe dans votre répertoire de projet ?
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'audit': {
            'format': '%(message)s',
        },
    },
    'handlers': {
        'audit_file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/log/django/audit.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 10,
            'formatter': 'audit',
        },
        'audit_console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'audit',
        },
    },
    'loggers': {
        'django.audit': {
            'handlers': ['audit_file', 'audit_console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}