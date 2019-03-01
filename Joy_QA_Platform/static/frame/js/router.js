;
(function () {

    function toAddProject() {
        window.location.href = '/api/project_create/';
    }

    function toProjectList() {
        window.location.href = '/api/project_list/';
    }
    
	function toAddCase(){
		window.location.href = '/api/case_create/';
	}
	
    function toAddModule() {
        window.location.href = '/api/module_create/';
    }

    function toModuleList() {
        window.location.href = '/api/module_list/';
    }

    function toAddConfig() {
        window.location.href = '/api/config_new/';
    }

    function toAddTask() {
        window.location.href = '/api/task_create/';
    }

    function toTaskList() {
        window.location.href = '/api/task_list/'
    }
    
    function toCaseList(){
    		window.location.href = '/api/case_list/'
    }
    
    function toRport(id){
    		window.location.href = '/api/report_query?id='+id;
    }

    window.pageRouter = {
        toAddProject: toAddProject,
        toAddModule: toAddModule,
        toAddConfig: toAddConfig,
        toAddTask: toAddTask,
        toAddCase: toAddCase,
        toProjectList: toProjectList,
        toModuleList: toModuleList,
        toTaskList: toTaskList,
        toCaseList: toCaseList,
        toRport: toRport
    }

}());