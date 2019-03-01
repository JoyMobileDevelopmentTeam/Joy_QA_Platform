;
(function() {

	//加载首页数据
	showFirstPage();
	
	//设置回调方法(回调参数为需要显示的页数，根据此页数进行网络请求，展示相应数据)
	window.PageIndicator.setCallback(function(curr) {
		window.APINet.getDebugtalkList({}, curr, function(data) {
			var param = JSON.parse(data['data']['debugtalks']);
			//console.log(param)
			var count = data['data']['count'];
			var curr = data['data']['currPage'];

			var proInfo = data['data']['proInfo']

			for(var index = 0; index < param.length; index ++) {
				//处理project_id与project_name
				param[index]['project_name'] = proInfo[param[index]['belong_project']]
				param[index]['project_id']  = param[index]['belong_project']
			}

			showResult(param);
			//设置总条数
            window.PageIndicator.setCount(count);
			//设置当前显示第几页
			window.PageIndicator.setPage(curr);
		});
	});

	function showFirstPage() {
		
		window.APINet.getDebugtalkList({}, 1, function(data) {
			var param = JSON.parse(data['data']['debugtalks']);
			//console.log(param)
			var count = data['data']['count'];
			var curr = data['data']['currPage'];

			var proInfo = data['data']['proInfo']

			for(var index = 0; index < param.length; index ++) {
				//处理project_id与project_name
				param[index]['project_name'] = proInfo[param[index]['belong_project']]
				param[index]['project_id']  = param[index]['belong_project']
			}

			showResult(param);
			//设置总条数
            window.PageIndicator.setCount(count);
			//设置当前显示第几页
			window.PageIndicator.setPage(1);
		});
	}

	function showResult(param) {
		//清空表格节点
		$('#debugtalk_list_body').empty();
		for(var index = 0; index < param.length; index++) {
			$("#debugtalk_list_body").append(getDebugtalkElement(param[index], index));
		};
	}
	
	//生成html元素
	function getDebugtalkElement(param, index) {
		console.log(param);
		var project_name = param['project_name'];
		var project_id = param['project_id'];
		var update_time = param['update_time'];
		var create_time = param['create_time'];
		var id = param['id']

		var debugtalk_str = '<tr><td><input type="checkbox" id="slect_' + id + '"/></td><td>' + (id) + '</td>' +
			'<td >' + project_name + '</td>' + '<td><a href="/api/debugtalk/' + id + '">debugtalk.py</a></td>' + 
			'<td>' + create_time + '</td>' + 
			'<td>' + update_time + '</td>' +
			'</tr>';
		return debugtalk_str;
	}
	


}());