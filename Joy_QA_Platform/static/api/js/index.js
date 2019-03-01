;
(function() {

	//	var count_chart = echarts.init(document.getElementById('charts_count'));
	var charts_task_to_project = echarts.init(document.getElementById('charts_task_to_project'));
	var charts_task_fail = echarts.init(document.getElementById('charts_task_fail'));

	// 指定图表的配置项和数据
	var count_option = {
		title: {
			text: '数量统计',
			textStyle: {
				color: '#888',
			},
		},
		grid: {
			show: true,
			left: '10%',
			width: '300',
			height: '200',
		},
		tooltip: {},
		legend: {
			data: ['']
		},
		xAxis: {
			show: true,
		},
		yAxis: {
			data: ["任务", "用例", "模块", "项目"],
		},
		series: [{
			name: '数量',
			type: 'bar',
			legendHoverLink: true,
			barWidth: 20,
			label: {
				show: true,
				position: 'right',
				textStyle: {
					color: 'black',
				},
			},
			itemStyle: {
				normal: {
					//每个柱子的颜色即为colorList数组里的每一项，如果柱子数目多于colorList的长度，则柱子颜色循环使用该数组
					color: function(params) {
						var colorList = ['#4472CA', '#5E7CE2', '#92B4F4', '#CFDEE7'];
						return colorList[params.dataIndex];
					},
				},
			},
		}]
	};

	// 使用刚指定的配置项和数据显示图表。
	//	count_chart.setOption(count_option);

	//	window.APINet.getCounts({}, function(data) {
	//		if(data['code'] != 1){
	//			console.log("获取数量失败!");
	//		}else{
	//			data = data['data'];
	//			projectCount = data['projectCount'];
	//			moduleCount = data['moduleCount'];
	//			testcaseCount = data['testcaseCount'];
	//			taskCount = data['taskCount'];
	//			count_chart.setOption({
	//				series: [{
	//					data: [taskCount, testcaseCount, moduleCount, projectCount],
	//				}],
	//			});	
	//		}
	//	});

	var pie_option = {
		title: {
			text: '失败任务',
			textStyle: {
				color: '#888',
			},
			x:'center',
			y:'center',
			subtextStyle:{
				color:'#74C239',	
			},
		},
		tooltip: {
			trigger: 'item',
		},
		series: {
			name: '占比',
			type: 'pie',
			radius:["30%","60%"],
			data: [],
			label: {
				show: true,
				formatter: '{b}\n{c} ({d}%)',
			},
			tooltip: {
				formatter: '{b}<br/>{c}<br/>{d}%',
			},
		}
	}

	charts_task_fail.setOption(pie_option);

	window.APINet.summary_fail_task({}, function(data) {
		if(data['code'] != 1) {
			console.log("获取失败任务列表失败!");
		} else {
			data = data['data'];
			var records = JSON.parse(data['records']);
			
			//统计总数
			var sum = 0;
			for(key in records){
				sum = sum + records[key];
			}

			result = [];
			for(var key in records) {
				result.push({
					name: key,
					value: records[key]
				});
			}
			charts_task_fail.setOption({
				title:{
					subtext:"总计:"+sum,
				},
				series: [{
					data: result,
				}],
			});
		}
	});

	window.APINet.fail_task_list({}, function(data) {
		var records = JSON.parse(data['data']['records']);
		var project_info = data['data']['project_info'];
		var task_info = data['data']['task_info'];
		$('#fail_list_body').empty();
		for(var index = 0; index < records.length; index++) {
			var project_name = project_info[records[index]['task_id']];
			var task_name = task_info[records[index]['task_id']];
			$("#fail_list_body").append(getFailRecordElement(records[index], project_name, task_name));
		}
	});

	//生成html元素
	function getFailRecordElement(param, project_name, task_name) {
		return "<tr><td>" + param['id'] + "</td><td>" + project_name + "</td><td>" + task_name + "</td>" +
			"<td>" + param['time'] + "</td>" + getOperationEle(param) + "</tr>";
	}

	function getOperationEle(param) {
		var result = '<td>' +
			'<div class="btn-group-xs bt-group-class" role="group">' +
			'<button type="button" data-id="' + param['report_id'] + '" class="btn btn-danger btn-report">查看报告</button>' +
			'</div>' +
			'</td>';
		return result;
	}

	$(".table").on("click", ".btn-report", function() {
		var id = $(this).data("id");
		window.pageRouter.toRport(id);
	});

	var task_to_project_option = {
		title: {
			text: '正在执行任务',
			textStyle: {
				color: '#888',
			},
			x:'center',
			y:'center',
			subtextStyle:{
				color:'#74C239',	
			},
		},
		tooltip: {
			trigger: 'item',
		},
		//		 legend: {
		//	        type: 'scroll',
		//	        orient: 'vertical',
		//	        right: 10,
		//	        top: 20,
		//	        bottom: 20,
		////	        data: ['奥飞SDK','融合SDK'],
		////	
		////	        selected: data.selected
		//  		},
		series: {
			name: '占比',
			type: 'pie',
			radius:["40%","70%"],
			data: [],
			label: {
				show: true,
				formatter: '{b}\n{c} ({d}%)',
			},
			tooltip: {
				formatter: '{b}<br/>{c}<br/>{d}%',
			},
		}
	}

	charts_task_to_project.setOption(task_to_project_option);

	window.APINet.task_to_project({}, function(data) {
		data = data['data'];
		var tasks = JSON.parse(data['tasks']);
		
		//统计总数
		var sum = 0;
		for(key in tasks){
			sum = sum + tasks[key];
		}

		result = [];
		for(var key in tasks) {
			result.push({
				name: key,
				value: tasks[key]
			});
		}
		charts_task_to_project.setOption({
			title:{
				subtext:"总计: "+sum,
			},
			series: [{
				data: result,
			}],
		});
	});

	//	$('#start_time').datetimepicker({
	//		format: "yyyy-mm-dd",
	//		autoclose: true,
	//		todayBtn: true,
	////		startDate: start_time,
	//		minView: 2,
	//		pickerPosition: 'top-right',
	//		multidate: true,
	//	})

	//	$('#stop_time').datetimepicker({
	//		format: "yyyy-mm-dd",
	//		autoclose: true,
	//		todayBtn: true,
	////		startDate: start_time,
	//		minView: 2,
	//		pickerPosition: 'top-right',
	//	})

	var min_day = "2019-01-01";
	var max_day = new Date().Format("yyyy-MM-dd");

	$(".daterange input[name=range_date]").daterangepicker({
		drops: "up",
		minDate: min_day,
		maxDate: max_day,
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

	$(".daterange input[name=range_date]").on('apply.daterangepicker', function(ev, picker) {
		var startDate = picker.startDate.format("YYYY-MM-DD");
		var endDate = picker.endDate.format("YYYY-MM-DD");
		//开始请求区间数据
		window.APINet.summary_fail_task({
			startDate: startDate,
			endDate: endDate,
		}, function(data) {
			if(data['code'] != 1) {
				console.log("获取失败任务列表失败!");
			} else {
				data = data['data'];
				if(data['records'] == '{}') {
					window.utils.tips("该时间段没有失败任务！");
					return;
				}

				var records = JSON.parse(data['records']);
				
				//统计总数
				var sum = 0;
				for(key in records){
					sum = sum + records[key];
				}

				result = [];
				for(var key in records) {
					result.push({
						name: key,
						value: records[key]
					});
				}
				charts_task_fail.setOption({
					title:{
						subtext:"总计:"+sum,
					},
					series: [{
						data: result,
					}],
				});
			}
		});
	});

	//设置当前时间内容于图表同步
	var now = Date.parse(new Date());
	var start_day = now - 180 * 24 * 60 * 60 * 1000;
	now = timestampToTime(now)
	start_day = timestampToTime(start_day)
	
	function timestampToTime(timestamp) {
        var date = new Date(timestamp);//时间戳为10位需*1000，时间戳为13位的话不需乘1000
        var Y = date.getFullYear() + '-';
        var M = (date.getMonth()+1 < 10 ? '0'+(date.getMonth()+1) : date.getMonth()+1) + '-';
        var D = date.getDate() + ' ';
        var h = date.getHours() + ':';
        var m = date.getMinutes() + ':';
        var s = date.getSeconds();
        return Y+M+D;
    }
	
	$("#date-content").val(start_day+"/"+now);

}());