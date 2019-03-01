"""
WSGI config for Joy_QA_Platform project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/1.11/howto/deployment/wsgi/
"""

import os
import hashlib

from django.core.wsgi import get_wsgi_application
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "Joy_QA_Platform.settings")
application = get_wsgi_application()

from ApiManager.operations.operation_task import restart_running_task
restart_running_task()  # 平台重启后，重启正在运行的任务

from Joy_QA_Platform import configs
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
if configs.IS_CREATE_SUPERUSER:
	get_user_model().create_superuser('admin', configs.SUPERUSER_NAME, hashlib.md5(configs.SUPERUSER_PWD.encode('utf8')).hexdigest())  # 平台启动，创建超级管理员
