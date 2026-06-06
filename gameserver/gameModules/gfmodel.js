import { readFileSync } from 'node:fs';

let counter = 0;
const clients = [];
const scenarios = JSON.parse(readFileSync(new URL('../scenarios.json', import.meta.url), 'utf8'));
const rockDefinitions = JSON.parse(readFileSync(new URL('../rocks.json', import.meta.url), 'utf8'));
let currentScenarioIndex = -1;
let roundNumber = 0;

function resolveRocks(scenario){
    return (scenario.rocks || []).map(function(rock){
        const definition = rockDefinitions[rock.type];
        const scale = rock.scale || 1;

        if(!definition){
            return {
                type: rock.type,
                x: rock.x,
                y: rock.y,
                scale: scale,
                lines: []
            };
        }

        return {
            type: rock.type,
            x: rock.x,
            y: rock.y,
            scale: scale,
            lines: definition.lines.map(function(line){
                return {
                    from: [line.from[0] * scale, line.from[1] * scale],
                    to: [line.to[0] * scale, line.to[1] * scale]
                };
            })
        };
    });
}

function resolveScenario(scenario){
    if(!scenario){
        return null;
    }

    return {
        ...scenario,
        rocks: resolveRocks(scenario)
    };
}

function getCurrentScenario(){
    if(currentScenarioIndex < 0 || scenarios.length === 0){
        return null;
    }

    return resolveScenario(scenarios[currentScenarioIndex]);
}

function areAllReady(){
    return clients.length >= 2 && clients.every(function(client){
        return client.ready;
    });
}

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
        clients: clients.slice(),
        currentScenario: getCurrentScenario(),
        roundNumber: roundNumber
    };
}

export function readyClient(client){
    const wasReadyToStart = areAllReady();
    const existingClient = clients.find(function(item){
        return item.id === client.id;
    });

    if(existingClient){
        existingClient.ready = true;
    }

    if(!wasReadyToStart && areAllReady()){
        advanceRound();
    }
}

export function resetReady(){
    clients.forEach(function(client){
        client.ready = false;
    });
}

export function advanceRound(){
    if(scenarios.length === 0){
        currentScenarioIndex = -1;
        return;
    }

    currentScenarioIndex = (currentScenarioIndex + 1) % scenarios.length;
    roundNumber++;
}
