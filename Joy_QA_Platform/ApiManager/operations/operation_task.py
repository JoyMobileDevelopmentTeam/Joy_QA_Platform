import datetime
import json
import re
import os
import requests
import time
import threading
import pickle

from django.core.mail import send_mail
from django.db import connection
from django.http import JsonResponse
from django.shortcuts import render_to_response, render
from django.core.cache import cache

from ApiManager.utils import schedule
from ApiManager.utils.case_utils import run_case_by_id
from ApiManager.utils.forms import TaskModelForm
from ApiManager.models import ProjectInfo, ModuleInfo, TestCaseInfo, EnvInfo, TaskInfo, ReportInfo, TaskFailedRecord
from frame.utils.common import get_ajax_msg, dataToJson
from ApiManager.utils.forms import get_validate_form_msg
from ApiManager.utils.utils import pagination_for_objects

from Joy_QA_Platform.settings import EMAIL_FROM
from Joy_QA_Platform.configs import AUTH_ADD_TASK, AUTH_DELETE, AUTH_UPDATE, AUTH_VIEW, EMAIL_SUFFIX

is_timer_start = False
run_task_list = []
run_job_dict = {}

def task_list(request):
    if request.method == "GET":
        return render(request, 'api/task_list.html')
    elif request.method == "POST":
        index = int(request.POST.get('index'))
        env_name_dic = {}
        project_name_dic = {}
        module_name_dic = {}
        results = filter_tasks_for_user(request.user, TaskInfo.objects.filter().order_by('-id'), AUTH_VIEW)
        tasks = pagination_for_objects(results, index)
        if tasks is not None and len(tasks) > 0:
            for task in tasks:
                append_env_dict(task, env_name_dic)
                append_project_dict(task, project_name_dic)
                append_module_dict(task, module_name_dic)
        count = len(results)
        task_info_list = []
        for task in tasks:
            task_dict = task2Dict(task)
            task_info_list.append(task_dict)

        data = dataToJson(task_info_list)
        return JsonResponse(get_ajax_msg(1, 1, '获取任务列表成功', {'tasks': data, 'count': count, 'currPage': index,
                                                            'envInfo': env_name_dic,
                                                            'proInfo': project_name_dic,
                                                            'moduleInfo': module_name_dic}))


def task_create(request):
    if request.method == 'GET':
        return render(request, 'api/task_new.html')
    elif request.user.has_perm(AUTH_ADD_TASK):
        if request.method == 'POST':
            model_form = TaskModelForm(request.POST)
            if model_form.is_valid():
                task_name = request.POST.get('task_name')
                env_id = request.POST.get('belong_env')
                project_id = request.POST.get('belong_project')
                module_id = request.POST.get('belong_module')
                emails = request.POST.get('receiver_email')
                start_time = datetime.datetime.fromtimestamp(int(request.POST.get('start_time')) / 1000)
                if request.POST.get('is_loop') == 'true':
                    is_loop = True
                elif request.POST.get('is_loop') == 'false':
                    is_loop = False
                interval_minute = request.POST.get('interval_minute')

                error_msg = None
                if not EnvInfo.objects.filter(id=env_id).exists():
                    error_msg = '此环境不存在'
                elif not ProjectInfo.objects.filter(id=project_id).exists():
                    error_msg = '此项目不存在'
                elif not ModuleInfo.objects.filter(id=module_id).exists():
                    error_msg = '此模块不存在'
                elif TaskInfo.objects.filter(task_name=task_name, belong_module_id=module_id).exists():
                    error_msg = '已存在此任务'
                elif start_time <= datetime.datetime.now():
                    error_msg = '任务开始时间早于当前时间'
                elif is_loop and int(interval_minute) < 1:
                    error_msg = '任务开始循环间隔时间不能小于1分钟'
                elif not validate_emails(emails.split(';')):
                    error_msg = '邮箱格式错误'
                if error_msg is not None:
                    return JsonResponse(get_ajax_msg(0, 0, error_msg, {}))

                model_form.instance.belong_env_id = env_id
                model_form.instance.belong_project_id = project_id
                model_form.instance.belong_module_id = module_id
                model_form.instance.start_time = start_time
                model_form.instance.receiver_email = deal_emails(emails.split(';'))
                model_form.save()

                for case_id in request.POST.get('case_list').split(','):
                    task = TaskInfo.objects.get(task_name=request.POST.get('task_name'))
                    case = TestCaseInfo.objects.get(id=case_id)
                    task.cases.add(case)

                return JsonResponse(get_ajax_msg(1, 1, '添加任务成功', {}))
            else:
                msg = get_validate_form_msg(model_form)
                return JsonResponse(get_ajax_msg(0, 0, msg))
    else:
        return JsonResponse(get_ajax_msg(0, 0, '用户没有创建任务的权限'))


def task_search(request):
    if request.method == 'POST':
        index = int(request.POST.get('index'))
        task_name = request.POST.get('task_name')
        project_name = request.POST.get('project_name')
        module_name = request.POST.get('module_name')
        tasks = None
        env_name_dic = {}
        project_name_dic = {}
        module_name_dic = {}
        count = 0
        if len(task_name) == 0 and len(project_name) == 0 and len(module_name) == 0:
            return JsonResponse(get_ajax_msg(0, 0, '搜索条件无效'))
        else:
            tasks = TaskInfo.objects.all()
            if len(module_name) != 0 and module_name != '模块名称':
                tasks = tasks.filter(belong_module__module_name__contains=module_name)
            if len(project_name) != 0 and project_name != '项目名称':
                tasks = tasks.filter(belong_project__project_name__contains=project_name)
            if len(task_name) != 0:
                tasks = tasks.filter(task_name__contains=task_name)
        if tasks == None:
            return JsonResponse(get_ajax_msg(0, 0, '查询出错'))
        if tasks != None and len(tasks) > 0:
            tasks = filter_tasks_for_user(request.user, tasks.order_by('-id'), AUTH_VIEW)  # 根据用户权限筛选模块
            for task in tasks:
                append_env_dict(task, env_name_dic)
                append_project_dict(task, project_name_dic)
                append_module_dict(task, module_name_dic)
        count = len(tasks)
        tasks = pagination_for_objects(tasks, index)
        task_info_list = []
        for task in tasks:
            task_dict = task2Dict(task)
            task_info_list.append(task_dict)

        data = dataToJson(task_info_list)
        return JsonResponse(get_ajax_msg(1, 1, '搜索成功', {'tasks': data, 'count': count, 'currPage': index,
                                                        'envInfo': env_name_dic, 'proInfo': project_name_dic,
                                                        'moduleInfo': module_name_dic}))


def task_delete(request):
    if request.method == 'POST':
        task_id = request.POST.get('id')
        tasks = TaskInfo.objects.filter(id=task_id)
        if len(tasks) == 0:
            return JsonResponse(get_ajax_msg(0, 0, '没有这条数据', {}))
        if check_perm(request.user, tasks[0], AUTH_DELETE):
            tasks[0].delete()
            return JsonResponse(get_ajax_msg(1, 1, '删除成功', {}))
        else:
            return JsonResponse(get_ajax_msg(0, 0, '用户没有删除该任务的权限'))


def task_query(request):
    if request.method == 'POST':
        task_id = request.POST.get('id')
        tasks = TaskInfo.objects.filter(id=task_id)
        if len(tasks) == 0:
            return JsonResponse(get_ajax_msg(0, 0, '没有这条数据', {}))
        tasks = filter_tasks_for_user(request.user, tasks, AUTH_VIEW)
        task_info_list = []
        for task in tasks:
            task_dict = task2Dict(task)
            task_info_list.append(task_dict)
        data = dataToJson(task_info_list)
        return JsonResponse(get_ajax_msg(1, 1, '获取任务成功', {'tasks': data}))


def task_update(request):
    if request.method == 'POST':
        task_form = TaskModelForm(request.POST)
        if task_form.is_valid():
            task_id = request.POST.get('id')
            task_name = request.POST.get('task_name')
            env_name = request.POST.get('env_name')
            project_name = request.POST.get('project_name')
            module_name = request.POST.get('module_name')
            receiver_email = request.POST.get('receiver_email')
            case_list = request.POST.get('case_list').split(',')
            start_time = datetime.datetime.fromtimestamp(int(request.POST.get('start_time')) / 1000)
            interval_minute = request.POST.get('interval_minute')
            if request.POST.get('is_loop') == 'true':
                is_loop = True
                if int(interval_minute) < 1:
                    return JsonResponse(get_ajax_msg(0, 0, '循环间隔时间不能小于1分钟', {}))
            elif request.POST.get('is_loop') == 'false':
                is_loop = False

            if start_time <= datetime.datetime.now():
                start_time = datetime.datetime.now()
                # return JsonResponse(get_ajax_msg(0, 0, '任务开始时间早于当前时间', {}))

            if not validate_emails(receiver_email.split(';')):
                return JsonResponse(get_ajax_msg(0, 0, '邮箱格式错误'))
            # print(deal_emails(receiver_email.split(';')))

            try:
                task = TaskInfo.objects.get(id=task_id)
                if TaskInfo.objects.filter(task_name=task_name,belong_module_id=module_name).exclude(id=task_id).exists():
                    return JsonResponse(get_ajax_msg(0, 0, '已存在此任务名称', {}))
                if not task.is_run:
                    if check_perm(request.user, TaskInfo.objects.get(id=task_id), AUTH_UPDATE):
                        if TaskInfo.objects.update_task(task_id, task_name=task_name, env_name=env_name,
                                                        project_name=project_name,
                                                        module_name=module_name, receiver_email=deal_emails(receiver_email.split(';')),
                                                        case_list=case_list,
                                                        start_time=start_time, is_loop=is_loop,
                                                        interval_minute=interval_minute):
                            return JsonResponse(get_ajax_msg(1, 1, '修改任务成功', {}))
                        else:
                            return JsonResponse(get_ajax_msg(0, 0, '修改任务失败', {}))
                    else:
                        return JsonResponse(get_ajax_msg(0, 0, '用户没有修改该任务的权限'))
                else:
                    return JsonResponse(get_ajax_msg(0, 0, '请先停止任务', {}))
            except:
                return JsonResponse(get_ajax_msg(0, 0, '该任务不存在', {}))
        else:
            msg = get_validate_form_msg(task_form)
            return JsonResponse(get_ajax_msg(0, 1, msg))


def task_run(request):
    global is_timer_start
    global run_task_list
    global run_job_dict
    if request.method == 'POST':
        task_id = request.POST.get('id')
        tasks = TaskInfo.objects.filter(id=task_id)
        if len(tasks) == 0:
            return JsonResponse(get_ajax_msg(0, 0, '没有这条数据', {}))
        task = tasks[0]

        if not task.is_run:
            if task.start_time > datetime.datetime.now():  # 任务开始时间必须大于当前时间
                pass
            else:
                task.start_time = datetime.datetime.now() + datetime.timedelta(seconds=10)
            # if not is_timer_start:
            #     is_timer_start = True
            #     start_task_timer = StartTaskTimer(run_task_list, run_job_dict)
            #     start_task_timer.start()
            run_task_list.append(task)
            task.is_run = True
            task.save()
            connection.close()
            return JsonResponse(get_ajax_msg(1, 1, '该任务成功运行'))
        else:
            connection.close()
            return JsonResponse(get_ajax_msg(0, 0, '该任务正在运行'))


def task_stop(request):
    global run_task_list
    global run_job_dict
    if request.method == 'POST':
        task_id = request.POST.get('id')
        tasks = TaskInfo.objects.filter(id=task_id)
        if len(tasks) == 0:
            return JsonResponse(get_ajax_msg(0, 0, '没有这条数据', {}))
        task = tasks[0]

        if task.is_run:
            task.is_run = False
            task.fail_times = 0
            task.save()
            # if task in run_task_list:
            #     run_task_list.remove(task)  # 从运行任务列表中删除该任务
            try:
                # jobs = run_job_dict[task.id]
                # for job in jobs:
                schedule.cancel_job(task.id)
            except KeyError:
                print('非循环任务')
            return JsonResponse(get_ajax_msg(1, 1, '该任务成功停止'))
        else:
            return JsonResponse(get_ajax_msg(0, 0, '该任务没有运行'))


def task_monitor(request):
    if request.method == 'GET':
        return render(request, 'api/task_monitor.html')
    if request.method == 'POST':
        index = int(request.POST.get('index'))
        search_task_name = request.POST.get('task_name')
        start = (index - 1) * 10
        res = requests.get('http://127.0.0.1:5555/api/tasks?limit=1000')  # 控制查询最大数目为1000，以解决查询卡顿的问题
        results = json.loads(res.content)
        monitor_result_list = []
        for result in results.values():
            try:
                task_dict = {}
                args = result['args'].split(',')
                # 获取任务信息
                infos = args[1].split('-')
                if '定时任务' in infos[0]:
                    task_name = infos[1]
                    case_name = infos[2]
                    report_uuid = args[4].split("'")[1]
                    task_dict['task_name'] = task_name
                    task_dict['case_name'] = case_name
                    task_dict['state'] = result['state']
                    task_dict['result'] = result['result']
                    task_dict['received'] = result['received']
                    task_dict['started'] = result['started']
                    task_dict['runtime'] = result['runtime']
                    task_dict['report_uuid'] = report_uuid
                    if search_task_name is not None:
                        if search_task_name in task_dict['task_name']:
                            monitor_result_list.append(task_dict)
                    else:
                        monitor_result_list.append(task_dict)
            except Exception as e:
                print('数据解析异常：' + e)
        # 根据任务开始时间降序排列
        for i in range(len(monitor_result_list) - 1):
            for j in range(len(monitor_result_list) - i - 1):
                if monitor_result_list[j]['received'] < monitor_result_list[j + 1]['received']:
                    monitor_result_list[j], monitor_result_list[j + 1] = monitor_result_list[j + 1], monitor_result_list[j]
        data = dataToJson(monitor_result_list[start: start + 10])
        return JsonResponse(get_ajax_msg(1, 1, '获取监控任务列表成功', {'monitors': data, 'count': len(monitor_result_list), 'currPage': index}))


def thread_run_case(**kwargs):
    case_id = kwargs['case_id']
    base_url = kwargs['base_url']
    task_name = kwargs['task_name']
    task_id = kwargs['task_id']
    threading.Thread(target=run_case, args=(base_url, case_id, task_name, task_id)).start()


def run_case(base_url, case_id, task_name, task_id):
    report_id = run_case_by_id(base_url, case_id, task_name,"定时任务",isTask=True)
    time.sleep(5)  # 等待报告信息写入数据库
    reports = ReportInfo.objects.all().filter(report_id=report_id)
    tasks = TaskInfo.objects.filter(id=task_id)
    if len(tasks) > 0:
        task = tasks[0]
    if len(reports) == 0:
        # 若没有此条报告，则认为用例成功，不再需要后续操作
        if len(tasks) > 0:
            task.fail_times = 0
            task.save()
    else:
        response_result = get_response_result(report_id)
        if response_result != True:
            task.fail_times += 1
            task.save()
            # 存失败记录
            failRecord = TaskFailedRecord(task_id=task,report_id=reports[0].id,time=datetime.datetime.fromtimestamp(reports[0].test_time))
            failRecord.save()
        if task.fail_times % 2 == 0 and task.fail_times != 0:
            receivers = task.receiver_email.split(';')
            for receiver in receivers:
                send_warn_mail(task_name, receiver, reports[0].id)
    connection.close()  # 避免造成mysql连接数过多的问题


def get_response_result(report_id):
    response_result = True
    try:
        reports = ReportInfo.objects.all().filter(report_id=report_id)
        if len(reports) > 0:
            report = reports[0]
            # print(report.result_data)
            summury = json.loads(report.result_data)
            stat = summury['stat']
            if stat['successes'] != stat['testsRun']:
                response_result = False
    except Exception as e:
        print('get_response_code e=====>', e)
    return response_result


def send_warn_mail(task_name, receiver, report_id):
    tips = task_name + '：监控到接口发生异常！查看报告地址：http://qa.15166.com/api/get_report/?id=' + str(report_id)
    try:
        email_title = "Joy_QA_Platform 定时任务监控接口"
        email_body = tips
        # 使用Django内置函数完成邮件发送。四个参数：主题，邮件内容，从哪里发，接受者list
        send_status = send_mail(email_title, email_body, EMAIL_FROM, [receiver])
    except Exception as e:
        print(e)


def task2Dict(task):
    task_dict = {}
    task_dict["id"] = task.id
    task_dict["task_name"] = task.task_name
    task_dict["belong_env"] = task.belong_env_id
    task_dict["belong_project"] = task.belong_project_id
    task_dict["belong_module"] = task.belong_module_id
    task_dict["receiver_email"] = task.receiver_email
    task_dict["case_id_list"] = []
    task_dict["case_name_list"] = []
    task_dict["start_time"] = task.start_time
    task_dict["is_loop"] = task.is_loop
    task_dict["interval_minute"] = task.interval_minute
    task_dict["is_run"] = task.is_run
    task_dict["fail_times"] = task.fail_times
    cases = task.cases.all()
    for case in cases:
        id = case.id
        task_dict["case_id_list"].append(case.id)
        task_dict["case_name_list"].append(case.name)
    return task_dict


def append_env_dict(task, env_dict):
    env_id = task.belong_env_id
    env_name = task.belong_env.env_name
    env_dict[str(env_id)] = env_name


def append_project_dict(task, project_dict):
    project_id = task.belong_project_id
    project_name = task.belong_project.project_name
    project_dict[str(project_id)] = project_name


def append_module_dict(task, module_dict):
    module_id = task.belong_module_id
    module_name = task.belong_module.module_name
    module_dict[str(module_id)] = module_name


def get_url_from_task(task):
    envs = EnvInfo.objects.filter(id=task.belong_env_id)
    env = envs[0]
    return env.host_port


class StartTaskTimer(threading.Thread):
    
    def __init__(self, run_task_list, run_job_dict):
        threading.Thread.__init__(self)
        self.run_task_list = run_task_list
        self.run_job_dict = run_job_dict

    def run(self):
        while True:
            # lst = self.run_task_list[::]
            tasks = get_running_tasks()
            for task in tasks:
                now = datetime.datetime.now()
                if task.start_time <= now <= (task.start_time + datetime.timedelta(seconds=5)):
                    if task.is_loop:
                        self.run_job_dict[task.id] = start_loop_task(task, thread_run_case)
                    else:
                        start_task(task, thread_run_case)
                        task.is_run = False
                        task.fail_times = 0
                        task.save()
                        # self.run_task_list.remove(task)
                else:
                    pass
            time.sleep(5)

mutex = threading.Lock()

def get_running_tasks():
    global mutex
    with mutex:
        result = []
        tasks = TaskInfo.objects.filter(is_run=True,is_loop=True)
        now = datetime.datetime.now()
        for task in tasks:
            # 排除可能的重复执行
            if task.start_time <= now <= (task.start_time + datetime.timedelta(seconds=5)) and (now - task.last_run_time > datetime.timedelta(seconds=5)):
                result.append(task)
                task.last_run_time = now
                task.save()
            # if datetime.datetime.now() - task.last_run_time > datetime.timedelta(seconds=task.interval_minute * 60 - 5):
            #     result.append(task)
        connection.close()
        if len(result) > 0:
            for i in result:
                print("获取到任务：",i.task_name)
        return result


def start_loop_task(task, func):
    base_url = get_url_from_task(task)
    jobs = []
    cases = task.cases.all()
    for case in cases:
        task_name = get_task_name(task, case)
        func(case_id=case.id, base_url=base_url, task_name=task_name, task_id=task.id)
        job = schedule.every(task.interval_minute).minutes.do(thread_run_case, case_id=case.id,
                                                              base_url=base_url, task_name=task_name, task_id=task.id)
        cache.set("qa_paltform_loop_jobs_"+str(datetime.datetime.now()),pickle.dumps(job),timeout=None)
    flag = cache.get("qa_test_platform_running_flag")
    # print("flag==="+str(flag))
    if flag != 1:
        schedule.run_continuously()
        # 一定要添加过期时间，否则当值过期时还会起新的线程（发现默认过期时间5分钟,这是django-redis组件和原生redis的区别）
        cache.set("qa_test_platform_running_flag",1,timeout=None)
    return jobs


def start_task(task, func):
    base_url = get_url_from_task(task)
    cases = task.cases.all()
    for case in cases:
        task_name = get_task_name(task, case)
        func(case_id=case.id, base_url=base_url, task_name=task_name, task_id=task.id)


def get_task_name(task, case):
    name = '定时任务' + '-' + task.task_name + '-' + case.name
    return name


def filter_tasks_for_user(user, tasks, perm):
    results = []
    for task in tasks:
        project = task.belong_project
        if user.has_perm(perm, project):
            results.append(task)
    return results


def check_perm(user, task, perm):
    project = task.belong_project
    return user.has_perm(perm, project)


def restart_running_task():
    # 清除redis中的任务缓存
    cache.delete_pattern("qa_paltform_loop_jobs_*")
    # 清除redis中的分布式锁，避免偶发的锁出现问题，任务会在执行器中的run_pending阻塞
    cache.delete_pattern('*qa_test_platform_get')
    # 增加是否已经启动了线程的标记，避免每增加一个执行任务就启动一次线程，可能导致任务重复执行
    cache.delete_pattern('qa_test_platform_running_flag')
    print("清除任务缓存、清除锁、清除线程启动标记")
    
    start_task_timer = StartTaskTimer(run_task_list, run_job_dict)
    start_task_timer.start()
    tasks = TaskInfo.objects.filter(is_run=True, is_loop=True)
    count = 0
    for task in tasks:
        task.start_time = datetime.datetime.now() + datetime.timedelta(seconds=10*(count+1))
        task.save()
        count = count + 1
    connection.close()  # 避免造成mysql连接数过多的问题


def validate_emails(emails):
    for email in emails:
        if len(email) == 0:
            continue
        if re.match("^[A-Z0-9a-z._%+-]+" + EMAIL_SUFFIX, email) is None:
            return False
    return True


def deal_emails(emails):
    result = []
    for email in emails:
        if email not in result:
            result.append(email)
    resultEmail = ""
    for email in result:
        resultEmail = resultEmail + ";" + email
    return resultEmail[1:]


