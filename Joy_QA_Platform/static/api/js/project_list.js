;
(function() {
	
	edit_project_id = null;
	
	var ids = ["edit_project_name", "edit_responsible_name", "edit_test_user", "edit_dev_user", "edit_publish_app", "edit_simple_desc", "edit_other_desc"];
	
	//首次进入展示第一页数据
	showFirstPage();
	
	//填充环境列表
	fillEnvList();
	
	window.utils.setListener(ids,setNormal);

	//设置回调方法(回调参数为需要显示的页数，根据此页数进行网络请求，展示相应数据)
	window.PageIndicator.setCallback(function(curr) {
		var projectName = $('#search_name').val().trim();
		var personName = $('#search_person').val().trim();
		if(projectName.length == 0 && personName.length == 0) {
			//没有搜索条件
			window.APINet.getProjectList({}, curr, function(data) {
			var param = JSON.parse(data['data']['projects']);
			var count = data['data']['count'];
			var curr = data['data']['currPage'];
			showResult(param);
			});
		}else{
			//有搜索条件的页数切换
			search(curr);
		}
	});
	
	//清空搜索条件
	$('#clear_btn').click(function(){
		$('#search_name').val('');
		$('#search_person').val('');
	});
	
	setConfirmCallback(function(base_url){
		project_ids = []
		if(edit_project_id == null){
			project_ids = getCheckBoxes('select_project');
		}else{
			project_ids.push(edit_project_id)
		}
		window.APINet.runProjects(
			{
				project_ids:project_ids,
				base_url:base_url
			},function(data){
				console.log(data)
				window.utils.tips(data['msg']);
			});
		$('#env_modal').modal('hide');
	});
	
	//多选运行点击事件处理
	$('#excute').click(function(){
		edit_project_id = null;
		check_val = getCheckBoxes('select_project');
		
		if(check_val == '') {
			window.utils.tips('请选择执行项目');
		} else {
			showEnvSelectModal();
		}
	});
	
	//全选事件处理
	$('#slect_all').change(function(event){
		if($(event.target).prop('checked') == true){
			$('tbody tr td input').prop('checked',true);
		}else{
			$('tbody tr td input').prop('checked',false)
		}
	});
	
	//各条目中『执行』『编辑』『删除』按钮的事件委托
	$(".table").on("click",".btn-execute",function(){
		var id = $(this).data('id');
		edit_project_id = id;
		showEnvSelectModal();
	});
	
	$(".table").on("click",".btn-edit",function(){
		var id = $(this).data("id");
		$('#edit_modal').modal('show');
		window.APINet.getProject({id:id},function(data){
			var result = parseInt(data['result']);
			if(result == 1){
				var project = JSON.parse(data['data']['projects'])[0];
				$('#edit_project_name').val(project['project_name']);
				$('#edit_responsible_name').val(project['responsible_name']);
				$('#edit_test_user').val(project['test_user']);
				$('#edit_dev_user').val(project['dev_user']);
				$('#edit_publish_app').val(project['publish_app']);
				$('#edit_simple_desc').val(project['simple_desc']);
				$('#edit_other_desc').val(project['other_desc']);
				$('#edit_project_id').val(project['id']);
			}
		});
	});
	
	$(".table").on("click",".btn-delete",function(){
		var id = $(this).data("id");
		window.utils.deleteConfirm('若删除项目，该项目下所有模块及测试用例将会被删除！确认要删除此项目吗？',function(index){
			window.APINet.deleteProject({id:id},function(data){
				var result = data['result'];
				var msg = data['msg'];
				if(parseInt(result) == 1){
					showFirstPage();
				}
				console.log(data);
				window.utils.tips(msg);
			});
		});
	});
		
	$('#submit_modify').click(function(){
		if(!window.utils.checkInput(ids,setError)){
			return;
		}
		
		var project_name = $('#edit_project_name').val();
		var responsible_name = $('#edit_responsible_name').val();
		var test_user = $('#edit_test_user').val();
		var dev_user = $('#edit_dev_user').val();
		var publish_app = $('#edit_publish_app').val();
		var simple_desc = $('#edit_simple_desc').val();
		var other_desc = $('#edit_other_desc').val();
		var id = $('#edit_project_id').val();
		
		window.APINet.updateProject({
			id: id,
			project_name: project_name,
			responsible_name: responsible_name,
			test_user: test_user,
			dev_user: dev_user,
			publish_app: publish_app,
			simple_desc: simple_desc,
			other_desc: other_desc
		}, function(data) {
			var result = parseInt(data['result']);
			if(result == 1){
				showFirstPage();
				$('#edit_modal').modal('hide');
			}
			window.utils.tips(data['msg']);
		});
	});

	function showFirstPage() {
		//获取第一页数据进行展示
		window.APINet.getProjectList({}, 1, function(data) {
			var param = JSON.parse(data['data']['projects']);
			var count = data['data']['count'];
			var curr = data['data']['currPage'];

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
		$('#project_list_body').empty();
		for(var index = 0; index < param.length; index++) {
			$("#project_list_body").append(getProjectElement(param[index], index));
		};
	}
	
	//生成html元素
	function getProjectElement(param, index) {
		var projectName = param['project_name'];
		var projectPrincipal = param['responsible_name'];
		var projectQA = param['test_user'];
		var createTime = param['create_time'];
		var id = param['id']

		var projectStr = '<tr><td><input type="checkbox" name="select_project" id="' + id + '"/></td><td>' + (id) + '</td>' +
			'<td>' + projectName + '</td>' + '<td>' + projectPrincipal + '</td>' + '<td>' + projectQA + '</td>' +
			'<td>' + createTime + '</td>' + getOperationEle(id) + '</tr>';
		return projectStr;
	}
	
	//获取操作相关元素
	function getOperationEle(id){
		var result = '<td>'+
						'<div class="btn-group-xs bt-group-class" role="group">'+
//							'<button type="button" data-id="'+id+'" class="btn btn-primary btn-execute">运行</button>'+
							'<button type="button" data-id="'+id+'" class="btn btn-info btn-edit btn-primary" data-toggle="modal">编辑</button>'+
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

	//『新增项目』按钮点击事件
	$("#add_project").click(function() {
		window.pageRouter.toAddProject();
	});

	//『搜索』按钮点击事件
	$('#search_btn').click(function() {
		var projectName = $('#search_name').val().trim();
		var personName = $('#search_person').val().trim();
		if(projectName.length == 0 && personName.length == 0) {
			//没有搜索条件
			showFirstPage();
		} else {
			//点击搜索则获取指定条件下的前10条记录
			search(1);
		}
	});

	//搜索项目方法
	function search(index) {
		var projectName = $('#search_name').val().trim();
		var personName = $('#search_person').val().trim();
		window.APINet.searchProject({
			project_name: projectName,
			person_name: personName,
			index: index
		}, function(data) {
			var param = JSON.parse(data['data']['projects']);
			var count = data['data']['count'];
			var curr = data['data']['currPage'];
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
}());