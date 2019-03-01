#用例加载
# 1、完成从数据库用例用例数据
# 2、添加基础测试项
# 3、格式化用例到yml格式文件

from django.core.exceptions import ObjectDoesNotExist
from ApiManager.models import TestCaseInfo
import ast,os,re,copy

def load_case_data(index, base_url):

    config = {
        'config': {
            'name': '',
            'request': {
                'base_url': base_url
            },
            'parameters':[]
        },
    }
    testcase_list = []

    testcase_list.append(config)

    try:
        case = TestCaseInfo.objects.get(id=index)
    except ObjectDoesNotExist:
        return testcase_list

    config['config']['name'] = case.name

    rely_data = ast.literal_eval(case.include)
    prarmeters_dict = config['config']['parameters']

    for rely_case in rely_data:
        try:
            rely_case_id = rely_case[0]
            rely_case_obj = TestCaseInfo.objects.get(id = rely_case_id)
            result = format_case(rely_case_obj,prarmeters_dict)
            format_variables(result,rely_case_obj)
            testcase_list.append(result)
            # 前置条件的基础测试不再进行，可减少一定测试次数
        except Exception as e:
            print('format_rely ObjectDoesNotExist===>{}'.format(e))

    result = format_case(case,prarmeters_dict)
    format_variables(result,case)
    testcase_list.append(result)
    """
        基础测试添加逻辑
        1、若变量不在prarmeters_dict中，则认为是variable中设置的变量，返回另行处理
            prarmeters_dict中的处理流程：
            1、缺失情况：去掉data中的字段
            2、为空串情况：设置data中该字段为空串
            3、基础库中的内容：设置data中该字段为相应值
            以上均要处理方法调用中的变量引用，正则替换为相应值，并将所有variable添加到该用例中，避免引用不到其他变量
            需要注意的是，当添加基础测试时，其他变量若为parameter中设置，需要进行删减，不然会增加很多用例
            （当前处理方式为，其他变量取第一个值使用）
        2、若变量为variable中定义
            1、缺失情况：去掉data中该字段
            2、空串情况：设置variable中该变量为空串
            3、基础库中内容：设置variable中的该值为相应值即可。
            由于已经存在variable内容，则不存在方法中的变量引用不到的问题，无需特别添加
        3、若上述两个流程之后都未添加基础测试，则认为是普通字段，未引用变量，则直接添加多个test，分别修改data中的内容
    """
    if not case.dataType == 'json':
        # 不为json格式时才能进行基础测试
        notAddedParams = add_basic_test(case,testcase_list,prarmeters_dict)
        notAddedParams = add_variables_basic_test(testcase_list,notAddedParams)
        add_normal_basic_test(testcase_list,notAddedParams)
    return testcase_list

def format_case(case_obj,parameters_dict,formatParams=True):

    case_dict = {'request':{}}
    case_dict['request']['url'] = case_obj.url
    case_dict['name'] = case_obj.name
    #格式化body
    format_data(case_dict,case_obj,parameters_dict)
    #格式化method
    format_method(case_obj,case_dict)
    #格式化headers（case中的）
    format_common(case_dict,case_obj.headers,'request','headers')
    #格式化验证
    format_validate(case_dict,case_obj.validate)
    #格式化提取-extract
    format_extract(case_dict,case_obj.extract)
    #添加parameters 相关
    if formatParams:
        format_parameters(parameters_dict,case_obj)
    
    result = {'test':case_dict}
    return result

def format_variables(result,case):
    try:
        if case.variables != "\"\"":
            # 判断variables为空的情况，注意，此处为""，不是空字符串
            variableList = ast.literal_eval(case.variables).pop("content")
            result["test"]["variables"] = {}
            for variable in variableList:
                result["test"]["variables"][variable["key"]] = variable["value"]
    except Exception as e:
        print("variables parse error!")


def format_rely(testcase_dict,content):
    content = ast.literal_eval(content)
    prarmeters_dict = testcase_dict['config']['parameters']
    for rely_case in content:
        try:
            rely_case_id = rely_case[0]
            rely_case_obj = TestCaseInfo.objects.get(id=rely_case_id)
            testcase_dict['test'].append(format_case(rely_case_obj,prarmeters_dict))
        except Exception as e:
            print('format_rely ObjectDoesNotExist===>{}'.format(e))
            pass

def format_extract(case_dict,extract):
    try:
        extract = ast.literal_eval(extract).pop('content')
        result = []
        for item in extract:
            result.append({item['key']:item['value']})
        case_dict['extract'] = result
    except Exception as e:
        pass

def format_method(case_obj,request_dict):
    methodType = case_obj.method
    if methodType == '1':
        methodType = 'POST'
    elif methodType == '2':
        methodType = 'GET'
    request_dict['request']['method'] = methodType

def format_data(root_dict,case_obj,parameters_dict):
    dataType = case_obj.dataType
    try:
        if dataType == 'data':
            content = ast.literal_eval(case_obj.request_data).pop('content')     
            root_dict['request']['data'] = josn_to_dict_case(content,parameters_dict)
        elif dataType == 'json':
            content = ast.literal_eval(case_obj.request_data).pop('content')
            root_dict['request']['data'] = list_to_dict2(content)
    except Exception as e:
        pass

def format_common(common_dict,content,key,sub_key):
    try:
        content = ast.literal_eval(content).pop('content')
        common_dict[key][sub_key] = list_to_dict(content)
    except Exception:
        pass

def format_validate(validate_dict,content):
    try:
        validate_content = ast.literal_eval(content).pop('content')
        validate_dict['validate'] = list_to_dict_all(validate_content)
    except Exception as e:
        pass

def format_parameters(parameters_dict,case_obj):
    try:
        parameters_data = ast.literal_eval(case_obj.parameters).pop('content')

        for item in parameters_data:
            result_dict = {}
            try:
                #判断value为list的情况
                value_content = ast.literal_eval(item['value'])
                if  not isinstance(value_content, list):
                    result_dict[item.get('key')] = item.get('value')
                else:
                    result_dict[item.get('key')] = value_content
            except ValueError:
                result_dict[item.get('key')] = item.get('value')

            parameters_dict.append(result_dict)
    except Exception:
        pass

#在params中有变量的情况下， request中的value 需要改为取params中的值  如 $account
def josn_to_dict_case(content,parameters):
    result_dict = {}
    for item in content:
        key = item.get('key')
        #key 与 params中的key相等的情况下， 修改value 为取params中的值  如 $account
        if has_key_in_params(parameters,key):
            result_dict[key] = '${}'.format(key)
        else:
            result_dict[key] = item.get('value')
    return result_dict   

def has_key_in_params(content,dataKey):
    for item in content:
        for key in item:
            if key == dataKey:
                return True
    return False

def list_to_dict2(content):
    result = {}
    for item in content:
       return item
    return result

def list_to_dict(content):
    result = {}
    for item in content:
        key = item.get('key')
        result[key] = item.get('value')
    return result

#把list中的所有数据都读取并且赋值 这个返回list
def list_to_dict_all(content):
    result = []
    for item in content:
        temp_dict = {}
        for key in item:
            temp_dict[key] = item[key]
            if 'expect' == key:
                data_type = temp_dict['type']
                if data_type == 'string':
                    data_type = 'str'
                    temp_dict[key] = str(item[key])
                elif data_type == 'int':
                    temp_dict[key] = int(item[key])
                elif data_type == 'float':
                    temp_dict[key] = float(item[key])
                elif data_type == 'boolean':
                    temp_dict[key] = boolean(item[key])
        result.append(temp_dict)
    return result

#json 转 字典
def josn_to_dict(content):
    result_dict = {}
    for item in content:
        try:
            #判断value为list的情况
            value_content = ast.literal_eval(item['value'])
            if  not isinstance(value_content, list):
                result_dict[item.get('key')] = item.get('value')
            else:
                result_dict[item.get('key')] = value_content

        except ValueError:
            result_dict[item.get('key')] = item.get('value')
    return result_dict
    
# 添加基础测试用例，返回未在prarmeters_dict中的字段列表
def add_basic_test(case,testcase_list,prarmeters_dict):
    # 判断是否有需要基础测试的字段
    # 用于存储需要基础测试的字段
    basicTest = []
    # 存储已经添加了基础测试的字段
    addedParams = []
    # 存储未添加基础测试的字段
    notAddedParams = []
    contents = ast.literal_eval(case.request_data).pop('content')
    for item in contents:
        if item['basic'] == 1 or item['basic'] == '1':
            basicTest.append(item['key'])
    if len(basicTest) < 1:
        return notAddedParams

    result = copy.deepcopy(basicTest)
    keys = get_params_keys(prarmeters_dict)
    for item in basicTest:
        if item not in keys:
            notAddedParams.append(item)
            result.remove(item)
    basicTest = result
    # 取出最近的一条request记录，进行修改后添加
    # 删除需要基础测试的字段（测试缺少字段）
    for item in basicTest:
        result = deal_params(case,prarmeters_dict,[item])
        testcase_list.append(result)
    # 添加该字段为空串的情况
    for item in basicTest:
        result = deal_params(case,prarmeters_dict,[item],'')
        testcase_list.append(result)
    # 读取基础库进行特殊情况添加
    library = read_basic_library()
    for item in library:
        for basicTestItem in basicTest:
            result = deal_params(case,prarmeters_dict,[basicTestItem],item)
            testcase_list.append(result)
    return notAddedParams

# 添加variables内容的基础测试
def add_variables_basic_test(testcase_list,notAddedParams):
    if len(notAddedParams) == 0:
        return notAddedParams

    # 取出yml中的第一个test配置，此配置为未处理过的配置，可以作为模板用来修改为基础测试的test
    for param in notAddedParams:
        templateTest = copy.deepcopy(testcase_list[1])
        data = templateTest['test']['request']['data']
        # 添加字段缺失情况
        del data[param]
        testcase_list.append(templateTest)
        # 添加字段为空串得情况
        templateTest = copy.deepcopy(testcase_list[1])
        test = templateTest['test']
        if test.get("variables") != None and test.get('variables').get(param) != None:
            # 若不存在variables内容，或者param不再variables中，则认为该字段不是变量引用形式配置的
            variables = templateTest['test']['variables']
            variables[param] = ''
            testcase_list.append(templateTest)
            # 添加基础库中的内容
            library = read_basic_library()
            for item in library:
                templateTest = copy.deepcopy(testcase_list[1])
                variables = templateTest['test']['variables']
                variables[param] = item
                testcase_list.append(templateTest)
            # 从列表中移除已经处理过的
            if param in notAddedParams:
                notAddedParams.remove(param)
    return notAddedParams

# 添加普通字段的基础测试
def add_normal_basic_test(testcase_list,notAddedParams):
    if len(notAddedParams) == 0:
        return

    for param in notAddedParams:
        templateTest = copy.deepcopy(testcase_list[1])
        data = templateTest['test']['request']['data']
        # 添加字段缺失情况
        del data[param]
        testcase_list.append(templateTest)

        # 添加字段为空串得情况
        templateTest = copy.deepcopy(testcase_list[1])
        data = templateTest['test']['request']['data']
        data[param] = ''
        testcase_list.append(templateTest)

        # 添加基础库中的内容
        library = read_basic_library()
        for item in library:
            templateTest = copy.deepcopy(testcase_list[1])
            data = templateTest['test']['request']['data']
            data[param] = item
            testcase_list.append(templateTest)



# 读取基础库内容
def read_basic_library():
    result = []
    libraryPath = os.path.join(os.getcwd(),'suite','basicLibrary.txt')
    if os.path.exists(libraryPath):
        with open(libraryPath) as f:
            lines = f.readlines()
            for line in lines:
                result.append(line.strip('\n'))
    else:
        print('基础库文件不存在！%s'%(libraryPath))
    return result

# 根据传入的替换内容，设置指定字段的值
def deal_params(case,prarmeters_dict,basicTest,replaceStr=None):
    result = format_case(case,prarmeters_dict,False)
    data = result['test']['request']['data']
    if replaceStr is None:
        for item in basicTest:
            if data.__contains__(item):
                del data[item]
    else:
        for item in basicTest:
            data[item] = replaceStr
    for item in data:
        if item == basicTest[0]:
            data[item] = replaceStr
            continue
        if data[item].startswith('${'):
            # 若是方法调用，则不进行处理
            patternStr = "\$" + basicTest[0] + "\s*,"
            pattern = re.compile(patternStr)
            match = pattern.search(data[item])
            if match:
                index = match.span()
                if replaceStr != None:
                    data[item] = data[item][0:index[0]] + replaceStr + data[item][index[1]-1:len(data[item])]
            continue
        if data[item].startswith('$'):
            # data为引用变量方式定义的情况,需要删减
            data[item] = parse_params(case,prarmeters_dict,data[item].lstrip('$'))
    # 将variables添加到每个基础测试用例中，避免引用不到变量
    # 同时，排除variables为空的情况
    if case.variables != "\"\"": 
        temp = ast.literal_eval(case.variables)
        result['test']['variables'] = {}
        for item in temp['content']:
            result['test']['variables'][item['key']] = item['value']
    return result

# 返回一个指定value值，以减少无效测试次数
def parse_params(case,parameters_dict,paramName):
    variables = case.variables
    result = ''
    for item in parameters_dict:
        for key in list(item.keys()):
            keyList = key.split('-')
            if paramName in keyList:
                index = keyList.index(paramName)
                if len(keyList) > 1:
                    result = item[key][0][index]
                else:
                    result = item[key][0]
    if result == '':
        # 未从parameters_dict中获取到值，使用variables中的值
        variables = ast.literal_eval(variables)['content']
        for item in variables:
            if item['key'] == paramName:
                result = item['value']
    return result

def get_params_keys(parameters_dict):
    keys = []
    for item in parameters_dict:
        keys.append(list(item.keys())[0])
    return keys



    



