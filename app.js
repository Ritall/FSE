//引入程序包
var express = require('express')
var path = require('path')
var app = express()
var server = require('http').createServer(app)
var io = require('socket.io').listen(server);

var fs = require("fs");
var file = "chat.db";
var exists = fs.existsSync(file);

//新建一个sqlite 的 database 
var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database(file);

if(!exists){
	db.run('CREATE TABLE Dept(Deptname ,Depttime)');
	db.run('CREATE TABLE Chatlog(name,time ,text)');
}

//db.close();

//WebSocket连接监听
io.on('connection', function (socket) {
  socket.emit('open');//通知客户端已连接

  // 构造客户端对象
  var client = {
    socket:socket,
    name:false
  }
  
  // 对发送事件的监听
  socket.on('message', function(msg){
    var obj={time:getTime()};//,color:client.color};

    //连接 用户名设置login事件
    if(!client.name){
        client.name = msg;
        obj['text']=msg;
        obj['author']='System';
        obj['type']='login';
        console.log(client.name + ' login');
        
		//返回欢迎语
        socket.emit('system',obj);
		
	    db.each("SELECT Depttime FROM Dept WHERE Deptname='"+client.name+"'",function(err,row){
       //曾经登陆过 
         
			db.each("SELECT text,name FROM Chatlog WHERE time>'" +row.Depttime+"'",function(err,row2){
	
			obj['text']=row2.text;
			obj['author']=row2.name;
		    obj['type']='reconnect';
		    socket.emit('system',obj);
			});
		});
	  	       
        //广播新用户已登陆
        socket.broadcast.emit('system',obj);
     }
	 else{
        //正常消息接收
        obj['text']=msg;
        obj['author']=client.name;      
        obj['type']='message';
        console.log(client.name + ' say: ' + msg);
     
		db.run("INSERT INTO Chatlog VALUES (?,?,?)", obj.author, obj.time, obj.text);
		db.each("SELECT rowid AS id, name ,time ,text FROM Chatlog", function(err, row) {
               console.log(row.id + ": " + row.name + ": " + row.time + ": "+ row.text);
        });
		
		// 返回消息
		socket.emit('message',obj);
        // 广播向其他用户发消息
        socket.broadcast.emit('message',obj);
      }
    });

    //监听退出事件 system事件
    socket.on('disconnect', function () {  
      var obj = {
        time:getTime(),
        //color:client.color,
        author:'System',
        text:client.name,
        type:'disconnect'
      };

      // 广播用户已退出
      socket.broadcast.emit('system',obj);
	  
	  db.run("INSERT INTO Dept VALUES (?,?)", obj.text, obj.time);
      //"DELETE FROM bookmarks WHERE id='" + req.params.id + "'" OR IGNORE 
	  //db.each("SELECT rowid AS id, name ,time FROM Dept", function(err, row) {
      //         console.log(row.id + ": " + row.name + ": " + row.time);
  
      console.log(client.name + 'Disconnect');
	 });
    });
  

//express基本配置
app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

// 指定客户端的html文件
app.get('/', function(req, res){
  res.sendfile('views/chat.html');
});

server.listen(app.get('port'), function(){
  console.log("micrchat server listening on port " + app.get('port'));
});

var getTime=function(){
  var date = new Date();
  return date.toLocaleTimeString();
  //return date.getHours()+":"+date.getMinutes()+":"+date.getSeconds();
}

/*var getColor=function(){
  var colors = ['aliceblue','antiquewhite','aqua','aquamarine','pink','red','green',
                'orange','blue','blueviolet','brown','burlywood','cadetblue'];
  return colors[Math.round(Math.random() * 10000 % colors.length)];
}*/