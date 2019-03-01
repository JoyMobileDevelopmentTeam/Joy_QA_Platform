;
(function() {

	var edit_env_id = null;

	var add_ids = ['env_name', 'host_port', 'desc'];
	var ids = ["edit_env_name", "edit_host_port", "edit_desc"];

	showFirstPage();

	window.utils.setListener(ids, setNormal);
	window.utils.setListener(add_ids, setNormal);
	
	//设置回调方法(回调参数为需要显示的页数，根据此页数进行网络请求，展示相应数据)
	window.PageIndicator.setCallback(function(curr) {
		window.APINet.getEnvList({}, curr, function(data) {
			var param = JSON.parse(data['data']['envs']);
			var count = data['data']['count'];
			var curr = data['data']['currPage'];
			var id_name = data['data']['id_to_name'];

			showResult(param,id_name);

			//设置总页数
			window.PageIndicator.setCount(count);
			//设置当前显示第几页
			window.PageIndicator.setPage(curr);
		});
	});

	//删除此条
	$(".table").on("click", ".btn-delete", function() {
		var id = $(this).data("id");

		window.utils.deleteConfirm('确认要删除此环境吗？', function(index) {

			const test = {
				"id": id
			};

			window.APINet.deleteEnv(JSON.stringify(test), function(data) {
				var result = parseInt(data['result']);
				window.utils.tips(data['msg']);

				if(result == 1) {
					showFirstPage();
				}
			});
		});
	});

	//添加环境
	$('#add_env_button').on('click', function() {
		$('#env_name').val('');
		$('#host_port').val('');
		$('#desc').val('');
		$('#add_env_model').modal({
			onConfirm: function() {
			},
			onCancel: function() {}
		});
		//获取项目列表供环境选择
		window.APINet.getProjectList({},-1,function(data){
			$("#choose_project_add").empty();
			$("#choose_project_add").append('<option value="-1">请选择</option>');
			if(data['result'] == 1){
				data = data['data'];
				projects = JSON.parse(data['projects']);
				for(index in projects){
					$("#choose_project_add").append('<option value="' + projects[index]['id'] + '">' + projects[index]['project_name'] + '</option>');
				}
			}else{
				window.utils.tips(data['msg']);	
			}
		});
	});

	//编辑按钮事件
	$(".table").on("click", ".btn-edit", function() {
		var id = $(this).data('id');
		edit_env_id = id;

		const test = {
			id: id
		};

		//拉取对应用例数据进行填充
		window.APINet.getEnv(JSON.stringify(test),function(data){
			var result = parseInt(data['result']);

			if(result) {
				var params = data['data'];
				fillingData(params);
				$('#edit_modal').modal('show');
			} else {
				window.utils.tips('获取用例信息失败');
			}
		});
	});

	//填充数据
	function fillingData(data) {
		var envs = JSON.parse(data['envs']);
		console.log(envs);
		if(envs.length > 0) {
			env = envs[0];
		}

		$('#edit_env_name').val(env['env_name']);
		$('#edit_host_port').val(env["host_port"]);
		$('#edit_desc').val(env["desc"]);
		//获取项目列表供环境选择
		window.APINet.getProjectList({},-1,function(data){
			$("#choose_project_edit").empty();
//			$("#choose_project_edit").append('<option value="-1">请选择</option>');
			if(data['result'] == 1){
				data = data['data'];
				projects = JSON.parse(data['projects']);
				for(index in projects){
					$("#choose_project_edit").append('<option value="' + projects[index]['id'] + '">' + projects[index]['project_name'] + '</option>');
				}
				$('#choose_project_edit').val(env["belong_project"]);
			}else{
				window.utils.tips(data['msg']);	
			}
		});
	}

	//提交修改
	$('#submit_change').click(function() {
		if(!window.utils.checkInput(ids, setError)) {
			return;
		}

		var id = edit_env_id;
		var env_name = $('#edit_env_name').val();
		var host_port = $('#edit_host_port').val();
		var desc = $('#edit_desc').val();
		var project_id = $("#choose_project_edit").val();

		const test = {
			"id": id,
			"env_name": env_name,
			"host_port": host_port,
			"desc": desc,
			"belong_project": project_id,
		};

		window.APINet.updateEnv(JSON.stringify(test),function(data){
			var result = parseInt(data['code']);
			if(result) {
				window.utils.tips('修改环境成功！');
				$('#edit_modal').modal('hide');
				showFirstPage();
			} else {
				window.utils.tips('修改环境失败');
			}
		});
	});

	//增加环境
	$('#submit_modify').click(function() {
		if(!window.utils.checkInput(add_ids, setError)) {
			return;
		}

		var env_name = $('#env_name').val();
		var host_port = $('#host_port').val();
		var desc = $('#desc').val();
		var project_id = $("#choose_project_add").val();

		window.APINet.addEnv({
			env_name: env_name,
			host_port: host_port,
			desc: desc,
			belong_project: project_id,
		}, function(data) {
			var result = parseInt(data['result']);
			if(result == 1) {
				$('#add_env_model').modal('hide');
				showFirstPage();
			}
			window.utils.tips(data['msg']);
		});
	});

	//显示
	function showFirstPage() {
		//获取第一页数据进行展示
		window.APINet.getEnvList({}, 1, function(data) {
			var param = JSON.parse(data['data']['envs']);
			var count = data['data']['count'];
			var curr = data['data']['currPage'];
			var id_name = data['data']['id_to_name'];
			console.log(id_name);

			showResult(param,id_name);

			//设置总页数
			window.PageIndicator.setCount(count);
			//设置当前显示第几页
			window.PageIndicator.setPage(1);
		});
	}

	//根据参数展示数据
	function showResult(param,id_name) {
		//清空表格节点
		$('#config_list_body').empty();
		for(var index = 0; index < param.length; index++) {
			$("#config_list_body").append(getEnvElement(param[index], index,id_name));
		};
	}

	//生成html元素
	function getEnvElement(param, index,id_name) {
		var id = param['id']
		var envName = param['env_name'];
		var host_port = param['host_port'];
		var desc = param['desc'];
		var createTime = param['create_time'];
		var belong_project = param['belong_project'];

		var projectStr = '<tr><td><input type="checkbox" id="slect_' + id + '"/></td><td>' + (id) + '</td>' +
			'<td>' + envName + '</td>' + '<td>' + id_name[belong_project] + '</td>' + '<td>' + host_port + '</td>' + '<td>' + desc + '</td>' +
			'<td>' + createTime + '</td>' + getOperationEle(id) + '</tr>';
		return projectStr;
	}

	//获取操作相关元素
	function getOperationEle(id) {
		var result = '<td>' +
			'<div class="btn-group-xs bt-group-class" role="group">' +
			'<button type="button" data-id="' + id + '" class="btn btn-info btn-edit btn-primary" data-toggle="modal">编辑</button>' +
			'<button type="button" data-id="' + id + '" class="btn btn-danger btn-delete">删除</button>' +
			'</div>' +
			'</td>';
		return result;
	}

	//设置输入框为正常状态
	function setNormal(id) {
		$('#' + id).parent().parent().removeClass('has-error');
	}

	//设置输入框为有错误状态
	function setError(id) {
		$('#' + id).parent().parent().addClass('has-error');
	}

}());