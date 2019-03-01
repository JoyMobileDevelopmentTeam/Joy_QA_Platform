import os, shutil, datetime

from django.core.exceptions import ObjectDoesNotExist
from django.http import JsonResponse

from ApiManager.models import ModuleInfo, TestCaseInfo, DebugTalk
from ApiManager.utils.common import get_report_name, get_uuid
from ApiManager.utils.file_tools import get_time_stamp, dump_python_file, dump_yaml_file
from ApiManager.utils.case_loader import load_case_data
from ApiManager import tasks

# 用例执行成功
RUN_CASE_SUC = 1
# 执行用例错误
RUN_CASE_ERR = 0
# 用例解析异常
RUN_CASE_EXCEPTION = -1


def run_case_by_id(base_url, case_id, report_name=None ,user_name='测试人员',isTask=False):
    result_code = RUN_CASE_EXCEPTION
    try:
        case = TestCaseInfo.objects.get(id=case_id)
        # 存储本次运行所使用的环境
        TestCaseInfo.objects.update_case_run_env(case, base_url)
        if report_name is None:
            # 获取报告名称
            projectName = case.belong_module.belong_project.project_name
            moduleName = case.belong_module.module_name
            report_name = get_report_name(projectName=projectName, moduleName=moduleName, caseName=case.name)
        else:
            report_name = report_name + '-' + datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        report_id = get_uuid()
        # 加载用例字典
        testcase_list = load_case_data(case_id, base_url)
        if testcase_list:
            # 将yml加入指定目录 字典写入yml文件
            yml_path = make_yml(case, testcase_list)
            
            result = tasks.hrun_path.delay(yml_path, report_name, case.belong_module.belong_project.id, case.belong_module.id, report_id, user_name, isTask)
            result_code = report_id
    except ValueError:
        result_code = RUN_CASE_ERR
    return result_code

# 获取执行yml文件路径
def make_yml(case, testcase_list):
    module_id = case.belong_module_id
    project_id = ModuleInfo.objects.get(id=module_id).belong_project_id

    project = ModuleInfo.objects.get(id=module_id).belong_project

    path = os.path.join(os.getcwd(), 'suite')
    # 时间戳
    path = os.path.join(path, get_time_stamp())
    os.mkdir(path)

    testcase_dir_path = os.path.join(path, str(project_id))
    if not os.path.exists(testcase_dir_path):
        os.mkdir(testcase_dir_path)

    make_debugtalk(testcase_dir_path, project_id)

    testcase_dir_path = os.path.join(testcase_dir_path, str(module_id))
    if not os.path.exists(testcase_dir_path):
        os.mkdir(testcase_dir_path)

    yml_path = os.path.join(testcase_dir_path, case.name + '.yml')
    dump_yaml_file(yml_path, testcase_list)
    return yml_path


# 生成debugtalk文件
def make_debugtalk(testcase_dir_path, project_id):
    try:
        debugtalk = DebugTalk.objects.get(belong_project_id=project_id).debugtalk
    except ObjectDoesNotExist:
        debugtalk = ''
    # 生成debugtalk文件
    debugtalk_path = os.path.join(testcase_dir_path, 'debugtalk.py')
    if '#debugtalk.py' == debugtalk or '' == debugtalk:
        # 如果是空的 则copy默认文件
        root_path = os.path.dirname(os.path.dirname(testcase_dir_path))
        default_debugtalk_path = os.path.join(root_path, 'debugtalk.py')
        shutil.copyfile(default_debugtalk_path, debugtalk_path)  # 复制文件
    else:
        dump_python_file(debugtalk_path, debugtalk)
