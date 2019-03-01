#

from django.http import HttpResponse
from django.shortcuts import render
from django.http import JsonResponse
from frame.utils.common import get_ajax_msg
from ApiManager.utils.utils import logger
import traceback


def process(request, **kwargs):
    app = kwargs.pop('app', None)
    fun = kwargs.pop('function', None)
    index = kwargs.pop('id', None)

    # print(('app==>{app},\nfun==>{fun},\nindex==>{index}'.format(app=app,fun=fun,index=index)))
    app_module = app

    if app == 'api':
        app_module = 'ApiManager'
    elif app == 'frame':
        app_module = 'frame'
    elif app == None:
        app_module = 'frame'
        app = 'frame'
        fun = 'login'

    try:
        app_module = __import__("%s.views" % app_module)
        view = getattr(app_module, 'views')
        fun = getattr(view, fun)

        # 执行view.py中的函数，并获取其返回值
        # result = fun(request, index) if index else fun(request)
        result = execute_views(fun, request=request, app=app, index=index)
    except (ImportError, AttributeError) as e:
        err_msg = '\n'
        err_msg += 'str(Exception):\t\t' + str(Exception) + '\n'
        err_msg += 'str(e):\t\t\t\t' + str(e) + '\n'
        err_msg += 'repr(e):\t\t\t' + repr(e) + '\n'
        err_msg += 'e.args:\t\t\t\t' + str(e.args) + '\n'
        err_msg += 'traceback.format_exc():\n' + str(traceback.format_exc())
        logger.error(err_msg)
        return HttpResponse('404 Not Found')
    except Exception as e:
        err_msg = '\n'
        err_msg += 'str(Exception):\t\t' + str(Exception) + '\n'
        err_msg += 'str(e):\t\t\t\t' + str(e) + '\n'
        err_msg += 'repr(e):\t\t\t' + repr(e) + '\n'
        err_msg += 'e.args:\t\t\t\t' + str(e.args) + '\n'
        err_msg += 'traceback.format_exc():\n' + str(traceback.format_exc())
        logger.error(err_msg)
        return HttpResponse('Exception')
    return result


def login_required(func):
    def inner(*args, **kwargs):
        request = kwargs['request']
        app = kwargs['app']
        # ApiManager的接口需要登录权限，否则重定向到登录页面
        if app == 'api':
            if request.user.is_authenticated:
                return func(*args, **kwargs)
            else:
                if request.method == 'GET':
                    return render(request, 'frame/login.html')
                elif request.method == 'POST':
                    return JsonResponse(get_ajax_msg(0, 0, '登录状态已失效，请重新登录'))
        elif app == 'frame':
            return func(*args, **kwargs)
    return inner


@login_required
def execute_views(fun, request, app, index):
    result = fun(request, index) if index else fun(request)
    return result
