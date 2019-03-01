# #用例执行
# #@shared_task 装饰器能在没有具体的 Celery 实例时创建任务
from celery import shared_task
from httprunner import HttpRunner
import time,json,os,shutil
from djcelery import celery
from datetime import datetime, date

import django

os.environ['DJANGO_SETTINGS_MODULE'] = 'Joy_QA_Platform.settings'
django.setup()

from ApiManager.models import *
from celery import Celery

broker = 'redis://127.0.0.1:6379/0'
backend = 'redis://127.0.0.1:6379/1'

app = Celery('my_task', broker=broker, backend=backend)

@celery.task
def hrun_path(testset_path, report_name, belong_project, belong_module, report_id='', user_name='', isTask=False):
    """
    用例运行
    :param testset_path: dict or list
    :param report_name: str
    :return:
    """
    kwargs = { "failfast": False }
    runner = HttpRunner(**kwargs)
    runner.run(testset_path)
    #删除文件临时文件
    root_path = os.path.dirname(os.path.dirname(os.path.dirname(testset_path)))
    shutil.rmtree(root_path)
    
    summary = runner.summary

    # 处理CaseInsensitiveDict不能序列化的问题
    for item in summary['records']:
        meta_data = item['meta_data']
        if meta_data.__contains__('request_headers') and meta_data.__contains__('response_headers'):
            meta_data['request_headers'] =  dict(meta_data['request_headers'])
            meta_data['response_headers'] =  dict(meta_data['response_headers'])
    stats = summary['stat']
    if isTask and stats['successes'] == stats['testsRun']:
        # 是定时任务,并且没有失败，则不写入报告
        pass
    else:
        saveReport(report_name,belong_project,belong_module,testset_path,runner.summary,report_id,user_name)
    return ''

@celery.task
def locust_run(testset_path):
    locusts.run_locusts_with_processes(sys.argv, processes_count)

def saveReport(report_name,belong_project,belong_module,original_data,result_data,report_id,user_name):
    report = ReportInfo(report_name=report_name,belong_project=belong_project,belong_module=belong_module,original_data=dataToJson(original_data),
        result_data=dataToJson(result_data),test_time=result_data['time']['start_at'].timestamp(),report_id=report_id,user_name=user_name)
    report.save()

def dataToJson(data):
    return json.dumps(data, cls=Encoder)


class Encoder(json.JSONEncoder):
    def default(self, obj):
        result = ''
        if isinstance(obj, datetime):
            result = obj.strftime('%Y-%m-%d %H:%M:%S')
        elif isinstance(obj, date):
            result = obj.strftime("%Y-%m-%d")
        elif isinstance(obj, bytes):
            result = str(obj, encoding='utf-8')
        else:
            result = json.JSONEncoder.default(self, obj)
        return result




