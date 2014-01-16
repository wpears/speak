var http = require('http')
  , express = require('express') 
  , app  = express()
  , server = http.createServer(app)
  , io = require('socket.io').listen(server)
  , sockets = {}
  , fs = require('fs')
  , url = require('url')
  , getRoom = require('./routes/getRoom').getRoom
  , public = __dirname+'/public'
  , routes={'/index.html':'index.html'
           ,'/':'index.html'
           ,'/client.js':'client.js'
           ,'/client.css':'client.css'
           ,'/favicon.ico':'favicon.ico'
           }
  ;

io.set('log level', 2);
io.enable('browser client minification');
io.enable('browser client etag');
io.enable('browser client gzip');

app.use(express.compress())
   .use(express.favicon(public+'/img/favicon.ico'))
   .use('/public',express.static(public))
   .use(function(req,res,next){
       res.sendfile('index.html');
       })
   .use(express.logger('dev'))
   .use(express.bodyParser())
   .use(app.router)
   .use(function(req, res) {
      res.send('404: Page not Found', 404);
    })
    .use(function(error, req, res, next) {
      res.send('500: Internal Server Error', 500);
    });

io.sockets.on('connection', function (socket) {
    sockets[socket.id]=socket;
    socket.name="Anonymous";
    socket.on('name',function(name){
      if(socket.room){
        io.sockets.in(socket.room).emit('name',socket.name+" is now "+name);
      }
      socket.name=name;
    });
    socket.on('pm',function(pmId,msg){
      console.log("got pm",msg);
      sockets[pmId].emit('pm',msg)
    });
    socket.on('loc',function(data){
      var coords = data.split(',');
      getRoom(+coords[0],+coords[1],function(err,obj){
        if(err) console.log(err);
        if(obj){
          attachToRoom(socket,obj._id);
          socket.emit('room',obj);
        }else{
          socket.emit('noroom');
        }
      });
    });
    socket.on('room',function(room){
      attachToRoom(socket,room);
    });
});

function attachToRoom(socket, room){
  socket.join(room);
  console.log("Joining",socket.name,"to",room);
  socket.room=room;
  socket.broadcast.to(room).emit('join',socket.name+" has joined.");
  socket.on('msg',function(msg){
    console.log('got msg:',msg,"from",socket.name);
    socket.broadcast.to(room).emit('msg',socket.name, socket.id, msg, 0);
  });
  socket.on('disconnect',function(){
    delete sockets[socket.id];
    socket.broadcast.to(room).emit('leave',socket.name+" has left.");
  });
}
server.listen(1337);
