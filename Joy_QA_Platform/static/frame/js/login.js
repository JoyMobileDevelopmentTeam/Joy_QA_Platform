;
(function () {

    var ids = ["account", "password"];
    window.utils.setListener(ids, setNormal);

    $('#login_submit').click(function () {
        if (!window.utils.checkInput(ids, setError)) {
            return;
        }

        var post_data = {
            "account": $('#account').val(),
            "password": md5($('#password').val()),
        }

        window.utils.ajax("POST", "/frame/login/", post_data, function (data) {
            if (data.result == 1) {
                window.location.href = window.location.origin + '/api/index/';
            } else if (data.result == 0) {
                window.utils.tips(data.msg, null);
            }
        });
    });

    // 设置输入框为有错误状态
    function setError(id) {
        $('#' + id).parent().parent().addClass('has-error');
    }

    // 设置输入框为正常状态
    function setNormal(id) {
        $('#' + id).parent().parent().removeClass('has-error');
    }
}());