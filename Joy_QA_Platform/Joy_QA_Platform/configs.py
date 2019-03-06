
# debug 环境数据库配置
DEBUG_DATABASES_NAME = ''
DEBUG_DATABASES_USER = ''
DEBUG_DATABASES_PWD  = ''
DEBUG_DATABASES_HOST = '127.0.0.1'
DEBUG_DATABASES_PORT = '3306'

# 线上环境数据库配置
DATABASES_NAME = ''
DATABASES_USER = ''
DATABASES_PWD  = ''
DATABASES_HOST = '127.0.0.1'
DATABASES_PORT = '3306'

# 验证码邮件和警报邮件配置
EMAIL_HOST_USER = ''  # 邮箱帐号
EMAIL_HOST_PASSWORD = ''  # 邮箱密码
EMAIL_FROM = ''  # 邮件发送者帐号

# redis配置
REDIS_LOCATION = 'redis://127.0.0.1:6379'
REDIS_PASSWORD = ''

# locust相关配置

# locust 主机工作目录名配置
LOCUST_WORKSPACE_DIR    = 'QAPlatform'
LOCUST_MASTER_BIND_PORT = '8095'

# 默认管理员账号
IS_CREATE_SUPERUSER = True
SUPERUSER_NAME = ''
SUPERUSER_PWD  = ''

# 权限名称
AUTH_ADD_PROJECT = 'ApiManager.add_projectinfo'
AUTH_ADD_MODULE = 'ApiManager.add_moduleinfo'
AUTH_ADD_TASK = 'ApiManager.add_taskinfo'
AUTH_ADD_CASE = 'ApiManager.add_testcaseinfo'
AUTH_DELETE = 'delete_project'
AUTH_UPDATE = 'update_project'
AUTH_VIEW   = 'view_project'

# 邮箱后缀限制
EMAIL_SUFFIX = ''
