import os, shutil, time
filename_list = ['config','debugtalk.py','locustfile.py','locust.yml']

# locust 从机下载配置
LOCUST_DOWNLOAD_URL  = ''
LOCUST_DOWNLOAD_USER = ''
LOCUST_DOWNLOAD_PWD  = ''

def get_curr_dir():
	return os.getcwd()

def download_files():
	for file in filename_list:
		QAPlatformPath = get_curr_dir()
		dest = os.path.join(QAPlatformPath,file)
		cmd = "wget " + LOCUST_DOWNLOAD_URL + file + " --http-user=" + LOCUST_DOWNLOAD_USER + " --http-passwd=" + LOCUST_DOWNLOAD_PWD + " -O " + str(dest)
		print(cmd)
		os.system(cmd)
		if os.path.exists(dest):
			cmd = "chmod 777 " + str(dest)
			print(cmd)
			os.system(cmd)

def prepare_locust_file(new_host):
	QAPlatformPath = get_curr_dir()
	locust_file = os.path.join(QAPlatformPath, 'locustfile.py')
	write_list = []
	with open(locust_file, 'r') as f:
		for line in f.readlines():
			# 替换locustfile中的host参数
			if 'host' in line:
				old_host = line.split('"')[1]
				line = line.replace(old_host, new_host)
			# 替换locustfile中的file_path参数
			if 'file_path' in line and 'self.' not in line:
				old_file_path = line.split('"')[1]
				new_file_path = os.path.join(QAPlatformPath, 'locust.yml')
				line = line.replace(old_file_path, new_file_path)
			write_list.append(line)
	f.close()
	with open(locust_file, 'w') as f:
		for line in write_list:
			f.write(line)
	f.close()

def run_locust(master_host):
	QAPlatformPath = get_curr_dir()
	locust_file = os.path.join(QAPlatformPath, 'locustfile.py')
	os.chdir(QAPlatformPath)
	cmd = 'locusts -f %s --slave --master-host=%s --master-port=8095' % (locust_file, master_host.strip())
	print(cmd)
	os.system(cmd)

download_files()

# 读取配置文件
QAPlatformPath = get_curr_dir()
config_file = os.path.join(QAPlatformPath, 'config')
with open(config_file, 'r') as f:
	for line in f.readlines():
		# 从配置文件获取master_host
		if 'master_host' in line:
			master_host = str(line.split('=')[1])
			print(master_host)
		# 从配置文件获取request_host
		if 'request_host' in line:
			request_host = str(line.split('=')[1])
			print(request_host)

prepare_locust_file(request_host)
run_locust(master_host)
