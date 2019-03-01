;
(function () {
	//获取主页需要的数量统计
	function getCounts(params, success){
		ajax(params, '/api/getCounts/', success);
	}
	
	//获取主页需要的任务失败记录
	function fail_task_list(params, success){
		ajax(params, '/api/fail_task_list/', success);
	}
	
	//获取主页的失败统计分布数据
	function summary_fail_task(params, success){
		ajax(params, '/api/summary_fail_task/', success);
	}
	
	//获取主页的执行中任务和项目关系数据
	function task_to_project(params, success){
		ajax(params, '/api/task_to_project/', success);
	}
	
    // 获取项目列表
    function getProjectList(params, index, success) {
        params['index'] = index;
        ajax(params, '/api/project_list/', success);
    }

    // 创建项目
    function createProject(params, success) {
        ajax(params, '/api/project_create/', success);
    }

    // 搜索项目
    function searchProject(params, success) {
        ajax(params, '/api/project_search/', success);
    }

    // 删除项目
    function deleteProject(params, success) {
        ajax(params, '/api/project_delete/', success);
    }

    //获取指定id的项目
    function getProject(params, success) {
        ajax(params, '/api/project_query/', success);
    }

    //更新指定项目
    function updateProject(params, success) {
        ajax(params, '/api/project_update/', success);
    }

    // 新增模块
    function createModule(params, success) {
        ajax(params, '/api/module_create/', success);
    }

    // 获取模块列表
    function getModuleList(params, index, success) {
        params['index'] = index;
        ajax(params, '/api/module_list/', success);
    }

    // 搜索模块
    function searchModule(params, success) {
        ajax(params, '/api/module_search/', success);
    }

    // 删除模块
    function deleteModule(params, success) {
        ajax(params, '/api/module_delete/', success);
    }

    //获取指定模块信息
    function getModule(params, success) {
        ajax(params, '/api/module_query/', success);
    }

    //更新指定模块
    function updateModule(params, success) {
        ajax(params, '/api/module_update/', success);
    }

    //创建配置
    function configNew(params, success) {
        ajax(params, '/api/config_new/', success);
    }

    //配置列表
    function getConfigList(params, index, success) {
        params['index'] = index;
        ajax(params, '/api/config_list/', success);
    }

    //删除配置
    function deleteConfig(params, index, success) {
        params['index'] = index;
        ajax(params, '/api/delete_config/', success);
    }

    //获取制定配置信息
    function getConfig(params, success) {
        ajax(params, '/api/get_config/', success);
    }

    //更新配置
    function updateConfig(params, success) {
        ajax(params, '/api/update_config/', success);
    }

    //搜索配置
    function searchConfig(params,index,success) {
            //alert(index)
            //params['index'] = index;
            ajax(params,'/api/search_config/',success);
    }

    //增加环境
    function addEnv(params,success) {
            ajax(params,'/api/env_create/',success);
    }

    //获取列表
    function getEnvList(params,index,success) {
        params['index'] = index;
        ajax(params,'/api/env_list/',success);
    }
    
    //获取指定的环境
    function getEnv(params,success){
    		ajax(params,'/api/env_query/',success);
    }
    
    //搜索指定项目下的环境
    function search_env(params,success){
    		ajax(params,'/api/env_search/',success);
    }
    
    //更新环境
    function updateEnv(params,success){
    		ajax(params,'/api/env_update/',success);
    }

    //删除环境
    function deleteEnv(params,success) {
        ajax(params,'/api/env_delete/',success);
    }

    //获取用例列表
    function getCaseList(params, index, success) {
        params['index'] = index;
        ajax(params, '/api/case_list/', success);
    }
    
    //新增用例
    function addCase(params, success) {
        ajax(params, '/api/case_create/', success);
    }
    
    //删除用例
    function deleteCase(params, success){
    		ajax(params, '/api/case_delete/', success);
    }
    
    //获取指定的用例信息
    function getCase(params,success){
    		ajax(params,'/api/case_query/',success);
    }
    
    //编辑用例
    function caseEdit(params,success){
    		ajax(params,'/api/case_edit/',success);
    }
    
    //搜索用例
    function searchCase(params,success){
    		ajax(params,'/api/case_search/', success);
    }
    
    //执行用例
    function executeCase(params,success){
    		ajax(params,'/api/case_run/', success);
    }
    
    //使用项目id、模块id等搜索用例
    function searchCaseWithId(params,success){
    		ajax(params,'/api/case_search_with_id/', success);
    }

	//删除用例
	function deleteCase(params,success){
		ajax(params,'/api/case_delete/', success);
	}

    // 获取任务列表
    function getTaskList(params, index, success) {
        params['index'] = index;
        ajax(params, '/api/task_list/', success);
    }

    // 创建任务
    function createTask(params, success) {
        ajax(params, '/api/task_create/', success);
    }

    // 搜索任务
    function searchTask(params, success) {
        ajax(params, '/api/task_search/', success);
    }

    // 删除任务
    function deleteTask(params, success) {
        ajax(params, '/api/task_delete/', success);
    }

    //获取指定任务信息
    function getTask(params, success) {
        ajax(params, '/api/task_query/', success);
    }

    //更新指定模块
    function updateTask(params, success) {
        ajax(params, '/api/task_update/', success);
    }

    // 获驱动目列表
    function getDebugtalkList(params, index, success) {
        params['index'] = index;
        ajax(params, '/api/debugtalk_list/', success);
    }

    function runTask(params, success) {
        ajax(params, '/api/task_run/', success);
    }

    function stopTask(params, success) {
        ajax(params, '/api/task_stop/', success);
    }

    function taskMonitor(params, index, success) {
        params['index'] = index;
        ajax(params, '/api/task_monitor/', success);
    }
    
    function runModules(params, success){
    	 	ajaxList(params,'/api/run_modules/',success);
    }
    
    function runProjects(params, success){
    		ajaxList(params,'/api/run_projects/',success);
    }
    
    function runCases(params, success){
    		//此方法需要传递数组，需要配置traditional:true,默认为false：深度序列化参数
		 ajaxList(params,'/api/run_cases/',success);
    }
    
    function checkReport(params, success){
   	 	ajax(params, '/api/report_check/', success);
    }
    
    function getReport(params, success){
    		ajax(params, '/api/report_query/', success);
    }
    
    function getReportList(params,index,success){
    		params['index'] = index;
    		ajax(params, '/api/report_list/', success);
    }
    
    function searchReport(params, success){
    		ajax(params, '/api/report_search/', success);
    }
    
    function deleteReport(params, success){
    		ajaxList(params, '/api/report_delete/', success);
    }
    
    function getUserList(params, index, success) {
        params['index'] = index;
        ajax(params, '/frame/user_list/', success);
    }

    function initAuth(params, success) {
        ajax(params, '/api/auth/', success);
    }

    function assignAuth(params, success) {
        ajax(params, '/api/assign_auth/', success);
    }
    
    function runLocust(params, success){
    		ajax(params, '/api/locust_run/', success);
    }
    
    function stopLocust(params, success){
    		ajax(params, '/api/locust_stop/', success);
    }

    //此方法需要传递数组，需要配置traditional:true,默认为false：深度序列化参数，设置为true使用传统序列化方式
    function ajaxList(params, url, success) {
        $.ajax({
            cache: false,
            type: 'POST',
            traditional:true,
            url: url,
            data: params,
            async: true,
            success: success
        });
    }

    function ajax(params, url, success) {
        $.ajax({
            cache: false,
            type: 'POST',
            url: url,
            data: params,
            async: true,
            success: success,
        });
    }

    window.APINet = {
    		getCounts: getCounts,
    		fail_task_list: fail_task_list,
    		summary_fail_task: summary_fail_task,
    		task_to_project: task_to_project,
        getProjectList: getProjectList,
        createProject: createProject,
        searchProject: searchProject,
        deleteProject: deleteProject,
        getProject: getProject,
        updateProject: updateProject,
        createModule: createModule,
        getModuleList: getModuleList,
        searchModule: searchModule,
        deleteModule: deleteModule,
        getModule: getModule,
        updateModule: updateModule,
        configNew: configNew,
        getConfigList: getConfigList,
        deleteConfig: deleteConfig,
        getConfig: getConfig,
        searchConfig,searchConfig,
        updateConfig: updateConfig,
        addEnv: addEnv,
        getEnvList: getEnvList,
        getEnv: getEnv,
        search_env: search_env,
        updateEnv: updateEnv,
        deleteEnv:deleteEnv,
        addCase: addCase,
        caseEdit: caseEdit,
        getCaseList: getCaseList,
        searchCase: searchCase,
        searchCaseWithId: searchCaseWithId,
        deleteCase: deleteCase,
        getCase: getCase,
        executeCase: executeCase,
        getTaskList: getTaskList,
        createTask: createTask,
        searchTask: searchTask,
        deleteTask: deleteTask,
        getTask: getTask,
        updateTask: updateTask,
        runTask: runTask,
        stopTask: stopTask,
        taskMonitor: taskMonitor,
        getDebugtalkList:getDebugtalkList,
        runCases: runCases,
        runModules: runModules,
        runProjects: runProjects,
        checkReport: checkReport,
        getReport: getReport,
        getReportList: getReportList,
        searchReport: searchReport,
        deleteReport: deleteReport,
        getUserList: getUserList,
        initAuth: initAuth,
        assignAuth: assignAuth,
        runLocust: runLocust,
        stopLocust: stopLocust
    }
}());