#coding: utf-8
import zmq
from locust import HttpLocust, TaskSet, task
from httprunner import LocustRunner
import os

class WebPageTasks(TaskSet):
    def on_start(self):
        self.test_runner = LocustRunner(self.client)
        self.file_path = self.locust.file_path

    @task
    def test_specified_scenario(self):
        self.test_runner.run(self.file_path)


class WebPageUser(HttpLocust):
    host = "https://www.baidu.com/"
    task_set = WebPageTasks
    min_wait = 1000
    max_wait = 5000

    file_path = "/Users/wujunfeng/git/QAPlatform/locust.yml"
