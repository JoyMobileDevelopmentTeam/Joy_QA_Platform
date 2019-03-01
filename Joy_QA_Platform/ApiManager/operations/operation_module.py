import json, re

from django.http import JsonResponse
from django.shortcuts import render_to_response, render
from django.forms.models import model_to_dict

from frame.utils.common import get_ajax_msg, dataToJson
from ApiManager.utils.forms import ModuleModelForm
from ApiManager.models import ModuleInfo, ProjectInfo
from ApiManager.utils.forms import get_validate_form_msg
from ApiManager.utils.utils import pagination_for_objects
from Joy_QA_Platform.configs import AUTH_ADD_MODULE, AUTH_DELETE, AUTH_UPDATE, AUTH_VIEW

def module_create(request):
    if request.method == 'GET':
        return render(request, 'api/module_new.html')
    elif request.method == 'POST':
        if request.user.has_perm(AUTH_ADD_MODULE):
            if request.method == 'POST':
                model_form = ModuleModelForm(request.POST)
                if model_form.is_valid():
                    project_id = request.POST.get('belong_project')
                    if not ProjectInfo.objects.filter(id=project_id).exists():
                        return JsonResponse(get_ajax_msg(0, 0, '此项目不存在', {}))
                    else:
                        if ModuleInfo.objects.filter(module_name=model_form.instance.module_name).filter(
                                belong_project_id=project_id).exists():
                            return JsonResponse(get_ajax_msg(0, 0, '此模块已存在', {}))
                        model_form.instance.belong_project_id = project_id
                        model_form.save()
                        return JsonResponse(get_ajax_msg(1, 1, '添加模块成功', {}))
                else:
                    msg = get_validate_form_msg(model_form)
                    return JsonResponse(get_ajax_msg(0, 0, msg))
        else:
            return JsonResponse(get_ajax_msg(0, 0, '用户没有创建模块的权限'))


def module_list(request):
    if request.method == 'GET':
        return render(request, 'api/module_list.html')
    elif request.method == 'POST':
        index = int(request.POST.get('index'))
        project_name_dic = {}
        # 根据用户权限筛选模块
        objects = filter_modules_for_user(request.user, ModuleInfo.objects.order_by('-id'), AUTH_VIEW)
        modules = pagination_for_objects(objects, index)
        if modules is not None and len(modules) > 0:
            for module in modules:
                project_id = module.belong_project_id
                project_name = module.belong_project.project_name
                project_name_dic[str(project_id)] = project_name
        count = len(objects)
        data = dataToJson([model_to_dict(i) for i in modules])
        return JsonResponse(get_ajax_msg(1, 1, '获取模块列表成功', {'modules': data, 'count': count, 'currPage': index,
                                                            'proInfo': project_name_dic}))


def module_search(request):
    if request.method == 'POST':
        # 当要搜索某个项目下的模块时，可通过传入项目id进行获取
        project_id = request.POST.get('project_id')
        if project_id != None:
            modules = ModuleInfo.objects.all().filter(belong_project_id=project_id)
            count = modules.count()
            data = dataToJson([model_to_dict(i) for i in modules])
            return JsonResponse(get_ajax_msg(1, 1, '搜索成功', {'modules': data, 'count': count}))
        
        index = int(request.POST.get('index'))
        project_name = request.POST.get('project_name')
        module_name = request.POST.get('module_name')
        test_person = request.POST.get('test_person')
        project_name_dic = {}
        if len(project_name) == 0 and len(module_name) == 0 and len(test_person) == 0:
            return JsonResponse(get_ajax_msg(0, 0, '搜索条件无效'))
        else:
            modules = ModuleInfo.objects.all()
            if len(project_name) != 0 and project_name != '项目名称':
                modules = modules.filter(belong_project__project_name__contains=project_name)
            if len(module_name) != 0:
                modules = modules.filter(module_name__contains=module_name)
            if len(test_person) != 0:
                modules = modules.filter(test_user__contains=test_person)
        if modules is None:
            return JsonResponse(get_ajax_msg(0, 0, '查询出错'))
        if modules is not None and len(modules) > 0:
            modules = filter_modules_for_user(request.user, modules.order_by('-id'), AUTH_VIEW)  # 根据用户权限筛选模块
            for module in modules:
                proID = module.belong_project_id
                proName = module.belong_project.project_name
                project_name_dic[str(proID)] = proName
        count = len(modules)
        modules = pagination_for_objects(modules, index)
        data = dataToJson([model_to_dict(i) for i in modules])
        return JsonResponse(get_ajax_msg(1, 1, '搜索成功', {'modules': data, 'count': count, 'currPage': index,
                                                        'proInfo': project_name_dic}))


def module_delete(request):
    if request.method == 'POST':
        module_id = request.POST.get('id')
        modules = ModuleInfo.objects.filter(id=module_id)
        if len(modules) == 0:
            return JsonResponse(get_ajax_msg(0, 0, '没有这条数据', {}))
        # 检查用户是否拥有删除权限
        if check_perm(request.user, modules[0], AUTH_DELETE):
            if ModuleInfo.objects.delete_module(module_id):
                return JsonResponse(get_ajax_msg(1, 1, '删除成功'))
            else:
                return JsonResponse(get_ajax_msg(0, 0, '删除失败'))
        else:
            return JsonResponse(get_ajax_msg(0, 0, '用户没有删除该模块的权限'))


def module_query(request):
    if request.method == 'POST':
        module_id = request.POST.get('id')
        modules = ModuleInfo.objects.filter(id=module_id)
        if len(modules) == 0:
            return JsonResponse(get_ajax_msg(0, 0, '没有这条数据', {}))
        modules = filter_modules_for_user(request.user, modules, AUTH_VIEW)
        data = dataToJson([model_to_dict(i) for i in modules])
        return JsonResponse(get_ajax_msg(1, 1, '获取模块成功', {'modules': data}))


def module_update(request):
    if request.method == 'POST':
        model_form = ModuleModelForm(request.POST)
        if model_form.is_valid():
            module_id = request.POST.get('id')
            module_name = request.POST.get('module_name')
            project_name = request.POST.get('project_name')
            test_user = request.POST.get('test_user')
            simple_desc = request.POST.get('simple_desc')
            other_desc = request.POST.get('other_desc')
            if check_perm(request.user, ModuleInfo.objects.get(id=module_id), AUTH_UPDATE):
                if ModuleInfo.objects.update_module(module_id, module_name=module_name, project_name=project_name,
                                                    test_user=test_user, simple_desc=simple_desc, other_desc=other_desc):
                    return JsonResponse(get_ajax_msg(1, 1, '修改模块成功', {}))
                else:
                    return JsonResponse(get_ajax_msg(0, 0, '修改模块失败', {}))
            else:
                return JsonResponse(get_ajax_msg(0, 0, '用户没有修改该模块的权限'))
        else:
            msg = get_validate_form_msg(model_form)
            return JsonResponse(get_ajax_msg(0, 0, msg))


def filter_modules_for_user(user, modules, perm):
    results = []
    for module in modules:
        project = module.belong_project
        if user.has_perm(perm, project):
            results.append(module)
    return results


def check_perm(user, module, perm):
    project = module.belong_project
    return user.has_perm(perm, project)
