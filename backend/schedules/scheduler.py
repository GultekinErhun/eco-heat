# schedules/scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from django.core import management
from django_apscheduler.jobstores import DjangoJobStore
from django_apscheduler.models import DjangoJobExecution
import sys

def check_schedules_job():
    """Programları kontrol eder ve uygular"""
    management.call_command('check_schedules')

def start():
    scheduler = BackgroundScheduler()
    scheduler.add_jobstore(DjangoJobStore(), "default")
    
    # Her 5 dakikada bir programları kontrol et
    scheduler.add_job(
        check_schedules_job,
        'interval',
        minutes=5,
        id='check_schedules',
        replace_existing=True,
    )
    
    scheduler.start()
    print("Scheduler started...", file=sys.stdout)