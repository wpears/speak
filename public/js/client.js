      var socket = io.connect('192.168.1.72') 
        , doc = document
        , area = doc.getElementById('area')
        , nameInput = doc.getElementById('nameInput')
        , msgPane = doc.getElementById('msgPane')
        , title = doc.getElementById('title')
        , users = doc.getElementById('users')
        , dest = doc.getElementById('dest')
        , name = "Anonymous"
        , pmId
        , initGeolocation = function(){
            if(document.location.pathname==='/'){
              if('geolocation' in navigator){
                navigator.geolocation.getCurrentPosition(
                   sendPos
                  ,checkLastCoords
                  ,{timeout:5000}
                  )
              }else{
                sendSF();
              }
            }else{
              socket.emit('room',document.location.pathname.slice(1))
            }
          }
        ;
      initGeolocation();
     
      window.addEventListener('load',function(){
        setTimeout(function(){
          window.addEventListener('popstate',initGeolocation);
        },0);
      });
          
      socket.on('msg', addMsg);
      socket.on('pm', function(msg){console.log(msg)}); 
      socket.on('join',function(data){
        console.log(data)
      });

      socket.on('leave',function(data){
        console.log(data)
      });
     
      socket.on('name',addText);

      socket.on('room', populate);
      
      socket.on('noroom', roomPrompt);
      

      function populate(data){
        var frag = doc.createDocumentFragment();  
        title.textContent = data.nm + " - " + data.ct;
        addUsers(data.usrs, frag)
        users.appendChild(frag);  
        if(document.location.pathname==="/"){
          window.history.replaceState(null,null,data._id);
        }else{
          window.history.pushState(null,null,data._id);
        }
      }
      
      function addUser(name, id, parent){
        var li=doc.createElement(li);
        li.id=id;
        li.textContent=name;
        parent.appendChild(li);
      }
      
      function addUsers(users, parent){
        for (var i=0,j=users.length; i<j; i++){
          addUser(users[i].name, users[i].id, parent);
        }
      }

      function roomPrompt(){}    

      area.onkeyup = function(e){
        e = e || event;
        if (e.keyCode === 13 && !e.shiftKey) {
          if(pmId){
            socket.emit('pm',pmId,this.value);
            pmId = null;
            dest.textContent="Room"
          }else socket.emit('msg', this.value);
            if(this.value !== ''){
              addMsg(name, 1337, this.value, 1);
              this.value = '';
            }
          }
      }
      nameInput.onkeyup = function(e){
        e = e || event;
        if (e.keyCode === 13) {
          if(this.value.trim() !== ''){
            name=this.value;
            socket.emit('name',name);
            this.value = '';
          }
        }
      } 
      area.focus();
     msgPane.addEventListener('mousedown',function(e){
       if(e.target.className.indexOf('user') !== -1){
         pmId = e.target.speakid;
         var name = e.target.textContent.slice(0,-2);
         dest.textContent=name;  
       }
     });   
      function addMsg(user, socketId, msg, isMe){
        console.log('addmsg called',arguments);
        console.log('user',user,'msg',msg);
        var usrEl = doc.createElement('span')
          , msgEl = doc.createElement('span')
          ;
        usrEl.innerText = user+": ";
        usrEl.className = "user";
        if(isMe) usrEl.className+=" isMe";
        usrEl.speakid = socketId;
        msgEl.innerText = msg;
        msgEl.className = "msg";
        
        msgPane.appendChild(usrEl);
        msgPane.appendChild(msgEl);
      }

      function addText(txt){
        var p = doc.createElement('p')
        p.innerText = txt;
        msgPane.appendChild(p);
        return p;
      }

      function checkLastCoords(){
        var lastCoords = localStorage.coords;
        if(lastCoords){
          console.log("Sending last");
          socket.emit('loc',lastCoords)
        }else{
          sendSf();
        }
      }
      function sendSF(){
        socket.emit('loc',"-122.4087,37.7810")
      }
            
      function sendPos(pos){
        var coords = getCoordString(pos);
        localStorage.coords = coords;
        socket.emit('loc',coords)
      }
      function getCoordString(pos){
        var coords = pos.coords;
        return coords.longitude+','+coords.latitude;
      }
