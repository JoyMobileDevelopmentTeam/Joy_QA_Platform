# Joy_QA_Platform
基于HttpRunner、Locust、Django Web框架的接口功能测试/压力测试/监控平台

## Design Philosophy
Joy_QA_Platform-QA测试平台基于Django搭建，内嵌*httprunner*（用于接口测试）、*locust*（用于接口压测）、*celery*（执行测试用例），外部依赖*MySQL*数据库（存储测试平台各种数据）、*redis*（提供平台和celery之间的通信），平台提供了常规的接口测试、接口压力测试、接口持续监控等功能。

[HttpRunner地址](https://github.com/HttpRunner/HttpRunner)、[locust地址](https://github.com/locustio/locust)、[mysql官网](https://dev.mysql.com)

## Key Features
- 分层设计：独立项目、模块、用例三个层面，方便用例管理、权限控制
- 独立环境：用例运行环境独立配置，一个用例可用于多个环境执行，避免重复编写用例
- 依赖HttpRunner：内嵌 *HttpRunner（1.4.7版本）* ，其支持的功能完全继承，用例编写便捷
- 压测支持：平台集成 *locust* 压测框架，接口测试用例支持直接用于接口压力测试
- 定时任务：定时任务支持定时单次运行，定时循环运行，支持最长间隔31天定时执行
- 报告管理：独立模块管理所有报告，包括定时任务执行所生产的失败报告（成功报告过多，不存储）

## 本地开发环境部署（建议MAC系统，Windows未测试）
1. 项目依赖Python3，请确保安装Python3环境；
2. 安装MySQL数据库（建议5.7版本，其他未测试），启动服务，并创建项目对应数据库，在配置文件中配置好对应账号、密码等参数；
3. 项目各参数在 *Joy_QA_Platform/configs.py* 文件中配置
```
  #线上环境数据库配置
  DATABASES_NAME = ''
  DATABASES_USER = ''
  DATABASES_PWD  = ''
  DATABASES_HOST = ''
  DATABASES_PORT = ''
```
4. 安装redis，启动服务
```
  redis-server
```
5. 配置redis
```
  #redis配置
  REDIS_LOCATION = 'redis://127.0.0.1:6379'
  REDIS_PASSWORD = ''
```
6. 发信邮箱配置
```
  #邮件配置
  EMAIL_HOST_USER = ''
  EMAIL_HOST_PASSWORD = ''
  EMAIL_FROM = ''
```
7. 压测相关配置
```
  # locust 主机工作目录名配置
  LOCUST_WORKSPACE_DIR    = ''
  # locust 主机端口配置
  LOCUST_MASTER_BIND_PORT = '8095'

  # locust 从机下载配置
  LOCUST_DOWNLOAD_URL  = ''
  # locust 从机登录用户名
  LOCUST_DOWNLOAD_USER = ''
  # locust 从机登录密码
  LOCUST_DOWNLOAD_PWD  = ''
```
8. 默认管理员账号配置
```
#默认管理员账号
SUPERUSER_NAME = ''
SUPERUSER_PWD  = ''
```
