from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)

class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'

    def ready(self):
        from django.db.models.signals import post_migrate
        from django_celery_beat.models import PeriodicTask, CrontabSchedule
        from .tasks import clean_expired_tokens

        def setup_periodic_tasks(sender, **kwargs):
            
            schedule, created_schedule = CrontabSchedule.objects.get_or_create(
                minute='0',
                hour='0',
                day_of_week='*',
                day_of_month='*',
                month_of_year='*',
            )
            task, created_task = PeriodicTask.objects.get_or_create(
                crontab=schedule,
                name='Clean expired tokens daily',
                task='users.tasks.clean_expired_tokens',
                defaults={'enabled': True},
            )
            if created_schedule or created_task:
                logger.info("Periodic task 'Clean expired tokens daily' has been created or updated.")
            else:
                logger.info("Periodic task 'Clean expired tokens daily' already exists.")

        post_migrate.connect(setup_periodic_tasks)
