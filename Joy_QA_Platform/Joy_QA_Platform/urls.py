"""Joy_QA_Platform URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.11/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
from django.conf.urls import url,include
from django.contrib import admin
from django.views.generic import RedirectView

from Joy_QA_Platform.activator import process



#反射机制，动态的路由系统
urlpatterns = [

    #####静态路由#####
    # ① 匹配规则  http://127.0.0.1:8000/admin/*
    url(r'^admin/', admin.site.urls),
    url(r'^$', process),
    url(r'^favicon\.ico$', RedirectView.as_view(url='/static/assets/img/favicon.ico')),
    url('^(?P<app>(\w+))/(?P<function>(\w+))/$', process),
    url('^(?P<app>(\w+))/(?P<function>(\w+))/(?P<id>(\w+))/$', process),

]
