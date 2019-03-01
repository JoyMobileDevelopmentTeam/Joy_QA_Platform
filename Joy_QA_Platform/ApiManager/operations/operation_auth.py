import json

from django.core.exceptions import ObjectDoesNotExist
from django.http import JsonResponse
from django.shortcuts import render_to_response, render
from django.forms.models import model_to_dict
from guardian.shortcuts import assign_perm, get_user_perms, remove_perm
from guardian.core import ObjectPermissionChecker

from Joy_QA_Platform.configs import AUTH_ADD_PROJECT, AUTH_ADD_MODULE, AUTH_ADD_CASE, AUTH_ADD_TASK, AUTH_DELETE, AUTH_UPDATE, AUTH_VIEW
from frame.models import UserInfo
from frame.utils.common import get_ajax_msg, dataToJson
from ApiManager.models import ProjectInfo

import time
# 创建权限列表
add_perm_list = [AUTH_ADD_PROJECT, AUTH_ADD_MODULE, AUTH_ADD_CASE, AUTH_ADD_TASK]
# 默认用户ID
DEFAULT_USER_ID = '-1'


def auth(request):
    if request.user.is_superuser:
        if request.method == 'GET':
            return render(request, 'api/auth.html')
        elif request.method == 'POST':
            # 初始化权限树
            user_id = request.POST.get('userId')
            projects = ProjectInfo.objects.filter().order_by('-id')
            perm_dict = {AUTH_VIEW: '查询', AUTH_UPDATE: '修改', AUTH_DELETE: '删除'}  # 需要初始化的权限
            is_superuser = False
            has_add_perm_list = []  # 用户拥有的创建权限列表
            auth_list = []
            if user_id != DEFAULT_USER_ID:
                try:
                    user = UserInfo.objects.get(id=user_id)
                    checker = ObjectPermissionChecker(user)
                    is_superuser = user.is_superuser
                    has_add_perm_list = check_add_perm_for_user(user, add_perm_list)  # 初始化创建权限部分
                except ObjectDoesNotExist:
                    return JsonResponse(get_ajax_msg(0, 0, '没有该名用户'))
            # 初始化项目权限部分
            for project in projects:
                flag_all = True  # 全选项目权限标志
                auth_dict = {}
                auth_dict['name'] = project.project_name
                auth_dict['value'] = project.id
                auth_dict['list'] = []
                for key, value in perm_dict.items():
                    perm_name = value
                    perm_value = str(project.id) + '-' + key
                    if user_id != DEFAULT_USER_ID:
                        is_auth = checker.has_perm(key, project)
                    else:
                        is_auth = False
                    flag_all = flag_all and is_auth  # 与运算，判断是否全选权限
                    auth_dict['list'].append({'name': perm_name, 'value': perm_value, 'checked': is_auth})
                auth_dict['checked'] = flag_all
                auth_list.append(auth_dict)
            return JsonResponse(get_ajax_msg(1, 1, '获取权限列表成功',
                                             {'is_superuser': is_superuser, 'checks': ','.join(has_add_perm_list),
                                              'trees': auth_list}))
    else:
        return JsonResponse(get_ajax_msg(0, 0, '该名用户没有管理员权限'))


# 分配权限
def assign_auth(request):
    if request.user.is_superuser:
        if request.method == 'POST':
            user_id = request.POST.get('userId')
            if user_id != DEFAULT_USER_ID:
                try:
                    user = UserInfo.objects.get(id=user_id)
                except ObjectDoesNotExist:
                    return JsonResponse(get_ajax_msg(0, 0, '没有该名用户'))
                else:
                    projects = ProjectInfo.objects.filter().order_by('-id')
                    empty_user_auth(user, projects, add_perm_list)  # 清空用户权限
                    is_superuser = request.POST.get('is_superuser')
                    checks = request.POST.get('checks')
                    auths = request.POST.get('auths')
                    # 分配用户是否为管理员
                    user.is_superuser = is_superuser
                    user.save()
                    # 分配创建项目，模块，用例，任务权限
                    if checks:
                        for perm in checks.split(','):
                            assign_perm(perm, user)
                    # 分配项目的查询，修改，删除权限
                    if auths:
                        auths = request.POST.get('auths').split(',')
                        for auth in auths:
                            project_id = auth.split('-')[0]
                            auth_name = auth.split('-')[1]
                            project = ProjectInfo.objects.get(id=project_id)
                            assign_perm(auth_name, user, project)
                    return JsonResponse(get_ajax_msg(1, 1, '分配权限成功'))
            else:
                return JsonResponse(get_ajax_msg(0, 0, '请选择用户'))
    else:
        return JsonResponse(get_ajax_msg(0, 0, '该名用户没有管理员权限'))


def check_add_perm_for_user(user, add_perm_list):
    results = []
    for perm in add_perm_list:
        if user.has_perm(perm):
            results.append(perm)
    return results


def check_project_perm_for_user(user, project):
    pass


def empty_user_auth(user, projects, add_perm_list):
    for perm in add_perm_list:
        remove_perm(perm, user)
    for project in projects:
        perms = get_user_perms(user, project)
        for perm in perms:
            remove_perm(perm, user, project)
