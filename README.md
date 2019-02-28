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
