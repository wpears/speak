var dbClient = require('mongodb').MongoClient
  , rms
  ;

dbClient.connect('mongodb://127.0.0.1:27017/rooms',function(err,db){
  if (err) handleErr(err);
  rms = db.collection('rms');
});

function getRoom(x,y,cb){
    var min = 1e6
      , minDoc
      ;
    rms.find({}).each(function(err,doc){
      if(err)cb(err);
      if(doc===null){
        console.log(min,minDoc);
        cb(null, minDoc);
        return;
      }
      var xdiff=doc.x-x
        , ydiff = doc.y-y
        , currMin = xdiff*xdiff+ydiff*ydiff
        ;
      if(currMin < min){
        min = currMin;
        minDoc = doc;
      }
    });
}

module.exports.getRoom=getRoom;  

function handleErr(err){
  console.log("handling the err...",err);
  process.exit(1);
 }
