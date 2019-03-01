from django.db import models

from django.contrib.auth.models import AbstractUser
from django.contrib.auth.hashers import make_password
from datetime import datetime


# Create your models here.
class BaseModel(models.Model):
    create_time = models.DateTimeField('创建时间', auto_now_add=True)
    update_time = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        abstract = True
        db_table = 'base_model'
        verbose_name = "公共模型"


# 用户信息model
class UserInfo(AbstractUser):
    class Meta:
        db_table = 'user_info'
        verbose_name = "用户信息"

    # 重写__str__方法，使用该方法打印实例时输出username，username字段继承自AbstractUser
    def __str__(self):
        return self.username

    @classmethod
    def create_superuser(cls, username, email, password):
        if not UserInfo.objects.filter(username=username).exists():
            user_info = UserInfo()
            user_info.username = username
            user_info.email = email
            # 加密password进行保存
            user_info.password = make_password(password)
            user_info.is_superuser = 1
            user_info.save()


# 邮箱验证码model
class CaptchaRecord(models.Model):
    SEND_CHOICES = (
        ("register", "注册"),
        ("reset", "重置密码"),
        ("update_email", "修改邮箱"),
    )
    receiver = models.EmailField(max_length=50, verbose_name="邮箱")
    send_type = models.CharField(choices=SEND_CHOICES, max_length=20, verbose_name="验证码类型")
    code = models.CharField(max_length=20, verbose_name="验证码")
    # 这里的now得去掉(),不去掉会根据编译时间。而不是根据实例化时间。
    send_time = models.DateTimeField(default=datetime.now, verbose_name="发送时间")
    is_valid = models.BooleanField('是否有效', default=True)

    class Meta:
        db_table = 'captcha_record'
        verbose_name = "验证码记录"

    # 重载__str__方法, 使用该方法打印实例时输出验证码和接收者
    def __str__(self):
        return '{0}({1})'.format(self.code, self.receiver)
