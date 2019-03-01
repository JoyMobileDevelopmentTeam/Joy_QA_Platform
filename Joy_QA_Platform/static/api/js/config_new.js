$('#DataType').on('change', function () {
            if ($('#DataType').val() == 'json') {
                $('#add_data').attr('disabled', true);
                $('#del_data').attr('disabled', true);
                $('#btn-json-viewer').removeAttr("disabled");
                $('#data').remove();
                var json_text = "<span style=\"font-size:10px;\" id=\"json-text\"><body>\n" +
                    "                                <div style=\"width:45%; float:left; margin-left: 0px; margin-top: 20px; height: 200px\" >\n" +
                    "                                    <textarea class=\"form-control\" id=\"json-input\" rows=\"10\" style=\"width: 100%\">{\"key\":\"value\"}\n" +
                    "                                      </textarea></div>\n" +
                    "\n" +
                    "                                <div style=\"width:50%; height:200px;overflow:auto;margin-top: 20px; margin-left: 5%; float:left\">\n" +
                    "                                    <p id=\"json-renderer\" style=\"width: 100%; padding-left: 20px\"></p>\n" +
                    "                                </div>\n" +
                    "                            </body></span>";
                $('#form_request_data').append(json_text);

            } else {
                var table = '<table class="table table-hover table-condensed table-bordered table-striped" id="data">\n' +
                    '                                <caption>' + $('#DataType').val() + ':</caption>\n' +
                    '                                <thead>\n' +
                    '                                <tr class="active text-success">\n' +
                    '                                    <th width="5%" align="center">Option</th>\n' +
                    '                                    <th width="30%" align="center">Key</th>\n' +
                    '                                    <th width="5%" align="center">Type</th>\n' +
                    '                                    <th width="60%" align="center">Value</th>\n' +
                    '                                </tr>\n' +
                    '                                </thead>\n' +
                    '                                <tbody>\n' +
                    '                                </tbody>\n' +
                    '                            </table>';

                $('#add_data').text('add ' + $('#DataType').val());
                $('#del_data').text('del ' + $('#DataType').val());

                $('#add_data').removeAttr("disabled");
                $('#del_data').removeAttr("disabled");
                $('#btn-json-viewer').attr('disabled', true);
                $('#data').remove();
                $('#json-text').remove();
                $('#form_request_data').append(table);
            }
        })

$(function () {
    $('#btn-json-viewer').click(function () {
        try {
            var input = eval('(' + $('#json-input').val() + ')');
        }
        catch (error) {
            myAlert("Json 格式有误,请重新输入")
        }
        var options = {
            collapsed: false,
            withQuotes: false
        };
        // $('#json-renderer').jsonViewer(input, options);
    });
    $('#btn-json-viewer').click();
});

$("#tab-test").on("click", "li", function () {
    $(this).addClass("am-active").siblings("li").removeClass("am-active");
    var target = $(this).children("a").attr("data-target");
    $(target).addClass("am-active").siblings(".am-tab-panel").removeClass("am-active");
}).find("li").eq(0).trigger("click");

$(function () {
    //$("#pre_case").sortable();
    //$("#pre_case").disableSelection();
});

$('#pre_collapse').mouseover(function () {
    $('#pre_case').collapse('open');
});

$('#close_collapse').mouseover(function () {
    $('#pre_case').collapse('close');
});

$('#belong_case_id').on('change', function () {
    if ($('#belong_case_id').val() !== '请选择') {
        case_id = $('#belong_case_id').val();
        case_name = $('#belong_case_id option:selected').text();
        var href = "<li id=" + case_id + "><a href='/api/edit_case/" + case_id + "/' id = " + case_id + ">" + case_name + "" +
            "</a><i class=\"js-remove\" onclick=remove_self('#" + case_id + "')>✖</i></li>";
        $("#pre_case").append(href);
    }
});

function remove_self(id) {
    $(id).remove();
};

(function(){
    
    //configInfo  变量  request  验证结果
    var ids = ["config_name","project_name","module_name","creator"];
    var form_ids = ["form_variables","form_params","form_hooks","form_request_data",
    "form_request_headers","form_extract","form_validate"];
    
    //点击创建配置
    $('#send').click(createConfig);
    $('#new_case').click(createConfig);
    setListener();

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
    
    //添加各输入框监听
    function  setListener(){
        for(var index in ids){
            var id = ids[index];
            $('#'+id).bind('change',function(event){
                //当内容发生变化，并且内容不为空时，则设置为正常状态
                if($(event.target).val() != "")
                    setNormal($(event.target).attr("id"));
            });
        }

    }
    
    function createConfig(){
        var result = checkInput();
        if(!result[0]){
            //有输入内容不符合要求
            setError(result[1]);
            return;
        }
        
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


        window.APINet.configNew({
            config_name: config_name,
            belong_project_id: project_id,
            belong_module_id: module_id,
            creator: creator,
            form_variables: form_variables,
            form_params: form_params,
            form_hooks: form_hooks,
            form_request_data: form_request_data,
            form_request_headers: form_request_headers,
            form_extract: form_extract,
            form_validate: form_validate
        },function(data){
            alert(data['msg']);
            if(data['code'] == 1) {
                location.href = '/api/config_list'
            }
        });
    }

    
    //检查输入的内容是否有效
    function checkInput(){
        for(var index in ids){
            var id = ids[index];
            var text = $("#" + id).val();
            if(text.length == 0){
                return [false, ids[index]];
            }
        }

        for(var index in form_ids){
            var form_id = form_ids[index];
            // alert(form_id)
            var value = $("#"+form_id).serializeJSON();
            json_value = JSON.stringify(value)
            // alert(json_value);
        }

        return [true, ""];
    }
    
    //设置输入框为有错误状态
    function setError(id){
        $('#'+id).parent().parent().addClass('has-error');
    }
    
    //设置输入框为正常状态
    function setNormal(id){
        $('#'+id).parent().parent().removeClass('has-error');
    }
}());

