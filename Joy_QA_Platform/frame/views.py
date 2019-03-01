import logging

from django.http import JsonResponse
from django.shortcuts import render

from frame.utils.operation import login_operation, register_operation, captcha_operation, reset_operation, \
    logout_operation, user_list_operation,log_operation


def login(request):
    if request.method == 'GET':
        return render(request, 'frame/login.html')
    elif request.method == 'POST':
        ajax_msg = login_operation(request)
        username = request.POST.get('account')
        password = request.POST.get('password')
        return JsonResponse(ajax_msg)


def register(request):
    if request.method == 'GET':
        return render(request, 'frame/register.html')
    elif request.method == 'POST':
        ajax_msg = register_operation(request)
        return JsonResponse(ajax_msg)


def reset(request):
    if request.method == 'GET':
        return render(request, 'frame/reset.html')
    elif request.method == 'POST':
        ajax_msg = reset_operation(request)
        return JsonResponse(ajax_msg)


def captcha(request):
    if request.method == 'POST':
        ajax_msg = captcha_operation(request)
        return JsonResponse(ajax_msg)


def logout(request):
    if request.method == 'POST':
        ajax_msg = logout_operation(request)
        return JsonResponse(ajax_msg)

def save_log(request):
    if request.method == 'POST':
        ajax_msg = log_operation(request)
        return JsonResponse(ajax_msg)

def user_list(request):
    return user_list_operation(request)

    
