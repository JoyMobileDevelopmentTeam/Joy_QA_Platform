import json
import os
import datetime
import time

from django.http import JsonResponse
from django.shortcuts import render_to_response, render
from django.forms.models import model_to_dict

from frame.utils.common import get_ajax_msg, dataToJson
from ApiManager.utils.file_tools import get_time_stamp
from ApiManager.models import ReportInfo, ProjectInfo, ModuleInfo
from ApiManager.utils.common import get_report_name, get_uuid, delete_report, generate_report, del_fields
from ApiManager.utils.utils import pagination_for_objects
from Joy_QA_Platform.configs import AUTH_DELETE, AUTH_UPDATE, AUTH_VIEW


def report_check(request):
    if request.method == 'POST':
        report_id = request.POST.get('report_id')
        if report_id == None:
            return JsonResponse(get_ajax_msg(0, 0, '报告id为空', {}))
        reports = ReportInfo.objects.all().filter(report_id=report_id)
        if len(reports) > 0:
            return JsonResponse(get_ajax_msg(1, 1, '报告已生成！', {'report_id': reports[0].id}))
        else:
            return JsonResponse(get_ajax_msg(0, 0, '报告未生成！', {}))


def report_query(request):
    if request.method == 'POST':
        report_id = request.POST.get('report_id')
        if report_id == None:
            return JsonResponse(get_ajax_msg(0, 0, '报告id为空', {}))
        reports = ReportInfo.objects.all().filter(id=report_id)
        if len(reports) > 0:
            if check_perm(request.user, reports[0], AUTH_VIEW):
                return JsonResponse(get_ajax_msg(1, 1, '获取报告成功！', {'report_id': reports[0].id}))
            else:
                return JsonResponse(get_ajax_msg(0, 0, '用户没有查看该报告的权限！'))
        else:
            return JsonResponse(get_ajax_msg(0, 0, '报告不存在！', {}))
    else:
        reports = ReportInfo.objects.all().filter(id=request.GET.get('id'))
        if len(reports) < 1:
            return JsonResponse(get_ajax_msg(0, 0, '报告不存在！', {}))
        report = reports[0]
        # 删除其他无用报告
        clear_report()
        generate_report(json.loads(report.result_data),json.loads(report.original_data),report.report_name)
        return render_to_response('report/%s.html'%(report.report_name))


def report_list(request):
    if request.method == 'GET':
        return render_to_response('api/report_list.html')
    elif request.method == 'POST':
        index = int(request.POST.get('index'))
        objects = filter_reports_for_user(request.user, ReportInfo.objects.defer('result_data').all().order_by('-id'), AUTH_VIEW)
        reports = pagination_for_objects(objects, index)
    count = len(objects)
    # 去除不需要的数据---数据特别多
    tempData = [model_to_dict(i) for i in reports]
    del_fields(tempData, ['result_data', 'original_data'])
    data = dataToJson(tempData)
    return JsonResponse(get_ajax_msg(1, 1, '获取报告列表成功', {'reports': data, 'count': count, 'currPage': index}))


def report_search(request):
    if request.method == "POST":
        index = int(request.POST.get('index'))
        search_type = request.POST.get('search_type', '')
        project_name = request.POST.get('project_name', '')
        module_name = request.POST.get('module_name', '')
        report_name = request.POST.get('report_name')
        start_date = request.POST.get('startDate', '')
        end_date = request.POST.get('endDate', '')
        
        if len(project_name) == 0 and len(module_name) == 0 and len(report_name) == 0 and len(start_date) == 0 and len(end_date) == 0:
            return JsonResponse(get_ajax_msg(0, 0, '搜索条件无效'))
        else:
            reports = ReportInfo.objects.all()
            if len(module_name) != 0 and module_name != '模块名称':
                module_id = ModuleInfo.objects.all().filter(module_name__contains=module_name)[0].id
                reports = reports.filter(belong_module=module_id)
            if len(project_name) != 0 and project_name != '项目名称':
                project_id = ProjectInfo.objects.all().filter(project_name__contains=project_name)[0].id
                reports = reports.filter(belong_project=project_id)
            if len(report_name) != 0:
                reports = reports.filter(report_name__contains=report_name)
            if search_type == '1':
                reports = reports.filter(report_name__contains='定时任务')
            if len(start_date) != 0 and len(end_date) != 0:
                start_date = time.mktime(datetime.datetime.strptime(start_date, "%Y-%m-%d").timetuple())
                end_date = time.mktime((datetime.datetime.strptime(end_date, "%Y-%m-%d")  + datetime.timedelta(days=1)).timetuple())
                reports = reports.filter(test_time__range=(start_date, end_date))
        if reports is None:
            return JsonResponse(get_ajax_msg(0, 0, '查询出错'))
        # 根据用户权限筛选
        reports = filter_reports_for_user(request.user, reports.order_by('-id'), AUTH_VIEW)
        count = len(reports)
        reports = pagination_for_objects(reports, index)
        # 去除不需要的数据---数据特别多
        tempData = [model_to_dict(i) for i in reports]
        del_fields(tempData,['result_data','original_data'])
        data = dataToJson(tempData)
        return JsonResponse(get_ajax_msg(1, 1, '搜索成功', {'reports': data, 'count': count, 'currPage': index}))


def report_delete(request):
    if request.method == "POST":
        report_ids = request.POST.getlist('ids')
        if len(report_ids) > 0:
            # 多选删除
            for report_id in report_ids:
                reports = ReportInfo.objects.filter(id=report_id)
                if len(reports) < 1:
                    return JsonResponse(get_ajax_msg(0, 0, '%s-此报告不存在！'%(report_id)))
                if check_perm(request.user, reports[0], AUTH_DELETE):
                    # 删除可能存在的报告页面
                    report_name = reports[0].report_name
                    delete_report(report_name)
                    reports[0].delete()
                else:
                    return JsonResponse(get_ajax_msg(0, 0, '用户没有删除该报告的权限：' + report_name))
            return JsonResponse(get_ajax_msg(1, 1, '删除报告成功！'))
        else:
            report_id = request.POST.get('id')
            reports = ReportInfo.objects.all().filter(id=report_id)
            if len(reports) < 1:
                return JsonResponse(get_ajax_msg(0, 0, '此报告不存在！'))
            if check_perm(request.user, reports[0], AUTH_DELETE):
                # 删除可能存在的报告页面
                report_name = reports[0].report_name
                delete_report(report_name)
                reports[0].delete()
                return JsonResponse(get_ajax_msg(1, 1, '删除报告成功！'))
            else:
                return JsonResponse(get_ajax_msg(0, 0, '用户没有删除该报告的权限！'))

# 清理报告html文件
def clear_report():
    excludeList = ['template']
    reportDir = os.path.join(os.getcwd(),'templates','report')
    fileList = os.listdir(reportDir)
    result = []
    for file in fileList:
        if file not in excludeList and ('.html' in file):
            result.append(file)
    for file in result:
        path = os.path.join(reportDir,file)
        if os.path.exists(path) and os.path.isfile(path):
            os.remove(path)

def filter_reports_for_user(user, reports, perm):
    project_dict = {}
    projects = ProjectInfo.objects.all()
    for project in projects:
        project_dict[project.id] = project
    
    results = []
    for report in reports:
        project = project_dict.get(report.belong_project)
        if project is not None:
            if user.has_perm(perm, project):
                results.append(report)
    return results


def check_perm(user, report, perm):
    project_dict = {}
    projects = ProjectInfo.objects.all()
    for project in projects:
        project_dict[project.id] = project
    
    project = project_dict[report.belong_project]
    if project is not None:
        return user.has_perm(perm, project)
    return False
