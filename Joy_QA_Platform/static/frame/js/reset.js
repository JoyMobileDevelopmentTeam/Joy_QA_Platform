;
(function () {

    var ids = ["email", "password", "repassword", "emailcapture"];
    window.utils.setListener(ids, setNormal);

    $('#reset_submit').click(function () {
        if (!window.utils.checkInput(ids, setError)) {
            return;
        }

        var post_data = {
            "email": $('#email').val(),
            "password": md5($('#password').val()),
            "repassword": md5($('#repassword').val()),
            "emailcapture": $('#emailcapture').val(),
        }

        window.utils.ajax("POST", "/frame/reset/", post_data, function (data) {
            if (data.result == 1) {
                window.utils.tips(data.msg, null);
                window.location.href = window.location.origin + '/frame/login/';
            } else if (data.result == 0) {
                window.utils.tips(data.msg, null);
            }
        });
    });

    $('#get_reset_captcha').click(function () {
        if (!window.utils.checkInput(["email"], setError)) {
            return;
        }

        var post_data = {
            "receiver": $('#email').val(),
            "send_type": "reset",
        }

        $('#get_reset_captcha').attr("disabled", true);
        $('#get_reset_captcha').css("background-color", "#eeeeee");
        $('#get_reset_captcha').css("color", "#1dacfc");
        $('#get_reset_captcha').text("60秒后再次请求");
        timeDown("get_reset_captcha", 59);

        window.utils.ajax("POST", "/frame/captcha/", post_data, function (data) {
            if (data.result == 0) {
                window.utils.tips(data.msg, null);
            }
        });
    });

    //倒计时
    function timeDown(id, timeInterval) {
        var interval = setInterval(function () {
            $('#' + id).text(timeInterval + '秒后再次请求');
            timeInterval--;
            if (timeInterval == 0) {
                clearInterval(interval);
                $('#' + id).text('重新发送');
                $('#' + id).attr("disabled", false);
                $('#' + id).css("background-color", "#1dacfc");
                $('#' + id).css("color", "#ffffff");
            }
        }, 1000);
    }

    // 设置输入框为有错误状态
    function setError(id) {
        $('#' + id).parent().parent().addClass('has-error');
    }

    // 设置输入框为正常状态
    function setNormal(id) {
        $('#' + id).parent().parent().removeClass('has-error');
    }
}());