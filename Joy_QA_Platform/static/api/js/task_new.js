;
(function () {

    var ids = ["task_name", "belong_env", "belong_project", "belong_module", "receiver_email"];
    var is_loop = false;

    $(document).ready(function () {
        $('#case_list').multiselect({nonSelectedText: '请选择测试用例'});

        var start_time = new Date().Format("yyyy-MM-dd HH:mm:ss");
        $('#start_time').datetimepicker({
            format: "yyyy-mm-dd hh:ii",
            autoclose: true,
            todayBtn: true,
            startDate: start_time,
            minuteStep: 5,
        })

        $('#is_loop').click(function () {
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

    window.utils.setListener(ids, setNormal);

    window.APINet.getEnvList({}, -1, function (data) {
        var envList = JSON.parse(data['data']['envs']);
        refresh_environment(envList, "#belong_env");
    });

    window.APINet.getProjectList({}, -1, function (data) {
        var projectList = JSON.parse(data['data']['projects']);
        refresh_project(projectList, "#belong_project");
    });

    $('#belong_project').change(function () {
        var projectId = $('#belong_project option:selected').val();
        if (projectId != -1) {
            window.APINet.searchModule({project_id: projectId}, function (data) {
                var moduleList = JSON.parse(data['data']['modules']);
                refresh_module(moduleList, "#belong_module");
            });
        }
    });

    $('#belong_module').change(function () {
        var moduleId = $('#belong_module option:selected').val();
        if (moduleId != -1) {
            window.APINet.searchCase({module_id: moduleId}, function (data) {
                var caseList = JSON.parse(data['data']['cases']);
                refresh_case(caseList, "#case_list");
            });
        }
    });

    $('#send').click(function () {
        createTask(function (data) {
            var result = parseInt(data['result']);
            window.utils.tips(data['msg'], function () {
                if (result == 1) {
                    window.pageRouter.toTaskList();
                } else {
                    console.log(data);
                }
            });
        })
    });

    $('#add_new').click(function () {
        createTask(function (data) {
            var result = parseInt(data['result']);
            window.utils.tips(data['msg'], function () {
                if (result == 1) {
                    window.pageRouter.toAddTask();
                } else {
                    console.log(data);
                }
            });
        })
    })

    function refresh_environment(envList, selector_id) {
        var selector = $(selector_id);
        selector.empty();

        for (var i = 0; i < envList.length; i++) {
            var env_id = envList[i].id;
            var env_name = envList[i].env_name;
            selector.prepend("<option value='" + env_id + "'>" + env_name + "</option>")
        }
        selector.prepend("<option value='-1' selected>请选择</option>");
    }

    function refresh_project(projectList, selector_id) {
        var selector = $(selector_id);
        selector.empty();

        for (var i = 0; i < projectList.length; i++) {
            var project_id = projectList[i].id;
            var project_name = projectList[i].project_name;
            selector.prepend("<option value='" + project_id + "'>" + project_name + "</option>")
        }
        selector.prepend("<option value='-1' selected>请选择</option>");
    }

    function refresh_module(moduleList, selector_id) {
        var selector = $(selector_id);
        selector.empty();

        for (var i = 0; i < moduleList.length; i++) {
            var module_id = moduleList[i].id;
            var module_name = moduleList[i].module_name;
            selector.prepend("<option value='" + module_id + "'>" + module_name + "</option>")
        }
        selector.prepend("<option value='-1' selected>请选择</option>");
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
        var day_selector = $('#interval_day');
        var hour_selector = $('#interval_hour');
        var minute_selector = $('#interval_minute');
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

    function createTask(callback) {
        if (!window.utils.checkInput(ids, setError)) {
            return;
        }

        var task_name = $('#task_name').val();
        var belong_env = $('#belong_env option:selected').val();
        var belong_project = $('#belong_project option:selected').val();
        var belong_module = $('#belong_module option:selected').val();
        var receiver_email = $('#receiver_email').val();
        var case_arr = $('#case_list').val();
        var start_time = new Date($('#start_time').val().replace(/-/g, '/')).getTime();
        var is_loop = $('#is_loop').val();
        var interval_day = Number($('#interval_day option:selected').val());
        var interval_hour = Number($('#interval_hour option:selected').val());
        var interval_minute = Number($('#interval_minute option:selected').val());
        interval_minute = interval_minute + interval_hour*60 + interval_day*60*24;
        console.log(start_time);
        if (case_arr != null) {
            var case_list = case_arr.join(",");
        } else {
            window.utils.tips("用例列表不能为空", null);
            return;
        }

        if(isNaN(start_time)){
            window.utils.tips("开始执行时间不能为空", null);
            return;
        }

        window.APINet.createTask({
            task_name: task_name,
            belong_env: belong_env,
            belong_project: belong_project,
            belong_module: belong_module,
            receiver_email: receiver_email,
            case_list: case_list,
            start_time: start_time,
            is_loop: is_loop,
            interval_minute: interval_minute,
        }, function (data) {
            callback(data);
        });
    }

    // 设置输入框为有错误状态
    function setError(id) {
        $('#' + id).parent().parent().addClass('has-error');
    }

    // 设置输入框为正常状态
    function setNormal(id) {
        $('#' + id).parent().parent().removeClass('has-error');
    }

    function validateCronExpression(str) {
        str = "* " + str;
        var cron_pattern = new RegExp("^\\s*($|#|\\w+\\s*=|(\\?|\\*|(?:[0-5]?\\d)(?:(?:-|\/|\\,)(?:[0-5]?\\d))?(?:,(?:[0-5]?\\d)(?:(?:-|\/|\\,)(?:[0-5]?\\d))?)*)\\s+(\\?|\\*|(?:[0-5]?\\d)(?:(?:-|\/|\\,)(?:[0-5]?\\d))?(?:,(?:[0-5]?\\d)(?:(?:-|\/|\\,)(?:[0-5]?\\d))?)*)\\s+(\\?|\\*|(?:[01]?\\d|2[0-3])(?:(?:-|\/|\\,)(?:[01]?\\d|2[0-3]))?(?:,(?:[01]?\\d|2[0-3])(?:(?:-|\/|\\,)(?:[01]?\\d|2[0-3]))?)*)\\s+(\\?|\\*|(?:0?[1-9]|[12]\\d|3[01])(?:(?:-|\/|\\,)(?:0?[1-9]|[12]\\d|3[01]))?(?:,(?:0?[1-9]|[12]\\d|3[01])(?:(?:-|\/|\\,)(?:0?[1-9]|[12]\\d|3[01]))?)*)\\s+(\\?|\\*|(?:[1-9]|1[012])(?:(?:-|\/|\\,)(?:[1-9]|1[012]))?(?:L|W)?(?:,(?:[1-9]|1[012])(?:(?:-|\/|\\,)(?:[1-9]|1[012]))?(?:L|W)?)*|\\?|\\*|(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(?:(?:-)(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))?(?:,(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(?:(?:-)(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC))?)*)\\s+(\\?|\\*|(?:[0-6])(?:(?:-|\/|\\,|#)(?:[0-6]))?(?:L)?(?:,(?:[0-6])(?:(?:-|\/|\\,|#)(?:[0-6]))?(?:L)?)*|\\?|\\*|(?:MON|TUE|WED|THU|FRI|SAT|SUN)(?:(?:-)(?:MON|TUE|WED|THU|FRI|SAT|SUN))?(?:,(?:MON|TUE|WED|THU|FRI|SAT|SUN)(?:(?:-)(?:MON|TUE|WED|THU|FRI|SAT|SUN))?)*)(|\\s)+(\\?|\\*|(?:|\\d{4})(?:(?:-|\/|\\,)(?:|\\d{4}))?(?:,(?:|\\d{4})(?:(?:-|\/|\\,)(?:|\\d{4}))?)*))$");
        var rst = cron_pattern.test(str);
        return rst;
    }

}());