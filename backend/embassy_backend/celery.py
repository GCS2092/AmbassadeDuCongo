"""
Celery configuration for async tasks (optional, django-q is primary)
"""
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'embassy_backend.settings')

app = Celery('embassy_backend')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

