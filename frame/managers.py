from django.db import models

#Django模块通过models.Manager进行数据库查询 需要了解

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

