/*动态改变模块信息*/
function show_module(module_info, id) {
	module_info = module_info.split('replaceFlag');
	var a = $(id);
	a.empty();
	for(var i = 0; i < module_info.length; i++) {
		if(module_info[i] !== "") {
			var value = module_info[i].split('^=');
			a.prepend("<option value='" + value[0] + "' >" + value[1] + "</option>")
		}
	}
	a.prepend("<option value='请选择' selected>请选择</option>");

}

function show_case(case_info, id) {
	case_info = case_info.split('replaceFlag');
	var a = $(id);
	a.empty();
	for(var i = 0; i < case_info.length; i++) {
		if(case_info[i] !== "") {
			var value = case_info[i].split('^=');
			a.prepend("<option value='" + value[0] + "' >" + value[1] + "</option>")
		}
	}
	a.prepend("<option value='请选择' selected>请选择</option>");

}

/*表单信息异步传输*/
function info_ajax(id, url) {
	var data = $(id).serializeJSON();
	if(id === '#add_task') {
		var include = [];
		var i = 0;
		$("ul#pre_case li a").each(function() {
			include[i++] = [$(this).attr('id'), $(this).text()];
		});
		data['module'] = include;
	}

	$.ajax({
		type: 'post',
		url: url,
		data: JSON.stringify(data),
		contentType: "application/json",
		success: function(data) {
			if(data !== 'ok') {
				if(data.indexOf('/api/') !== -1) {
					window.location.href = data;
				} else {
					myAlert(data);
				}
			} else {
				window.location.reload();
			}
		},
		error: function() {
			myAlert('服务器异常');
		}
	});

}

function auto_load(id, url, target, type) {
	var data = $(id).serializeJSON();
	if(id === '#form_message') {
		data = {
			"test": {
				"name": data,
				"type": type
			}
		}
	} else if(id === '#form_config') {
		data = {
			"config": {
				"name": data,
				"type": type
			}
		}
	} else {
		data = {
			"task": {
				"name": data,
			}
		}
	}
	$.ajax({
		type: 'post',
		url: url,
		data: JSON.stringify(data),
		contentType: "application/json",
		success: function(data) {
			if(type === 'module') {
				show_module(data, target)
			} else {
				show_case(data, target)
			}
		},
		error: function() {
			myAlert('服务器异常');
		}
	});

}

function update_data_ajax(id, url) {
	var data = $(id).serializeJSON();
	$.ajax({
		type: 'post',
		url: url,
		data: JSON.stringify(data),
		contentType: "application/json",
		success: function(data) {
			if(data !== 'ok') {
				myAlert(data);
			} else {
				window.location.reload();
			}
		},
		error: function() {
			myAlert('服务器异常');
		}
	});
}

function del_data_ajax(id, url) {
	var data = {
		"id": id,
		'mode': 'del'
	};
	$.ajax({
		type: 'post',
		url: url,
		data: JSON.stringify(data),
		contentType: "application/json",
		success: function(data) {
			if(data !== 'ok') {
				myAlert(data);
			} else {
				window.location.reload();
			}
		},
		error: function() {
			myAlert('服务器异常');
		}
	});
}

function copy_data_ajax(id, url) {
	var data = {
		"data": $(id).serializeJSON(),
		'mode': 'copy'
	};
	$.ajax({
		type: 'post',
		url: url,
		data: JSON.stringify(data),
		contentType: "application/json",
		success: function(data) {
			if(data !== 'ok') {
				myAlert(data);
			} else {
				window.location.reload();
			}
		},
		error: function() {
			myAlert('服务器异常');
		}
	});
}

function config_ajax(type) {
	var dataType = $("#config_data_type").serializeJSON();
	var caseInfo = $("#form_config").serializeJSON();
	var variables = $("#config_variables").serializeJSON();
	var parameters = $('#config_params').serializeJSON();
	var hooks = $('#config_hooks').serializeJSON();
	var request_data = null;
	if(dataType.DataType === 'json') {
		try {
			request_data = eval('(' + $('#json-input').val() + ')');
		} catch(err) {
			myAlert('Json格式输入有误！')
			return
		}
	} else {
		request_data = $("#config_request_data").serializeJSON();
	}
	var headers = $("#config_request_headers").serializeJSON();

	const config = {
		"config": {
			"name": caseInfo,
			"variables": variables,
			"parameters": parameters,
			"request": {
				"headers": headers,
				"type": dataType.DataType,
				"request_data": request_data
			},
			"hooks": hooks,

		}
	};
	if(type === 'edit') {
		url = '/api/edit_config/';
	} else {
		url = '/api/add_config/';
	}
	$.ajax({
		type: 'post',
		url: url,
		data: JSON.stringify(config),
		contentType: "application/json",
		success: function(data) {
			if(data === 'session invalid') {
				window.location.href = "/api/login/";
			} else {
				if(data.indexOf('/api/') != -1) {
					window.location.href = data;
				} else {
					myAlert(data);
				}
			}
		},
		error: function() {
			myAlert('服务器异常');
		}
	});
}

/*提示 弹出*/
function myAlert(data) {
	$('#my-alert_print').text(data);
	$('#my-alert').modal({
		relatedTarget: this
	});
}

function post(url, params) {
	var temp = document.createElement("form");
	temp.action = url;
	temp.method = "post";
	temp.style.display = "none";
	for(var x in params) {
		var opt = document.createElement("input");
		opt.name = x;
		opt.value = params[x];
		temp.appendChild(opt);
	}
	document.body.appendChild(temp);
	temp.submit();
	return temp;
}

function del_row(id) {
	var attribute = id;
	var chkObj = document.getElementsByName(attribute);
	var tabObj = document.getElementById(id);
	for(var k = 0; k < chkObj.length; k++) {
		if(chkObj[k].checked) {
			tabObj.deleteRow(k + 1);
			k = -1;
		}
	}
}

function clear_rows(id) {
	var attribute = id;
	var tabObj = document.getElementById(id);
	var chkObj = document.getElementsByName(attribute);
	for(var k = 0; k < chkObj.length; k++) {
		tabObj.deleteRow(k + 1);
		k = -1;
	}
}

function add_row(id, params) {
//	console.log(params);
	var tabObj = document.getElementById(id); //获取添加数据的表格
	var rowsNum = tabObj.rows.length;  //获取当前行数
	var style = 'width:100%; border: none';
	var cell_check = "<input type='checkbox' name='" + id + "' style='width:55px' />";
	var cell_delete = '<button type="button" name="'+ id + '" data-id="' + id + '" class="btn btn-danger btn-xs btn-delete-row">删除</button>';
	var cell_key = "<input type='text' name='content[][key]'  value='' style='" + style + "' />";
	var cell_value = "<input type='text' name='content[][value]'  value='' style='" + style + "' />";
	var cell_type = "<select name='content[][type]' class='form-control' style='height: 25px; font-size: 15px; " +
		"padding-top: 0px; padding-left: 0px; border: none' id='" + id + "_type_" + rowsNum + "'> " +
		"<option value='string'>string</option><option value='int'>int</option><option value='float'>float</option><option value='boolean'>boolean</option></select>";
	var cell_comparator = "<select name='content[][comparator]' class='form-control' style='height: 25px; font-size: 15px; " +
		"padding-top: 0px; padding-left: 0px; border: none' id='" + id + "_comparator_" + rowsNum + "'> " +
		"<option value='eq'>equals</option> <option value='contains'>contains</option> <option value='startswith'>startswith</option> <option value='endswith'>endswith</option> <option value='regex_match'>regex_match</option> <option value='type_match'>type_match</option> <option value='contained_by'>contained_by</option> <option value='less_than'>less_than</option> <option value='less_than_or_equals'>less_than_or_equals</option> <option value='greater_than'>greater_than</option> <option value='greater_than_or_equals'>greater_than_or_equals</option> <option value='not_equals'>not_equals</option> <option value='string_equals'>string_equals</option> <option value='length_equals'>length_equals</option> <option value='length_greater_than'>length_greater_than</option> <option value='length_greater_than_or_equals'>length_greater_than_or_equals</option> <option value='length_less_than'>length_less_than</option> <option value='length_less_than_or_equals'>length_less_than_or_equals</option></select>";
	var cell_sign = "<input class='select-sign' type='checkbox' id='" + id + "_sign_" + rowsNum + "' data-id='"+rowsNum+"' style='width:55px' name='content[][sign]' value='1'/>";
	var cell_basic_test = "<input class='select-basic' type='checkbox' id='" + id + "_basic_" + rowsNum + "' data-id='"+rowsNum+"' style='width:55px' name='content[][basic]' value='1'/>";
	//处理需要填入数据的情况
	if(params != undefined) {
		var key = params['key'];
		var value = params['value'];
		if(id == 'data'){
			cell_key = "<input type='text' class='input-data' data-id='"+ rowsNum +"' name='content[][key]'  value='" + key + "' style='" + style + "' />";
			cell_value = "<input type='text' class='value-data' name='content[][value]' data-id='"+rowsNum+"' value='" + value + "' style='" + style + "' />";
		}else{
			cell_key = "<input type='text' name='content[][key]'  value='" + key + "' style='" + style + "' />";
			cell_value = "<input type='text' name='content[][value]'  value='" + value + "' style='" + style + "' />";
		}
	}else{
		if(id == 'data'){
			cell_key = "<input type='text' class='input-data' data-id='"+ rowsNum +"' name='content[][key]'  value='' style='" + style + "' />";
			cell_value = "<input type='text' class='value-data' name='content[][value]' data-id='"+rowsNum+"' value='' style='" + style + "' />";
		}
	}
	
	if(id == 'validate'){
		//validate键值不能为key和value,要进行修改
		if(params == undefined){
			var cell_key = "<input type='text' name='content[][check]'  value='' style='" + style + "' />";
			var cell_value = "<input type='text' name='content[][expect]'  value='' style='" + style + "' />";
		}else{
			var key = params['check'];
			var value = params['expect'];
			cell_key = "<input type='text' name='content[][check]'  value='" + key + "' style='" + style + "' />";
			cell_value = "<input type='text' name='content[][expect]'  value='" + value + "' style='" + style + "' />";
		}
	}
	
	if(id == 'hooks'){
		//hooks键值不能为key和value,要进行修改
		if(params == undefined){
			var cell_key = "<input type='text' name='content[][setup_hooks]'  value='' style='" + style + "' />";
			var cell_value = "<input type='text' name='content[][teardown_hooks]'  value='' style='" + style + "' />";
		}else{
			var key = params['setup_hooks'];
			var value = params['teardown_hooks'];
			cell_key = "<input type='text' name='content[][setup_hooks]'  value='" + key + "' style='" + style + "' />";
			cell_value = "<input type='text' name='content[][teardown_hooks]'  value='" + value + "' style='" + style + "' />";
		}
	}

	var myNewRow = tabObj.insertRow(rowsNum);
	var newTdObj0 = myNewRow.insertCell(0);
	var newTdObj1 = myNewRow.insertCell(1);
	var newTdObj2 = myNewRow.insertCell(2);

//	newTdObj0.innerHTML = cell_check
	newTdObj0.innerHTML = cell_delete;
	newTdObj1.innerHTML = cell_key;
	if(id === 'variables' || id === 'data') {
		var newTdObj3 = myNewRow.insertCell(3);
		newTdObj2.innerHTML = cell_type;
		newTdObj3.innerHTML = cell_value;
	} else if(id === 'validate') {
		var newTdObj3 = myNewRow.insertCell(3);
		newTdObj2.innerHTML = cell_comparator;
		newTdObj3.innerHTML = cell_type;
		var newTdObj4 = myNewRow.insertCell(4);
		newTdObj4.innerHTML = cell_value;
	} else {
		newTdObj2.innerHTML = cell_value;
	}
	
	//data类型数据,添加一个是否参与签名的选项
	if(id == 'data'){
		var newTdObj4 = myNewRow.insertCell(4);
		newTdObj4.innerHTML = cell_sign;
		var newTdObj5 = myNewRow.insertCell(5);
		newTdObj5.innerHTML = cell_basic_test;
	}

	//处理数据类型的选中
	if(params != undefined && params.hasOwnProperty('type')) {
		var type = params['type'];
		$('#' + id + '_type_' + rowsNum).val(type);
	}

	if(params != undefined && params.hasOwnProperty('comparator')) {
		var type = params['comparator'];
		$('#' + id + '_comparator_' + rowsNum).val(type);
	}
	
	//处理是否参与签名的选中
	if(params != undefined && params.hasOwnProperty('sign')){
		//填入是否参与签名
		var sign = params['sign'];
		$('#'+id+'_sign_'+rowsNum).prop('checked',sign==1?true:false);
	}
	
	//处理是否进行基础测试的选中
	if(params != undefined && params.hasOwnProperty('basic')){
		//填入是否参与签名
		var sign = params['basic'];
		$('#'+id+'_basic_'+rowsNum).prop('checked',sign==1?true:false);
	}
}

function add_params(id, params) {
	var tabObj = document.getElementById(id); //获取添加数据的表格
	var rowsNum = tabObj.rows.length;  //获取当前行数
	var style = 'width:100%; border: none';
//	var check = "<input type='checkbox' name='" + id + "' style='width:55px' />";
	var cell_delete = '<button type="button" name="'+id+'" data-id="' + id + '" class="btn btn-danger btn-xs btn-delete-row">删除</button>';
	var placeholder = '单个:["value1", "value2],  多个:[["name1", "pwd1"],["name2","pwd2"]]';
	var key = "<textarea  name='content[][key]'  placeholder='单个:key, 多个:key1-key2'  style='" + style + "' />";
	var value = "<textarea  name='content[][value]'  placeholder='" + placeholder + "' style='" + style + "' />";

	//处理需要填入数据的情况
	if(params != undefined) {
		var objKey = params['key'];
		key = "<textarea  name='content[][key]' placeholder='单个:key, 多个:key1-key2'  style='" + style + "' >" + objKey + "</textarea>";
		var str = params['value'];
		value = "<textarea  name='content[][value]'  placeholder='" + placeholder + "' style='" + style + "' >" + str + "</textarea>";
	}

	var myNewRow = tabObj.insertRow(rowsNum);
	var newTdObj0 = myNewRow.insertCell(0);
	var newTdObj1 = myNewRow.insertCell(1);
	var newTdObj2 = myNewRow.insertCell(2);
//	newTdObj0.innerHTML = check;
	newTdObj0.innerHTML = cell_delete;
	newTdObj1.innerHTML = key;
	newTdObj2.innerHTML = value;
}

function add_row_with_obj(id, obj) {
	for(var index in obj) {
		add_row(id, obj[index]);
	}
}

function filling(testCase) {
	var variables = JSON.parse(testCase['variables'])['content'];
	add_row_with_obj('variables', variables);

	var parameters = JSON.parse(testCase['parameters'])['content'];
	for(var index in parameters) {
		add_params('params', parameters[index]);
	}

	var hooks = JSON.parse(testCase['hooks'])['content'];
	add_row_with_obj('hooks', hooks);

	var url = testCase['url'];
	$('#url').val(url);

	var method = testCase['method'];
	$('#method').val(method);

	var dataType = testCase['dataType'];
	$('#DataType').val(dataType);

	var request_data = JSON.parse(testCase['request_data'])['content'];
	if(dataType == 'data') {
		add_row_with_obj('data', request_data);
	} else if(dataType == 'json') {
//		console.log(JSON.stringify(JSON.parse(testCase['request_data'])['content'][0]));
		$('#json_input').val(JSON.stringify(JSON.parse(testCase['request_data'])['content'][0]));
	}
	showDataOrJson(dataType);

	var headers = JSON.parse(testCase['headers'])['content'];
	add_row_with_obj('header', headers);

	var extract = JSON.parse(testCase['extract'])['content'];
	add_row_with_obj('extract', extract);

	var validates = JSON.parse(testCase['validate'])['content'];
	add_row_with_obj('validate', validates);
}

function clearForms() {
	clear_rows('variables');
	clear_rows('params');
	clear_rows('hooks');
	clear_rows('data');
	clear_rows('header');
	clear_rows('extract');
	clear_rows('validate');
}

function showDataOrJson(dataType) {
	if(dataType == 'json') {
		$('#form_request_data').hide();
		$('#json_text').show();
	} else if(dataType == 'data') {
		$('#form_request_data').show();
		$('#json_text').hide();
	}
}

//删除
function remove_self(id){
    $(id).remove();
}

//填充环境列表
function fillEnvList(){
	//加载环境列表
	window.APINet.getEnvList({}, -1, function(data) {
		var param = JSON.parse(data['data']['envs']);
        for(var index = 0; index < param.length; index++) {
            var cur_env = param[index]
            $("#choose_env_name").append('<option value="' + cur_env['host_port'] + '">' + cur_env['env_name'] + ": "+cur_env['host_port']+ '</option>');
        }
	});
}

//显示运行环境选择的模态框,复原为选中『请选择』项
function showEnvSelectModal(){
	$('#env_modal').modal('show');
	$('#choose_env_name').val(-1);
}

function setConfirmCallback(callback){
	$('#confirm_run').click(function(){
		base_url = $("#choose_env_name").val()
		if(base_url == -1){
			window.utils.tips('请选择执行环境！');
			return;
		}
		callback(base_url);
	});
}

function init_acs(language, theme, editor) {
    editor.setTheme("ace/theme/" + theme);
    editor.session.setMode("ace/mode/" + language);
    editor.setFontSize(17);

    editor.setReadOnly(false);

    editor.setOption("wrap", "free");

    ace.require("ace/ext/language_tools");
    editor.setOptions({
        enableBasicAutocompletion: true,
        enableSnippets: true,
        enableLiveAutocompletion: true,
        autoScrollEditorIntoView: true
    });

}

//获取点击运行按钮时选中的 用例,模块,项目条目，返回其id
function getCheckBoxes(name) {
	obj = document.getElementsByName(name);
	check_val = [];
	for(k in obj) {
		if(obj[k].checked){
			check_val.push($(obj[k]).attr('id'));
		}
	}
	return check_val;
}
	
	
function setSignature(){
	//编辑界面中的签名参数处理
	$(".table").on("change",".select-sign",function(){
		var row = $(this).data('id');
		//排序后的参与签名的values
		var signValues = getSignValues();
//		console.log(countProperties(signValues));

		if(countProperties(signValues) > 0){
			//判断是否已存在签名字段，不存在则添加，存在则修改value
			var signInput = hasSign();
			if(signInput == null){
				//添加行
				add_row('data');
				//将其key填入'signature'
				signInput = $('.input-data').last();
				signInput.val('signature');
			}

			//设置签名内容
			var content = '${get_md5(';
			for(var key in signValues){
//				console.log(key);
				content = content + key + "," + signValues[key]+","
			}
			//去掉最后一个逗号
			content = content.substring(0,content.length-1);
			content = content+')}'
			$(getValueInput($(signInput).data('id'))).val(content);
		}else{
			//判断是否已存在签名字段，存在则删除，不存在则不做处理
			var signInput = hasSign();
			$(signInput).parent().parent().remove();
		}
	});
}
	
//获取指定id的value输入框
function getValueInput(id){
	var result = null;
	$('.value-data').each(function(){
		if($(this).data('id') == id){
			result = this;
		}
	});
	return result;
}

//获取需要参与签名的value
function getSignValues(){
	var keys = {};
	var values = {};
	var signs = {};
	var indexs = [];
	var result = [];
	var valueResult = [];
	var keyAndValue = new Array();
	$('.input-data').each(function(){
		var id = $(this).data('id');
		keys[id+""] = $(this).val();
	});
	$('.select-sign').each(function(){
		var id = $(this).data('id');
		signs[id+""] = $(this).prop('checked');
	});
	
	$('.value-data').each(function(){
		var id = $(this).data('id');
		values[id+""] = $(this).val();
	});
//	console.log(signs);
	//获取参与签名的所有key
	for(var item in signs){
		if(signs[item] == true){
			result.push(keys[item]);
		}
	}
//	console.log(result);
	
	//基于key排序,result中存的是所有的key值
	result = result.sort();
//	console.log(result);
	
	//取出对应id
	for(var item in result){
		for(var index in keys){
			if(result[item] == keys[index]){
				valueResult.push(values[index]);
				keyAndValue[keys[index]] = values[index];
			}
		}
	}
//	console.log(valueResult);
//	console.log(keyAndValue);
	return keyAndValue;
}

//判断是否已存在signature字段
function hasSign(){
	var result = null;
	$('.input-data').each(function(){
		if($(this).val() == 'signature'){
			result = this;
		}
	});
	return result;
}

//设置各表格监听
function initTablesListener(){
	$('.table').on('keyup' ,"input[name='content[][key]'],textarea[name='content[][key]'],input[name='content[][setup_hooks]'],input[name='content[][check]']",function(){
		var content = $(this).val();
		if(content == ''){
			//内容为空，不加下一行
			return;
		}
		if($(this).parents('tr').next().length > 0){
			//有下一行则不再添加
			return;
		}
		
		var id = $(this).parents('table').attr('id');
		if(id == 'params'){
			add_params(id);
		}else{
			add_row(id);
		}
	});
	
	//删除按钮事件
	$('.table').on('click', ".btn-delete-row",function(){
		$(this).parents('tr').remove();
	});
}
    
function countProperties (obj) {
    var count = 0;
    for (var property in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, property)) {
            count++;
        }
    }
    return count;
}

    

