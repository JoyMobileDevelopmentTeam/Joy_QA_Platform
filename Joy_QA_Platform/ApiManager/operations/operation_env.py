
import json,re

from django.forms.models import model_to_dict
from django.shortcuts import render
from django.http import JsonResponse

from frame.utils.common import get_ajax_msg, dataToJson
from ApiManager.models import EnvInfo, TestCaseInfo
from ApiManager.utils.forms import EnvModelForm
from ApiManager.utils.forms import get_validate_form_msg
from ApiManager.utils.utils import pagination_for_objects

def env_create(request):
    if request.method == "POST":
        envForm = EnvModelForm(request.POST)
        belong_project = request.POST.get('belong_project')
        if belong_project is None or not belong_project.isdigit():
            return JsonResponse(get_ajax_msg(0, 0, '所属项目不正确！'))
        if envForm.is_valid():
            if not EnvInfo.objects.filter(env_name=envForm.instance.env_name).exists():
                # 没有相同名字的环境
                envForm.instance.belong_project_id = belong_project
                envForm.save()
                return JsonResponse(get_ajax_msg(1, 1, '添加环境成功', {}))
            else:
                # 存在相同名字的项目
                return JsonResponse(get_ajax_msg(0, 0, '已存在此环境！'))
        else:
            msg = get_validate_form_msg(envForm)
            return JsonResponse(get_ajax_msg(0, 0, msg))

def env_list(request):
    if request.method == "GET":
        return render(request, 'api/environment_manage.html')
    elif request.method == "POST":
        index = int(request.POST.get('index'))
        objects = EnvInfo.objects.filter().order_by('-id')
        envs = pagination_for_objects(objects, index)

        project_id_to_name = {}
        count = objects.count()
        for env in envs:
            project_id_to_name[env.belong_project_id] = env.belong_project.project_name
        data = dataToJson([model_to_dict(i) for i in envs])
        return JsonResponse(get_ajax_msg(1, 1, '获取环境列表成功', {'envs': data, 'count': count, 'currPage': index,'id_to_name':project_id_to_name}))


def env_query(request):
    if request.method == "POST":
        env_info = json.loads(request.body.decode('utf-8'))
        env_id = env_info['id']
        envs = EnvInfo.objects.filter(id=env_id)
        if len(envs) == 0:
            return JsonResponse(get_ajax_msg(0, 0, '没有这条数据', {}))
        data = dataToJson([model_to_dict(i) for i in envs])
        return JsonResponse(get_ajax_msg(1, 1, '获取环境信息成功', {'envs': data}))

def env_search(request):
    if request.method == "POST":
        case_id = request.POST.get('case_id')
        belong_project = 0
        if case_id is not None:
            # 通过测试用例id查询所能用的环境
            cases = TestCaseInfo.objects.filter(id=case_id)
            if len(cases) == 0:
                return JsonResponse(get_ajax_msg(0, 0, '没有这条用例！', {}))
            else:
                case = cases[0]
                belong_project = case.belong_module.belong_project_id
        else:
            belong_project = request.POST.get('project_id')
        if belong_project is None:
            return JsonResponse(get_ajax_msg(0, 0, '数据无效', {}))
        envs = EnvInfo.objects.filter(belong_project_id=belong_project)
        data = dataToJson([model_to_dict(i) for i in envs])
        return JsonResponse(get_ajax_msg(1, 1, '获取用环境息成功', {'envs': data}))


def env_delete(request):
    if request.method == "POST":
        env_info = json.loads(request.body.decode('utf-8'))
        env_id = env_info['id']
        env = EnvInfo.objects.filter(id=env_id)
        if len(env) == 0:
            return JsonResponse(get_ajax_msg(0, 0, '没有这条数据', {}))
        if EnvInfo.objects.delete_env(env_id):
            return JsonResponse(get_ajax_msg(1, 1, '删除成功', {}))
        else:
            return JsonResponse(get_ajax_msg(0, 0, '删除失败', {}))


def env_update(request):
    if request.method == "POST":
        env_info = json.loads(request.body.decode('utf-8'))
        env_id = env_info['id']
        env_name = env_info['env_name']
        host_port = env_info['host_port']
        desc = env_info['desc']
        belong_project = env_info['belong_project']
        if belong_project is None or not belong_project.isdigit():
            return JsonResponse(get_ajax_msg(0, 0, '所属项目不正确！'))
        if EnvInfo.objects.update_env(env_id, env_name=env_name,
                                      host_port=host_port,
                                      desc=desc,belong_project_id=belong_project):
            return JsonResponse(get_ajax_msg(1, 1, '修改环境成功', {}))
        else:
            return JsonResponse(get_ajax_msg(0, 0, '修改环境失败', {}))







