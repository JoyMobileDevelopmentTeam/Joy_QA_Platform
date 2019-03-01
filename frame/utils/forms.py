from django import forms


# 验证登录表单
class LoginForm(forms.Form):
    account = forms.CharField(required=True, error_messages={'required': "账号不能为空"})
    password = forms.CharField(required=True, error_messages={'required': "密码不能为空"})


# 验证注册表单
class RegisterForm(forms.Form):
    email = forms.EmailField(required=True,
                             error_messages={'required': "邮箱不能为空",
                                             'invalid': "邮箱格式错误"})
    password = forms.CharField(required=True,
                               min_length=6,
                               error_messages={'required': "密码不能为空",
                                               'min_length': "密码至少6位"})
    repassword = forms.CharField(required=True,
                                 min_length=6,
                                 error_messages={'required': "密码不能为空",
                                                 'min_length': "密码至少6位"})
    username = forms.CharField(required=True,
                               max_length=20,
                               error_messages={'required': "用户名不能为空",
                                               'max_length': "用户名最多为20位"})
    emailcapture = forms.CharField(required=True,
                                   error_messages={'required': "验证码不能为空"})


# 验证重置密码表单
class ResetForm(forms.Form):
    email = forms.EmailField(required=True,
                             error_messages={'required': "邮箱不能为空",
                                             'invalid': "邮箱格式错误"})
    password = forms.CharField(required=True,
                               min_length=6,
                               error_messages={'required': "密码不能为空",
                                               'min_length': "密码至少6位"})
    repassword = forms.CharField(required=True,
                                 min_length=6,
                                 error_messages={'required': "密码不能为空",
                                                 'min_length': "密码至少6位"})
    emailcapture = forms.CharField(required=True,
                                   error_messages={'required': "验证码不能为空"})
