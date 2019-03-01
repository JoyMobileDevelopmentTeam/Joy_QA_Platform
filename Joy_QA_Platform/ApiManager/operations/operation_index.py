import datetime

from django.http import JsonResponse
from django.forms.models import model_to_dict
from django.shortcuts import render_to_response

from ApiManager.models import TaskInfo, TaskFailedRecord
from ApiManager.operations.operation_task import filter_tasks_for_user
from frame.utils.common import get_ajax_msg, dataToJson
from Joy_QA_Platform.configs import AUTH_VIEW


def index(request):
    return render_to_response('frame/index.html')

def fail_task_list(request):
    if request.method == "POST":
        failRecords = filter_fail_records_for_user(request.user, TaskFailedRecord.objects.all().order_by('-id')[0:20], AUTH_VIEW)
        task_to_project = {}
        task_to_name = {}
        for record in failRecords:
            task_to_project[record.task_id.id] = record.task_id.belong_project.project_name
            task_to_name[record.task_id.id] = record.task_id.task_name
        data = dataToJson([model_to_dict(i) for i in failRecords])
        return JsonResponse(get_ajax_msg(1, 1, '获取失败记录成功', {'records': data, 'project_info':task_to_project,'task_info':task_to_name})) 

def summary_fail_task(request):
    if request.method == "POST":
        startDate = request.POST.get('startDate')
        endDate = request.POST.get('endDate')
        if startDate is None or endDate is None:
            # 统计最近半年的失败记录
            endDate = datetime.datetime.now()
            startDate = endDate - datetime.timedelta(days=180)
        else:
            # 统计已选时间区间的失败记录
            startDate = datetime.datetime.strptime(startDate, "%Y-%m-%d")
            endDate = datetime.datetime.strptime(endDate, "%Y-%m-%d") + datetime.timedelta(days=1)
        failRecords = filter_fail_records_for_user(request.user, TaskFailedRecord.objects.filter(time__range=(startDate, endDate)), AUTH_VIEW)
        sum_dic = {}
        task_to_project = {}
        for record in failRecords:
            if record.task_id.id not in sum_dic:
                sum_dic[record.task_id.id] = 1
                task_to_project[record.task_id.id] = record.task_id.belong_project.project_name
            else:
                sum_dic[record.task_id.id] = sum_dic[record.task_id.id] + 1
        result = {}
        for item in sum_dic:
            if task_to_project[item] not in result:
                result[task_to_project[item]] = sum_dic[item]
            else:
                result[task_to_project[item]] = sum_dic[item] + result[task_to_project[item]]
        data = dataToJson(result)
        return JsonResponse(get_ajax_msg(1, 1, '获取失败统计数据成功', {'records': data})) 

def task_to_project(request):
    if request.method == "POST":
        tasks = filter_tasks_for_user(request.user, TaskInfo.objects.all().filter(is_run=True), AUTH_VIEW)
        sum_dic = {}
        project_to_name = {}
        for task in tasks:
            if task.belong_project.id not in sum_dic.keys():
                sum_dic[task.belong_project.id] = 1
                project_to_name[task.belong_project.id] = task.belong_project.project_name
            else:
                sum_dic[task.belong_project.id] = sum_dic[task.belong_project.id] + 1
        result = {}
        for item in sum_dic:
            result[project_to_name[item]] = sum_dic[item]
        data = dataToJson(result)
        return JsonResponse(get_ajax_msg(1, 1, '获取正在执行任务统计数据成功', {'tasks':data})) 
        

def filter_fail_records_for_user(user, records, perm):
    results = []
    for record in records:
        project = record.task_id.belong_project
        if user.has_perm(perm, project):
            results.append(record)
    return results
