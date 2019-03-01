;
(function() {

	//caseinfo  变量  request  验证结果
	var ids = ["case_name", "project_name", "module_name", "dev_name"];

	window.utils.setListener(ids, setNormal);
	
	//各个参数均添加默认一栏
	add_row('variables');
	add_params('params');
	add_row('hooks');
	add_row('data');
	add_row('header');
	add_row('extract');
	add_row('validate');
	
	//设置各表格监听及删除按钮的点击实现
	initTablesListener();

	//点击创建项目
	$('#send').click(function() {
		case_ajax(true);
	});

	//点击新增用例
	$('#add_case').click(function() {
		case_ajax(false);
	});
	
	//设置文件选择控件样式
	$('#file').filestyle({buttonName:"btn-primary"});
	
	//选择配置文件，进行上传
	$('#upload_case').click(function(){
		if($('#case_file')[0].files[0] == undefined){
			window.utils.tips('请选择用例配置文件！');
			return;
		}
		var formData = new FormData();
		formData.append('file',$('#case_file')[0].files[0]);
		$.ajax({
			type:"post",
			url:"/api/case_upload/",
			async:true,
			cache:false,
			processData:false,
			contentType:false,
			data: formData,
			success:function(data){
				if(data['code'] == 1){
					fillDataWithCSV(data);	
				}else{
					window.utils.tips(data['msg']);
				}
			},
			error: function(){
				window.utils.tips('上传文件出错！');
			}
		});
	});

	//选择的项目变化
	$('#project_name').change(function() {
		var id = parseInt($(this).val());
		//清空模块、配置
		clearSelect('module_name');
		clearSelect('config_name');
		clearSelect('case_select');
		if(id != -1) {
			//拉取相应项目下的模块
			window.APINet.searchModule({
				project_id: id
			}, function(data) {
				var result = parseInt(data['result']);
				if(result == 1) {
					//添加获取的模块到select中
					addModules(JSON.parse(data['data']['modules']));
				} else {
					window.utils.tips('获取模块列表失败');
				}
			});
			
			//拉取该项目下的用例
			window.APINet.searchCaseWithId({
				project_id: id
			},function(data){
				var result = data['result'];
				if(result == 1){
					addCases(JSON.parse(data['data']['cases']))
				}else{
					window.utils.tips('拉取用例列表失败！请刷新重试！');
				}
			});
		}
	});
	
	setSignature();

	//选择的模块变化
//	$('#module_name').change(function() {
//		var project_id = parseInt($('#project_name').val());
//		var module_id = parseInt($('#module_name').val());
//		var obj = document.getElementById("module_name");
//		var index = obj.selectedIndex;
//		var module_name = obj.options[index].text
//		if(module_id == -1) {
//			//清空配置
//			clearSelect('config_name');
//			clearSelect('case_select');
//		} else {
//			//拉取相应项目下的用例
//			//TODO 这里显示的只有10条 在数据多的情况下如何处理？
//			window.APINet.searchCase({
//				index: 1,
//				module_name: module_name
//			}, function(data) {
//				var result = parseInt(data['result']);
//				if(result == 1) {
//					//添加获取的模块到select中
//					// addModules(JSON.parse(data['data']['modules']));
//					addCases(JSON.parse(data['data']['cases']))
//				} else {
//					window.utils.tips(data['msg']);
//				}
//			});
//			//获取配置
//			//TODO 获取配置并填充
//			window.APINet.searchConfig({
//				index: 1,
//				module_name: module_name
//			}, function(data) {
//				alert(data);
//			});
//
//		}
//	});

	$('#case_select').change(function() {
		var case_id = parseInt($(this).val());
		if(case_id == -1) {
			return;
		}
		//获取对应id的配置
		window.APINet.getCase({
			id: case_id
		}, function(data) {
//			console.log(data);
			var params = data['data'];
			var result = parseInt(data['result']);
			if(result == 1) {
				//填充数据到编辑框中
				fillingData(params);
			} else {
				window.utils.tips('获取用例信息失败,可重复切换用例尝试.');
			}
		});
	});

	$('#DataType').change(function() {
		var dataType = $(this).val();
		showDataOrJson(dataType);
	});

	//填充数据
	function fillingData(data) {
		//清空所有表格，再进行数据的添加
		clearForms();

		var testCase = data['cases'];
		if(testCase.length > 0) {
			testCase = testCase[0];
		} else {
			window.utils.tips("获取用例信息失败，数据为空！");
			return;
		}

		filling(testCase);
	}

	function projectChanged(module_id) {
		var id = parseInt($('#project_name').val());
		if(id == -1) {
			//清空模块、配置
			clearSelect('module_name');
			clearSelect('config_name');
		} else {
			//拉取相应项目下的模块
			window.APINet.searchModule({
				project_id: id
			}, function(data) {
				var result = parseInt(data['result']);
				if(result == 1) {
					//添加获取的模块到select中
					addModules(JSON.parse(data['data']['modules']));
					$('#module_name').val(module_id);
				} else {
					window.utils.tips('获取模块列表失败');
				}
			});
		}
	}

	function case_ajax(isToList) {
		if(!window.utils.checkInput(ids,setError)){
			return;
		}

		var url = $("#url").serializeJSON();
		var method = $("#method").serializeJSON();
		var dataType = $("#DataType").serializeJSON();
		var caseInfo = $("#form_message").serializeJSON();
		var variables = $("#form_variables").serializeJSON();
		var request_data = null;
		if(dataType.DataType === 'json') {
			try {
				request_data = JSON.parse($('#json_input').val());
			} catch(err) {
				window.utils.tips('Json格式输入有误！');
				return
			}
		} else {
			request_data = $("#form_request_data").serializeJSON();
		}

		var headers = $("#form_request_headers").serializeJSON();
		var extract = $("#form_extract").serializeJSON();
		var validate = $("#form_validate").serializeJSON();
		var parameters = $('#form_params').serializeJSON();
		var hooks = $('#form_hooks').serializeJSON();
		var include = [];
		var i = 0;
		$("ul#sortable li a").each(function() {
			include[i++] = [$(this).attr('id'), $(this).text()];
		});
		caseInfo['include'] = include;

		var content = {
			name: caseInfo['case_name'],
			author: caseInfo['dev_name'],
			belong_module: caseInfo['module_id'],
			include: caseInfo['include'],
			case_info: caseInfo,
			variables: variables,
			parameters: parameters,
			hooks: hooks,
			url: url.url,
			method: method.method,
			dataType: dataType.DataType,
			request_data: request_data,
			headers: headers,
			extract: extract,
			validate: validate
		};
		
		//处理参与签名、基础测试未选中
		temp = content.request_data['content'];
		for(var index in temp){
			if(temp[index].hasOwnProperty('sign') == false){
				temp[index]['sign'] = 0;
			}
			if(temp[index].hasOwnProperty('basic') == false){
				temp[index]['basic'] = 0;
			}
		}

		//		console.log(JSON.stringify(content));
		window.APINet.addCase(JSON.stringify(content),function(data){
			var result = parseInt(data['result']);
			if(result == 1) {
				window.utils.tips(data['msg'], function() {
					if(isToList) {
						window.pageRouter.toCaseList();
					} else {
						window.pageRouter.toAddCase();
					}
				});
			} else {
				window.utils.tips(data['msg']);
			}
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

	//清空选择列表
	function clearSelect(id) {
		$('#' + id).empty();
		$('#' + id).append('<option value="-1">请选择</option>');
	}

	//添加模块到select
	function addModules(modules) {
		for(var index = 0; index < modules.length; index++) {
			var module = modules[index];
			$('#module_name').append('<option value="' + module['id'] + '">' + module['module_name'] + '</option>');
		}
	}

	//添加case到select
	function addCases(cases) {
		for(var index = 0; index < cases.length; index++) {
			var data = cases[index];
			$('#case_select').append('<option value="' + data['id'] + '">' + data['name'] + '</option>');
		}
	}

	$('#case_select').on('change', function() {
		if($('#case_select').val() !== '-1') {
			var case_id = $('#case_select').val();
			var case_name = $('#case_select option:selected').text();
			var href = "<li id=" + case_id + "><a href='/api/edit_case/" + case_id + "/' id = " + case_id + ">" + case_name + "" +
				"</a><i class=\"js-remove\" onclick=remove_self('#" + case_id + "')>✖</i></li>";
			$("#sortable").append(href);
		}
	});

	$(function() {
		$("#sortable").sortable();
		$("#sortable").disableSelection();
	});
	
	//通过上传csv文件进行用例填充
	function fillDataWithCSV(data){
//		console.log(data);
		var code = data['code'];
		var caseObj = data['data']['case'];
		var caseInfo = caseObj['caseInfo'];
//		console.log(caseObj);
		if(code == 1){
			//开始填充数据
			$('#case_name').val(caseInfo['casename']);
			$('#url').val(caseInfo['url']);
			$('#method').val(caseInfo['method']);
			add_row_with_obj('data',buildData('data',caseObj['requestInfo']));
			add_row_with_obj('extract',buildData('extract',caseObj['extractInfo']));
			add_row_with_obj('header',buildData('extract',caseObj['headersInfo']));
			paramInfo = buildData('params',caseObj['parameterInfo']);
			for(var index in paramInfo){
				add_params('params',paramInfo[index]);
			}
			add_row_with_obj('variables',buildData('variables',caseObj['variablesInfo']));
			//处理hooks内容
			hooks = {"setup_hooks":caseObj['setup_hooksInfo'],"teardown_hooks":caseObj['teardown_hooksInfo']}
			hooks = buildData('hooks',hooks);
			for(var item in hooks){
				add_row('hooks',hooks[item]);
			}
			//处理validate内容
			add_row_with_obj('validate',buildData('validate',caseObj['validateInfo']));
		}else{
			window.utils.tips(data['msg']);	
		}
	}
	
	//拼接数据，使用addrow添加内容
	function buildData(id,data){
		result = [];
		if(id == 'data'){
			for(var index = 0;index<data['key'].length;index++){
				result.push({"key":data['key'][index],"value":data['value'][index],"type":data['type'][index].toLowerCase()});
			}
		}
		if(id == 'extract' || id == 'header' || id == 'variables'){
			for(var key in data){
				result.push({"key":key,"value":data[key]});
			}
		}
		if(id =='params'){
			for(var key in data){
				var content = '[';
				if(key.indexOf('-') == -1){
					//不包含多参数
					for(var item in data[key]){
						content = content + '"' + data[key][item]+'",'
					}
				}else{
					//包含多个参数，拼接value
					for(var index in data[key]){
						content = content + JSON.stringify(data[key][index]) +','
					}
				}
				content  = content.substring(0,content.length-1) + ']';
				result.push({"key":key,"value":content});
			}
		}
		if(id == 'hooks'){
			for(var index=0;index<data['setup_hooks'].length;index++){
				result.push({'setup_hooks':data['setup_hooks'][index],"teardown_hooks":data['teardown_hooks'][index]});
			}
		}
		if(id == 'validate'){
			for(var key in data){
				result.push({"check":key,"comparator":"eq","type":"int","expect":data[key]})
			}
		}
		return result;
	}

}());