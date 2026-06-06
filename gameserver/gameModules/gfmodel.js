let counter = 0;
const clients = [];

export function getNewClient(){
    counter++;

    const newClient = {
        id: counter,
        ready: false
    };

    clients.push(newClient);
    return newClient;
}

export function disconnect(client){
    let i;

    for( i = clients.length -1; i >= 0; i--){  
        if(clients[i].id == client.id){        
            clients.splice(i,1);
        }
    }
}

export function getModel(){
    return {
        clients: clients.slice()
    };
}

export function readyClient(client){
    const existingClient = clients.find(function(item){
        return item.id === client.id;
    });

    if(existingClient){
        existingClient.ready = true;
    }
}

export function resetReady(){
    clients.forEach(function(client){
        client.ready = false;
    });
}
