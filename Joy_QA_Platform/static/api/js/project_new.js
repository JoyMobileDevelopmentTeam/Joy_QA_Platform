;
(function() {

	var ids = ["project_name", "responsible_name", "test_user", "dev_user", "publish_app", "simple_desc", "other_desc"];
	
	$("#project_name").blur(function(){
		//项目名称失去焦点时，填入简要描述和其他信息中
		if($("#simple_desc").val().trim() == ""){
			$("#simple_desc").val($(this).val());
		}
		if($("#other_desc").val().trim() == ""){
			$("#other_desc").val($(this).val());
		}
	});

	//点击创建项目
	$('#send').click(function() {
		createProject(function(data) {
			var result = parseInt(data['result']);
			window.utils.tips(data['msg'],function(){
				if(result == 1){
					window.pageRouter.toProjectList();
				}else{
					console.log(data);
				}
			});
		});
	});

	$('#add_module').click(function() {
		createProject(function(data) {
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

	function createProject(callback) {
		if(!window.utils.checkInput(ids,setError)){
			return;
		}

		var jsonstr = $('#add_project').serializeJSON();
		window.APINet.createProject(JSON.stringify(jsonstr),function(data){
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