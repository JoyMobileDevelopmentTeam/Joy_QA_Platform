from django.db import models
import json
import ApiManager.models

'''用户类型表操作'''
class UserTypeManager(models.Manager):
    def insert_user_type(self, user_type):
        self.create(user_type=user_type)

    def insert_type_name(self, type_name):
        self.create(type_name=type_name)

    def insert_type_desc(self, type_desc):
        self.create(type_desc=type_desc)

    def get_objects(self, user_type_id):  # 根据user_type得到一条数据
        return self.get(user_type_id=user_type_id)


'''用户信息表操作'''
class UserInfoManager(models.Manager):
    def insert_user(self, username, password, email, object):
        self.create(username=username, password=password, email=email, user_type=object)

    def query_user(self, username, password):
        return self.filter(username__exact=username, password__exact=password).count()


'''项目信息表操作'''
class ProjectInfoManager(models.Manager):

    def get_queryset(self):
        return super(ProjectInfoManager, self).get_queryset().filter(is_delete=False)

    def insert_project(self, **kwargs):
        self.create(**kwargs)

    def update_project(self, id, **kwargs):  # 如此update_time才会自动更新！！
        try:
            obj = self.get(id=id)
        except Exception as e:
            return False
        obj.project_name = kwargs.get('project_name')
        obj.responsible_name = kwargs.get('responsible_name')
        obj.test_user = kwargs.get('test_user')
        obj.dev_user = kwargs.get('dev_user')
        obj.publish_app = kwargs.get('publish_app')
        obj.simple_desc = kwargs.get('simple_desc')
        obj.other_desc = kwargs.get('other_desc')
        obj.save()
        return True

    def delete_project(self,project_id,**kwargs):
        try:
            obj = self.get(id=project_id)
        except Exception as e:
            return False
        obj.is_delete = True
        obj.save()
        return True

    def isExist(self,project_id):
        try:
            project_id = int(project_id)
        except Exception as e:
            return False
        return self.filter(id=project_id).exists()

    def get_pro_name(self, pro_name, type=True, id=None):
        if type:
            return self.filter(project_name__exact=pro_name).count()
        else:
            if id is not None:
                return self.get(id=id).project_name
            return self.get(project_name__exact=pro_name)

    def get_pro_info(self, type=True):
        if type:
            return self.all().values('project_name')
        else:
            return self.all()


'''模块信息表操作'''
class ModuleInfoManager(models.Manager):

    def get_queryset(self):
        return super(ModuleInfoManager, self).get_queryset().filter(is_delete=False).filter(belong_project__is_delete=False)

    def insert_module(self, **kwargs):
        self.create(**kwargs)

    def update_module(self, id, **kwargs):
        try:
            obj = self.get(id=id)
        except Exception as e:
            return False
        obj.belong_project_id = kwargs.get('project_name')
        obj.module_name = kwargs.get('module_name')
        obj.test_user = kwargs.get('test_user')
        obj.simple_desc = kwargs.get('simple_desc')
        obj.other_desc = kwargs.get('other_desc')

        obj.save()
        return True

    def delete_module(self,module_id,**kwargs):
        try:
            obj = self.get(id=module_id)
        except Exception as e:
            return False
        obj.is_delete = True
        obj.save()
        return True

    #TODO
    def get_module_name(self, module_name, type=True, id=None):
        if type:
            return self.filter(module_name__exact=module_name).count()
        else:
            if id is not None:
                return self.get(id=id).module_name
            else:
                return self.get(id=module_name)

    def isExist(self,module_id):
        try:
            module_id = int(module_id)
        except Exception as e:
            return False
        return self.filter(id=module_id).exists()


# '''配置表操作'''
# #TODO  cofing是否全部删除
class ConfigInfoManager(models.Manager):
    def insert_config(self, **kwargs):
        self.create(**kwargs)

    def update_config(self, id, **kwargs):
        obj = self.get(id=id)
        obj.config_name = kwargs.get('config_name')
        obj.belong_project_id = kwargs.get('project_name')
        obj.belong_module_id = kwargs.get('module_name')
        obj.creator = kwargs.get('creator')
        obj.form_variables = kwargs.get('form_variables')
        obj.form_params = kwargs.get('form_params')
        obj.form_hooks = kwargs.get('form_hooks')
        obj.form_request_data = kwargs.get('form_request_data')
        obj.form_request_headers = kwargs.get('form_request_headers')
        obj.form_extract = kwargs.get('form_extract')
        obj.form_validate = kwargs.get('form_validate')
        obj.save()
        return True

    def get_config_name(self, config_name, type=True, id=None):
        if type:
            return self.filter(config_name__exact=module_name).count()
        else:
            if id is not None:
                return self.get(id=id).module_name
            else:
                return self.get(id=module_name)

    def isExist(self,config_id):
        try:
            config_id = int(config_id)
        except Exception as e:
            return False
        return self.filter(id=config_id).exists()
        

'''用例信息表操作'''
class TestCaseInfoManager(models.Manager):

    def get_queryset(self):
        return super(TestCaseInfoManager, self).get_queryset().filter(is_delete=False,belong_module__is_delete=False).filter(belong_module__belong_project__is_delete=False)

    def insert_case(self, belong_module, **kwargs):
        case_info = kwargs.get('test').pop('case_info')
        self.create(name=kwargs.get('test').get('name'),belong_module_id=belong_module,
                    author=case_info.pop('dev_name'), include=case_info.pop('include'), request=json.dumps(kwargs))

    def update_case_run_env(self,case,run_env):
        case.lastRunEnv = run_env
        case.save()

    def update_case(self, belong_module, **kwargs):
        case_id = kwargs.get('case_id')
        obj = self.get(id=case_id)
        obj.name = kwargs.get('name')
        obj.belong_module_id = belong_module
        obj.include = json.dumps(kwargs.get('include'))
        obj.author = kwargs.get('author')
        obj.case_info = json.dumps(kwargs.get('case_info'))
        obj.variables = json.dumps(kwargs.get('variables'))
        obj.parameters = json.dumps(kwargs.get('parameters'))

        obj.hooks = json.dumps(kwargs.get('hooks'))
        obj.url = kwargs.get('url')
        obj.method = kwargs.get('method')
        obj.dataType = kwargs.get('dataType')
        obj.request_data = json.dumps(kwargs.get('request_data'))
        obj.headers = json.dumps(kwargs.get('headers'))
        obj.extract = json.dumps(kwargs.get('extract'))
        obj.validate = json.dumps(kwargs.get('validate'))

        obj.save()

    def insert_config(self, belong_module, **kwargs):
        config_info = kwargs.get('config').pop('config_info')
        self.create(name=kwargs.get('config').get('name'), belong_project=config_info.pop('project'),
                    belong_module=belong_module,
                    author=config_info.pop('author'), type=2, request=kwargs)

    def update_config(self, belong_module, **kwargs):
        config_info = kwargs.get('config').pop('config_info')
        obj = self.get(id=config_info.pop('test_index'))
        obj.belong_module = belong_module
        obj.belong_project = config_info.pop('project')
        obj.name = kwargs.get('config').get('name')
        obj.author = config_info.pop('author')
        obj.request = kwargs
        obj.save()

    def isExist(self, name, module_id, project_id):
        return self.filter(name=name).filter(belong_module_id=module_id).filter(belong_module__belong_project_id=project_id).exists()

    def get_case_by_id(self, index, type=True):
        #type true get all cases
        if type:
            return self.filter(id=index).all()
        else:
            return self.get(id=index).name


'''环境变量管理'''
class EnvInfoManager(models.Manager):

    def get_queryset(self):
        return super(EnvInfoManager, self).get_queryset().filter(is_delete=False,belong_project__is_delete=False)

    def insert_env(self, **kwargs):
        self.create(**kwargs)

    def update_env(self, index, **kwargs):
        obj = self.get(id=index)
        obj.env_name = kwargs.pop('env_name')
        obj.host_port = kwargs.pop('host_port')
        obj.desc = kwargs.pop('desc')
        obj.belong_project_id = kwargs.pop('belong_project_id')
        obj.save()
        return True

    def get_env_name(self, index):
        return self.get(id=index).env_name

    def delete_env(self, index):
        try:
            obj = self.get(id=index)
        except Exception as e:
            return False
        obj.is_delete = True
        obj.save()
        return True


'''任务信息表操作'''
class TaskInfoManager(models.Manager):

    def get_queryset(self):
        return super(TaskInfoManager, self).get_queryset().filter(belong_module__is_delete=False,belong_project__is_delete=False)

    def insert_task(self, **kwargs):
        self.create(**kwargs)
    
    def update_task(self, id, **kwargs):
        try:
            obj = self.get(id=id)
        except Exception as e:
            return False
        obj.task_name = kwargs.get('task_name')
        obj.belong_env_id = kwargs.get('env_name')
        obj.belong_project_id = kwargs.get('project_name')
        obj.belong_module_id = kwargs.get('module_name')
        obj.receiver_email = kwargs.get('receiver_email')
        obj.start_time = kwargs.get('start_time')
        obj.is_loop = kwargs.get('is_loop')
        obj.interval_minute = kwargs.get('interval_minute')
        obj.save()

        obj.cases.clear()
        for case_id in kwargs.get('case_list'):
            case = ApiManager.models.TestCaseInfo.objects.get(id=case_id)
            obj.cases.add(case)
        return True
    
    
    def get_task_name(self, task_name, type=True, id=None):
        if type:
            return self.filter(task_name__exact=task_name).count()
        else:
            if id is not None:
                return self.get(id=id).task_name
            else:
                return self.get(id=task_name)


'''任务信息表操作'''
class DebugTalkManager(models.Manager):

    def get_queryset(self):
        return super(DebugTalkManager, self).get_queryset().filter(belong_project__is_delete=False)

        






