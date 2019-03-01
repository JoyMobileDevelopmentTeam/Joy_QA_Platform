;
(function () {

    var ids = ["edit_task_name", "edit_env_name", "edit_project_name", "edit_module_name", "edit_receiver_email"];
    var is_loop = false;

    $(document).ready(function () {
        $('#edit_case_list').multiselect({nonSelectedText: '请选择测试用例'});

        var start_time = new Date().Format("yyyy-MM-dd HH:mm:ss");
        $('#edit_start_time').datetimepicker({
            format: "yyyy-mm-dd hh:ii",
            autoclose: true,
            todayBtn: true,
            startDate: start_time,
            minuteStep: 5,
        })

        $('#edit_is_loop').click(function () {
            is_loop = !is_loop;
            if (is_loop) {
                $(this).html("循环");
                $(this).val(true);
                $(this).attr("class", "btn btn-success btn-sm");
                $(".interval").removeAttr("disabled");
            } else {
                $(this).html("不循环");
                $(this).val(false);
                $(this).attr("class", "btn btn-danger btn-sm");
                $(".interval").attr("disabled", "disabled");
            }
        });

        refresh_interval_selector();
    });

    // 首次进入展示第一页数据
    showFirstPage();

    //获取项目下拉列表
    window.APINet.getProjectList({}, -1, function (data) {
        var projectList = JSON.parse(data['data']['projects']);
        refresh_project(projectList, "#search_project");
    });

    //根据选中项目来获取模块下拉列表
    $('#search_project').change(function () {
        var projectId = $('#search_project option:selected').val();
        if (projectId != -1) {
            window.APINet.searchModule({project_id: projectId}, function (data) {
                var moduleList = JSON.parse(data['data']['modules']);
                refresh_module(moduleList, "#search_module");
            });
        }
    });

    window.utils.setListener(ids, setNormal);

    // 设置回调方法(回调参数为需要显示的页数，根据此页数进行网络请求，展示相应数据)
    window.PageIndicator.setCallback(function (curr) {
        var TaskName = $('#search_name').val().trim();
        var projectName = $('#search_project option:selected').text().trim(); //项目下拉列表默认值为-1
        var moduleName = $('#search_module option:selected').text().trim(); //模块下拉列表默认值为-1

        if (TaskName.length == 0 && projectName == '-1' && moduleName == '-1') {
            // 没有搜索条件
            window.APINet.getTaskList({}, curr, function (data) {
                var param = JSON.parse(data['data']['tasks']);
                var count = data['data']['count'];
                var curr = data['data']['currPage'];
                var envInfo = data['data']['envInfo'];
                var proInfo = data['data']['proInfo'];
                var moduleInfo = data['data']['moduleInfo'];

                for (var index = 0; index < param.length; index++) {
                    // 处理env_id与env_name
                    param[index]['env_name'] = envInfo[param[index]['belong_env']];
                    // 处理project_id与project_name
                    param[index]['project_name'] = proInfo[param[index]['belong_project']];
                    // 处理module_id与module_name
                    param[index]['module_name'] = moduleInfo[param[index]['belong_module']]
                }

                showResult(param);
            });
        } else {
            // 有搜索条件的页数切换
            search(curr);
        }
    });

    //全选事件处理
    $('#select_all').change(function (event) {
        if ($(event.target).prop('checked') == true) {
            $('tbody tr td input').prop('checked', true);
        } else {
            $('tbody tr td input').prop('checked', false);
        }
    });

    // 各条目中『执行』『停止』『编辑』『删除』按钮的事件委托
    $(".table").on("click", ".btn-execute", function () {
        var id = $(this).data("id");
        window.APINet.runTask({id: id}, function (data) {
            window.utils.tips(data['msg'], null);
            if (data.result == 1) {
                // 0.5s后重新刷新页面
                setTimeout(function () {
                    location.reload();
                }, 500);
            }
        });
    });
    $(".table").on("click", ".btn-stop", function () {
        var id = $(this).data("id");
        window.APINet.stopTask({id: id}, function (data) {
            window.utils.tips(data['msg'], null);
            if (data.result == 1) {
                // 0.5s后重新刷新页面
                setTimeout(function () {
                    location.reload();
                }, 500);
            }
        });
    });
    $(".table").on("click", ".btn-edit", function () {
        var id = $(this).data("id");
        window.APINet.getTask({id: id}, function (data) {
            // 获取对应任务信息成功
            var result = parseInt(data['result']);
            var belong_env = null;
            var belong_project = null;
            var belong_module = null;
            var case_id_list = null;
            if (result == 1) {
                $('#edit_modal').modal('show');
                var task = JSON.parse(data['data']['tasks'])[0];
                $('#edit_task_name').val(task['task_name']);
                $('#edit_receiver_email').val(task['receiver_email']);
                $('#edit_task_id').val(id);
                $('#edit_start_time').val(task['start_time']);
                if (task['is_loop'] == true) {
                    $('#edit_is_loop').html("循环");
                    $('#edit_is_loop').val(true);
                    $('#edit_is_loop').attr("class", "btn btn-success btn-sm");
                    $(".interval").removeAttr("disabled");

                    var interval_minute = Number(task['interval_minute']);
                    var day = Math.floor(interval_minute / (60*24));
                    var hour = Math.floor(interval_minute % (60*24) / 60);
                    var minute = Math.floor(interval_minute % (60*24) % 60);
                    $('#edit_interval_day').val(day);
                    $('#edit_interval_hour').val(hour);
                    $('#edit_interval_minute').val(minute);
                }
                belong_env = task['belong_env'];
                belong_project = task['belong_project'];
                belong_module = task['belong_module'];
                case_id_list = task['case_id_list'];

                window.APINet.getEnvList({}, -1, function (data) {
                    var environmentList = JSON.parse(data['data']['envs']);
                    refresh_environment(environmentList, "#edit_env_name");
                    // 设置选中环境
                    $("#edit_env_name").val(belong_env);
                });

                window.APINet.getProjectList({}, -1, function (data) {
                    var projectList = JSON.parse(data['data']['projects']);
                    refresh_project(projectList, "#edit_project_name");
                    // 设置选中项目
                    $("#edit_project_name").val(belong_project);
                });

                window.APINet.searchModule({project_id: belong_project}, function (data) {
                    var moduleList = JSON.parse(data['data']['modules']);
                    refresh_module(moduleList, "#edit_module_name");
                    // 设置选中模块
                    $("#edit_module_name").val(belong_module);
                });

                window.APINet.searchCase({module_id: belong_module}, function (data) {
                    var caseList = JSON.parse(data['data']['cases']);
                    refresh_case(caseList, "#edit_case_list");
                    // 设置选中用例
                    $("#edit_case_list").multiselect('select', case_id_list);
                });

                $('#edit_project_name').change(function () {
                    var projectId = $('#belong_project option:selected').val();
                    if (projectId != -1) {
                        window.APINet.searchModule({project_id: projectId}, function (data) {
                            var moduleList = JSON.parse(data['data']['modules']);
                            refresh_module(moduleList, "#edit_module_name");
                        });
                    }
                });

                $('#edit_module_name').change(function () {
                    var moduleId = $('#edit_module_name option:selected').val();
                    if (moduleId != -1) {
                        window.APINet.searchCase({module_id: moduleId}, function (data) {
                            var caseList = JSON.parse(data['data']['cases']);
                            refresh_case(caseList, "#edit_case_list");
                        });
                    }
                });
            } else {
                window.utils.tips('获取任务信息失败!');
            }
        });
    });
    $(".table").on("click", ".btn-delete", function () {
        var id = $(this).data("id");
        window.utils.deleteConfirm('确认要删除此任务？', function (index) {
            window.APINet.deleteTask({id: id}, function (data) {
                var result = data['result'];
                var msg = data['msg'];
                if (parseInt(result) == 1) {
                    showFirstPage();
                }
                window.utils.tips(msg);
            });
        })
    });

    //编辑修改
    $('#submit_modify').click(function () {
        var ids = ["edit_task_name", "edit_env_name", "edit_project_name", "edit_module_name", "edit_receiver_email"];

        if (!window.utils.checkInput(ids, setError)) {
            return;
        }

        var task_name = $('#edit_task_name').val();
        var env_name = $('#edit_env_name').val();
        var project_name = $('#edit_project_name').val();
        var module_name = $('#edit_module_name').val();
        var receiver_email = $('#edit_receiver_email').val();
        var case_arr = $('#edit_case_list').val();
        var id = $('#edit_task_id').val();
        var start_time = new Date($('#edit_start_time').val().replace(/-/g, '/')).getTime();
        var is_loop = $('#edit_is_loop').val();
        var interval_day = Number($('#edit_interval_day option:selected').val());
        var interval_hour = Number($('#edit_interval_hour option:selected').val());
        var interval_minute = Number($('#edit_interval_minute option:selected').val());
        interval_minute = interval_minute + interval_hour*60 + interval_day*60*24;

        if (case_arr != null) {
            var case_list = case_arr.join(",");
        } else {
            window.utils.tips("用例列表不能为空", null);
            return;
        }

        window.APINet.updateTask({
            id: id,
            task_name: task_name,
            env_name: env_name,
            project_name: project_name,
            module_name: module_name,
            receiver_email: receiver_email,
            case_list: case_list,
            start_time: start_time,
            is_loop: is_loop,
            interval_minute: interval_minute,
        }, function (data) {
            var result = parseInt(data['result']);
            if (result == 1) {
                showFirstPage();
                $('#edit_modal').modal('hide');
            }
            window.utils.tips(data['msg'], null);
        });
    });


    function showFirstPage() {
        // 获取第一页数据进行展示
        window.APINet.getTaskList({}, 1, function (data) {
            var param = JSON.parse(data['data']['tasks']);
            var count = data['data']['count'];
            var curr = data['data']['currPage'];
            var envInfo = data['data']['envInfo'];
            var proInfo = data['data']['proInfo'];
            var moduleInfo = data['data']['moduleInfo'];

            for (var index = 0; index < param.length; index++) {
                // 处理env_id与env_name
                param[index]['env_name'] = envInfo[param[index]['belong_env']];
                // 处理project_id与project_name
                param[index]['project_name'] = proInfo[param[index]['belong_project']];
                // 处理module_id与module_name
                param[index]['module_name'] = moduleInfo[param[index]['belong_module']]
            }

            showResult(param);

            // 设置总页数
            window.PageIndicator.setCount(count);
            // 设置当前显示第几页
            window.PageIndicator.setPage(1);
        });
    }

    // 根据参数展示数据
    function showResult(param) {
        // 清空表格节点
        $('#task_list_body').empty();
        for (var index = 0; index < param.length; index++) {
            $("#task_list_body").append(getTaskElement(param[index], index));
        }
    }

    //生成html元素
    function getTaskElement(param, index) {
        var taskName = param['task_name'];
        var failTimes = param['fail_times'];
        var belongEnv = param['env_name'];
        var belongProject = param['project_name'];
        var belongModule = param['module_name'];
        var startTime = param['start_time'];
        var isRun = param['is_run'];
        var receiverEmail = param['receiver_email'];
        var caseNameList = param['case_name_list'];
        var id = param['id']
        if(receiverEmail.length > 30){
        		receiverEmail = receiverEmail.substring(0,30) + "...";
        }

        var taskStr = '<tr><td><input type="checkbox" name="select_task" id="slect_' + id + '"/></td><td>' + (id) + '</td>' +
            '<td>' + taskName + '</td>' + '<td>' + getStatePic(failTimes) + '</td>' + '<td>' + belongEnv + '</td>' + '<td>' + belongProject + 
            '</td>' + '<td>' + belongModule + '</td>' + '<td>' + startTime + '</td>' + '<td>' + receiverEmail + '</td>' +
            '<td>' + caseNameList + '</td>' + getOperationEle(id, isRun) + '</tr>';
        return taskStr;
    }

    // 根据接口失败次数获取接口状态图片
    function getStatePic(failTimes) {
        if(failTimes >= 2){
            return "<span class='ion-md-close' id='title' style='color: red;'></span>";
        } else {
            return "<span class='ion-md-checkmark' id='title' style='color: green;'></span>";
        }
    }

    //获取操作相关元素
    function getOperationEle(id, isRun) {
        if (isRun) {
            var result = '<td>' +
                '<div class="btn-group-xs bt-group-class" role="group">' +
                '<button type="button" data-id="' + id + '" class="btn btn-danger btn-stop">停止</button>'
        } else {
            var result = '<td>' +
                '<div class="btn-group-xs bt-group-class" role="group">' +
                '<button type="button" data-id="' + id + '" class="btn btn-primary btn-execute">运行</button>'
        }
        result = result +
            '<button type="button" data-id="' + id + '" class="btn btn-info btn-edit">编辑</button>' +
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

    //『新增任务』按钮点击事件
    $("#add_task").click(function () {
        window.pageRouter.toAddTask();
    });

    //『搜索』按钮点击事件
    $('#search_btn').click(function () {
        var TaskName = $('#search_name').val().trim();
        var projectName = $('#search_project option:selected').val().trim(); //项目下拉列表默认值为-1
        var moduleName = $('#search_module option:selected').val().trim(); //模块下拉列表默认值为-1
        if (TaskName.length == 0 && projectName == '-1' && moduleName == '-1') {
            //没有搜索条件
            showFirstPage();
        } else {
            //点击搜索则获取指定条件下的前10条记录
            search(1);
        }
    });

    //搜索任务方法
    function search(index) {
        var TaskName = $('#search_name').val().trim();
        var projectName = $('#search_project option:selected').text().trim();
        var moduleName = $('#search_module option:selected').text().trim();
        window.APINet.searchTask({
            task_name: TaskName,
            project_name: projectName,
            module_name: moduleName,
            index: index,
        }, function (data) {
            var param = JSON.parse(data['data']['tasks']);
            var count = data['data']['count'];
            var curr = data['data']['currPage'];
            var envInfo = data['data']['envInfo'];
            var proInfo = data['data']['proInfo'];
            var moduleInfo = data['data']['moduleInfo'];

            for (var index = 0; index < param.length; index++) {
                // 处理project_id与project_name
                param[index]['env_name'] = envInfo[param[index]['belong_env']];
                // 处理project_id与project_name
                param[index]['project_name'] = proInfo[param[index]['belong_project']];
                // 处理module_id与module_name
                param[index]['module_name'] = moduleInfo[param[index]['belong_module']]
            }

            showResult(param);

            //设置总页数
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

    function refresh_environment(envList, selector_id) {
        var selector = $(selector_id);
        selector.empty();

        for (var i = 0; i < envList.length; i++) {
            var env_id = envList[i].id;
            var env_name = envList[i].env_name;
            selector.prepend("<option value='" + env_id + "'>" + env_name + "</option>")
        }
        selector.prepend("<option value='-1' selected>运行环境</option>");
    }

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

    function refresh_module(moduleList, selector_id) {
        var selector = $(selector_id);
        selector.empty();

        for (var i = 0; i < moduleList.length; i++) {
            var module_id = moduleList[i].id;
            var module_name = moduleList[i].module_name;
            selector.prepend("<option value='" + module_id + "'>" + module_name + "</option>")
        }
        selector.prepend("<option value='-1' selected>模块名称</option>");
    }

    function refresh_case(caseList, selector_id) {
        var selector = $(selector_id);
        selector.html("");

        for (var i = 0; i < caseList.length; i++) {
            var case_id = caseList[i].id;
            var case_name = caseList[i].name;
            selector.append("<option value='" + case_id + "'>" + case_name + "</option>");
        }

        selector.multiselect("destroy").multiselect({nonSelectedText: '请选择测试用例'});
    }

    function refresh_interval_selector() {
        var day_selector = $('#edit_interval_day');
        var hour_selector = $('#edit_interval_hour');
        var minute_selector = $('#edit_interval_minute');
        day_selector.empty();
        hour_selector.empty();
        minute_selector.empty();

        for (var i = 30; i >= 0; i--) {
            day_selector.prepend("<option value='" + i + "'>" + i + "</option>")
        }
        for (var i = 23; i >= 0; i--) {
            hour_selector.prepend("<option value='" + i + "'>" + i + "</option>")
        }
        for (var i = 59; i >= 0; i--) {
            minute_selector.prepend("<option value='" + i + "'>" + i + "</option>")
        }
    }

    function validateCronExpression(str) {
        str = "* " + str;
        var cron_pattern = new RegExp("^\\s*($|#|\\w+\\s*=|(\\?|\\*|(?:[0-5]?\\d)(?:(?:-|\/|\\,)(?:[0-5]?\\d))?(?:,(?:[0-5]?\\d)(?:(?:-|\/|\\,)(?:[0-5]?\\d))?)*)\\s+(\\?|\\*|(?:[0-5]?\\d)(?:(?:-|\/|\\,)(?:[0-5]?\\d))?(?:,(?:[0-5]?\\d)(?:(?:-|\/|\\,)(?:[0-5]?\\d))?)*)\\s+(\\?|\\*|(?:[01]?\\d|2[0-3])(?:(?:-|\/|\\,)(?:[01]?\\d|2[0-3]))?(?:,(?:[01]?\\d|2[0-3])(?:(?:-|\/|\\,)(?:[01]?\\d|2[0-3]))?)*)\\s+(\\?|\\*|(?:0?[1-9]|[12]\\d|3[01])(?:(?:-|\/|\\,)(?:0?[1-9]|[12]\\d|3[01]))?(?:,(?:0?[1-9]|[12]\\d|3[01])(?:(?:-|\/|\\,)(?:0?[1-9]|[12]\\d|3[01]))?)*)\\s+(\\?|\\*|(?:[1-9]|1[012])(?:(?:-|\/|\\,)(?:[1-9]|1[012]))?(?:L|W)?(?:,(?:[1-9]|1[012])(?:(?:-|\/|\\,)(?:[1-9]|1[012]))?(?:L|W)?)*|\\?|\\*|(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(?:(?:-)(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))?(?:,(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(?:(?:-)(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))?)*)\\s+(\\?|\\*|(?:[0-6])(?:(?:-|\/|\\,|#)(?:[0-6]))?(?:L)?(?:,(?:[0-6])(?:(?:-|\/|\\,|#)(?:[0-6]))?(?:L)?)*|\\?|\\*|(?:MON|TUE|WED|THU|FRI|SAT|SUN)(?:(?:-)(?:MON|TUE|WED|THU|FRI|SAT|SUN))?(?:,(?:MON|TUE|WED|THU|FRI|SAT|SUN)(?:(?:-)(?:MON|TUE|WED|THU|FRI|SAT|SUN))?)*)(|\\s)+(\\?|\\*|(?:|\\d{4})(?:(?:-|\/|\\,)(?:|\\d{4}))?(?:,(?:|\\d{4})(?:(?:-|\/|\\,)(?:|\\d{4}))?)*))$");
        var rst = cron_pattern.test(str);
        return rst;
    }

}());