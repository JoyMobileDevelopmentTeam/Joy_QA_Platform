import json,os,uuid,shutil
import urllib.parse

from django.db.models.fields.related import ManyToManyField

from ApiManager.utils.file_tools import get_time_stamp

def get_report_name(projectName='',moduleName='',caseName=''):
    time_stamp = get_time_stamp()
    report_name = ''
    if projectName == '' and moduleName == '' and caseName == '':
        report_name = 'report_'+str(time_stamp.replace(' ','-'))
    else:
       report_name = caseName+'-'+moduleName+'-'+projectName+"-"+str(time_stamp.replace(' ','-'))
    return report_name

def get_uuid():
    return str(uuid.uuid1())

def generate_report(summary,original_data,report_name):
    stat = summary['stat']
    # 'stat': {
    #     'testsRun': 1,
    #     'failures': 0,
    #     'errors': 0,
    #     'skipped': 0,
    #     'expectedFailures': 0,
    #     'unexpectedSuccesses': 0,
    #     'successes': 1
    # },
    records = summary['records']
    if len(records) < 1:
        return None
    sucList = []
    failList = []
    for record in records:
        if record['status'] == 'success':
            sucList.append(record)
        else:
            failList.append(record)
    # 抽取运行结果中需要的数据
    result = {}
    result['testPass'] = stat['successes']
    result['testAll'] = stat['testsRun']
    result['testFail'] = stat['failures'] + stat['errors']
    result['testSkip'] = stat['skipped']
    result['beginTime'] = summary['time']['start_at']
    result['totalTime'] = str(int(summary['time']['duration'] * 1000))+'ms'
    result['testName'] = '测试'
    testResult = []
    for record in records:
        item = {}
        item['className'] = record['name']
        item['methodName'] = record['name']
        item['description'] = record['name']
        meta_data = record['meta_data']
        if len(meta_data) > 0:
            item['spendTime'] = str(int(meta_data['response_time_ms']))+'ms'
            item['status'] = record['status']
            item['log'] = {'url':meta_data['url'],'method':meta_data['method'],'status_code':meta_data['status_code'],
                            'request_headers':str(meta_data['request_headers']),'request_body':decode_url(meta_data['request_body']),
                            'response_headers':str(meta_data['response_headers']),'response_body':str(meta_data['response_body']),
                            'original_data':get_original_data(original_data),'type':'normal','error':record['attachment']}
        else:
            # meta_data为空或者attachment不为空，则可能代码报错了
            item['log'] = {'type':'error','error':record['attachment']}
        testResult.append(item)
    # 去除重复请求的数据内容，request_body完全一样的情况
    # 用于存储已存在的request_body
    excludeResult = []
    newResult = []
    for test in testResult:
        if 'request_body' in test['log']:
            # 判断请求内容(包含接口地址)是否已经存在，避免报告中重复展示
            if test['log']['request_body']+test['log']['url'] not in excludeResult:
                excludeResult.append(test['log']['request_body']+test['log']['url'])
                newResult.append(test)
    result['testResult'] = newResult
    reportDir = os.path.join(os.getcwd(),'templates','report')
    templateFile = os.path.join(reportDir,'template')
    reportFile = os.path.join(reportDir,report_name+'.html')
    shutil.copyfile(templateFile,reportFile)
    modify_file_content(reportFile,"${resultData}",json.dumps(result))
    return reportFile

def decode_url(text):
    if text == None:
        return ''
    return urllib.parse.unquote(text.replace('&',' & '))

def get_original_data(path):
    if isinstance(path,str):
        # 是一个str，认为为用例路径，判断文件是否存在，读取文件内容展示
        if os.path.exists(path):
            content = open(path).readlines()
            # 处理unicode编码
            return ''.join(content).encode('latin-1').decode('unicode_escape').replace('\n','<br/>')
        else:
            return path
    else:
        # 不是str，应为dict或list，直接返回
        return path

def modify_file_content(sourcefile, oldContent, newContent):
    if os.path.isdir(sourcefile):
        print("the source %s must be a file not a dir")
        return

    if not os.path.exists(sourcefile):
        print("the source is not exists.path:%s"%sourcefile)
        return 

    f = open(sourcefile, 'r+')
    data = str(f.read())
    f.close()
    bRet = False
    idx = data.find(oldContent)
    while idx != -1:
        data = data[:idx] + newContent + data[idx + len(oldContent):]
        idx = data.find(oldContent, idx + len(oldContent))
        bRet = True

    if bRet:
        fw = open(sourcefile, 'w')
        fw.write(data)
        fw.close()
        print("modify file success.path:%s"%sourcefile)
    else:
        print("there is no content matched in file:%s with content:%s"%(sourcefile, oldContent))

def delete_report(report_name):
    reportDir = os.path.join(os.getcwd(),'templates','report')
    reportFile = os.path.join(reportDir,report_name+'.html')
    if os.path.exists(reportFile):
        os.remove(reportFile)

# 处理django原生model_to_dict方法会丢弃datetime类型数据的问题
def to_dict(instance):
    opts = instance._meta
    data = {}
    for f in opts.concrete_fields + opts.many_to_many:
        if isinstance(f, ManyToManyField):
            if instance.pk is None:
                data[f.name] = []
            else:
                data[f.name] = list(f.value_from_object(instance).values_list('pk', flat=True))
        else:
            data[f.name] = f.value_from_object(instance)
    return data

def del_fields(sources,fields):
    if isinstance(fields,list):
        for key in fields:
            del_field(sources,key)

def del_field(sources,field):
    if isinstance(sources,dict):
        del sources[field]
    elif isinstance(sources,list):
        for item in sources:
            del item[field]




