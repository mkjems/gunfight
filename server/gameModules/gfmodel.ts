import { readFileSync } from 'node:fs';
import {
    parseRockDefinitions,
    parseScenarioSources,
    resolveScenarioSource,
    type GamePhase,
    type GameModelClient,
    type GameModelSnapshot,
    type MatchState,
    type RoundResultPayload,
    type Scenario
} from '../../shared/contracts.js';

export const GAME_MODEL_TIMINGS = {
    readyCountdownMs: 2000,
    roundIntroMs: 2200,
    hitPauseMs: 1800,
    gameOverMs: 5000,
    matchMs: 70000
};

export const LEGAL_PHASE_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
    waiting: ['readying', 'closed'],
    readying: ['waiting', 'readyCountdown', 'closed'],
    readyCountdown: ['roundIntro', 'abandoned', 'closed'],
    roundIntro: ['playing', 'gameOver', 'abandoned', 'closed'],
    playing: ['hitPause', 'gameOver', 'abandoned', 'closed'],
    hitPause: ['roundIntro', 'gameOver', 'abandoned', 'closed'],
    gameOver: ['waiting', 'readying', 'abandoned', 'closed'],
    abandoned: ['closed'],
    closed: []
};

interface GameModelOptions {
    now?: () => number;
}

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

function defaultNow(): number {
    return Date.now();
}

function isActivePhase(phase: GamePhase): boolean {
    return (
        phase === 'readyCountdown' ||
        phase === 'roundIntro' ||
        phase === 'playing' ||
        phase === 'hitPause' ||
        phase === 'gameOver'
    );
}

export function canTransitionPhase(
    currentPhase: GamePhase,
    nextPhase: GamePhase
): boolean {
    return LEGAL_PHASE_TRANSITIONS[currentPhase].indexOf(nextPhase) >= 0;
}

export function createGameModel(options: GameModelOptions = {}) {
    const now = options.now || defaultNow;
    let counter = 0;
    const clients: GameModelClient[] = [];
    let currentScenarioIndex = -1;
    let matchResultId: string | null = null;
    let matchState: MatchState = 'idle';
    let matchEndsAt: number | null = null;
    let phase: GamePhase = 'waiting';
    let phaseEndsAt: number | null = null;
    let phaseStartedAt = now();
    let roundNumber = 0;
    let scores = [0, 0];
    let version = 0;

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

    function bumpVersion(): void {
        version++;
    }

    function setPhase(
        nextPhase: GamePhase,
        options: { allowSamePhase?: boolean; endsAt?: number | null } = {}
    ): boolean {
        if (phase === nextPhase && options.allowSamePhase !== true) {
            return false;
        }

        if (phase !== nextPhase && !canTransitionPhase(phase, nextPhase)) {
            return false;
        }

        phase = nextPhase;
        phaseStartedAt = now();
        phaseEndsAt =
            typeof options.endsAt === 'number' ? options.endsAt : null;
        bumpVersion();

        return true;
    }

    function setWaitingPhase(): boolean {
        if (clients.length === 0) {
            return setPhase('closed');
        }

        return setPhase(clients.length >= 2 ? 'readying' : 'waiting', {
            allowSamePhase: true
        });
    }

    function resetMatch(): void {
        matchResultId = null;
        matchState = 'idle';
        matchEndsAt = null;
        scores = [0, 0];
    }

    function startMatch(): boolean {
        resetMatch();
        matchState = 'playing';
        matchEndsAt = now() + GAME_MODEL_TIMINGS.matchMs;
        advanceRound();
        return setPhase('roundIntro', {
            endsAt: now() + GAME_MODEL_TIMINGS.roundIntroMs
        });
    }

    function finishMatch(resultId: string): boolean {
        if (matchState === 'gameOver') {
            return false;
        }

        if (
            matchState !== 'playing' ||
            !canTransitionPhase(phase, 'gameOver')
        ) {
            return false;
        }

        matchResultId = resultId;
        matchState = 'gameOver';
        return setPhase('gameOver', {
            endsAt: now() + GAME_MODEL_TIMINGS.gameOverMs
        });
    }

    function returnToLobbyAfterGameOver(): boolean {
        if (
            phase !== 'gameOver' ||
            matchState !== 'gameOver' ||
            (phaseEndsAt !== null && now() < phaseEndsAt)
        ) {
            return false;
        }

        clients.forEach(function (client) {
            client.ready = false;
        });
        resetMatch();
        return setWaitingPhase();
    }

    return {
        getNewClient: function (): GameModelClient {
            counter++;

            const newClient: GameModelClient = {
                id: counter,
                ready: false
            };

            clients.push(newClient);
            setWaitingPhase();
            return newClient;
        },

        disconnect: function (client: GameModelClient): void {
            let i;
            const wasActive = isActivePhase(phase) || matchState === 'playing';

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

            if (clients.length === 0) {
                setPhase('closed');
            } else if (wasActive) {
                setPhase('abandoned');
            } else {
                setWaitingPhase();
            }
        },

        getModel: function (): GameModelSnapshot {
            const snapshot: GameModelSnapshot = {
                clients: clients.slice(),
                currentScenario: getCurrentScenario(),
                matchState: matchState,
                phase: phase,
                phaseStartedAt: phaseStartedAt,
                roundNumber: roundNumber,
                scores: scores.slice(),
                version: version
            };

            if (matchResultId) {
                snapshot.matchResultId = matchResultId;
            }

            if (matchEndsAt) {
                snapshot.matchEndsAt = matchEndsAt;
            }

            if (phaseEndsAt) {
                snapshot.phaseEndsAt = phaseEndsAt;
            }

            return snapshot;
        },

        touch: function (): void {
            bumpVersion();
        },

        readyClient: function (client: GameModelClient): boolean {
            const existingClient = clients.find(function (item) {
                return item.id === client.id;
            });

            if (!existingClient || existingClient.ready) {
                return false;
            }

            if (clients.length < 2 || phase !== 'readying') {
                return false;
            }

            existingClient.ready = true;
            bumpVersion();

            if (areAllReady()) {
                resetMatch();
                return setPhase('readyCountdown', {
                    endsAt: now() + GAME_MODEL_TIMINGS.readyCountdownMs
                });
            }

            return true;
        },

        startMatch: function (): boolean {
            if (phase !== 'readyCountdown' || !areAllReady()) {
                return false;
            }

            return startMatch();
        },

        enterPlaying: function (resultId: string): boolean {
            if (phase !== 'roundIntro' || matchState !== 'playing') {
                return false;
            }

            if (matchEndsAt && now() >= matchEndsAt) {
                return finishMatch(resultId);
            }

            return setPhase('playing', {
                endsAt: matchEndsAt
            });
        },

        recordRoundResult: function (result: RoundResultPayload): boolean {
            const winnerSlot = getClientSlot(result.winnerId);
            const targetSlot = getClientSlot(result.targetId);

            if (
                phase !== 'playing' ||
                matchState !== 'playing' ||
                clients.length < 2 ||
                result.roundNumber !== roundNumber ||
                winnerSlot < 0 ||
                targetSlot < 0 ||
                winnerSlot === targetSlot ||
                (matchEndsAt !== null && now() >= matchEndsAt)
            ) {
                return false;
            }

            scores[winnerSlot]++;
            return setPhase('hitPause', {
                endsAt: now() + GAME_MODEL_TIMINGS.hitPauseMs
            });
        },

        finishHitPause: function (resultId: string): boolean {
            if (phase !== 'hitPause' || matchState !== 'playing') {
                return false;
            }

            if (matchEndsAt && now() >= matchEndsAt) {
                return finishMatch(resultId);
            }

            advanceRound();
            return setPhase('roundIntro', {
                endsAt: now() + GAME_MODEL_TIMINGS.roundIntroMs
            });
        },

        finishMatch: function (resultId: string): boolean {
            if (matchEndsAt && now() < matchEndsAt) {
                return false;
            }

            return finishMatch(resultId);
        },

        returnToLobbyAfterGameOver: function (): boolean {
            return returnToLobbyAfterGameOver();
        }
    };
}
