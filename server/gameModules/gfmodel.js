import { readFileSync } from 'node:fs';

const scenarios = JSON.parse(
    readFileSync(new URL('../scenarios.json', import.meta.url), 'utf8')
);
const rockDefinitions = JSON.parse(
    readFileSync(new URL('../rocks.json', import.meta.url), 'utf8')
);

function resolveRocks(scenario) {
    return (scenario.rocks || []).map(function (rock) {
        const definition = rockDefinitions[rock.type];

        if (!definition) {
            return {
                type: rock.type,
                x: rock.x,
                y: rock.y,
                lines: []
            };
        }

        return {
            type: rock.type,
            x: rock.x,
            y: rock.y,
            lines: definition.lines.map(function (line) {
                return {
                    from: line.from,
                    to: line.to
                };
            })
        };
    });
}

function resolveScenario(scenario) {
    if (!scenario) {
        return null;
    }

    return {
        ...scenario,
        rocks: resolveRocks(scenario)
    };
}

export function createGameModel() {
    let counter = 0;
    const clients = [];
    let currentScenarioIndex = -1;
    let roundNumber = 0;

    function getCurrentScenario() {
        if (currentScenarioIndex < 0 || scenarios.length === 0) {
            return null;
        }

        return resolveScenario(scenarios[currentScenarioIndex]);
    }

    function areAllReady() {
        return (
            clients.length >= 2 &&
            clients.every(function (client) {
                return client.ready;
            })
        );
    }

    function advanceRound() {
        if (scenarios.length === 0) {
            currentScenarioIndex = -1;
            return;
        }

        currentScenarioIndex = (currentScenarioIndex + 1) % scenarios.length;
        roundNumber++;
    }

    return {
        getNewClient: function () {
            counter++;

            const newClient = {
                id: counter,
                ready: false
            };

            clients.push(newClient);
            return newClient;
        },

        disconnect: function (client) {
            let i;

            for (i = clients.length - 1; i >= 0; i--) {
                if (clients[i].id === client.id) {
                    clients.splice(i, 1);
                }
            }
        },

        getModel: function () {
            return {
                clients: clients.slice(),
                currentScenario: getCurrentScenario(),
                roundNumber: roundNumber
            };
        },

        readyClient: function (client) {
            const wasReadyToStart = areAllReady();
            const existingClient = clients.find(function (item) {
                return item.id === client.id;
            });

            if (existingClient) {
                existingClient.ready = true;
            }

            if (!wasReadyToStart && areAllReady()) {
                advanceRound();
            }
        },

        resetReady: function () {
            clients.forEach(function (client) {
                client.ready = false;
            });
        },

        advanceRound: advanceRound
    };
}
