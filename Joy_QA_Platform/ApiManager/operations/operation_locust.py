import os,shutil
from multiprocessing import Process

from django.http import JsonResponse
from django.core.exceptions import ObjectDoesNotExist

from frame.utils.common import get_ajax_msg
from Joy_QA_Platform import configs
from ApiManager.utils.case_loader import load_case_data
from ApiManager.models import ModuleInfo, TestCaseInfo, DebugTalk
from ApiManager.utils.file_tools import get_time_stamp, dump_python_file, dump_yaml_file,parseYml

LOCUST_WORKSPACE_DIR = configs.LOCUST_WORKSPACE_DIR
LOCUST_MASTER_BIND_PORT = configs.LOCUST_MASTER_BIND_PORT


def locust_run(request):
    if request.method == 'POST':
        case_id = request.POST.get('case_id')
        base_url = request.POST.get('base_url')
        # 检查是否已经存在locust实例在运行
        check = os.popen("ps -ef | grep locust|grep -v 'grep '")
        if check.read() == '':
            case = TestCaseInfo.objects.get(id=case_id)
            # 返回为空，可直接进行压测
            # 生成用例yml
            testcase_list = load_case_data(case_id, base_url)
            if testcase_list:
                # 将yml加入指定目录 字典写入yml文件
                yml_path = make_yml(case, testcase_list)
                p = Process(target=excute_locust,args=(yml_path,))
                p.start()
                return JsonResponse(get_ajax_msg(1, 1, '已成功执行压测实例', {}))
        else:
            # 返回不为空，提示用户是否结束当前实例
            return JsonResponse(get_ajax_msg(99, 0, '已存在正在执行的压测实例', {}))

def excute_locust(yml_path):
    locustFile = gen_locust_file(yml_path)
    # 解析request_host
    modify_config(yml_path)
    if os.path.exists(locustFile) and os.path.isfile(locustFile):
        # 将locustfile.py拷贝到git目录下
        # destPath = os.path.join(get_slave_path(),"QAPlatform","locustfile.py")
        # shutil.copy(locustFile,destPath)
        pass
        # 生成py测试脚本使用的是旧版本httprunner，而从机使用的是新版本，两个不兼容，故不使用生产的脚本，直接推送新版本模板供从机使用
    if os.path.exists(yml_path) and os.path.isfile(yml_path):
        # 将yml拷贝到git目录下
        destPath = os.path.join(get_locust_work_dir(),"locust.yml")
        shutil.copy(yml_path,destPath)
    # 拷贝debugtalk.py文件到git目录
    debugtalk_path = os.path.join(os.path.dirname(os.path.dirname(yml_path)),'debugtalk.py')
    if os.path.exists(debugtalk_path) and os.path.isfile(debugtalk_path):
        destPath = os.path.join(get_locust_work_dir(),"debugtalk.py")
        shutil.copy(debugtalk_path,destPath)
    # 处理文件路径中包含空格
    yml_path = yml_path.replace(' ','\ ')
    # 删除临时文件
    # 获取目录
    shutil.rmtree(os.path.dirname(os.path.dirname(debugtalk_path)))
    destPath = os.path.join(get_locust_work_dir(),"locustfile.py")
    os.system("locust -f %s --master --web-host=0.0.0.0 --master-bind-port=%s"%(destPath,LOCUST_MASTER_BIND_PORT))

def locust_stop():
    # 杀死locust进程
    result = os.system("ps -ef | grep locust|grep -v 'grep ' | awk '{print $2}'|xargs kill -9")
    return JsonResponse(get_ajax_msg(1, 1, '已停止当前实例', {}))


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

def get_slave_path():
    slave_path = os.path.join(os.getcwd(),'slave')
    return slave_path

def get_locust_work_dir():
    return os.path.join(get_slave_path(),LOCUST_WORKSPACE_DIR)

# 生成locust执行的脚本文件
def gen_locust_file(yml_path):
    try:
        from httprunner import locusts
        locusts.gen_locustfile(yml_path)
        return os.path.join(os.getcwd(),"locustfile.py")
    except Exception as e:
        print(e)
        print("生成locustfile.py出错！")
        return None

def modify_config(yml_path):
    try:
        base_url = parseYml(yml_path)[0]['config']['request']['base_url']
        QAPlatformPath = get_locust_work_dir()
        configPath = os.path.join(QAPlatformPath,'config')
        result = []
        f = open(configPath,'r+')
        lines = f.readlines()
        for line in lines:
            if 'request_host=' in line:
                result.append('request_host='+base_url)
            else:
                result.append(line)
        f.close()
        f = open(configPath,'w+')
        f.writelines(result)
        f.close()
    except Exception as e:
        print(e)
        print('修改config文件出错！')



