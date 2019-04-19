#debugtalk.py
from datetime import datetime
import time,json,os
import hashlib
from Crypto.Cipher import AES
from binascii import b2a_hex


def hooks(msg):
    print('=msg==>{}'.format(msg))
    return '123'


def get_md5(*args):
    print('-----进入get_md5------')
    for item in args:
        if item == None:
            print('None')
        print(item)
    md5 = hashlib.md5()
    source = ''
    pairs = len(args) // 2
    for i in range(pairs):
        source += str(args[i*2+1])
    if len(args) % 2 ==1:
        source += str(args[-1])
    md5.update(source.encode('utf-8'))
    print('MD5加密前为 ：' + source)
    #默认32位
    print('MD5加密后为 ：' + md5.hexdigest())
    return md5.hexdigest()

def get_md5_with_key(*args):
    # print('-------args----------',args)
    md5 = hashlib.md5()
    source = ''
    pairs = len(args) // 2
    for i in range(pairs):
        source += str(args[i*2]) + '=' + str(args[i*2+1])
    if len(args) % 2 ==1:
        source +=  str(args[-1])
    # source = source[1:]
    print('-------md5---------',source)
    md5.update(source.encode('utf-8'))
    return md5.hexdigest()

def get_aes(key, *args):    
    text = ''
    for index,value in enumerate(args):
        if index%2 == 1:
        	text += str(value)
    print('--aes加密前--',text)
    mode = AES.MODE_CBC
    cryptor = AES.new(key, mode, key)
    #这里密钥key 长度必须为16（AES-128）、24（AES-192）、或32（AES-256）Bytes 长度.目前AES-128足够用
    length = 16
    count = len(text.encode('utf-8'))
    if(count % length != 0) :
        add = length - (count % length)
    else:
        add = 0
    text = text + ('\0' * add)
    ciphertext = cryptor.encrypt(text)
    #因为AES加密时候得到的字符串不一定是ascii字符集的，输出到终端或者保存时候可能存在问题
    #所以这里统一把加密后的字符串转化为16进制字符串
    return str(b2a_hex(ciphertext),'utf-8')

def get_aes_with_key(key,*args):
    text = ''
    for index,value in enumerate(args):
        if index%2 == 0:
            text += "&" + str(args[index]) + "=" + str(args[index+1])
    text = text[1:]
    print('--aes加密前--',text)
    mode = AES.MODE_CBC
    cryptor = AES.new(key, mode, key)
    #这里密钥key 长度必须为16（AES-128）、24（AES-192）、或32（AES-256）Bytes 长度.目前AES-128足够用
    length = 16
    count = len(text.encode('utf-8'))
    if(count % length != 0) :
        add = length - (count % length)
    else:
        add = 0
    text = text + ('\0' * add)
    ciphertext = cryptor.encrypt(text)
    #因为AES加密时候得到的字符串不一定是ascii字符集的，输出到终端或者保存时候可能存在问题
    #所以这里统一把加密后的字符串转化为16进制字符串
    return str(b2a_hex(ciphertext),'utf-8')

def get_timestamp():
    t = time.time()
    # print('get_timestamp==>{}'.format(t))
    return int(t)

def getJsonExtension(*args):
    params = list(args)
    tempMap = {}
    pairs = len(params)//2
    print(args)
    for index in range(pairs):
        tempMap[params[index*2]]=params[index*2+1]
    result = json.dumps(tempMap).replace(" ","")
    print("extension === "+result)
    return result

def getPwd():
    print(os.getcwd())
    return os.getcwd()

def shuchu(*args):
    for param in args:
        print("---------shuchu----------")
        print(param)
    return ""
