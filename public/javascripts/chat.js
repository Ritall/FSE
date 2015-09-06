 $(function () {
    var content = $('#content');
    var status = $('#status');
	var tip = $('#tip');
    var input = $('#input');
	var name = $('#name');

    var myName = false;

    //建立连接
    socket = io.connect('http://localhost:3000');
    //收到server的连接确认
    socket.on('open',function(){
		tip.text('Input your name :');
        status.text('Input your msg :');
    });

    //监听system事件，判断login或者disconnect，打印系统消息信息
    socket.on('system',function(json){
        var p = '';
        if (json.type === 'login'){
			myName=json.text;
              p = '<p style="color: blue;font-style:italic; font-weight: 900;"> '+ json.time+ '  ' + json.text +' is in !! </p>';
        }else if(json.type == 'disconnect'){
			  p = '<p style="color: blue;font-style:italic; font-weight: 900;">  '+ json.time+ '  ' + json.text +' Left !! </p>';		  
        }else if (json.type== 'reconnect'){
			  p = '<p style="color: red;font-style:italic; font-weight: 900;">  '+json.author+ ' said : ' + json.text +' </p>';
		}	
		     content.append(p); 
       
    });

    //监听message事件，打印消息信息
    socket.on('message',function(json){
        var p1 = '<p style="font-style:italic; font-weight:700;" >'+ json.time+'   '+json.author+' : </p>';  
        var p2 = '<p align="right">' +json.text+'</p>';		
		//var p = '<p><span style="color:'+json.color+';">' + json.author+'</span> @ '+ json.time+ ' : '+json.text+'</p>';
		content.append(p1);	
		content.append(p2);
        	
    });

    //通过“回车”提交姓名信息
	name.keydown(function(e) {
        if (e.keyCode === 13) {
            var msg = $(this).val();
            if (!msg) return;
            socket.send(msg);
            //$(this).val('');
			//document.getElementById('name').style.visibility = 'hidden';
		
        }
    });
	 //通过“回车”提交消息
    input.keydown(function(e) {
        if (e.keyCode === 13) {
            var msg = $(this).val();
            if (!msg) return;
            socket.send(msg);
            $(this).val('');           
        }
    });
});