# api模块 model
from django.db import models
from django.utils import timezone

from ApiManager.managers import ProjectInfoManager, ModuleInfoManager, TestCaseInfoManager, ConfigInfoManager, \
    TaskInfoManager, EnvInfoManager, DebugTalkManager
from Joy_QA_Platform.configs import AUTH_DELETE, AUTH_UPDATE, AUTH_VIEW


# 所有model请都基于BaseTable
class BaseTable(models.Model):

    class Meta:
        abstract = True
        verbose_name = "公共字段表"
        db_table = 'BaseTable'


class ProjectInfo(BaseTable):
    create_time = models.DateTimeField('创建时间', blank=True, default=timezone.now)

    class Meta:
        verbose_name = "工程目录表"
        db_table = 'project_info'
        permissions = (
            (AUTH_VIEW, 'View project'),
            (AUTH_UPDATE, 'Update project'),
            (AUTH_DELETE, 'Delete project'),
        )

    project_name = models.CharField('项目名称', max_length=50)
    responsible_name = models.CharField('负责人', max_length=20)
    test_user = models.CharField('测试人员', max_length=100)
    dev_user = models.CharField('开发人员', max_length=100)
    publish_app = models.CharField('发布应用', max_length=60)
    simple_desc = models.CharField('简要描述', max_length=100, null=True)
    other_desc = models.CharField('其他信息', max_length=100, null=True)
    is_delete = models.BooleanField('是否已被删除', default=False)

    objects = ProjectInfoManager()

    def delete(self, *args, **kwargs):
        self.is_delete = True
        super(ProjectInfo, self).save(args, kwargs)
    
    def __str__(self):
        return self.project_name


class ModuleInfo(BaseTable):
    create_time = models.DateTimeField('创建时间', blank=True, default=timezone.now)

    class Meta:
        verbose_name = '模块信息'
        db_table = 'module_info'

    module_name = models.CharField('模块名称', max_length=50)
    belong_project = models.ForeignKey(ProjectInfo, on_delete=models.CASCADE)
    test_user = models.CharField('测试负责人', max_length=50)
    simple_desc = models.CharField('简要描述', max_length=100, null=True)
    other_desc = models.CharField('其他信息', max_length=100, null=True)
    is_delete = models.BooleanField('是否已被删除', default=False)

    objects = ModuleInfoManager()

    def delete(self, *args, **kwargs):
        self.is_delete = True
        super(ModuleInfo, self).save(args, kwargs)

    def __str__(self):
        return self.module_name

class ConfigInfo(BaseTable):
    create_time = models.DateTimeField('创建时间', blank=True, default=timezone.now)

    class Meta:
        verbose_name = '配置信息'
        db_table = 'config_info'

    config_name = models.CharField('配置名称', max_length=50, unique=True)
    belong_project = models.ForeignKey(ProjectInfo, on_delete=models.CASCADE)
    belong_module = models.ForeignKey(ModuleInfo, on_delete=models.CASCADE)
    creator = models.CharField('编写人员', max_length=5)
    form_variables = models.CharField("变量", max_length=500)
    form_params = models.CharField("参数", max_length=500)
    form_hooks = models.CharField("hooks", max_length=500)
    form_request_data = models.CharField("请求data", max_length=500)
    form_request_header = models.CharField("请求header", max_length=500)
    form_extract = models.CharField("extract", max_length=500)
    form_validate = models.CharField("validate", max_length=500)

    objects = ConfigInfoManager()

    def __str__(self):
        return self.config_name


class EnvInfo(BaseTable):
    create_time = models.DateTimeField('创建时间', blank=True, default=timezone.now)

    class Meta:
        verbose_name = '环境信息'
        db_table = 'env_info'

    env_name = models.CharField('环境名称', max_length=50)
    host_port = models.CharField('请求地址', max_length=50)
    desc = models.CharField('简要描述', max_length=100)
    belong_project = models.ForeignKey(ProjectInfo, on_delete=models.CASCADE)
    is_delete = models.BooleanField('是否已被删除', default=False)

    objects = EnvInfoManager()

    def delete(self, *args, **kwargs):
        self.is_delete = True
        super(EnvInfo, self).save(args, kwargs)

    def __str__(self):
        return self.env_name


class TestCaseInfo(BaseTable):
    create_time = models.DateTimeField('创建时间', blank=True, default=timezone.now)

    class Meta:
        verbose_name = '用例信息'
        db_table = 'test_case_info'

    # 区分是config配置还是测试用例case
    type = models.IntegerField('test/config', default=1)
    name = models.CharField('用例/配置名称', max_length=50)
    belong_module = models.ForeignKey(ModuleInfo, on_delete=models.CASCADE)
    include = models.CharField('包含config/test', max_length=400, null=True, blank=True)
    author = models.CharField('编写人员', max_length=20)

    case_info = models.TextField('case_info')
    variables = models.TextField('variables', blank=True)
    parameters = models.TextField('parameters', blank=True)

    hooks = models.TextField('hooks', blank=True)
    url = models.TextField('url')
    method = models.TextField('method')
    dataType = models.TextField('dataType')
    request_data = models.TextField('request_data')
    headers = models.TextField('headers', blank=True)
    extract = models.TextField('extract', blank=True)
    validate = models.TextField('validate', blank=True)
    lastRunEnv = models.TextField('上次运行时选用的环境id', blank=True, default='')
    is_delete = models.BooleanField('是否已被删除', default=False)

    objects = TestCaseInfoManager()

    def delete(self, *args, **kwargs):
        self.is_delete = True
        super(TestCaseInfo, self).save(args, kwargs)

    def __str__(self):
        return self.parameters


class TaskInfo(BaseTable):
    create_time = models.DateTimeField('创建时间', blank=True, default=timezone.now)

    class Meta:
        verbose_name = '任务信息'
        db_table = 'task_info'

    task_name = models.CharField('任务名称', max_length=50)
    belong_env = models.ForeignKey(EnvInfo, on_delete=models.CASCADE)
    belong_project = models.ForeignKey(ProjectInfo, on_delete=models.CASCADE)
    belong_module = models.ForeignKey(ModuleInfo, on_delete=models.CASCADE)
    receiver_email = models.CharField('接收邮箱', max_length=100)
    cases = models.ManyToManyField(TestCaseInfo)
    start_time = models.DateTimeField('开始时间', default=timezone.now)
    is_loop = models.BooleanField('是否循环', default=False)
    interval_minute = models.IntegerField('间隔分钟', default=0)
    is_run = models.BooleanField('是否运行', default=False)
    fail_times = models.IntegerField('失败次数', default=0)
    last_run_time = models.DateTimeField('上次执行时间', default=timezone.now)
    objects = TaskInfoManager()

    def __str__(self):
        return self.task_name


class ReportInfo(BaseTable):
    create_time = models.DateTimeField('创建时间', blank=True, default=timezone.now)

    class Meta:
        verbose_name = '报告信息'
        db_table = 'report_info'

    report_name = models.CharField('报告名称', max_length=255)
    belong_project = models.IntegerField('所属项目id',default=0)
    belong_module = models.IntegerField('所属模块id',default=0)
    original_data = models.TextField('original_data', blank=True)
    result_data = models.TextField('result_data', blank=True)
    test_time = models.IntegerField('test_time', default=1)
    report_id = models.CharField('报告id', max_length=50, default='')
    user_name = models.CharField('测试人员', max_length=50, default='')

    def __str__(self):
        return self.result_data


# 每个项目的驱动python文件
class DebugTalk(BaseTable):
    create_time = models.DateTimeField('创建时间', blank=True, default=timezone.now)
    update_time = models.DateTimeField('更新时间', blank=True, auto_now=True)

    class Meta:
        verbose_name = 'python驱动文件'
        db_table = 'debugtalk'

    belong_project = models.ForeignKey(ProjectInfo, on_delete=models.CASCADE)
    debugtalk = models.TextField(null=True, default='#debugtalk.py')

    objects = DebugTalkManager()


class TaskFailedRecord(BaseTable):
    create_time = models.DateTimeField('创建时间', blank=True, default=timezone.now)
    update_time = models.DateTimeField('更新时间', blank=True, auto_now=True)

    class Meta:
        verbose_name = '任务失败记录'
        db_table = 'task_failed_record'

    task_id = models.ForeignKey(TaskInfo, on_delete=models.CASCADE)
    report_id = models.CharField('报告id', max_length=50, default='')
    time = models.DateTimeField('失败时间', default=timezone.now)







    
