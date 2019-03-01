;
(function() {

	//首次进入展示第一页数据
	showFirstPage();

	//设置回调方法(回调参数为需要显示的页数，根据此页数进行网络请求，展示相应数据)
	window.PageIndicator.setCallback(function(curr) {
		var configName = $('#search_name').val().trim();
		var personName = $('#search_person').val().trim();
		if(configName.length == 0 && personName.length == 0) {
			//没有搜索条件
			window.APINet.getconfigList({}, curr, function(data) {
			var param = JSON.parse(data['data']['configs']);
			var count = data['data']['count'];
			var curr = data['data']['currPage'];
			showResult(param);
			});
		}else{
			//有搜索条件的页数切换
			search(curr);
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
		console.log($(this).data("id")+'执行');
	});
	$(".table").on("click", ".btn-edit", function() {
		var id = $(this).data("id");
		window.APINet.getConfig({id:id},function(data){
			//获取对应模块信息成功
			var result = parseInt(data['result']);
			if(result == 1){
				$('#edit_modal').modal('show');
				var config = JSON.parse(data['data']['configs'])[0];
				$('#config_name').val(config['config_name']);
				$('#project_name').val(config['belong_project']);
				$('#module_name').val(config['belong_module']);
				$('#creator').val(config['creator']);
				$('#form_variables').val(config["form_variables"]);
				$('#form_params').val(config["form_params"]);
				$('#form_hooks').val(config["form_hooks"]);
				$('#form_request_data').val(config["form_request_data"]);
				$('#form_request_headers').val(config["form_request_headers"]);
				$('#form_extract').val(config["form_extract"]);
				$('#form_validate').val(config["form_validate"]);
				$('#edit_config_id').val(id);
				//获取项目列表
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

			    //获取Module列表
			    window.APINet.getModuleList({}, -1, function(data) {
			        var result = data['result'];
			        if(parseInt(result) == 1) {
			            //获取项目列表成功
			            var modules = JSON.parse(data['data']['modules']);
			            for(var index = 0; index < modules.length; index++) {
			                var cur_module = modules[index]
			                $("#module_name").append('<option value="' + cur_module['id'] + '">' + cur_module['module_name'] + '</option>');
			            }
			        }
			    });
			} else {
				console.log(data['msg']);
				window.utils.tips('获取模块信息失败!');
			}
		});
	});

	$(".table").on("click", ".btn-delete", function() {
		var id = $(this).data("id");
		window.utils.deleteConfirm('确认要删除此配置？',function(index){

			const test = {
				"id": id
        	};
			$.ajax({
            type: 'POST',
            url: "/api/delete_config/",
            data: JSON.stringify(test),
            contentType: "application/json",
            success: function (data) {
                var result = parseInt(data['result']);
                alert(data['msg'])
                
                if (result) {
                	showFirstPage();
                }
            },
            error: function () {
                alert('服务器异常');
            }
        	});
		});
	});

	//编辑修改
	$('#submit_modify').click(function(){
		// if(!window.utils.checkInput(ids,setError)){
		// 	return;
		// }
        
        var config_name  = $('#config_name').val();
        var project_id = $('#project_name').val();
        var module_id = $('#module_name').val();
        var creator    = $('#creator').val();
        var form_variables = JSON.stringify($("#form_variables").serializeJSON());
        var form_params = JSON.stringify($("#form_params").serializeJSON());
        var form_hooks = JSON.stringify($("#form_hooks").serializeJSON());
        var form_request_data = JSON.stringify($("#form_request_data").serializeJSON());
        var form_request_headers = JSON.stringify($("#form_request_headers").serializeJSON());
        var form_extract = JSON.stringify($("#form_extract").serializeJSON());
        var form_validate = JSON.stringify($("#form_validate").serializeJSON());
        var id = $('#edit_config_id').val();


        window.APINet.updateConfig({
        	id: id,
            config_name: config_name,
            project_name: project_id,
            module_name: module_id,
            creator: creator,
            form_variables: form_variables,
            form_params: form_params,
            form_hooks: form_hooks,
            form_request_data: form_request_data,
            form_request_headers: form_request_headers,
            form_extract: form_extract,
            form_validate: form_validate
        },function(data){
            if(data['code'] == 1) {
                location.href = '/api/config_list'
            }
        });
	});

	function showFirstPage() {
		//获取第一页数据进行展示
		window.APINet.getConfigList({}, 1, function(data) {
			var param = JSON.parse(data['data']['configs']);
			var count = data['data']['count'];
			var curr = data['data']['currPage'];
			var proInfo = data['data']['proInfo'];
			var moduleInfo = data['data']['moduleInfo'];

			for(var index = 0; index < param.length; index++) {
					//处理project_id与project_name
					console.log(param)
					param[index]['project_name'] = proInfo[param[index]['belong_project']]
					param[index]['module_name'] = moduleInfo[param[index]['belong_module']]
			}
			showResult(param);

			//设置总页数
			window.PageIndicator.setPageNum(getPageNum(count));
			//设置当前显示第几页
			window.PageIndicator.setPage(1);
		});
	}

	//根据参数展示数据
	function showResult(param) {
		//清空表格节点
		$('#config_list_body').empty();
		for(var index = 0; index < param.length; index++) {
			$("#config_list_body").append(getconfigElement(param[index], index));
		};
	}
	
	//根据数据条数，计算页面页数
	function getPageNum(count){
		if(count%10 == 0){
			return parseInt(count / 10)
		}else{
			return parseInt(count / 10)+1
		}
	}
	
	//生成html元素
	function getconfigElement(param, index) {
		var configName = param['config_name'];
		var belongProject = param['project_name'];
		var belongModule = param['module_name'];
		var creator = param['creator'];
		var createTime = param['create_time'];
		var id = param['id']

		var configStr = '<tr><td><input type="checkbox" id="slect_' + id + '"/></td><td>' + (id) + '</td>' +
			'<td>' + configName + '</td>' + '<td>' + belongProject + '</td>' + '<td>' + belongModule + '</td>' +
			'<td>' + creator + '</td>' + '<td>' + createTime + getOperationEle(id) + '</tr>';
		return configStr;
	}
	
	//获取操作相关元素
	function getOperationEle(id){
		var result = '<td>'+
						'<div class="btn-group-xs bt-group-class" role="group">'+
							'<button type="button" data-id="'+id+'" class="btn btn-info btn-edit">编辑</button>'+
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
	$("#add_config").click(function() {
		window.pageRouter.toAddConfig();
	});

	//『搜索』按钮点击事件
	$('#search_btn').click(function() {
		var configName = $('#search_name').val().trim();
		var projectName = $('#search_project').val().trim();
		var moduleName = $('#search_module').val().trim();
		var creatorName = $('#search_creator').val().trim();
		if(configName.length == 0 && projectName.length == 0 && moduleName.length == 0 && creatorName.length == 0) {
			//没有搜索条件
			showFirstPage();
		} else {
			//点击搜索则获取指定条件下的前10条记录
			search(1);
		}
	});

	//搜索项目方法
	function search(index) {
		var configName = $('#search_name').val().trim();
		var projectName = $('#search_project').val().trim();
		var moduleName = $('#search_module').val().trim();
		var creatorName = $('#search_creator').val().trim();
		window.APINet.searchConfig({
			config_name: configName,
			project_name:projectName,
			module_name:moduleName,
			creator: creatorName,
			index: index
		}, function(data) {
			var param = JSON.parse(data['data']['configs']);
			var count = data['data']['count'];
			var curr = data['data']['currPage'];
//			console.log(data);
			
			showResult(param);
			
			//设置总页数
			window.PageIndicator.setPageNum(getPageNum(count));
			//设置当前显示第几页
			window.PageIndicator.setPage(curr);
		});
	}

}());