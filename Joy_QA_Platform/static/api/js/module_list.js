;
(function () {

    edit_module_id = null;

    var ids = ["edit_module_name", "edit_project_name", "edit_test_user", "edit_simple_desc", "edit_other_desc"];

    //首次进入展示第一页数据
    showFirstPage();

    window.utils.setListener(ids, setNormal);

    //获取项目下拉列表
    window.APINet.getProjectList({}, -1, function (data) {
        var projectList = JSON.parse(data['data']['projects']);
        refresh_project(projectList, "#search_project");
    });

    //填充环境列表
    fillEnvList();

    //设置回调方法(回调参数为需要显示的页数，根据此页数进行网络请求，展示相应数据)
    window.PageIndicator.setCallback(function (curr) {
        var projectName = $('#search_project option:selected').val().trim(); //项目下拉列表默认值为-1
        var moduleName = $('#search_name_module').val().trim();
        var testPerson = $('#search_test_person').val().trim();
        if (projectName == '-1' && moduleName.length == 0 && testPerson.length == 0) {
            //没有搜索条件
            window.APINet.getModuleList({}, curr, function (data) {
                var param = JSON.parse(data['data']['modules']);
                var count = data['data']['count'];
                var curr = data['data']['currPage'];
                var proInfo = data['data']['proInfo']

                for (var index = 0; index < param.length; index++) {
                    //处理project_id与project_name
                    param[index]['project_name'] = proInfo[param[index]['belong_project']]
                }
                showResult(param);
            });
        } else {
            //有搜索条件的页数切换
            search(curr);
        }
    });

    //清空搜索条件
    $('#clear_btn').click(function () {
        $('#search_project').val('-1');
        $('#search_name_module').val('');
        $('#search_test_person').val('');
    });

    setConfirmCallback(function (base_url) {
        module_ids = [];
        if (edit_module_id == null) {
            module_ids = getCheckBoxes('select_module');
        } else {
            module_ids.push(edit_module_id)
        }
        window.APINet.runModules(
            {
                module_ids: module_ids,
                base_url: base_url
            }, function (data) {
                window.utils.tips(data['msg']);
            });

        $('#env_modal').modal('hide');
    });

    //点击运行
    $('#excute').click(function () {
        edit_module_id = null;
        check_val = getCheckBoxes('select_module');

        if (check_val == '') {
            window.utils.tips('未选择执行模块');
        } else {
            showEnvSelectModal();
        }
    });

    //全选事件处理
    $('#slect_all').change(function (event) {
        if ($(event.target).prop('checked') == true) {
            $('tbody tr td input').prop('checked', true);
        } else {
            $('tbody tr td input').prop('checked', false)
        }
    });

    //各条目中『执行』『编辑』『删除』按钮的事件委托
    $(".table").on("click", ".btn-execute", function () {
        var id = $(this).data('id');
        edit_module_id = id;
        showEnvSelectModal();
    });
    $(".table").on("click", ".btn-edit", function () {
        var id = $(this).data("id");
        window.APINet.getModule({id: id}, function (data) {
            //获取对应模块信息成功
            var result = parseInt(data['result']);
            var belong_project = null;
            if (result == 1) {
                $('#edit_modal').modal('show');
                var module = JSON.parse(data['data']['modules'])[0];
                $('#edit_module_name').val(module['module_name']);
                $('#edit_test_user').val(module['test_user']);
                $('#edit_simple_desc').val(module['simple_desc']);
                $('#edit_other_desc').val(module['other_desc']);
                $('#edit_module_id').val(id);
                belong_project = module['belong_project'];
                //拉取所有项目信息，供修改时选择
                window.APINet.getProjectList({}, -1, function (data) {
                    var result = parseInt(data['result']);
                    if (result == 1) {
                        //添加项目到select节点中
                        //获取项目列表成功
                        var projects = JSON.parse(data['data']['projects']);
                        $('#edit_project_name').empty();
                        for (var index = 0; index < projects.length; index++) {
                            var project = projects[index]
                            $("#edit_project_name").append('<option value="' + project['id'] + '">' + project['project_name'] + '</option>');
                        }
                        //设置选中项目
                        $("#edit_project_name").val(belong_project);
                    } else {
                        console.log(data['msg']);
                        window.utils.tips('获取项目信息失败!');
                    }
                });
            } else {
                console.log(data['msg']);
                window.utils.tips('获取模块信息失败!');
            }
        });
    });
    $(".table").on("click", ".btn-delete", function () {
        var id = $(this).data("id");
        window.utils.deleteConfirm('若删除模块，该模块下所有测试用例将会被删除！确认要删除此模块？', function (index) {
            window.APINet.deleteModule({
                id: id
            }, function (data) {
                var result = data['result'];
                var msg = data['msg'];
                if (parseInt(result) == 1) {
                    showFirstPage();
                }
                window.utils.tips(msg);
            });
        });
    });

    //编辑修改
    $('#submit_modify').click(function () {
        if (!window.utils.checkInput(ids, setError)) {
            return;
        }

//      var ids = ["edit_module_name", "edit_project_name", "edit_test_user", "edit_simple_desc", "edit_other_desc"];
        var module_name = $('#edit_module_name').val();
        var project_name = $('#edit_project_name').val();
        var test_user = $('#edit_test_user').val();
        var simple_desc = $('#edit_simple_desc').val();
        var other_desc = $('#edit_other_desc').val();
        var id = $('#edit_module_id').val();

        window.APINet.updateModule({
            id: id,
            module_name: module_name,
            project_name: project_name,
            test_user: test_user,
            simple_desc: simple_desc,
            other_desc: other_desc
        }, function (data) {
            var result = parseInt(data['result']);
            if (result == 1) {
                showFirstPage();
                $('#edit_modal').modal('hide');
            }
            window.utils.tips(data['msg']);
        });
    });

    function showFirstPage() {
        //获取第一页数据进行展示
        window.APINet.getModuleList({}, 1, function (data) {
            var param = JSON.parse(data['data']['modules']);
            var count = data['data']['count'];
            var curr = data['data']['currPage'];
            var proInfo = data['data']['proInfo']

            for (var index = 0; index < param.length; index++) {
                //处理project_id与project_name
                param[index]['project_name'] = proInfo[param[index]['belong_project']]
            }

            showResult(param);

            //设置总条数
            window.PageIndicator.setCount(count);
            //设置当前显示第几页
            window.PageIndicator.setPage(1);
        });
    }

    //根据参数展示数据
    function showResult(param) {
        //清空表格节点
        $('#module_list_body').empty();
        for (var index = 0; index < param.length; index++) {
            $("#module_list_body").append(getProjectElement(param[index], index));
        }
        ;
    }

    //生成html元素
    function getProjectElement(param, index) {
        var moduleName = param['module_name'];
        var projectName = param['project_name'];
        var moduleQA = param['test_user'];
        var createTime = param['create_time'];
        var id = param['id']

        var projectStr = '<tr><td><input type="checkbox" name="select_module" id="' + id + '"/></td><td>' + (id) + '</td>' +
            '<td>' + moduleName + '</td>' + '<td>' + moduleQA + '</td>' + '<td>' + projectName + '</td>' +
            '<td>' + '</td>' + '<td>' + createTime + '</td>' + getOperationEle(id) + '</tr>';
        return projectStr;
    }

    //获取操作相关元素
    function getOperationEle(id) {
        var result = '<td>' +
            '<div class="btn-group-xs bt-group-class" role="group">' +
//          '<button type="button" data-id="' + id + '" class="btn btn-primary btn-execute">运行</button>' +
            '<button type="button" data-id="' + id + '" class="btn btn-info btn-edit data-toggle="modal"">编辑</button>' +
            '<button type="button" data-id="' + id + '" class="btn btn-danger btn-delete">删除</button>' +
            '</div>' +
            '</td>';
        return result;
    }

    //获取格式化的日期+时间
    function getDate(time) {
        var date = new Date(time * 1000);
        return date.getFullYear() + "年" + (date.getMonth() + 1) + '月' + date.getDate() + '日' + ' ' + date.getHours() + ':' + date.getMinutes();
    }

    //『新增模块』按钮点击事件
    $("#add_module").click(function () {
        window.pageRouter.toAddModule();
    });

    //『搜索』按钮点击事件
    $('#search_btn').click(function () {
        var projectName = $('#search_project option:selected').val().trim(); //项目下拉列表默认值为-1
        var moduleName = $('#search_name_module').val().trim();
        var testPerson = $('#search_test_person').val().trim();
        if (projectName == '-1' && moduleName.length == 0 && testPerson.length == 0) {
            //没有搜索条件
            showFirstPage();
        } else {
            //点击搜索则获取指定条件下的前10条记录
            search(1);
        }
    });

    //搜索模块方法
    function search(index) {
        var projectName = $('#search_project option:selected').text().trim();
        var moduleName = $('#search_name_module').val().trim();
        var testPerson = $('#search_test_person').val().trim();

        window.APINet.searchModule({
            project_name: projectName,
            module_name: moduleName,
            test_person: testPerson,
            index: index
        }, function (data) {
            var param = JSON.parse(data['data']['modules']);
            var count = data['data']['count'];
            var curr = data['data']['currPage'];
            var proInfo = data['data']['proInfo']

            for (var index = 0; index < param.length; index++) {
                //处理project_id与project_name
                param[index]['project_name'] = proInfo[param[index]['belong_project']]
            }

            showResult(param);

            //设置总条数
            window.PageIndicator.setCount(count);
            //设置当前显示第几页
            window.PageIndicator.setPage(curr);
        });
    }

    //设置输入框为有错误状态
    function setError(id) {
        $('#' + id).parent().parent().addClass('has-error');
    }

    //设置输入框为正常状态
    function setNormal(id) {
        $('#' + id).parent().parent().removeClass('has-error');
    }

    //刷新项目下拉列表
    function refresh_project(projectList, selector_id) {
        var selector = $(selector_id);
        selector.empty();

        for (var i = 0; i < projectList.length; i++) {
            var project_id = projectList[i].id;
            var project_name = projectList[i].project_name;
            selector.prepend("<option value='" + project_id + "'>" + project_name + "</option>")
        }
        selector.prepend("<option value='-1' selected>项目名称</option>");
    }

}());