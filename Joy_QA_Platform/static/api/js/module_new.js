;
(function() {

	var ids = ["module_name", "project_name", "test_user", "simple_desc", "other_desc"];
	
	$("#module_name").blur(function(){
		//项目名称失去焦点时，填入简要描述和其他信息中
		if($("#simple_desc").val().trim() == ""){
			$("#simple_desc").val($(this).val());
		}
		if($("#other_desc").val().trim() == ""){
			$("#other_desc").val($(this).val());
		}
	});

	$('#send').click(function() {
		createModule(function(data) {
			var result = parseInt(data['result']);
			window.utils.tips(data['msg'],function(){
				if(result == 1){
					window.pageRouter.toModuleList();
				}else{
					console.log(data);
				}
			});
		});
	});

	$('#add_new').click(function() {
		createModule(function(data) {
			var result = parseInt(data['result']);
			window.utils.tips(data['msg'],function(){
				if(result == 1) {
					window.pageRouter.toAddModule();
				}else{
					console.log(data);
				}
			});
		});
	});

	window.utils.setListener(ids,setNormal);

	window.APINet.getProjectList({}, -1, function(data) {
		var result = data['result'];
		if(parseInt(result) == 1) {
			//获取项目列表成功
			var projects = JSON.parse(data['data']['projects']);
			for(var index = 0; index < projects.length; index++) {
				var project = projects[index]
				$("#project_name").append('<option value="' + project['id'] + '">' + project['project_name'] + '</option>');
			}
		}
	});

	function createModule(callback) {
		if(!window.utils.checkInput(ids,setError)){
			return;
		}

		var module_name = $('#module_name').val();
		var project_id = $('#project_name').val();
		var test_user = $('#test_user').val();
		var simple_desc = $('#simple_desc').val();
		var other_desc = $('#other_desc').val();

		window.APINet.createModule({
			module_name: module_name,
			belong_project: project_id,
			test_user: test_user,
			simple_desc: simple_desc,
			other_desc: other_desc
		}, function(data) {
			callback(data);
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