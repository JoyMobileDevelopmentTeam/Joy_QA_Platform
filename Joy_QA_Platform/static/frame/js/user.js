;
(function () {

    function ajax_request(method, url, request_data, success) {
        $.ajax({
            cache: false,
            type: method,
            url: url,
            data: request_data,
            async: true,
            success: success,
        });
    }

    $('#login_submit').click(function () {
        var post_data = {
            "account": $('#account').val(),
            "password": $('#password').val(),
        }
        ajax_request("POST", "/frame/login/", post_data, function (data) {
            if (data.result == 1) {
                window.location.href = window.location.origin + '/api/index/';
            } else if (data.result == 0) {
                alert(data.msg)
            }
        });
    });

    $('#register_submit').click(function () {
        var post_data = {
            "email": $('#email').val(),
            "password": $('#password').val(),
            "repassword": $('#repassword').val(),
            "username": $('#username').val(),
            "emailcapture": $('#emailcapture').val(),
        }
        ajax_request("POST", "/frame/register/", post_data, function (data) {
            if (data.result == 1) {
                alert(data.msg)
                window.location.href = window.location.origin + '/frame/login/';
            } else if (data.result == 0) {
                alert(data.msg)
            }
        });
    });

    $('#logout').click(function () {
        ajax_request("POST", "/frame/logout/", null, function (data) {
            if (data.result == 1) {
                window.utils.tips(data.msg, null);
                window.location.href = window.location.origin + '/frame/login/';
            } else if (data.result == 0) {
                window.utils.tips(data.msg, null);
            }
        });
    });

    $('#reset_submit').click(function () {
        var post_data = {
            "email": $('#email').val(),
            "password": $('#password').val(),
            "repassword": $('#repassword').val(),
            "emailcapture": $('#emailcapture').val(),
        }
        ajax_request("POST", "/frame/reset/", post_data, function (data) {
            if (data.result == 1) {
                alert(data.msg)
                window.location.href = window.location.origin + '/frame/login/';
            } else if (data.result == 0) {
                alert(data.msg)
            }
        });
    });

    $('#get_register_captcha').click(function () {
        var post_data = {
            "receiver": $('#email').val(),
            "send_type": "register",
        }
        $(this).text("重新发送");
        ajax_request("POST", "/frame/captcha/", post_data, function (data) {
            if (data.result == 0) {
                alert(data.msg)
            }
        });
    });

    $('#get_reset_captcha').click(function () {
        var post_data = {
            "receiver": $('#email').val(),
            "send_type": "reset",
        }
        $(this).text("重新发送");
        ajax_request("POST", "/frame/captcha/", post_data, function (data) {
            if (data.result == 0) {
                alert(data.msg)
            }
        });
    });

}());