;
(function () {
    layui.config({
        base: '/static/api/js/',
    }).extend({
        authtree: 'authtree',
    });

    layui.use(['jquery', 'authtree', 'form', 'layer'], function () {
        var $ = layui.jquery;
        var authtree = layui.authtree;
        var form = layui.form;
        var layer = layui.layer;

        // 初始化用户列表
        window.APINet.getUserList({}, -1, function (data) {
            var userList = JSON.parse(data['data']['users']);
            refreshUser(userList, "#select_user");
        });

        // 初始化权限树，用户ID为-1时不回填已拥有权限到权限树
        initAuthTree(authtree, -1);

        // 根据选中用户来刷新权限树
        form.on('select(LAY-select-user-change)', function () {
            var userId = $('#select_user option:selected').val();
            if (userId != -1) {
                initAuthTree(authtree, userId);
            }
        });

        // 完成权限分配，提交表单
        form.on('submit(LAY-auth-tree-submit)', function () {
            var userId = $('#select_user option:selected').val();
            var is_superuser = $('#is_superuser').prop('checked') == true ? 'True' : 'False';
            var checks = getCheckboxValue('add_checkbox');
            var auths = authtree.getLeaf('#LAY-auth-tree-index');
            auths = auths.join(',')
            if (userId != -1) {
                window.APINet.assignAuth({
                    userId: userId,
                    is_superuser: is_superuser,
                    checks: checks,
                    auths: auths,
                }, function (data) {
                    window.utils.tips(data['msg'], null);
                });
            } else {
                window.utils.tips("请选择用户", null);
            }
            //阻止表单跳转，如果需要表单跳转，去掉这段即可。
            return false;
        });
    });

    // 初始化权限树
    function initAuthTree(authtree, userId) {
        window.APINet.initAuth({
            userId: userId,
        }, function (data) {
            // 回填用户是否为管理员
            $("#is_superuser").prop('checked', false);
            $("#is_superuser").prop('checked', data.data.is_superuser);
            // 回填用户的创建权限
            setCheckboxValue('add_checkbox', data.data.checks);
            renderForm();

            // 渲染时传入渲染目标ID，树形结构数据（具体结构看样例，checked表示默认选中），以及input表单的名字
            authtree.render('#LAY-auth-tree-index', data.data.trees, {
                inputname: 'authids[]',
                layfilter: 'lay-check-auth',
                openall: true,
            });

            // 监听自定义lay-filter选中状态，PS:layui现在不支持多次监听，所以扩展里边只能改变触发逻辑，然后引起了事件冒泡延迟的BUG，要是谁有好的建议可以反馈我
            form.on('checkbox(lay-check-auth)', function (data) {
                // // 获取所有节点
                // var all = authtree.getAll('#LAY-auth-tree-index');
                // console.log('all', all);
                // // 获取所有已选中节点
                // var checked = authtree.getChecked('#LAY-auth-tree-index');
                // console.log('checked', checked);
                // // 获取所有未选中节点
                // var notchecked = authtree.getNotChecked('#LAY-auth-tree-index');
                // console.log('notchecked', notchecked);
                // 注意这里：需要等待事件冒泡完成，不然获取叶子节点不准确。
                setTimeout(function () {
                    // 获取选中的叶子节点
                    var leaf = authtree.getLeaf('#LAY-auth-tree-index');
                    console.log('leaf', leaf);
                }, 100);
            });
        });
    }

    // 刷新用户下拉列表
    function refreshUser(userList, selector_id) {
        var selector = $(selector_id);
        selector.empty();
        for (var i = 0; i < userList.length; i++) {
            var userId = userList[i].user_id;
            var userName = userList[i].user_name;
            selector.prepend("<option value='" + userId + "'>" + userName + "</option>")
        }
        selector.prepend("<option value='-1' selected>请选择用户</option>");
        renderForm();  // layui表单内容改变需要重新渲染
    }

    // 重新渲染表单
    function renderForm() {
        layui.use('form', function () {
            var form = layui.form;
            form.render();
        });
    }

    // 复选框取值
    function getCheckboxValue(checkboxName) {
        var checkedArr = $("input[name=" + checkboxName + "]:checked");
        var checkBoxValue = "";
        checkedArr.each(function () {
            checkBoxValue += $(this).val() + ",";
        })
        checkBoxValue = checkBoxValue.substring(0, checkBoxValue.length - 1);
        return checkBoxValue;
    }

    // 复选框赋值
    function setCheckboxValue(checkboxName, checkBoxValue) {
        var checkedArr = checkBoxValue.split(",");

        $("input[name=" + checkboxName + "]").each(function () {
            $(this).prop('checked', false);
        });

        for (var i = 0; i < checkedArr.length; i++) {
            $("input[name=" + checkboxName + "]").each(function () {
                if ($(this).val() == checkedArr[i]) {
                    $(this).prop("checked", true);
                }
            });
        }
    }
}());