from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.hashers import make_password
from django.db.models import Q
from django.http import JsonResponse

from frame.utils.forms import LoginForm, RegisterForm, ResetForm
from frame.models import UserInfo
from frame.utils.common import get_ajax_msg, send_captcha, verify_captcha, dataToJson, validate_email

import re,os,time


FAIL_CODE = 0
SUC_CODE = 1
INVALID_INPUT_CODE = 101
REGISTER_USERNAME_EXIST = 102
REGISTER_EMAIL_EXIST = 103
REGISTER_CAPTCHA_ERROR = 104
REGISTER_USERNAME_NO_EXIST = 105
REGISTER_PASSWORD_ERROR = 106
REGISTER_EMAIL_ERROR = 107

RESULT_SUC_TAG = 'success'
RESULT_FAIL_TAG = 'fail'

SECONDS_OF_ONE_HOUR = 3600


def login_operation(request):
    # Post中的参数会对应到Form中进行验证
    login_form = LoginForm(request.POST)
    # is_valid返回验证结果
    if login_form.is_valid():
        username = request.POST.get('account')
        password = request.POST.get('password')

        # 登录成功返回User对象，登录失败返回None
        user = authenticate(username=username, password=password)

        if user is not None:
            # 使用Django验证系统登录，生成session，并且保存在数据库和浏览器
            login(request, user)
            # 设置session过期时间
            request.session.set_expiry(SECONDS_OF_ONE_HOUR * 24)
            # 清除所有已经失效的session
            request.session.clear_expired()
            result = get_ajax_msg(SUC_CODE, RESULT_SUC_TAG, "登录成功")
        else:
            result = get_ajax_msg(FAIL_CODE, RESULT_FAIL_TAG, "用户名或密码错误")
    else:
        # TODO 是否可以只从校验拿到错误信息
        pattern = '(?<=<li>)\S+(?=</li>)'
        items = list(login_form.errors.items())[0]
        content = str(items[1])
        msg = re.search(pattern, content).group()
        result = get_ajax_msg(INVALID_INPUT_CODE, RESULT_FAIL_TAG, msg)
    return result


def register_operation(request):
    # Post中的参数会对应到Form中进行验证
    register_form = RegisterForm(request.POST)
    # is_valid返回验证结果
    if register_form.is_valid():
        # 注册时前端填写的username为邮箱账号
        email = request.POST.get('email')
        password = request.POST.get('password')
        repassword = request.POST.get('repassword')
        username = request.POST.get('username')
        captcha = request.POST.get('emailcapture')
        send_type = 'register'

        # 用户查重与密码对比
        if UserInfo.objects.filter(email=email):
            result = get_ajax_msg(REGISTER_EMAIL_EXIST, RESULT_FAIL_TAG, "该邮箱已被注册")
            return result
        if not validate_email(email):
            result = get_ajax_msg(REGISTER_EMAIL_ERROR, RESULT_FAIL_TAG, "请使用企业邮箱")
            return result
        if UserInfo.objects.filter(username=username):
            result = get_ajax_msg(REGISTER_USERNAME_EXIST, RESULT_FAIL_TAG, "该用户名已被注册")
            return result
        if password != repassword:
            result = get_ajax_msg(REGISTER_PASSWORD_ERROR, RESULT_FAIL_TAG, "两次输入的密码不一致")
            return result

        # 检验验证码
        if verify_captcha(email, captcha, send_type):
            user_info = UserInfo()
            user_info.email = email
            # 加密password进行保存
            user_info.password = make_password(password)
            user_info.username = username
            user_info.save()
            # 跳转到登录页面
            result = get_ajax_msg(SUC_CODE, RESULT_SUC_TAG, "注册成功")
        else:
            result = get_ajax_msg(REGISTER_CAPTCHA_ERROR, RESULT_FAIL_TAG, "验证码错误")
    else:
        pattern = '(?<=<li>)\S+(?=</li>)'
        items = list(register_form.errors.items())[0]
        content = str(items[1])
        msg = re.search(pattern, content).group()
        result = get_ajax_msg(INVALID_INPUT_CODE, RESULT_FAIL_TAG, msg)
    return result


def captcha_operation(request):
    receiver = request.POST.get('receiver')
    send_type = request.POST.get('send_type')
    if receiver != '' and send_type != '':
        result_code = send_captcha(receiver, send_type)
        if result_code == 1:
            result = get_ajax_msg(SUC_CODE, RESULT_SUC_TAG, "发送成功")
        else:
            result = get_ajax_msg(FAIL_CODE, RESULT_FAIL_TAG, "发送失败")
    else:
        result = get_ajax_msg(INVALID_INPUT_CODE, RESULT_FAIL_TAG, "邮箱不能为空")
    return result


def reset_operation(request):
    # Post中的参数会对应到Form中进行验证
    reset_form = ResetForm(request.POST)
    # is_valid返回验证结果
    if reset_form.is_valid():
        email = request.POST.get('email')
        password = request.POST.get('password')
        repassword = request.POST.get('repassword')
        captcha = request.POST.get('emailcapture')
        send_type = 'reset'

        # 判断邮箱是否存在
        if not UserInfo.objects.filter(email=email):
            result = get_ajax_msg(REGISTER_USERNAME_NO_EXIST, RESULT_FAIL_TAG, "该账号不存在")
            return result
        if password != repassword:
            result = get_ajax_msg(REGISTER_USERNAME_EXIST, RESULT_FAIL_TAG, "两次输入的密码不一致")
            return result

        # 检验验证码
        if verify_captcha(email, captcha, send_type):
            user_info = UserInfo.objects.get(email=email)
            user_info.password = make_password(password)
            user_info.save()
            # 跳转到登录页面
            result = get_ajax_msg(SUC_CODE, RESULT_SUC_TAG, "重置密码成功")
        else:
            result = get_ajax_msg(REGISTER_CAPTCHA_ERROR, RESULT_FAIL_TAG, "验证码错误")

    else:
        pattern = '(?<=<li>)\S+(?=</li>)'
        items = list(reset_form.errors.items())[0]
        content = str(items[1])
        msg = re.search(pattern, content).group()
        result = get_ajax_msg(INVALID_INPUT_CODE, RESULT_FAIL_TAG, msg)
    return result


def logout_operation(request):
    logout(request)
    if not request.user.is_authenticated:
        result = get_ajax_msg(SUC_CODE, RESULT_SUC_TAG, "注销成功")
    else:
        result = get_ajax_msg(FAIL_CODE, RESULT_FAIL_TAG, "注销失败")
    return result

# def copyfile(srcfile,dstfile):
#     if not os.path.isfile(srcfile):
#         print "%s not exist!"%(srcfile)
#     else:
#         fpath,fname = os.path.split(dstfile)    #分离文件名和路径
#         if not os.path.exists(fpath):
#             os.makedirs(fpath)                #创建路径
#         shutil.copyfile(srcfile,dstfile)      #复制文件
def log_operation(request):
    log = request.POST.get('log')
    print('==log_operation=={}'.format(log))
    #存到文件
    logDir = os.path.join(os.getcwd(),'templates','log')
    filename = get_time_stamp()
    filename = os.path.join(logDir,filename + '.txt')
    fp = open(filename,'w') 
    
    fp.write(log)

    return get_ajax_msg(SUC_CODE, RESULT_SUC_TAG, "上传成功")

def get_time_stamp():
    ct = time.time()
    local_time = time.localtime(ct)
    data_head = time.strftime("%Y-%m-%d %H-%M-%S", local_time)
    data_secs = (ct - int(ct)) * 1000
    time_stamp = "%s-%03d" % (data_head, data_secs)
    return time_stamp

def user_list_operation(request):
    if request.method == 'POST':
        index = int(request.POST.get('index'))
        if index == -1:
            users = UserInfo.objects.filter().order_by('-id')
        elif index >= 0:
            start = (index - 1) * 10
            users = UserInfo.objects.filter().order_by('-id')[start:start + 10]
        user_list = []
        for user in users:
            if user.username != 'AnonymousUser':  # 不返回匿名用户
                user_dict = {}
                user_dict["user_id"] = user.id
                user_dict["user_name"] = user.username
                user_list.append(user_dict)
        data = dataToJson(user_list)
        return JsonResponse(get_ajax_msg(1, 1, '获取用户列表成功', {'users': data}))

class CustomBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        try:
            user = UserInfo.objects.get(email=username)
            if user.check_password(password):
                return user
        except Exception as e:
            return None

