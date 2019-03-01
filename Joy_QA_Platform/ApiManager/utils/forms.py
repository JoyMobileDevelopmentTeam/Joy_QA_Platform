from django import forms
from django.forms import ModelForm  # 导入ModelForm
from ApiManager.models import ProjectInfo, ModuleInfo, ConfigInfo, TaskInfo, EnvInfo
import json, re


class ProjectModelForm(ModelForm):
    project_name = forms.CharField(min_length=3, max_length=50, required=True,
                                   error_messages={
                                       'required': "项目名称不能为空",
                                       'min_length': "项目名称至少3个字符",
                                       'max_length': "项目名称最多50个字符"})
    responsible_name = forms.CharField(min_length=2, max_length=50, required=True,
                                       error_messages={
                                           'required': "负责人名称不能为空",
                                           'min_length': "负责人名称至少2个字符",
                                           'max_length': "负责人名称最多20个字符"})
    test_user = forms.CharField(min_length=2, max_length=100, required=True,
                                error_messages={
                                    'required': "测试人员不能为空",
                                    'min_length': "测试人员名称至少2个字符",
                                    'max_length': "测试人员名称最多100个字符"})
    dev_user = forms.CharField(min_length=2, max_length=100, required=True,
                               error_messages={
                                   'required': "开发人员不能为空",
                                   'min_length': "开发人员名称至少2个字符",
                                   'max_length': "开发人员名称最多100个字符"})
    publish_app = forms.CharField(min_length=1, max_length=60, required=True,
                                  error_messages={
                                      'required': "发布应用名称不能为空",
                                      'min_length': "发布应用名称至少2个字符",
                                      'max_length': "发布应用名称最多60个字符"})
    simple_desc = forms.CharField(min_length=2, max_length=100, required=True,
                                  error_messages={
                                      'required': "简要描述不能为空",
                                      'min_length': "简要描述至少2个字符",
                                      'max_length': "简要描述最多100个字符"})
    other_desc = forms.CharField(min_length=2, max_length=100, required=True,
                                 error_messages={
                                     'required': "其他信息不能为空",
                                     'min_length': "其他信息至少2个字符",
                                     'max_length': "其他信息最多100个字符"})

    class Meta:
        model = ProjectInfo
        fields = '__all__'


class ModuleModelForm(ModelForm):
    module_name = forms.CharField(min_length=2, max_length=50, required=True,
                                  error_messages={
                                      'required': "模块名称不能为空",
                                      'min_length': "模块名称至少2个字",
                                      'max_length': "模块名称最多50个字"})
    # belong_project = forms.CharField(min_length=1, max_length=50, required=True,
    # 		error_messages={
    # 			'required': "所属项目名称不能为空",
    # 			'min_length': "所属项目id至少个1字符",
    # 			'max_length': "所属项目名称最多50个字符"})
    test_user = forms.CharField(min_length=2, max_length=50, required=True,
                                error_messages={
                                    'required': "测试人员不能为空",
                                    'min_length': "测试人员名称至少2个字符",
                                    'max_length': "测试人员名称最多20个字符"})
    simple_desc = forms.CharField(min_length=2, max_length=100, required=True,
                                  error_messages={
                                      'required': "简要描述不能为空",
                                      'min_length': "简要描述至少2个字符",
                                      'max_length': "简要描述最多100个字符"})
    other_desc = forms.CharField(min_length=2, max_length=100, required=True,
                                 error_messages={
                                     'required': "其他信息不能为空",
                                     'min_length': "其他信息至少2个字符",
                                     'max_length': "其他信息最多100个字符"})

    class Meta:
        model = ModuleInfo
        exclude = ['belong_project']


class ConfigModelForm(ModelForm):
    config_name = forms.CharField(min_length=3, max_length=50, required=True,
                                  error_messages={
                                      'required': "配置名称不能为空",
                                      'min_length': "配置名称至少3个字符",
                                      'max_length': "配置名称最多50个字符"
                                  }
                                  )

    # belong_project = forms.CharField(max_length=50, required=False,
    # 		error_messages={
    # 			'max_length': "所属项目名称最多50个字符"
    # 		}
    # 	)

    # belong_module = forms.CharField( max_length=50, required=False,
    # 		error_messages={
    # 			'max_length': "所属模块名称最多50个字符"
    # 		}
    # 	)

    creator = forms.CharField(min_length=2, max_length=50, required=True,
                              error_messages={
                                  'required': "创建人员名称不能为空",
                                  'min_length': "创建人员名称至少2个字符",
                                  'max_length': "创建人员名称最多20个字符"
                              }
                              )

    form_variables = forms.CharField(max_length=500, required=False,
                                     error_messages={
                                         'max_length': "变量最多500个字符"
                                     }
                                     )

    form_params = forms.CharField(max_length=500, required=False,
                                  error_messages={
                                      'max_length': "参数最多500个字符"
                                  }
                                  )

    form_hooks = forms.CharField(max_length=500, required=False,
                                 error_messages={
                                     'max_length': "hooks最多500个字符"
                                 }
                                 )

    form_request_data = forms.CharField(max_length=500, required=False,
                                        error_messages={
                                            'max_length': "请求data最多500个字符"
                                        }
                                        )

    form_request_header = forms.CharField(max_length=500, required=False,
                                          error_messages={
                                              'max_length': "请求header最多500个字符"
                                          }
                                          )

    form_extract = forms.CharField(max_length=500, required=False,
                                   error_messages={
                                       'max_length': "extract最多500个字符"
                                   }
                                   )

    form_validate = forms.CharField(max_length=500, required=False,
                                    error_messages={
                                        'max_length': "validate最多500个字符"
                                    }
                                    )

    class Meta:
        model = ConfigInfo
        exclude = ['belong_project', 'belong_module']


class EnvModelForm(ModelForm):
    env_name = forms.CharField(min_length=3, max_length=50, required=True,
                               error_messages={
                                   'required': "环境名称不能为空",
                                   'min_length': "环境名称至少3个字符",
                                   'max_length': "环境名称最多50个字符"})
    host_port = forms.CharField(min_length=7, max_length=50, required=True,
                                error_messages={
                                    'required': "请求地址不能为空",
                                    'min_length': "请求地址至少7个字符",
                                    'max_length': "请求地址最多15个字符"})
    desc = forms.CharField(required=True,
                           error_messages={
                               'required': "描述不能为空",
                               'invalid': "描述错误"})

    class Meta:
        model = EnvInfo
        # fields = '__all__'
        exclude = ['belong_project']


class TaskModelForm(ModelForm):
    task_name = forms.CharField(min_length=3, max_length=50, required=True,
                                error_messages={
                                    'required': "任务名称不能为空",
                                    'min_length': "任务名称至少3个字符",
                                    'max_length': "任务名称最多50个字符"})
    # receiver_email = forms.EmailField(required=True,
    #                                   error_messages={'required': "邮箱不能为空",
    #                                                   'invalid': "邮箱格式错误"})
    case_list = forms.CharField(required=True,
                                error_messages={
                                    'required': "用例列表不能为空"})
    start_time = forms.CharField(required=True,
                                 error_messages={
                                     'required': "任务名称不能为空"})

    class Meta:
        model = TaskInfo
        exclude = ['belong_env', 'belong_project', 'belong_module', 'start_time', 'cases', 'fail_times', 'last_run_time', 'receiver_email']

# class CaseForm(ModelForm):
#     name = forms.CharField(min_length=3, max_length=50, required=True,
#                                 error_messages={
#                                     'required': "用例名称不能为空",
#                                     'min_length': "用例名称至少3个字符",
#                                     'max_length': "用例名称最多50个字符"})
#     author = forms.CharField(min_length=2, max_length=20, required=True,
#                                   error_messages={
#                                       'required': "开发人员不能为空",
#                                       'min_length': "开发人员至少2个字符",
#                                       'max_length': "开发人员最多20个字符"})

#     def clean_case_info(self):
#         try:
#             json.dumps(self.cleaned_data['case_info'])
#             return self.cleaned_data['case_info']
#         except Exception as e:
#             raise forms.ValidationError('用例基本信息解析失败！')


#     def clean_request_data(self):
#         try:
#             print("self.cleaned_data['request_data']=====>>>{}".format(type(self.cleaned_data['request_data'])))
#             json.loads(self.cleaned_data['request_data'])
#             result = json.loads(self.cleaned_data['request_data'])

#             return result
#         except Exception as e:
#             print(e)
#             raise forms.ValidationError('用例请求信息解析失败！(request_data)')

#     def clean_variables(self):
#         try:
#             json.dumps(self.cleaned_data['variables'])
#             return self.cleaned_data['variables']
#         except Exception as e:
#             raise forms.ValidationError('用例变量信息解析失败！(variables)')

#     class Meta:
#         model = TestCaseInfoForTest
#         exclude = ['belong_module','type']

def get_validate_form_msg(model_form):
    items = list(model_form.errors.items())[0]
    content = str(items[1])
    pattern = '(?<=<li>)\S+(?=</li>)'
    return re.search(pattern, content).group()
