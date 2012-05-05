

var counter = 0;

var clients = [];

exports.getNewClient = function(){
    counter++;
    var newC = {
        id: counter
    };
    clients.push(newC);
    console.log('numPlayers', clients.length);
    return newC;
}

exports.disconnect = function(client){
    var i;
    for( i = clients.length -1; i >= 0; i--){  
        if(clients[i].id == client.id){        
            clients.splice(i,1);
        }
    }
    console.log('numPlayers', clients.length);
}

exports.getModel = function(){
    return {
        'clients': clients
    };
}
  