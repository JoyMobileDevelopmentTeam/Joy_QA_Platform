;
(function () {
    var edit_case_id = null;
    var isCopy = false;
    var check_task_id = null;
    var check_count = 0;
    var case_id_to_url = {};
    var locust_case_id = null;

    //首次进入展示第一页数据
    showFirstPage();
    
    //设置各表格监听及删除按钮的点击实现
	initTablesListener();

    test = {
        index: "-1"
    }

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
        }else{
        		refresh_module([], "#search_name_module");
        }
    });

    //新增用例
    $('#add_case').click(function () {
        window.pageRouter.toAddCase();
    });

    //点击运行
    $('#excute').click(function () {
        edit_case_id = null;
        locust_case_id = null;
        check_val = getCheckBoxes('select_case');

        if (check_val == '') {
            window.utils.tips('未选择执行用例');
        } else {
            showEnvSelectModal();
        }
    });

    $('#send').click(function () {
        case_ajax();
    });

    //全选事件处理
    $('#slect_all').change(function (event) {
        if ($(event.target).prop('checked') == true) {
            $('tbody tr td input').prop('checked', true);
        } else {
            $('tbody tr td input').prop('checked', false)
        }
    });

    setSignature();

    //清空搜索条件
    $('#clear_btn').click(function () {
        $('#search_project').val('-1');
        $('#search_name_module').val('-1');
        $('#search_case_name').val('');
        $('#search_create_person').val('');
    });

    //编辑按钮事件
    $(".table").on("click", ".btn-edit", function () {
        var id = $(this).data('id');
        isCopy = false;
        edit_case_id = id;
        locust_case_id = null;
        //拉取对应用例数据进行填充
        window.APINet.getCase({
            id: id
        }, function (data) {
            var params = data['data'];
            var result = parseInt(data['result']);
            if (result == 1) {
                //填充数据到编辑框中
                fillingData(params);
                $('#edit_modal').modal('show');
                //设置项目和模块不可选择，为不能修改状态
                $('#project_name').attr('disabled', true);
                $('#module_name').attr('disabled', true);
                //拉取项目下的用例，供依赖选择
                fillIncludeCase();
            } else {
                window.utils.tips('获取用例信息失败!请重试！');
            }
        });
    });

    //删除按钮事件处理
    $(".table").on("click", ".btn-delete", function () {
        var id = $(this).data("id");
        window.utils.deleteConfirm('确认要删除此用例吗？', function (index) {
            window.APINet.deleteCase({
                id: id
            }, function (data) {
                var result = data['result'];
                var msg = data['msg'];
                if (parseInt(result) == 1) {
                    showFirstPage();
                }
                window.utils.tips(msg);
            });
        });
    });

    //复制按钮事件处理
    $(".table").on("click", ".btn-copy", function () {
        var id = $(this).data("id");
        isCopy = true;
        //拉取对应用例数据进行填充
        window.APINet.getCase({
            id: id
        }, function (data) {
            var params = data['data'];
            var result = parseInt(data['result']);
            if (result == 1) {
                //填充数据到编辑框中
                fillingData(params);
                $('#edit_modal').modal('show');
                //设置项目和模块不可选择，为不能修改状态
                $('#project_name').attr('disabled', true);
                $('#module_name').attr('disabled', true);
            } else {
                window.utils.tips('获取用例信息失败!请重试！');
            }
        });
    });
    
    //压测按钮事件处理
    $(".table").on("click", ".btn-locust", function () {
        var id = $(this).data("id");
        locust_case_id = id;
        showEnvSelectModal();
        $("#choose_env_name").empty();
        $("#choose_env_name").append('<option value="-1">请选择</option>');
        window.APINet.search_env({
        		case_id: id,
        },function(data){
        		if(data['result'] == 1){
        			param = JSON.parse(data['data']['envs']);
        			//填充环境列表
			        for(var index = 0; index < param.length; index++) {
			            var cur_env = param[index]
			            $("#choose_env_name").append('<option value="' + cur_env['host_port'] + '">' + cur_env['env_name'] + ": "+cur_env['host_port']+ '</option>');
			        }
			        
			         //选中上一次运行此用例的环境
			        if(case_id_to_url[id] != 0 && case_id_to_url[id] != '0'){
			        		$('#choose_env_name').val(case_id_to_url[id]);
			        }
        		}else{
        			window.utils.tips(data['msg']);
        		}
        });
    });

    $('#DataType').change(function () {
        var dataType = $(this).val();
        showDataOrJson(dataType);
    });

    //填充数据
    function fillingData(data) {
        //清空所有表格，再进行数据的添加
        clear_rows('variables');
        clear_rows('params');
        clear_rows('hooks');
        clear_rows('data');
        clear_rows('header');
        clear_rows('extract');
        clear_rows('validate');
        $('#pre_case').empty();

        var testCase = data['cases'];
        var proInfo = data['proInfo'];
        var moduleInfo = data['moduleInfo'];

        if (testCase.length > 0) {
            testCase = testCase[0];
        } else {
            window.utils.tips("获取用例信息失败，数据为空！");
            return;
        }

        var module_id = testCase['belong_module'];
        var project_id = proInfo[module_id];
        var dev_name = testCase['author'];

        $('#case_name').val(testCase['name']);
        $('#project_name').val(project_id);
        //触发所属项目变动，拉取模块列表,并进行选中
        projectChanged(module_id, case_id);
        $('#dev_name').val(dev_name);

        var includes = JSON.parse(testCase['include']);
        for (var index in includes) {
            var include = includes[index];
            var case_id = include[0];
            var case_name = include[1];
            var href = "<li id=" + case_id + "><a href='/api/edit_case/" + case_id + "/' id = " + case_id + ">" + case_name + "" +
                "</a><i class=\"js-remove\" onclick=remove_self('#" + case_id + "')>✖</i></li>";
            $('#pre_case').append(href);
        }

        var variables = JSON.parse(testCase['variables'])['content'];
        add_row_with_obj('variables', variables);

        var parameters = JSON.parse(testCase['parameters'])['content'];
        for (var index in parameters) {
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
        add_row_with_obj('data', request_data);

        var headers = JSON.parse(testCase['headers'])['content'];
        add_row_with_obj('header', headers);

        var extract = JSON.parse(testCase['extract'])['content'];
        add_row_with_obj('extract', extract);

        var validates = JSON.parse(testCase['validate'])['content'];
        add_row_with_obj('validate', validates);
    }

    function projectChanged(module_id, case_id) {
        var id = parseInt($('#project_name').val());
        if (id == -1) {
            //清空模块、配置
            clearSelect('module_name');
            clearSelect('config_name');
        } else {
        		//拉取该项目下的用例供依赖使用
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
            //拉取相应项目下的模块
            window.APINet.searchModule({
                project_id: id
            }, function (data) {
                var result = parseInt(data['result']);
                if (result == 1) {
                    //添加获取的模块到select中
                    addModules(JSON.parse(data['data']['modules']));
                    $('#module_name').val(module_id);
                    //触发模块变动，拉取可选用例
//                  moduleChanged(module_id, case_id);
                } else {
                    window.utils.tips('获取模块列表失败');
                }
            });
        }
    }
    
    //拉取项目下的用例供依赖时选择
    function fillIncludeCase(){
    		window.APINet.searchCaseWithId({
    			project_id: $('#project_name').val()
    		},function(data){
    			console.log(data);
    		});
    }

    function moduleChanged(module_id, case_id) {
        window.APINet.searchCase({
            module_id: module_id
        }, function (data) {
            var param = JSON.parse(data['data']['cases']);
            var count = data['data']['count'];
            addCases(param);
        });
    }

    //添加case到select
    function addCases(cases) {
        clearSelect('case_select');
        for (var index = 0; index < cases.length; index++) {
            var data = cases[index];
            if (data['id'] == edit_case_id) {
                //跳过用例本身，避免死循环
                continue;
            }
            $('#case_select').append('<option value="' + data['id'] + '">' + data['name'] + '</option>');
        }
    }

    //清空选择列表
    function clearSelect(id) {
        $('#' + id).empty();
        $('#' + id).append('<option value="-1">请选择</option>');
    }

    //添加模块到select
    function addModules(modules) {
        for (var index = 0; index < modules.length; index++) {
            var module = modules[index];
            $('#module_name').append('<option value="' + module['id'] + '">' + module['module_name'] + '</option>');
        }
    }

    //『搜索』按钮点击事件
    $('#search_btn').click(function () {
        var projectName = $('#search_project option:selected').val().trim(); //项目下拉列表默认值为-1
        var moduleName = $('#search_name_module option:selected').val().trim(); //模块下拉列表默认值为-1
        var caseName = $('#search_case_name').val().trim();
        var author = $('#search_create_person').val().trim();
        if (projectName == '-1' && moduleName == '-1' && caseName.length == 0 && author.length == 0) {
            //没有搜索条件
            showFirstPage();
        } else {
            //点击搜索则获取指定条件下的前10条记录
            search(1);
        }
    });

    //执行
    $(".table").on("click", ".btn-execute", function () {
        var id = $(this).data('id');
        edit_case_id = id;
        locust_case_id = null;
        showEnvSelectModal();
        $("#choose_env_name").empty();
        $("#choose_env_name").append('<option value="-1">请选择</option>');
        
        window.APINet.search_env({
        		case_id: id,
        },function(data){
        		if(data['result'] == 1){
        			param = JSON.parse(data['data']['envs']);
        			//填充环境列表
			        for(var index = 0; index < param.length; index++) {
			            var cur_env = param[index]
			            $("#choose_env_name").append('<option value="' + cur_env['host_port'] + '">' + cur_env['env_name'] + ": "+cur_env['host_port']+ '</option>');
			        }
			        
			         //选中上一次运行此用例的环境
			        if(case_id_to_url[id] != 0 && case_id_to_url[id] != '0'){
			        	$('#choose_env_name').val(case_id_to_url[id]);
			        }
        		}else{
        			window.utils.tips(data['msg']);
        		}
        });
    });

    //点击运行
    setConfirmCallback(function (base_url) {
    		if(locust_case_id != null){
    			//执行压测
    			window.APINet.runLocust({
        			case_id: locust_case_id,
        			base_url: base_url
        	},function(data){
        			var result = data['result'];
        			if(result == 1){
        				//跳转locust页面
        				window.utils.tips(data['msg']);

					setTimeout(function(){
						window.location.href = "http://"+document.domain+':8089';
					},2000);
        			}else if(data['code'] == 99 || data['code'] == '99'){
        				//提示是否停止正在执行的压测实例
        				window.utils.showComfirmDialog('已存在正在执行的压测实例，是否停止该实例？',function(){
        					window.APINet.stopLocust({},function(data){
        						if(data['result'] == 1 || data['result'] == '1'){
        							window.utils.tips(data['msg']);
        						}
        					});
        				});
        			}else{
        				window.utils.tips(data['msg']);
        			}
        		});
    		}else if (edit_case_id == null) {
            //多选用例执行
            check_val = getCheckBoxes('select_case');
            window.APINet.runCases({
                base_url: base_url,
                case_ids: check_val
            }, function (data) {
                window.utils.tips(data['msg']);
            });
        } else {
            //单个用例执行
            url = '/api/run_testcase_single/';
            executeCase(edit_case_id, base_url, url)
        }
        $('#env_modal').modal('hide');
    });

    //搜索模块方法
    function search(index) {
        var projectName = $('#search_project option:selected').text().trim();
        var moduleName = $('#search_name_module option:selected').text().trim();
        var caseName = $('#search_case_name').val().trim();
        var author = $('#search_create_person').val().trim();

        window.APINet.searchCase({
            project_name: projectName,
            module_name: moduleName,
            case_name: caseName,
            author: author,
            index: index
        }, function (data) {
            var param = JSON.parse(data['data']['cases']);
            var count = data['data']['count'];
            var curr = data['data']['currPage'];
            var moduleInfo = data['data']['moduleInfo'];
            var proInfo = data['data']['proInfo'];
            var cases = JSON.parse(data['data']['cases']);
            //取出各用例上一次运行的环境
            case_id_to_url = {};
            cases.forEach(function(value,index,array){
            	case_id_to_url[value['id']] = value['lastRunEnv'].trim();
            });

            for (var index = 0; index < param.length; index++) {
                //处理project_id与project_name以及module_id与module_name
                param[index]['belong_project'] = proInfo[param[index]['belong_module']];
                param[index]['belong_module'] = moduleInfo[param[index]['belong_module']];
            }

            showResult(param);

            //设置总条数
            window.PageIndicator.setCount(count);
            //设置当前显示第几页
            window.PageIndicator.setPage(curr);
        });
    }

    function showFirstPage() {
        //获取第一页数据进行展示
        window.APINet.getCaseList({}, 1, function (data) {
            var param = JSON.parse(data['data']['cases']);
            var count = data['data']['count'];
            var curr = data['data']['currPage'];
            var moduleInfo = data['data']['moduleInfo'];
            var proInfo = data['data']['proInfo'];
            var cases = JSON.parse(data['data']['cases']);
            //取出各用例上一次运行的环境
            case_id_to_url = {};
            cases.forEach(function(value,index,array){
            	case_id_to_url[value['id']] = value['lastRunEnv'].trim();
            });
            
            for (var index = 0; index < param.length; index++) {
                //处理project_id与project_name以及module_id与module_name
                param[index]['belong_project'] = proInfo[param[index]['belong_module']];
                param[index]['belong_module'] = moduleInfo[param[index]['belong_module']];
            }

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
        $('#case_list_body').empty();
        for (var index = 0; index < param.length; index++) {
            $("#case_list_body").append(getProjectElement(param[index], index));
        }
        ;
    }

    //生成html元素
    function getProjectElement(param, index) {
        var caseName = param['name'];
        var author = param['author'];
        var module_name = param['belong_module']
        var project_name = param['belong_project'];
        var createTime = param['create_time'];
        var id = param['id']

        var projectStr = '<tr><td><input type="checkbox" name="select_case" id="' + id + '"/></td><td>' + (id) + '</td>' +
            '<td>' + caseName + '</td>' + '<td>' + author + '</td>' + '<td>' + project_name + '</td>' +
            '<td>' + module_name + '<td>' + createTime + '</td>' + '</td>' + getOperationEle(id) + '</tr>';
        return projectStr;
    }

    //获取操作相关元素
    function getOperationEle(id) {
        var result = '<td>' +
            '<div class="btn-group-xs bt-group-class" role="group">' +
            '<button type="button" data-id="' + id + '" class="btn btn-primary btn-execute">运行</button>' +
            '<button type="button" data-id="' + id + '" class="btn btn-info btn-edit btn-primary" data-toggle="modal">编辑</button>' +
            '<button type="button" data-id="' + id + '" class="btn btn-danger btn-delete">删除</button>' +
            '<button type="button" data-id="' + id + '" class="btn btn-success btn-copy">复制</button>' +
            '<button type="button" data-id="' + id + '" class="btn btn-danger btn-locust">压测</button>' +
            '</div>' +
            '</td>';
        return result;
    }

    function executeCase(case_id, base_url, url) {
        const case_info = {
            "case_info": {
                "case_id": case_id,
                "base_url": base_url
            }
        };
        
        window.APINet.executeCase(JSON.stringify(case_info),function(data){
        		checkReport(data['data']['report_id']);
            window.utils.tips(data['msg']);
        });

    }

    //检查报告是否生成
    function checkReport(report_id) {
        //轮询测试结果
        check_task_id = setInterval(function () {
            window.APINet.checkReport({
                report_id: report_id
            }, function (data) {
                if (data['result'] == 1) {
                    console.log(data);
                    clearInterval(check_task_id)
                    check_count = 0;
                    window.utils.showComfirmDialog('报告已生成，是否查看？', null, function (index) {
                        window.pageRouter.toRport(data['data']['report_id']);
                        window.APINet.getReport({
                            report_id: data['data']['report_id']
                        }, function (data) {
                            console.log(data);
                        });
                    }, '确定', '取消');
                }
                check_count++;
                if (check_count > 10) {
                    clearInterval(check_task_id)
                    check_count = 0;
                }
            });
        }, 3000);
    }

    function case_ajax() {
        var url = $("#url").serializeJSON();
        var method = $("#method").serializeJSON();
        var dataType = $("#DataType").serializeJSON();
        var caseInfo = $("#form_message").serializeJSON();
        var variables = $("#form_variables").serializeJSON();
        var request_data = null;
        if (dataType.DataType === 'json') {
            try {
            	console.log("22222");
                request_data = eval('(' + $('#json_input').val() + ')');
            } catch (err) {
                myAlert('Json格式输入有误！')
                return
            }
        } else {
            request_data = $("#form_request_data").serializeJSON();
        }
        console.log(request_data);

        var headers = $("#form_request_headers").serializeJSON();
        var extract = $("#form_extract").serializeJSON();
        var validate = $("#form_validate").serializeJSON();
        var parameters = $('#form_params').serializeJSON();
        var hooks = $('#form_hooks').serializeJSON();
        var include = [];
        var i = 0;
        $("ul#pre_case li a").each(function () {
            include[i++] = [$(this).attr('id'), $(this).text()];
        });
        caseInfo['include'] = include;

        caseInfo['module_id'] = $('#module_name').val();

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
            validate: validate,
            case_id: edit_case_id
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

        destUrl = isCopy ? '/api/case_create/' : '/api/case_edit/';
        if(isCopy){
        		window.APINet.addCase(JSON.stringify(content),function(data){
        			dealData(data)
        		});
        }else{
        		window.APINet.caseEdit(JSON.stringify(content),function(data){
        			dealData(data)
        		});
        }
    }
    
    function dealData(data){
    		var result = parseInt(data['result']);
        if (result == 1) {
            window.utils.tips(data['msg'], function () {
                $('#edit_modal').modal('hide');
                showFirstPage();
            });
        } else {
            window.utils.tips(data['msg']);
        }
    }

    $('#case_select').on('change', function () {
        if ($('#case_select').val() !== '-1') {
            var case_id = $('#case_select').val();
            var case_name = $('#case_select option:selected').text();
            var href = "<li id=" + case_id + "><a href='/api/edit_case/" + case_id + "/' id = " + case_id + ">" + case_name + "" +
                "</a><i class=\"js-remove\" onclick=remove_self('#" + case_id + "')>✖</i></li>";
            $("#pre_case").append(href);
        }
    });

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
//      console.log('refreshing')
        var selector = $(selector_id);
        selector.empty();

        for (var i = 0; i < moduleList.length; i++) {
            var module_id = moduleList[i].id;
            var module_name = moduleList[i].module_name;
            selector.prepend("<option value='" + module_id + "'>" + module_name + "</option>")
        }
        selector.prepend("<option value='-1' selected>模块名称</option>");
    }
    
    window.PageIndicator.setCallback(function(curr){
    		showPage(curr);
    }); 
    
    //展示指定的页数内容
    function showPage(curr){
    		var projectName = $('#search_project option:selected').val().trim(); //项目下拉列表默认值为-1
        var moduleName = $('#search_name_module option:selected').val().trim();
        var caseName = $('#search_case_name').val().trim();
        var author = $('#search_create_person').val().trim();
        if(projectName == '-1' && moduleName == '-1' && caseName.length == 0 && author.length == 0){
        		//没有搜索条件
	        window.APINet.getCaseList({}, curr, function (data) {
	            var param = JSON.parse(data['data']['cases']);
	            var count = data['data']['count'];
	            var curr = data['data']['currPage'];
	            var moduleInfo = data['data']['moduleInfo'];
	            var proInfo = data['data']['proInfo'];
	            var cases = JSON.parse(data['data']['cases']);
	            //取出各用例上一次运行的环境
	            cases.forEach(function(value,index,array){
	            		case_id_to_url[value['id']] = value['lastRunEnv'].trim();
	            });
	            
	            for (var index = 0; index < param.length; index++) {
	                //处理project_id与project_name以及module_id与module_name
	                param[index]['belong_project'] = proInfo[param[index]['belong_module']];
	                param[index]['belong_module'] = moduleInfo[param[index]['belong_module']];
	            }
	
	            showResult(param);
	            
	            //设置总条数
	            window.PageIndicator.setCount(count);
	            //设置当前显示第几页
	            window.PageIndicator.setPage(curr);
	        });
        }else{
        		//有搜索条件
        		search(curr);
        }
    }

}());