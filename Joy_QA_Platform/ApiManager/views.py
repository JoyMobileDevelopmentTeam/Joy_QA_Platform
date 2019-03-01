#ApiManager模块所有的前端请求都在此处理
from .operations import operation_project, operation_module, operation_case, operation_task, operation_report, operation_env, operation_auth \
    , operation_index, operation_locust

def index(request):
    return operation_index.index(request)

def fail_task_list(request):
    return operation_index.fail_task_list(request)

def summary_fail_task(request):
    return operation_index.summary_fail_task(request)

def task_to_project(request):
    return operation_index.task_to_project(request)

def project_create(request):
    return operation_project.project_create(request)

def project_list(request):
    return operation_project.project_list(request)

def project_search(request):
    return operation_project.project_search(request)

def project_delete(request):
    return operation_project.project_delete(request)

def project_query(request):
    return operation_project.project_query(request)

def project_update(request):
    return operation_project.project_update(request)

def debugtalk_list(request):
    return operation_project.debugtalk_list(request)

# 编辑debugtalk
def debugtalk(request, id=None):
    return operation_project.debugtalk(request,id)

def module_create(request):
    return operation_module.module_create(request)

def module_list(request):
    return operation_module.module_list(request)

def module_search(request):
    return operation_module.module_search(request)

def module_delete(request):
    return operation_module.module_delete(request)

def module_query(request):
    return operation_module.module_query(request)

def module_update(request):
    return operation_module.module_update(request)

def case_create(request):
    return operation_case.case_create(request)

def case_upload(request):
    return operation_case.case_upload(request)

def case_list(request):
    return operation_case.case_list(request)

def case_search(request):
    return operation_case.case_search(request)

def case_search_with_id(request):
    return operation_case.case_search_with_id(request)

def case_delete(request):
    return operation_case.case_delete(request)

def case_query(request):
    return operation_case.case_query(request)

def case_edit(request):
    return operation_case.case_edit(request)

def case_run(request):
    return operation_case.case_run(request)

def env_create(request):
    return operation_env.env_create(request)

def env_list(request):
    return operation_env.env_list(request)

def env_query(request):
    return operation_env.env_query(request)

def env_search(request):
    return operation_env.env_search(request)

def env_delete(request):
    return operation_env.env_delete(request)

def env_update(request):
    return operation_env.env_update(request)

def task_create(request):
    return operation_task.task_create(request)

def task_list(request):
    return operation_task.task_list(request)

def task_search(request):
    return operation_task.task_search(request)

def task_delete(request):
    return operation_task.task_delete(request)

def task_query(request):
    return operation_task.task_query(request)

def task_update(request):
    return operation_task.task_update(request)

def task_run(request):
    return operation_task.task_run(request)

def task_stop(request):
    return operation_task.task_stop(request)

def task_monitor(request):
    return operation_task.task_monitor(request)

def locust_run(request):
    return operation_locust.locust_run(request)

def locust_stop(request):
    return operation_locust.locust_stop()

def report_check(request):
    return operation_report.report_check(request)

def report_query(request):
    return operation_report.report_query(request)

def report_list(request):
    return operation_report.report_list(request)

def report_search(request):
    return operation_report.report_search(request)

def report_delete(request):
    return operation_report.report_delete(request)

def auth(request):
    return operation_auth.auth(request)

def assign_auth(request):
    return operation_auth.assign_auth(request)


