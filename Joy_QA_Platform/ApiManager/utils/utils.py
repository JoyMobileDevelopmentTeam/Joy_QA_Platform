import logging


def pagination_for_objects(objects, index):
	"""
	分页返回查询结果
	"""
	if index < 1:
		pass
	elif index >= 1:
		start = (index - 1) * 10
		objects = objects[start:start + 10]
	return objects


def getLogger():
	"""
	获取 mLogger，在 settings.py 中配置
	所有级别日志均输出到控制台中
	DEBUG 级别或以上级别日志输出到 debug.log 文件
	WARNING 级别或以上级别日志输出到 warn.log 文件
	"""
	return logging.getLogger('mLogger')


logger = getLogger()
