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
  安装：brew install redis
  启动：redis-server
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

  <font color=#A52A2A>此配置项在不使用压测功能时无需配置，locust相关配置主要用于主机和从机之间的资源测试用例分发，本地开发环境部署时不适用。</font>
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
9. 安装项目依赖
  安装依赖库之前，请确认xcode command line是否已正确安装
```
  命令行窗口执行pip install -r requirements.txt 安装工程所依赖的库文件，requirements.txt位于项目根目录
```
10. 生成数据库表
  命令行窗口切换到项目根目录，执行Django相关命令生成表结构
```
  python manage.py makemigrations
  python manage.py migrate
```
  请查看数据库，确认表结构正确创建
11. 启动项目
  在项目根目录执行命令
```
  python manage.py runserver 0.0.0.0:8000
```
12. 启动Celery，用于执行用例任务
  在项目根目录执行命令
```
  celery -A ApiManager.tasks worker -l info
```
13. 启动flower，用于任务执行的监控
  在项目根目录执行命令，此处命令中redis地址、端口、账号等请自行更换
```
  flower --broker=redis://localhost:6379/0 --broker_api=redis://localhost:6379/0
```
14. 访问项目
  浏览器访问：http://127.0.0.1:8000/frame/login 进行注册、登录，开始使用测试平台
15. 任务监控可以使用平台内的任务监控功能，也可通过flower自带的页面进行查看，若flower正确执行后可通过5555端口查看http://127.0.0.1:5555
## 生产环境部署
  生产环境部署依赖于uWSGI和Nginx，特别是主从机之间的用例同步功能，依赖于Nginx的权限控制功能以保证安全性。
  需要注意的是：
  
        1、Django默认使用8000端口

        2、压测locust默认使用8089端口

        3、压测用例文件同步，不项目使用8095、8096端口

        4、flower任务监控使用5555端口

        请确保服务器以上端口开房，否则可能会影响相应功能使用
1. 生产环境的部署与本地环境部署组件相似，请参照本地部署相应步骤进行
2. configs.py的配置内容请参考本地部署相关说明，将本地地址、端口替换为服务器地址、端口即可
3. 安装uWSGI，配置使用其启动项目
    
    启动服务uWSGI配置注意建议：

        在平台项目目录下，创建uwsgi.ini、uwsgi.log、uwsig.pid三个文件，分别为配置文件、日志文件和进程号配置文件
        在uwsgi.ini中配置uwsgi启动的相关参数，
          http：指定端口
          module：指定项目所用wsgi.py文件（相对路径）
          chdir：指定工作目录（项目目录，此目录注意正确设置，否则会报找不到app）
          limit-as：2048（默认512，限制uwsgi进程占用虚拟内存的最大值，超过则会报错）
          pidfile：指定进程号配置文件（uwsgi.pid文件内配置指定进程号即可）
          daemonize：后台运行模式，并将日志输出到指定的日志文件内
          pythonpath：指定python路径
              指定django路径  （此两条不指定，在wsgi.py中可能会报错找不到django等）
          enable-threads：多线程开关，由于测试平台用到了celery和请打开多线程开关，并设置合理的线程数，否则当进行定时任务时，会卡死测试平台。
          uwsgi运行过程中，若出现MemoryError错误，建议提高配置limit-as配置的值，配合reload-on-as = 1024配置使用（在达到1024的时候重启进程）
          
          参考：
          https://uwsgi-docs.readthedocs.io/en/latest/
          https://blog.csdn.net/wangpeng2011314/article/details/82527613
4. 安装Nginx，配置、启动代理服务

        代理80端口至8000端口--Django端口，可修改
        代理项目中static目录下的静态资源
        代理项目中slave目录下的压测相关文件--请确保此目录Nginx代理有进行权限控制，否则可能有文件泄露的风险。
        
5. Nginx配置注意事项：

        主、从机之间的压测用例等文件同步使用了Linux的wget功能，并依赖Nginx的权限控制功能保证文件安全性，请合理配置私密文件相关Nginx代理的权限。
