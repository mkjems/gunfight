import { readFileSync } from 'node:fs';
import {
    parseRockDefinitions,
    parseScenarioSources,
    resolveScenarioSource
} from '../../shared/contracts.js';

/**
 * @typedef {import('../../shared/contracts.js').GameModelClient} GameModelClient
 * @typedef {import('../../shared/contracts.js').GameModelSnapshot} GameModelSnapshot
 * @typedef {import('../../shared/contracts.js').Scenario} Scenario
 * @typedef {import('../../shared/contracts.js').ScenarioSource} ScenarioSource
 */

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
    /** @type {GameModelClient[]} */
    const clients = [];
    let currentScenarioIndex = -1;
    let roundNumber = 0;

    /** @returns {Scenario | null} */
    function getCurrentScenario() {
        if (currentScenarioIndex < 0 || scenarios.length === 0) {
            return null;
        }

        return resolveScenarioSource(
            scenarios[currentScenarioIndex],
            rockDefinitions
        );
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
        /** @returns {GameModelClient} */
        getNewClient: function () {
            counter++;

            /** @type {GameModelClient} */
            const newClient = {
                id: counter,
                ready: false
            };

            clients.push(newClient);
            return newClient;
        },

        /** @param {GameModelClient} client */
        disconnect: function (client) {
            let i;

            for (i = clients.length - 1; i >= 0; i--) {
                if (clients[i].id === client.id) {
                    clients.splice(i, 1);
                }
            }
        },

        /** @returns {GameModelSnapshot} */
        getModel: function () {
            return {
                clients: clients.slice(),
                currentScenario: getCurrentScenario(),
                roundNumber: roundNumber
            };
        },

        /** @param {GameModelClient} client */
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
