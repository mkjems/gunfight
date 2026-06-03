let counter = 0;
const clients = [];

exports.getNewClient = function(){
    counter++;

    const newClient = {
        id: counter
    };

    clients.push(newClient);
    return newClient;
};

exports.disconnect = function(client){
    let i;

    for( i = clients.length -1; i >= 0; i--){  
        if(clients[i].id == client.id){        
            clients.splice(i,1);
        }
    }
};

exports.getModel = function(){
    return {
        clients: clients.slice()
    };
};
