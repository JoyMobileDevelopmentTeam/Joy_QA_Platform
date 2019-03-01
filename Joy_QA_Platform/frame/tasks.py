from djcelery import celery
import time

@celery.task
def sleeptask(i):
	from time import sleep
	sleep(i)
	run_time = time.strftime('%Y-%m-%d %H-%M-%S', time.localtime(time.time()))
	print('sleep====>{}'.format(run_time))
	return i
