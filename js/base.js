//;是为了结束前面的语句，如果前面没有结束符 ;  在压缩时会出现问题
;(function(){
    'use strict'
    //声明一群变量
    var $form_add_task=$('.add-task')
        ,task_list=[]
        ,$task_detail=$('.task-detail')
        ,$task_detail_mask=$(".task-detail-mask")
        ,$task_delete_trigger
        ,$task_detail_trigger
        ,current_index
        ,$updata_form
        ,$task_detail_content
        ,$task_detail_content_input
        ,$checkbox_complete
        ;

        //在开始时调用init()函数
        init();

    //为form注册submit事件
    $form_add_task.on('submit',on_add_task_form_submit);
    //click mask 隐藏 task-detail
    $task_detail_mask.on('click',hide_task_detail);



    //form submit的回调函数
    function on_add_task_form_submit (e) {
        //每次都要新增一个new_task对象
        var new_task={}
            ,$input;
        //阻止默认行为
        e.preventDefault();
        //获取新task的值
        $input=$(this).find("input[name='content']");
        new_task.content=$input.val();
        //如果新task的值为空 则直接返回 否则继续执行
        if(!new_task.content){return;}
        //存入新task
        add_task(new_task);
        //输入一个task之后，将input的value清空 这样在下次输入时 input中无内容 可直接输入
        $input.val(null);
    }
    //查找并监听所有详情按钮的click事件
    function listen_task_detail(){
        var index;
        $('.task-item').on('dblclick',function () {
            index=$(this).data('index');
            show_task_detail(index);
        });
        $task_detail_trigger.on('click',function(){
            var $this=$(this);
            var $item=$this.parent().parent();
            index=$item.data('index');
            show_task_detail(index);
        });
    }
    //显示task详情
    function show_task_detail(index){
        //生成详情模板
        render_task_detail(index);
        //保存当前索引
        current_index=index;
        //显示详情模板（默认隐藏） （注：jQuery方法  show() 显示元素 ）
        $task_detail.show();
        //显示mask（默认隐藏）
        $task_detail_mask.show();
    }

    //更新task
    function update_task(index,data){
        if(index===undefined || !task_list[index]){return;}
        //合并新旧数据
        task_list[index]=$.extend({},task_list[index],data);
        refresh_task_list();
    }
    //渲染指定Task的详细信息
    function render_task_detail(index){
        if(index===undefined || !task_list[index]){return;}
        var item=task_list[index];
        var tpl='<form>'+
            '<div class="content">'+
            item.content+
            '</div>'+
            '<div class="input-item"><input style="display: none" type="text" name="content" value="'+(item.content ||'')+'">'+
            '</div>'+
            // '<div>'+
            '<div class="desc input-item">'+
            '<textarea name="desc">'+(item.desc || '') +'</textarea>'+
            '</div>'+
            // '</div>'+
            '<div class="remind input-item">'+
            '<input name="remind" type="date" value="'+item.remind+'"></input>'+
            '</div>'+
            '<div class="input-item"><button type="submit">更新</button></div>'+
            '</form>';
        //清空Task详情模板
        $task_detail.html(' ');
        //添加新模板
        $task_detail.append(tpl);
        // or
        // $task_detail.html(tpl);

        //选中其中的form元素 因为之后会使用其监听的submit事件
        $updata_form=$task_detail.find('form');
        //选中显示Task内容的元素
        $task_detail_content=$updata_form.find('.content');
        //选中显示Task input的元素
        $task_detail_content_input=$updata_form.find('[name=content]');

        // 注册dbclick 事件 双击内容元素显示input 隐藏自己
        $task_detail_content.on('dblclick',function(){
            $task_detail_content_input.show();
            $task_detail_content.hide();

        });

        //详情 form表单注册 sbumit事件
        $updata_form.on('submit',function(e){
            //阻值表单提交
            e.preventDefault();
            var data={};
            //获取内容详情中各个input的值
            data.content=$(this).find('[name=content]').val();
            data.desc=$(this).find('[name=desc]').val();
            data.remind=$(this).find('[name=remind]').val();
            // console.log(data);
            update_task(index,data);
            hide_task_detail();

        });

    }

    //隐藏Task详情
    function hide_task_detail(){
        //jQuery方法  hide() 隐藏元素
        $task_detail.hide();
        $task_detail_mask.hide();
    }


    //监听打开Task详情事件
    function listen_task_delete(){
        $task_delete_trigger.on('click',function(){
            var $this=$(this);//将当前点击的元素 编程一个jQuery对象
            var $item=$this.parent().parent();//找到删除按钮所在的task元素
            var index=$item.data('index');//与dataset的区别是什么？
            var tmp=confirm('确定删除？');//确认删除
            //delete_task(index)删除数组中的一个对象，这是数组中的响应位置为null
            tmp ? delete_task(index) : null;
        });
    }

    //监听完成Task事件  根据input[checkbox]元素的checked属性
    function listen_checkbox_complete(){
        $checkbox_complete.on('click',function(){
            var $this=$(this);
            var index=$this.parent().parent().data('index');
            //取出被click的 item 在 LocalStorage 中的对象
            var item=get(index);
            //item.complete在第一次点击时，为undefined
            if(item.complete){//再点击一次表示  取消完成 更改为未完成
                //在此处设置 checked 是无效的 因为update_task()函数会调用
                // refresh_task_list()函数  会重新渲染模板(line:242)
                // $this.attr('checked',true);
                update_task(index,{complete:false});
                console.log($this)
            }else{
                update_task(index,{complete:true});
            }
        });
    }

    //add_task()函数   添加新task到task_list
    function add_task(new_task){
        //将新task推入task_list
        task_list.push(new_task);
        //更新LocalStorage 中 task_list
        refresh_task_list();
        return true;
    }

    //refresh函数 刷新LocalStorage数据并重新渲染 tpl
    function refresh_task_list(){
        //每次重新设置LocalStorage中的task_list 在重新刷新页面之后 才能显示新添加的task
        //或者  不显示已删除的task
        store.set('task_list',task_list);
        render_task_list();
    }

    //delete()函数  删除一个task
    function delete_task(index){
        //如果没有index 或者 index不存在 则直接返回
        if(index === undefined || !task_list[index]){return;}
        //老师方法：直接删除task_list[index]
        delete task_list[index];
        //更新task_list
        refresh_task_list();
    }


    //init()函数  取得store中的task_list对象
    function init(){
       task_list=store.get('task_list') || [];
        // console.log(task_list);
        //在开始时，就显示task_list
        if(task_list.length) {
            render_task_list();
        }
    }

    //获取LocalStorage中  task_list中的某一项
    function get(index){
        return  store.get('task_list')[index];
    }

    //render_task_list函数  render所有Task模板
    function render_task_list() {
        var $task_list = $('.task-list');
        //每次render之前，将$task_list的html清空
        $task_list.html(' ');
        var complete_item = [];
        for (var i = 0; i < task_list.length; i++) {
            var item = task_list[i];
            //item && 因为元素删除之后为null  null.complete是存在的 会报错
            if (item && item.complete) {
                //保持在task_list中的index
                complete_item[i]=item;
            } else {
                var $task = render_task_item(task_list[i], i);
                $task_list.prepend($task);
            }
        }

        for (var j = 0; j < complete_item.length; j++) {
            var $task = render_task_item(complete_item[j], j);
            //因为保持了在task_list中的index  所以complete_item中的index是不连续的
            //所以当循环到null时 直接跳过  否则null.addClass会报错
            if(!$task){continue;}
            $task.addClass('completed');
            $task_list.append($task);
        }


        //在render_task_list之后  也就是将结构添加到页面之后 才能取到相关元素
        $task_delete_trigger=$('.action.delete');
        $task_detail_trigger=$('.action.detail');
        $checkbox_complete=$('.task-list .complete[type=checkbox]');
        //每次render之后，要重新监听click事件
        listen_task_delete();
        listen_task_detail();
        listen_checkbox_complete();

    }

//render_task_item 函数  render 单条Task模板
function render_task_item(data,index){//index主要用于定位 在删除时可以使用
    //将整个html结构作为字符串   用data.content 更新里面内容  好厉害！！！！
    if(!data||index===undefined){return;}
    var list_item_tpl='<div class="task-item" data-index="'+ index + '">'+
        '<span><input class="complete" type="checkbox"></span>'+
        '<span class="task-content">'+data.content+'</span>'+
        '<span class="fr">'+
        '<span class="action delete"> 删除</span>'+
        '<span class="action detail"> 详情</span>'+
        '</span>'+
        '</div>';
    return $(list_item_tpl);//return list_item_tpl 也是ok的
}


    //render_task_item 函数  render 单条Task模板
    function render_task_item(data,index) {//index主要用于定位 在删除时可以使用
        //将整个html结构作为字符串   用data.content 更新里面内容  好厉害！！！！
        if (!data || index === undefined) {
            return;
        }
        var list_item_tpl = '<div class="task-item" data-index="' + index + '">' +
            '<span><input class="complete" ' + (data.complete ? 'checked' : '') + ' type="checkbox"></span>' +
            '<span class="task-content">' + data.content + '</span>' +
            '<span class="fr">' +
            '<span class="action delete"> 删除</span>' +
            '<span class="action detail"> 详情</span>' +
            '</span>' +
            '</div>';
        return $(list_item_tpl);//return list_item_tpl 也是ok的
    }

})();
