;
(function () {

    var load = null;

    //检查传入的各input内容是否为空,并通过传入的设置错误方法，进行相应处理
    function checkInput(ids, setError) {
        for (var index in ids) {
            var id = ids[index];
            var text = $("#" + id).val();
            if ($('#' + id).attr('type') == 'select') {
                if (text == '-1' || parseInt(text) == -1) {
                    if (setError != null) {
                        setError(ids[index]);
                    }
                    return false;
                }
            } else {
                if (text.length == 0) {
                    if (setError != null) {
                        setError(ids[index]);
                    }
                    return false;
                }
            }
        }
        return true;
    }

    //添加各输入框监听，并通过传入的设置正常状态方法，进行相应处理
    function setListener(ids, setNormal) {
        for (var index in ids) {
            (function (index) {
                var id = ids[index];
                //当获取焦点时，则设置为正常状态
                $('#' + id).focus(function () {
                    if (setNormal != null) {
                        setNormal(id);
                    }
                });
            })(index);
        }
    }

    //弹出提示
    function tips(msg, func) {
        if (isNull(func)) {
            layer.msg(msg, {time: 700});
        } else {
            layer.msg(msg, {time: 700}, func);
        }
    }

    //删除确认
    function deleteConfirm(msg, confirm, cancel) {
        layer.confirm(msg, {btn: ['取消', '确定'], title: '警告'}, function (index) {
            layer.close(index);
            if (!isNull(cancel)) {
                cancel(index);
            }
        }, function (index) {
            layer.close(index);
            confirm(index);
        });
    }

    function showComfirmDialog(msg, confirm, cancel, text1, text2) {
        if (isNull(text1) || isNull(text2)) {
            layer.confirm(msg, {btn: ['取消', '确定'], title: '提示'}, function (index) {
                layer.close(index);
                if (!isNull(cancel)) {
                    cancel(index);
                }
            }, function (index) {
                layer.close(index);
                if(!isNull(confirm)){
                		confirm(index);
                }
            });
        } else {
            layer.confirm(msg, {btn: [text1, text2], title: '提示'}, function (index) {
                layer.close(index);
                if (!isNull(cancel)) {
                    cancel(index);
                }
            }, function (index) {
                layer.close(index);
                if(!isNull(confirm)){
                		confirm(index);
                }
            });
        }

    }

    //显示加载
    function showLoading() {
        load = layer.load();
    }

    //关闭加载
    function closeLoading() {
        if (load != null) {
            layer.close(load);
        }
    }

    //判断是否为空
    function isNull(value) {
        if (value == null || value == 'null' || value == 'undefined' || value == '') {
            return true;
        }
        return false;
    }

    // ajax网络请求
    function ajax(method, url, request_data, success) {
        $.ajax({
            cache: false,
            type: method,
            url: url,
            data: request_data,
            async: true,
            success: success,
        });
    }

    // 获取日期格式化
    // (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
    // (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18
    Date.prototype.Format = function (fmt) {
        var o = {
            "M+": this.getMonth() + 1, //月份
            "d+": this.getDate(), //日
            "H+": this.getHours(), //小时
            "m+": this.getMinutes(), //分
            "s+": this.getSeconds(), //秒
            "q+": Math.floor((this.getMonth() + 3) / 3), //季度
            "S": this.getMilliseconds() //毫秒
        };
        if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
            if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
    }

    window.utils = {
        checkInput: checkInput,
        setListener: setListener,
        showLoading: showLoading,
        closeLoading: closeLoading,
        tips: tips,
        deleteConfirm: deleteConfirm,
        isNull: isNull,
        ajax: ajax,
        showComfirmDialog: showComfirmDialog,
    }
}());