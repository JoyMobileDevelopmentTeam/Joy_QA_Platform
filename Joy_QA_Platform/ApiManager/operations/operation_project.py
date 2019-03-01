import json, re, os

from django.http import JsonResponse
from django.shortcuts import render_to_response, render
from django.forms.models import model_to_dict

from ApiManager.utils.forms import ProjectModelForm
from ApiManager.models import ProjectInfo, DebugTalk
from frame.utils.common import get_ajax_msg, dataToJson
from guardian.shortcuts import get_objects_for_user, assign_perm
from ApiManager.utils.forms import get_validate_form_msg
from ApiManager.utils.utils import pagination_for_objects
from ApiManager.utils.common import to_dict
from Joy_QA_Platform.configs import AUTH_ADD_PROJECT, AUTH_DELETE, AUTH_UPDATE, AUTH_VIEW

def project_create(request):
    if request.method == 'GET':
        return render(request, 'api/project_new.html')
    elif request.method == 'POST':
        if request.user.has_perm(AUTH_ADD_PROJECT):
            params = json.loads(request.body.decode('utf-8'))
            model_form = ProjectModelForm(params)
            if model_form.is_valid():
                project_name = params['project_name']
                if not ProjectInfo.objects.filter(project_name=project_name).exists():
                    # 没有相同名字的项目
                    model_form.save()
                    project = ProjectInfo.objects.filter(project_name=project_name)
                    # DebugTalk(belong_project=project.first()).save()
                    # 读取默认文件内容，存入默认提供的方法
                    content = get_default_debugtalk()
                    DebugTalk.objects.create(belong_project=project.first(), debugtalk=content)
                    # 项目创建者默认拥有该项目的查询，修改权限
                    assign_perm(AUTH_VIEW, request.user, project)
                    assign_perm(AUTH_UPDATE, request.user, project)
                    return JsonResponse(get_ajax_msg(1, 1, '新增工程成功！'))
                else:
                    # 存在相同名字的项目
                    return JsonResponse(get_ajax_msg(0, 0, '已存在此项目！'))
            else:
                msg = get_validate_form_msg(model_form)
                return JsonResponse(get_ajax_msg(0, 0, msg))
        else:
            return JsonResponse(get_ajax_msg(0, 0, '用户没有创建项目的权限'))


def project_list(request):
    if request.method == "GET":
        return render(request, 'api/project_list.html')
    elif request.method == "POST":
        index = int(request.POST.get('index'))
        objects = get_objects_for_user(request.user, AUTH_VIEW).all()
        projects = pagination_for_objects(objects, index)
        count = objects.count()
        data = dataToJson([model_to_dict(i) for i in projects])
        return JsonResponse(get_ajax_msg(1, 1, '获取工程列表成功', {'projects': data, 'count': count, 'currPage': index}))


def project_search(request):
    if request.method == "POST":
        project_name = request.POST.get('project_name')
        person_name = request.POST.get('person_name')
        index = int(request.POST.get('index'))
        if len(project_name) == 0 and len(person_name) == 0:
            return JsonResponse(get_ajax_msg(0, 0, '搜索条件无效'))
        else:
            projects = ProjectInfo.objects.all()
            if len(project_name) > 0:
                projects = projects.filter(project_name__contains=project_name)
            if len(person_name) > 0:
                projects = projects.filter(responsible_name__contains=person_name)
        if projects is None:
            return JsonResponse(get_ajax_msg(0, 0, '查询出错'))
        objects = get_objects_for_user(request.user, AUTH_VIEW, projects)  # 根据用户权限筛选项目对象
        projects = pagination_for_objects(objects, index)
        count = objects.count()
        data = dataToJson([model_to_dict(i) for i in projects])
        return JsonResponse(get_ajax_msg(1, 1, '搜索成功', {'projects': data, 'count': count, 'currPage': index}))


def project_delete(request):
    if request.method == 'POST':
        project_id = request.POST.get('id')
        projects = ProjectInfo.objects.filter(id=project_id)
        if len(projects) == 0:
            return JsonResponse(get_ajax_msg(0, 0, '没有这条数据', {}))
        # 检查用户是否拥有删除权限
        if not request.user.has_perm(AUTH_DELETE, projects[0]):
            return JsonResponse(get_ajax_msg(0, 0, '用户没有删除该项目的权限'))
        if ProjectInfo.objects.delete_project(project_id):
            return JsonResponse(get_ajax_msg(1, 1, '删除成功', {}))
        else:
            return JsonResponse(get_ajax_msg(0, 0, '删除失败', {}))


def project_query(request):
    if request.method == 'POST':
        project_id = request.POST.get('id')
        projects = ProjectInfo.objects.filter(id=project_id)
        if len(projects) == 0:
            return JsonResponse(get_ajax_msg(0, 0, '没有这条数据', {}))
        projects = get_objects_for_user(request.user, AUTH_VIEW, projects)  # 根据用户权限筛选项目对象
        data = dataToJson([model_to_dict(i) for i in projects])
        return JsonResponse(get_ajax_msg(1, 1, '获取项目成功', {'projects': data}))


def project_update(request):
    if request.method == 'POST':
        model_form = ProjectModelForm(request.POST)
        if model_form.is_valid():
            project_id = request.POST.get('id')
            project_name = request.POST.get('project_name')
            responsible_name = request.POST.get('responsible_name')
            test_user = request.POST.get('test_user')
            dev_user = request.POST.get('dev_user')
            publish_app = request.POST.get('publish_app')
            simple_desc = request.POST.get('simple_desc')
            other_desc = request.POST.get('other_desc')
            # 检查用户是否拥有修改权限
            if not request.user.has_perm(AUTH_UPDATE, ProjectInfo.objects.get(id=project_id)):
                return JsonResponse(get_ajax_msg(0, 0, '用户没有修改该项目的权限'))
            if ProjectInfo.objects.update_project(project_id, project_name=project_name,
                                                  responsible_name=responsible_name, test_user=test_user,
                                                  dev_user=dev_user,
                                                  publish_app=publish_app, simple_desc=simple_desc,
                                                  other_desc=other_desc):
                return JsonResponse(get_ajax_msg(1, 1, '修改项目成功', {}))
            else:
                return JsonResponse(get_ajax_msg(0, 0, '修改项目失败', {}))
        else:
            msg = get_validate_form_msg(model_form)
            return JsonResponse(get_ajax_msg(0, 1, msg))

"""
    以下debugtalk部分代码
"""


def debugtalk_list(request):
    if request.method == "GET":
        return render(request, 'api/debugtalk_list.html')
    elif request.method == "POST":
        index = int(request.POST.get('index'))
        data, project_name_dic, count = get_debugtalk_list(index)
        return JsonResponse(get_ajax_msg(1, 1, '获取驱动列表成功',
                                         {'debugtalks': data, 'count': count, 'currPage': index,
                                          'proInfo': project_name_dic}))

def debugtalk(request,id=None):
    if request.method == 'GET':
        debugtalk = DebugTalk.objects.values('id', 'debugtalk').get(id=id)
        return render_to_response('api/debugtalk.html', debugtalk)
    else:
        modify_debugtalk(request.POST.get('id'), request.POST.get('debugtalk'))
        return render_to_response('api/debugtalk_list.html')

#获取驱动列表
def get_debugtalk_list(index):
    project_name_dic = {}
    if index == -1:
        debugTalks = DebugTalk.objects.filter().order_by('-id')
    elif index >= 0:
        start = (index - 1) * 10
        debugTalks = DebugTalk.objects.filter().order_by('-id')[start:start + 10]

        for debugTalk in debugTalks:
            project_id = debugTalk.belong_project_id
            project_name = debugTalk.belong_project.project_name
            project_name_dic[str(project_id)] = project_name
    count = DebugTalk.objects.filter().all().count()
    data = dataToJson([to_dict(i) for i in debugTalks])
    return data,project_name_dic,count

#编辑debugtalk
def modify_debugtalk(id,debugtalk):
    code = debugtalk.replace('new_line', '\r\n')
    obj = DebugTalk.objects.get(id=id)
    obj.debugtalk = code
    obj.save()


def get_default_debugtalk():
    defatulFile = os.path.join(os.getcwd(), 'suite', 'debugtalk.py')
    lines = []
    content = ''
    if os.path.exists(defatulFile):
        with open(defatulFile) as f:
            lines = f.readlines()
    for line in lines:
        line = line.rstrip(' ').rstrip('\n').rstrip('\r\n').rstrip('\r')
        content = content + line + os.linesep
    return content
