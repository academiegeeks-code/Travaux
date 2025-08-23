# myproject/celery.py
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bcef_innovation_backend.settings')

app = Celery('bcef_innovation_backend')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
