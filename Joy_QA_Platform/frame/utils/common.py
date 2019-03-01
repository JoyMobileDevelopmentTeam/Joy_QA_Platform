from random import Random
import json, re
from datetime import datetime, date, timedelta

# 导入Django自带的邮件模块
from django.core.mail import send_mail
# 导入setting中发送邮件的配置
from Joy_QA_Platform.settings import EMAIL_FROM
from Joy_QA_Platform.configs import EMAIL_SUFFIX
from frame.models import CaptchaRecord

RESULT_OK = 1
RESULT_FAIL = 0


def get_ajax_msg(code, result, msg, data={}):
    """
    ajax提示信息
    :param code:str
    :param result: str
    :param msg: str
    :param data: dict
    :return:
    """

    # result success的时候标记为请求成功，不成功的时候result的值为提示文案
    if result is 'success' or result == '1' or result == 1:
        interface_result = RESULT_OK
    else:
        interface_result = RESULT_FAIL

    context = {
        'result': interface_result,
        'msg': msg,
        'code': code,
        'data': data,
    }
    return context


# 检验验证码
def verify_captcha(receiver, captcha, send_type):
    records = CaptchaRecord.objects.filter(receiver=receiver, code=captcha)
    if len(records) > 0:
        for record in records:
            # 验证码有效时间为10分钟
            if datetime.now() <= (record.send_time + timedelta(minutes=10)) and record.is_valid and send_type == record.send_type:
                record.is_valid = False
                record.save()
                return True
        return False
    else:
        return False


# 生成随机字符串
def random_str(random_length):
    str = ''
    # 生成字符串的可选字符串
    chars = '0123456789'
    length = len(chars) - 1
    random = Random()
    for i in range(random_length):
        str += chars[random.randint(0, length)]
    return str


def dataToJson(data):
    return json.dumps(data, cls=DateEncoder)


class DateEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.strftime('%Y-%m-%d %H:%M:%S')
        elif isinstance(obj, date):
            return obj.strftime("%Y-%m-%d")
        else:
            return json.JSONEncoder.default(self, obj)


# 发送验证码
def send_captcha(receiver, send_type):
    # 生成6位验证码
    code = random_str(6)
    # 数据库保存验证码记录，以便后续校验验证码
    captcha_record = CaptchaRecord()
    captcha_record.code = code
    captcha_record.receiver = receiver
    captcha_record.send_type = send_type
    send_status = 0

    # 旧验证码失效
    records = CaptchaRecord.objects.filter(receiver=receiver, send_type=send_type)
    for record in records:
        record.is_valid = False
        record.save()

    try:
        # 注册新用户的邮件文案
        if send_type == "register":
            email_title = "Joy_QA_Platform 用户注册验证码"
            email_body = "欢迎注册卓游测试平台！验证码：{0}".format(code)
            # 使用Django内置函数完成邮件发送。四个参数：主题，邮件内容，从哪里发，接受者list
            send_status = send_mail(email_title, email_body, EMAIL_FROM, [receiver])
        # 忘记密码的邮件文案
        elif send_type == "reset":
            email_title = "Joy_QA_Platform 修改密码验证码"
            email_body = "修改卓游测试平台账号密码！验证码：{0}".format(code)
            # 使用Django内置函数完成邮件发送。四个参数：主题，邮件内容，从哪里发，接受者list
            send_status = send_mail(email_title, email_body, EMAIL_FROM, [receiver])
    except Exception as e:
        print(e)

    # 如果发送成功
    if send_status:
        captcha_record.save()
        return True
    else:
        return False

def validate_email(email):
    if re.match("^[A-Z0-9a-z._%+-]+" + EMAIL_SUFFIX, email) is not None:
        return True
    else:
        return False
