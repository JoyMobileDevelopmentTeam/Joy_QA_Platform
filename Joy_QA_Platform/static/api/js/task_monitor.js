;
(function () {

    $(document).ready(function () {
        // 首次进入展示第一页数据
        showFirstPage();
    });

    // 设置回调方法(回调参数为需要显示的页数，根据此页数进行网络请求，展示相应数据)
    window.PageIndicator.setCallback(function (curr) {
        var taskName = $('#search_name').val().trim();

        if (taskName.length == 0) {
            // 没有搜索条件
            window.APINet.taskMonitor({}, curr, function (data) {
                var param = JSON.parse(data['data']['monitors']);
                var count = data['data']['count'];
                var curr = data['data']['currPage'];

                showResult(param);
                
            });
        } else {
            // 有搜索条件的页数切换
            search(curr);
        }
    });

    function showFirstPage() {
        // 获取第一页数据进行展示
        window.APINet.taskMonitor({}, 1, function (data) {
            var param = JSON.parse(data['data']['monitors']);
            var count = data['data']['count'];
            var curr = data['data']['currPage'];

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
        $('#monitor_list_body').empty();
        for (var index = 0; index < param.length; index++) {
            $('#monitor_list_body').append(getTaskElement(param[index], index));
        }
        ;
    }

    //生成html元素
    function getTaskElement(param, index) {
        var taskName = param['task_name'];
        var caseName = param['case_name'];
        var state = param['state'];
        var result = param['result'];
        var received = timestampToTime(param['received']);
        var started = timestampToTime(param['started']);
        var runtime = param['runtime'].toFixed(2) + "s";
        var id = param['report_uuid']

        var monitorStr = '<tr>' + '<td>' + taskName + '</td>' + '<td>' + caseName + '</td>' +
            '<td>' + state + '</td>' + '<td>' + received + '</td>' + '<td>' +
            started + '</td>' + '<td>' + runtime + '</td>' + getOperationEle(id) + '</tr>';
        return monitorStr;
    }

    //获取操作相关元素
    function getOperationEle(id) {
        var result = '<td>' +
            '<div class="btn-group-xs bt-group-class" role="group">' +
            '<button type="button" data-id="' + id + '" class="btn btn-primary btn-report">查看报告</button>' +
            '</div>' +
            '</td>';
        return result;
    }

    //查看报告
    $(".table").on("click", ".btn-report", function () {
        var id = $(this).data("id");
        window.APINet.checkReport({report_id: id}, function (data) {
            if (data.result == 1) {
                id = data['data'].report_id
                window.pageRouter.toRport(id);
            } else {
                window.utils.tips(data['msg'], null);
            }
        });
    });

    //『搜索』按钮点击事件
    $('#search_btn').click(function () {
        var taskName = $('#search_name').val().trim();
        if (taskName.length == 0) {
            //没有搜索条件
            showFirstPage();
        } else {
            //点击搜索则获取指定条件下的前10条记录
            search(1);
        }
    });

    //搜索任务方法
    function search(index) {
        var taskName = $('#search_name').val().trim();
        window.APINet.taskMonitor({
            task_name: taskName,
        }, index, function (data) {
            var param = JSON.parse(data['data']['monitors']);
            var count = data['data']['count'];
            var curr = data['data']['currPage'];

            showResult(param);

            //设置总页数
            window.PageIndicator.setCount(count);
            //设置当前显示第几页
            window.PageIndicator.setPage(curr);
        });
    }

    function timestampToTime(timestamp) {
        var date = new Date(timestamp * 1000);//时间戳为10位需*1000，时间戳为13位的话不需乘1000
        Y = date.getFullYear() + '-';
        M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
        D = (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) + ' ';
        h = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':';
        m = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':';
        s = (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds()) + '.';
        ms = date.getMilliseconds();
        if (ms < 10) {
            ms = '00' + ms;
        }
        if (ms < 100) {
            ms = '0' + ms;
        }
        return Y + M + D + h + m + s + ms;
    }

}());