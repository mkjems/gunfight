import { readFileSync } from 'node:fs';
import {
    parseRockDefinitions,
    parseScenarioSources,
    resolveScenarioSource,
    type GameModelClient,
    type GameModelSnapshot,
    type MatchState,
    type RoundResultPayload,
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
    let matchResultId: string | null = null;
    let matchState: MatchState = 'idle';
    let roundNumber = 0;
    let scores = [0, 0];

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

    function getClientSlot(clientId: number): number {
        return clients.findIndex(function (client) {
            return client.id === clientId;
        });
    }

    function resetMatch(): void {
        matchResultId = null;
        matchState = 'idle';
        scores = [0, 0];
    }

    function startMatch(): void {
        resetMatch();
        matchState = 'playing';
        advanceRound();
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
                resetMatch();
            }
        },

        getModel: function (): GameModelSnapshot {
            const snapshot: GameModelSnapshot = {
                clients: clients.slice(),
                currentScenario: getCurrentScenario(),
                matchState: matchState,
                roundNumber: roundNumber,
                scores: scores.slice()
            };

            if (matchResultId) {
                snapshot.matchResultId = matchResultId;
            }

            return snapshot;
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
                startMatch();
            }

            return !!existingClient;
        },

        resetReady: function (): void {
            clients.forEach(function (client) {
                client.ready = false;
            });
            resetMatch();
        },

        recordRoundResult: function (result: RoundResultPayload): boolean {
            const winnerSlot = getClientSlot(result.winnerId);
            const targetSlot = getClientSlot(result.targetId);

            if (
                matchState !== 'playing' ||
                clients.length < 2 ||
                result.roundNumber !== roundNumber ||
                winnerSlot < 0 ||
                targetSlot < 0 ||
                winnerSlot === targetSlot
            ) {
                return false;
            }

            scores[winnerSlot]++;
            advanceRound();

            return true;
        },

        finishMatch: function (resultId: string): boolean {
            if (matchState === 'gameOver') {
                return false;
            }

            if (matchState !== 'playing') {
                return false;
            }

            matchResultId = resultId;
            matchState = 'gameOver';

            return true;
        }
    };
}
