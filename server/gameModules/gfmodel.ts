import { readFileSync } from 'node:fs';
import {
    parseRockDefinitions,
    parseScenarioSources,
    resolveScenarioSource,
    type GameModelClient,
    type GameModelSnapshot,
    type Scenario
} from '../../shared/contracts.js';

const rockDefinitions = parseRockDefinitions(
    JSON.parse(readFileSync(new URL('../rocks.json', import.meta.url), 'utf8')),
    'server/rocks.json'
);
const scenarios = parseScenarioSources(
    JSON.parse(
        readFileSync(new URL('../scenarios.json', import.meta.url), 'utf8')
    ),
    rockDefinitions,
    'server/scenarios.json'
);

export function createGameModel() {
    let counter = 0;
    const clients: GameModelClient[] = [];
    let currentScenarioIndex = -1;
    let roundNumber = 0;

    function getCurrentScenario(): Scenario | null {
        if (currentScenarioIndex < 0 || scenarios.length === 0) {
            return null;
        }

        return resolveScenarioSource(
            scenarios[currentScenarioIndex],
            rockDefinitions
        );
    }

    function areAllReady(): boolean {
        return (
            clients.length >= 2 &&
            clients.every(function (client) {
                return client.ready;
            })
        );
    }

    function advanceRound(): void {
        if (scenarios.length === 0) {
            currentScenarioIndex = -1;
            return;
        }

        currentScenarioIndex = (currentScenarioIndex + 1) % scenarios.length;
        roundNumber++;
    }

    return {
        getNewClient: function (): GameModelClient {
            counter++;

            const newClient: GameModelClient = {
                id: counter,
                ready: false
            };

            clients.push(newClient);
            return newClient;
        },

        disconnect: function (client: GameModelClient): void {
            let i;

            for (i = clients.length - 1; i >= 0; i--) {
                if (clients[i].id === client.id) {
                    clients.splice(i, 1);
                }
            }

            if (clients.length < 2) {
                clients.forEach(function (remainingClient) {
                    remainingClient.ready = false;
                });
            }
        },

        getModel: function (): GameModelSnapshot {
            return {
                clients: clients.slice(),
                currentScenario: getCurrentScenario(),
                roundNumber: roundNumber
            };
        },

        readyClient: function (client: GameModelClient): boolean {
            const wasReadyToStart = areAllReady();
            const existingClient = clients.find(function (item) {
                return item.id === client.id;
            });

            if (clients.length < 2) {
                return false;
            }

            if (existingClient) {
                existingClient.ready = true;
            }

            if (!wasReadyToStart && areAllReady()) {
                advanceRound();
            }

            return !!existingClient;
        },

        resetReady: function (): void {
            clients.forEach(function (client) {
                client.ready = false;
            });
        },

        advanceRound: advanceRound
    };
}
