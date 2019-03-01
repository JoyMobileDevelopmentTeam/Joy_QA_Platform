import json, ast, os, csv

from django.http import JsonResponse
from django.shortcuts import render_to_response, render
from django.forms.models import model_to_dict

from frame.utils.common import get_ajax_msg, dataToJson
from ApiManager.utils.common import get_uuid
from ApiManager.models import TestCaseInfo, ProjectInfo
from ApiManager.utils.common import del_fields
from ApiManager.utils import case_utils
from ApiManager.utils.utils import pagination_for_objects
from Joy_QA_Platform.configs import AUTH_ADD_CASE, AUTH_DELETE, AUTH_UPDATE, AUTH_VIEW

def case_create(request):
    if request.method == "GET":
        # 拼装项目信息返回前端使用
        projects = ProjectInfo.objects.all().order_by('id')
        context = {}
        context['projects'] = []
        for project in projects:
            context['projects'].append({'project_name': project.project_name, 'project_id': project.id})
        return render(request, 'api/case_add.html', context)
    if request.user.has_perm(AUTH_ADD_CASE):
        if request.method == 'POST':
            params = json.loads(request.body.decode('utf-8'))
            name = params['name']
            module_id = params['belong_module']
            if TestCaseInfo.objects.filter(name=name).filter(belong_module_id=module_id).exists():
                return JsonResponse(get_ajax_msg(0, 0, "该模块下已存在同名用例!", {}))
            # 校验各个字段
            check_result = check_case_info(params)
            if check_result == '':
                TestCaseInfo(name=name, belong_module_id=module_id, include=json.dumps(params['include']),
                             author=params['author'], case_info=json.dumps(params['case_info']),
                             variables=json.dumps(params['variables']),
                             parameters=json.dumps(params['parameters']), hooks=json.dumps(params['hooks']),
                             url=params['url'], method=params['method'], dataType=params['dataType'],
                             request_data=json.dumps(params['request_data']), headers=json.dumps(params['headers']),
                             extract=json.dumps(params['extract']), validate=json.dumps(params['validate']),
                             lastRunEnv=0).save()
                return JsonResponse(get_ajax_msg(1, 1, "新增用例成功", {}))
            else:
                return JsonResponse(get_ajax_msg(0, 0, check_result, {}))
    else:
        return JsonResponse(get_ajax_msg(0, 0, '用户没有创建用例的权限'))


def case_list(request):
    if request.method == "GET":
        # 拼装项目信息返回前端使用(编辑用例的模态框内使用)
        projects = ProjectInfo.objects.all().order_by('id')
        context = {}
        context['projects'] = []
        for project in projects:
            context['projects'].append({'project_name': project.project_name, 'project_id': project.id})
        return render(request, 'api/case_list.html', context)
    elif request.method == 'POST':
        index = int(request.POST.get('index'))
        project_name_dic = {}
        module_name_dic = {}
        # 根据用户权限筛选用例
        results = filter_cases_for_user(request.user, TestCaseInfo.objects.filter().order_by('-id'), AUTH_VIEW)
        cases = pagination_for_objects(results, index)

        if cases is not None and len(cases) > 0:
            for case in cases:
                # 所属模块id对应模块名称
                module_id = case.belong_module_id
                module_name = case.belong_module.module_name
                module_name_dic[str(module_id)] = module_name
                # 所属模块id对应项目名称
                project_name = case.belong_module.belong_project.project_name
                project_name_dic[str(module_id)] = project_name
        count = len(results)
        tempData = [model_to_dict(i) for i in cases]
        del_fields(tempData,['variables','parameters','hooks','url','request_data','headers','extract','validate','include'])
        data = dataToJson(tempData)
        return JsonResponse(get_ajax_msg(1, 1, '获取用例列表成功', {'cases': data, 'count': count, 'currPage': index,
                                                            'proInfo': project_name_dic,
                                                            'moduleInfo': module_name_dic}))


# 拉取指定用例（以项目id、模块id等为条件）
def case_search_with_id(request):
    if request.method == 'POST':
        project_id = request.POST.get('project_id', 0)
        module_id = request.POST.get('module_id', 0)
        case_id = request.POST.get('case_id', 0)
        cases = None
        project_name_dic = {}
        module_name_dic = {}
        count = 0
        if case_id != 0:
            cases = TestCaseInfo.objects.filter(id=case_id)
        elif module_id != 0:
            cases = TestCaseInfo.objects.filter(belong_module_id=module_id)
        elif project_id != 0:
            cases = TestCaseInfo.objects.filter(belong_module__belong_project__id=project_id)
        if cases is None:
            return JsonResponse(get_ajax_msg(0, 0, '查询出错'))
        cases = filter_cases_for_user(request.user, cases.order_by('-id'), AUTH_VIEW)
        if cases != None and len(cases) > 0:
            for case in cases:
                # 所属模块id对应模块名称
                module_id = case.belong_module_id
                module_name = case.belong_module.module_name
                module_name_dic[str(module_id)] = module_name
                # 所属模块id对应项目名称
                project_name = case.belong_module.belong_project.project_name
                project_name_dic[str(module_id)] = project_name
        count = len(cases)
        tempData = [model_to_dict(i) for i in cases]
        del_fields(tempData,['variables','parameters','hooks','url','request_data','headers','extract','validate','include'])
        data = dataToJson(tempData)
        return JsonResponse(get_ajax_msg(1, 1, '搜索成功', {'cases': data, 'count': count,
                                                        'proInfo': project_name_dic, 'moduleInfo': module_name_dic}))
    elif request.method == 'GET':
        pass


def case_search(request):
    if request.method == 'POST':
        # 当要搜索某个模块下的用例时，可通过传入模块id进行获取
        module_id = request.POST.get('module_id')
        if module_id != None:
            cases = TestCaseInfo.objects.all().filter(belong_module_id=module_id)
            count = cases.count()
            data = dataToJson([model_to_dict(i) for i in cases])
            return JsonResponse(get_ajax_msg(1, 1, '搜索成功', {'cases': data, 'count': count}))
        index = int(request.POST.get('index'))
        project_name = request.POST.get('project_name', '')
        module_name = request.POST.get('module_name', '')
        case_name = request.POST.get('case_name', '')
        author = request.POST.get('author', '')
        project_name_dic = {}
        module_name_dic = {}
        if len(project_name) == 0 and len(module_name) == 0 and len(case_name) == 0 and len(author) == 0:
            return JsonResponse(get_ajax_msg(0, 0, '搜索条件无效'))
        else:
            cases = TestCaseInfo.objects.all()
            if len(module_name) != 0 and module_name != '模块名称':
                cases = cases.filter(belong_module__module_name__contains=module_name)
            if len(project_name) != 0 and project_name != '项目名称':
                cases = cases.filter(belong_module__belong_project__project_name__contains=project_name)
            if len(case_name) != 0:
                cases = cases.filter(name__contains=case_name)
            if len(author) != 0:
                cases = cases.filter(author__contains=author)
        if cases is None:
            return JsonResponse(get_ajax_msg(0, 0, '查询出错'))
        if cases is not None and len(cases) > 0:
            cases = filter_cases_for_user(request.user, cases.order_by('-id'), AUTH_VIEW)  # 根据用户权限筛选用例
            for case in cases:
                # 所属模块id对应模块名称
                module_id = case.belong_module_id
                module_name = case.belong_module.module_name
                module_name_dic[str(module_id)] = module_name
                # 所属模块id对应项目名称
                project_name = case.belong_module.belong_project.project_name
                project_name_dic[str(module_id)] = project_name
        count = len(cases)
        cases = pagination_for_objects(cases, index)
        tempData = [model_to_dict(i) for i in cases]
        del_fields(tempData,['variables','parameters','hooks','url','request_data','headers','extract','validate','include'])
        data = dataToJson(tempData)
        return JsonResponse(get_ajax_msg(1, 1, '搜索成功', {'cases': data, 'count': count, 'currPage': index,
                                                        'proInfo': project_name_dic, 'moduleInfo': module_name_dic}))


def case_delete(request):
    if request.method == "POST":
        case_id = request.POST.get('id')
        cases = TestCaseInfo.objects.filter(id=case_id)
        if len(cases) == 0:
            return JsonResponse(get_ajax_msg(0, 0, '没有这条数据', {}))
        # 检查用户是否拥有删除权限
        if check_perm(request.user, cases[0], AUTH_DELETE):
            cases[0].delete()
            return JsonResponse(get_ajax_msg(1, 1, '删除成功'))
        else:
            return JsonResponse(get_ajax_msg(0, 0, '用户没有删除该模块的权限'))


def case_query(request):
    if request.method == "POST":
        case_id = request.POST.get('id')
        cases = TestCaseInfo.objects.filter(id=case_id)
        moduleid_to_projectid = {}
        moduleid_to_modulename = {}
        if len(cases) == 0:
            return JsonResponse(get_ajax_msg(0, 0, '没有这条数据', {}))
        if cases is not None and len(cases) > 0:
            for case in cases:
                # 所属模块id对应模块名称
                module_id = case.belong_module_id
                module_name = case.belong_module.module_name
                moduleid_to_modulename[str(module_id)] = module_name
                # 所属模块id对应项目id
                project_id = case.belong_module.belong_project_id
                moduleid_to_projectid[str(module_id)] = project_id
        cases = filter_cases_for_user(request.user, cases, AUTH_VIEW)
        data = dataToJson([model_to_dict(i) for i in cases])
        data = json.loads(data)
        return JsonResponse(get_ajax_msg(1, 1, '获取用例信息成功', {'cases': data, 'proInfo': moduleid_to_projectid,
                                                            'moduleInfo': moduleid_to_modulename}))


def case_edit(request):
    if request.method == 'POST':
        try:
            params = json.loads(request.body.decode('utf-8'))
        except Exception as e:
            print('解析json出错！e={}'.format(e))
            return JsonResponse(get_ajax_msg(0, 0, "解析json出错！", {}))
        case_id = params['case_id']
        if not TestCaseInfo.objects.filter(id=case_id).exists():
            return JsonResponse(get_ajax_msg(0, 0, "不存在此条用例记录!", {}))
        name = params['name']
        module_id = params['belong_module']
        # cases = TestCaseInfo.objects.filter(name=name).filter(belong_module_id=module_id)
        # if cases.count() > 0 and cases[0].id != case_id:
        if not TestCaseInfo.objects.filter(name=name).filter(belong_module_id=module_id).exists():
            return JsonResponse(get_ajax_msg(0, 0, "该模块下已存在同名用例!", {}))
        else:
            # 更新数据
            check_result = check_case_info(params)
            if check_result == '':
                if check_perm(request.user, TestCaseInfo.objects.get(id=case_id), AUTH_UPDATE):
                    update_case(params)
                    return JsonResponse(get_ajax_msg(1, 1, '修改用例成功', {}))
                else:
                    return JsonResponse(get_ajax_msg(0, 0, '用户没有修改该用例的权限'))
            else:
                return JsonResponse(get_ajax_msg(0, 0, check_result, {}))


def case_upload(request):
    if request.method == 'POST':
        upload_file = request.FILES.get('file', None)
        if not upload_file:
            return JsonResponse(get_ajax_msg(0, 0, '上传失败！', {}))
        result = parse_upload_case(upload_file)
        if result:
            return JsonResponse(get_ajax_msg(1, 1, '上传成功！', {'case': result}))
        else:
            return JsonResponse(get_ajax_msg(0, 0, '解析文件失败！', {}))

def case_run(request):
    if request.method == 'POST':
        user_name = request.user.username
        case_info = json.loads(request.body.decode('utf-8')).pop('case_info')
        case_id = case_info.get('case_id')
        base_url = case_info.get('base_url', None)
        result = case_utils.run_case_by_id(base_url, case_id,None,user_name)

        if result == case_utils.RUN_CASE_ERR:
            return JsonResponse(get_ajax_msg(0, 0, '用例错误', {}))
        elif result == case_utils.RUN_CASE_EXCEPTION:
            return JsonResponse(get_ajax_msg(0, 0, '用例解析异常', {}))
        else:
            return JsonResponse(get_ajax_msg(1, 1, '已添加到队列', {'report_id': result}))
    else:
        return JsonResponse(get_ajax_msg(1001, 0, '不支持的请求方式', {}))


# 检查用例信息是否符合规则
def check_case_info(params):
    if params['name'] == '':
        return '用例名称不能为空！'
    if params['belong_module'] == '':
        return '所属模块不能为空！'
    if params['author'] == '':
        return '开发人员不能为空！'
    if params['url'] == '':
        return '待测接口地址不能为空！'

    data_type = params['dataType']

    # 过滤无效数据,去除可能存在的key为空字符串的情况
    params['variables'] = filter_params(params['variables'])
    if data_type == 'data':
        params['request_data'] = filter_params(params['request_data'])
    else:
        params['request_data'] = deal_json(params['request_data'])
    params['parameters'] = filter_params(params['parameters'])
    params['hooks'] = filter_params(params['hooks'], 'hooks')
    params['headers'] = filter_params(params['headers'])
    params['extract'] = filter_params(params['extract'])
    params['validate'] = filter_params(params['validate'], 'validate')

    if params['parameters'].__contains__('content'):
        for item in params['parameters']['content']:
            try:
                if not isinstance(ast.literal_eval(item['value']), list):
                    return 'parameters格式不正确'
            except Exception as e:
                return 'parameters格式不正确'
    return ''


def filter_params(params, keyword=None):
    result = []
    if params.__contains__('content'):
        if keyword is None:
            result = list(filter(filter_invalid_key, params['content']))
        elif keyword == 'validate':
            result = list(filter(filter_validate, params['content']))
        elif keyword == 'hooks':
            result = list(filter(filter_hooks, params['content']))
    if len(result) == 0:
        return ''
    return {'content': result}


def deal_json(params):
    return {'content': [params]}


def filter_invalid_key(item):
    del_linesep(item)
    if item['key'] == '':
        return False
    return True


def filter_validate(item):
    del_linesep(item)
    if item['check'] == '':
        return False
    return True


def filter_hooks(item):
    del_linesep(item)
    if item['setup_hooks'] == '':
        return False
    if item['teardown_hooks'] == '':
        return False
    return True


# 删除两端可能存在的换行符
def del_linesep(item):
    for key in item:
        if isinstance(item[key], str):
            item[key] = item[key].strip('\n').strip('\r\n').strip('\r')


# 更新用例
def update_case(params):
    TestCaseInfo.objects.update_case(**params)


def parse_upload_case(upload_file):
    filePath = os.path.join(os.getcwd(), 'temp', get_uuid() + '.csv')
    tempFile = open(filePath, 'wb+')
    for chunk in upload_file.chunks():
        tempFile.write(chunk)
    tempFile.close()
    result = parse_csv(filePath)
    os.remove(filePath)
    return result


# ----------------csv文件解析相关---------------


def is_empty_line(line):
    for item in line:
        if item != '' and item != '\n':
            return False
    return True

def is_null(content):
    if content != '' and content != '\n':
        return False
    return True


def get_line_type(line):
    types = ['info', 'request', 'headers', 'parameters', 'variables', 'setup_hooks', 'teardown_hooks', 'extract',
             'validate']
    if len(line) > 2 and line[0] == '-':
        for item in types:
            if item in line[1].lower():
                return item.lower()
    return None


def get_index(dataType, line, infoList, indexList=None):
    if dataType == 2:
        for index, item in enumerate(line):
            if not is_null(item) and index > 1:
                infoList[item] = index
    elif dataType == 3:
        for index, item in enumerate(line):
            if not is_null(item) and index > 1:
                indexList[item] = index
        # 初始化requestInfo
        for item in indexList:
            infoList[item] = []


def get_data(dataType, line, infoList, indexList=None):
    # dataType 
    # 1、    单行数据    如setup_hooks
    # 2、    1对1的数据  如headers
    # 3、    1对多的数据  如parameters
    if dataType == 1:
        for index, item in enumerate(line):
            if not is_null(item) and index > 1:
                infoList.append(item)
    elif dataType == 2:
        for item in infoList:
            infoList[item] = line[infoList[item]]
    elif dataType == 3:
        for item in indexList:
            infoList[item].append(line[indexList[item]])

def deal_params(params):
    for key in params:
        if '-' in key:
            paramsLen = len(key.split('-'))
            result = []
            for value in params[key]:
                values = value.split('-')
                while len(values) < paramsLen:
                    # value可能为''，则需要补足为多个
                    values.append('')
                result.append(values)
            params[key] = result

def parse_csv(filePath):
    result = {}
    caseInfo = {}
    requestIndex = {}
    requestInfo = {}
    headersInfo = {}
    parameterIndex = {}
    parameterInfo = {}
    variablesIndex = {}
    variablesInfo = {}
    setup_hooksInfo = []
    teardown_hooksInfo = []
    extractInfo = {}
    validateInfo = {}

    try:
        lineType = None
        if os.path.exists(filePath):
            with open(filePath) as f:
                f_csv = csv.reader(f)
                for line in f_csv:
                    if is_empty_line(line):
                        # 跳过空行
                        continue
                    # 去除utf-8 BOM格式的文件开头的特殊字符
                    line[0] = line[0].strip('\ufeff')
                    if '-' == line[0]:
                        lineType = get_line_type(line)
                        # 此行为指示行
                        if lineType == 'info':
                            get_index(2, line, caseInfo)
                        elif lineType == 'request':
                            # request行
                            get_index(3, line, requestInfo, requestIndex)
                        elif lineType == 'headers':
                            # headers行
                            get_index(2, line, headersInfo)
                        elif lineType == 'parameters':
                            get_index(3, line, parameterInfo, parameterIndex)
                        elif lineType == 'variables':
                            get_index(3, line, variablesInfo, variablesIndex)
                            # for index,item in enumerate(line):
                            #   if not is_null(item) and index > 1:
                            #       variablesIndex[item] = index
                            # # 初始化variablesInfo
                            # for item in variablesIndex:
                            #   variablesInfo[item] = []
                        elif lineType == 'setup_hooks':
                            get_data(1, line, setup_hooksInfo)
                        elif lineType == 'teardown_hooks':
                            get_data(1, line, teardown_hooksInfo)
                        elif lineType == 'extract':
                            # validate行
                            get_index(2, line, extractInfo)
                        elif lineType == 'validate':
                            # validate行
                            get_index(2, line, validateInfo)
                    else:
                        # 此行为数据行
                        if lineType == 'info':
                            get_data(2, line, caseInfo)
                        elif lineType == 'request':
                            get_data(3, line, requestInfo, requestIndex)
                        elif lineType == 'headers':
                            # headers行
                            get_data(2, line, headersInfo)
                        elif lineType == 'parameters':
                            get_data(3, line, parameterInfo, parameterIndex)
                        elif lineType == 'variables':
                            get_data(3, line, variablesInfo, variablesIndex)
                            # for item in variablesIndex:
                            #   variablesInfo[item].append(line[variablesIndex[item]])
                        elif lineType == 'extract':
                            # extract行
                            get_data(2, line, extractInfo)
                        elif lineType == 'validate':
                            # validate行
                            get_data(2, line, validateInfo)
            f.close()
        else:
            print("csv文件不存在")
            return None
        deal_params(parameterInfo)
        result['caseInfo'] = caseInfo
        result['requestInfo'] = requestInfo
        result['headersInfo'] = headersInfo
        result['parameterInfo'] = parameterInfo
        result['variablesInfo'] = variablesInfo
        result['setup_hooksInfo'] = setup_hooksInfo
        result['teardown_hooksInfo'] = teardown_hooksInfo
        result['extractInfo'] = extractInfo
        result['validateInfo'] = validateInfo
        return result
    except Exception as e:
        print(e)
        return None

# ----------------csv文件解析相关---------------


def filter_cases_for_user(user, cases, perm):
    results = []
    for case in cases:
        module = case.belong_module
        project = module.belong_project
        if user.has_perm(perm, project):
            results.append(case)
    return results


def check_perm(user, case, perm):
    module = case.belong_module
    project = module.belong_project
    return user.has_perm(perm, project)
