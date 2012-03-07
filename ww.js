var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function(request, response) {
    console.log((new Date()).toLocaleTimeString() + ' Received http request for ' + request.url);
    response.writeHead(404);
    response.end();
});
server.listen(process.env.PORT, function() {
    console.log((new Date()).toLocaleTimeString() + ' Server is listening on port '+process.env.PORT);
});

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

function islegal(nickname)
{
	if(nickname=="fuck") return false;
	for(var i in clients)
		if(clients[i].nickname==nickname) return false;
	return true;
}

wsServer.bcast=function(obj){
	for(var i in clients)
		clients[i].sendUTF(JSON.stringify(obj));
}

var clients=[];
wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()).toLocaleTimeString() + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    
    var connection = request.accept(null, request.origin);
	var jsonobj={type:"regist|public|private-message-receiver-nickname|user-leave",sender:"sender-nickname",content:"regist-nickname|failed|message|leaver-nickname"};
    console.log((new Date()).toLocaleTimeString() + " "+connection.remoteAddress + " connected - Protocol Version " + connection.websocketVersion);
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            //console.log('Received Message: ' + message.utf8Data);
            //connection.sendUTF(message.utf8Data);
		jsonobj=JSON.parse(message.utf8Data);
		if(jsonobj.type=="regist")
		{
			if(!islegal(jsonobj.content))
			{
				jsonobj.content="failed";
				connection.sendUTF(JSON.stringify(jsonobj));
			}
			else
			{
				connection.nickname=jsonobj.content;
				wsServer.bcast(jsonobj);
				connection.sendUTF(JSON.stringify(jsonobj));
				for(var i in clients)
				{
					jsonobj.content=clients[i].nickname;
					connection.sendUTF(JSON.stringify(jsonobj));
				}
				clients.push(connection);
			}
		}
		else if(jsonobj.type=="public")
		{
			wsServer.bcast(jsonobj);
			console.log(jsonobj.sender+" broadcasting message:"+jsonobj.content);
		}
		else
		{
		     for(var i in clients)
		          if(clients[i].nickname==jsonobj.type)
		          {
		               clients[i].sendUTF(JSON.stringify(jsonobj));
		               connection.sendUTF(JSON.stringify(jsonobj));
		               console.log(jsonobj.sender+" send "+jsonobj.type+" private message:"+jsonobj.content);
		               break;
		           }
		}			
        }
    });
    connection.on('close', function(reasonCode, description) {
          for(var i in clients)
               if(clients[i].nickname==connection.nickname)
                    clients.splice(i,1);
          jsonobj.type="userleave";
          jsonobj. content=connection.nickname;
          wsServer.bcast(jsonobj);
          console.log((new Date()).toLocaleTimeString() +" "+ connection.nickname/*.remoteAddress*/ + ' disconnected.');
    });
});
