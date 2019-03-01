;
(function() {
	var min_day = "2019-01-01";
	var max_day = new Date().Format("yyyy-MM-dd");
	
	//首次进入展示第一页数据
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
                refresh_module(moduleList, "#search_name_module");
            });
        }
    });

	//设置回调方法(回调参数为需要显示的页数，根据此页数进行网络请求，展示相应数据)
	window.PageIndicator.setCallback(function(curr) {
		var searchType = $('#search_type option:selected').val().trim(); //搜索类型默认值为0
		var projectName = $('#search_project option:selected').val().trim(); //项目下拉列表默认值为-1
        var moduleName = $('#search_name_module option:selected').val().trim(); //模块下拉列表默认值为-1
		var reportName = $('#search_name').val().trim();
		var startDate = $('.daterange input[name=range_date]').data('daterangepicker').startDate.format("YYYY-MM-DD");
		var endDate = $('.daterange input[name=range_date]').data('daterangepicker').endDate.format("YYYY-MM-DD");
		if(searchType == '0' && projectName == '-1' && moduleName == '-1' && reportName.length == 0 && startDate.length == 0 && endData.length == 0) {
			//没有搜索条件
			window.APINet.getReportList({index:curr}, curr, function(data) {
				var param = JSON.parse(data['data']['reports']);
				var count = data['data']['count'];
				var curr = data['data']['currPage'];
				showResult(param);
			});
		}else{
			//有搜索条件的页数切换
			search(curr);
		}
	});
	
	//删除选中的报告
	$('#delete_btn').click(function(){
		var select_reports  = getCheckBoxes('select_report')
		if(select_reports.length < 1){
			window.utils.tips('未选中任何报告！');
		}else{
			window.utils.deleteConfirm('确定删除选中的报告吗？',function(index){
				window.APINet.deleteReport({
					ids:select_reports
				},function(data){
					showFirstPage();
				});
			});
		}
	});
	
	//清空搜索条件
	$('#clear_btn').click(function(){
		$('#search_type').val('0');
		$('#search_project').val('-1');
        $('#search_name_module').val('-1');
		$('#search_name').val('');
		$('.daterange input[name=range_date]').data('daterangepicker').setStartDate(min_day);
		$('.daterange input[name=range_date]').data('daterangepicker').setEndDate(max_day);
	});
	
	//全选事件处理
	$('#slect_all').change(function(event){
		if($(event.target).prop('checked') == true){
			$('tbody tr td input').prop('checked',true);
		}else{
			$('tbody tr td input').prop('checked',false)
		}
	});
	
	//各条目中『查看』按钮的事件委托
	$(".table").on("click",".btn-view",function(){
		var id = $(this).data('id');
		window.pageRouter.toRport(id);
	});
	
	$(".table").on("click",".btn-delete",function(){
		var id = $(this).data("id");
		window.utils.deleteConfirm('确认要删除此报告吗？',function(index){
			window.APINet.deleteReport({id:id},function(data){
				var result = data['result'];
				var msg = data['msg'];
				if(parseInt(result) == 1){
					showFirstPage();
				}
				window.utils.tips(msg);
			});
		});
	});

	function showFirstPage() {
		//获取第一页数据进行展示
		window.APINet.getReportList({}, 1, function(data) {
			var param = JSON.parse(data['data']['reports']);
			var count = data['data']['count'];
			var curr = data['data']['currPage'];
			showResult(param);

			//设置总页数
			window.PageIndicator.setCount(count);
			//设置当前显示第几页
			window.PageIndicator.setPage(1);
		});
	}

	//根据参数展示数据
	function showResult(param) {
		//清空表格节点
		$('#report_list_body').empty();
		for(var index = 0; index < param.length; index++) {
			$("#report_list_body").append(getReportElement(param[index], index));
		};
	}
	
	//生成html元素
	function getReportElement(param, index) {
		var reportName = param['report_name'];
		var createTime = param['create_time'];
		var username = param['user_name'];
		var id = param['id']

		var projectStr = '<tr><td><input type="checkbox" name="select_report" id="' + id + '"/></td><td>' + (id) + '</td>' +
			'<td>' + reportName + '</td>' + '<td>' + username + '</td>' +
			'<td>' + createTime + '</td>' + getOperationEle(id) + '</tr>';
		return projectStr;
	}
	
	//获取操作相关元素
	function getOperationEle(id){
		var result = '<td>'+
						'<div class="btn-group-xs bt-group-class" role="group">'+
							'<button type="button" data-id="'+id+'" class="btn btn-primary btn-view">查看</button>'+
							'<button type="button" data-id="'+id+'" class="btn btn-danger btn-delete">删除</button>'+
  						'</div>'+
  					'</td>';
  		return result;
	}

	//获取格式化的日期+时间
	function getDate(time) {
		var date = new Date(time * 1000);
		return date.getFullYear() + "年" + (date.getMonth() + 1) + '月' + date.getDate() + '日' + ' ' + date.getHours() + ':' + date.getMinutes();
	}

	//『搜索』按钮点击事件
	$('#search_btn').click(function() {
		var searchType = $('#search_type option:selected').val().trim(); //搜索类型默认值为0
		var projectName = $('#search_project option:selected').val().trim(); //项目下拉列表默认值为-1
        var moduleName = $('#search_name_module option:selected').val().trim(); //模块下拉列表默认值为-1
		var reportName = $('#search_name').val().trim();
		var startDate = $('.daterange input[name=range_date]').data('daterangepicker').startDate.format("YYYY-MM-DD");
		var endDate = $('.daterange input[name=range_date]').data('daterangepicker').endDate.format("YYYY-MM-DD");
		if(searchType == '0' && projectName == '-1' && moduleName == '-1' && reportName.length == 0 && startDate.length == 0 && endData.length == 0) {
			//没有搜索条件
			showFirstPage();
		} else {
			//点击搜索则获取指定条件下的前10条记录
			search(1);
		}
	});

	//搜索报告方法
	function search(index) {
		var search_type = $('#search_type option:selected').val().trim();
		var projectName = $('#search_project option:selected').text().trim();
        var moduleName = $('#search_name_module option:selected').text().trim();
		var reportName = $('#search_name').val().trim();
		var startDate = $('.daterange input[name=range_date]').data('daterangepicker').startDate.format("YYYY-MM-DD");
		var endDate = $('.daterange input[name=range_date]').data('daterangepicker').endDate.format("YYYY-MM-DD");
		console.log(startDate);
		console.log(endDate);
		
		window.APINet.searchReport({
			search_type: search_type,
			project_name: projectName,
            module_name: moduleName,
			report_name: reportName,
			startDate: startDate,
			endDate: endDate,
			index: index
		}, function(data) {
			var param = JSON.parse(data['data']['reports']);
			var count = data['data']['count'];
			var curr = data['data']['currPage'];
			
			showResult(param);
			
			//设置总页数
			window.PageIndicator.setCount(count);
			//设置当前显示第几页
			window.PageIndicator.setPage(curr);
		});
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

    //刷新模块下拉列表
    function refresh_module(moduleList, selector_id) {
        console.log('refreshing')
        var selector = $(selector_id);
        selector.empty();

        for (var i = 0; i < moduleList.length; i++) {
            var module_id = moduleList[i].id;
            var module_name = moduleList[i].module_name;
            selector.prepend("<option value='" + module_id + "'>" + module_name + "</option>")
        }
        selector.prepend("<option value='-1' selected>模块名称</option>");
	}

	$(".daterange input[name=range_date]").daterangepicker({
		drops: "down",
		minDate: min_day,
		maxDate: max_day,
		startDate: min_day,
		endDate: max_day,
		locale: {
			"format": "YYYY-MM-DD", // 显示格式
			"separator": " / ", // 两个日期之间的分割线
			// 中文化
			"applyLabel": "确定",
			"cancelLabel": "取消",
			"fromLabel": "开始",
			"toLabel": "结束",
			"daysOfWeek": ["日", "一", "二", "三", "四", "五", "六"],
			"monthNames": ["一月", "二月", "三月", "四月", "五月", "六", "七月", "八月", "九月", "十月", "十一月", "十二月"],
			"firstDay": 1,
		},
	});
	
}());