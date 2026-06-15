import type { GamePhase } from '../../../shared/contracts.js';
import { Config } from '../platform/config.js';
import { analyze } from './clientModelSync.js';
import { RoundState } from '../state/clientScreens.js';

type ClientId = number | string;

type ModelClient = {
    id: ClientId;
    ready?: boolean;
};

type PublicModel = {
    clients: ModelClient[];
    currentScenario?: {
        playerStarts?: typeof Config.player.slots;
    } | null;
    matchState?: string;
    phase?: GamePhase;
};

type CreatePlanOptions = {
    model: PublicModel | null;
    playerId?: ClientId | null;
    previousModel: PublicModel | null;
    roundState: RoundState;
};

export function create(options: CreatePlanOptions) {
    const syncState = analyze(
        options.previousModel,
        options.model,
        options.playerId
    );
    const serverStartedRound =
        options.model?.phase === 'roundIntro' &&
        options.previousModel?.phase !== 'roundIntro';
    const shouldStartRound =
        canStartRoundFromState(options.roundState) && serverStartedRound;
    const serverReturnedToLobby =
        isServerLobbyPhase(options.model?.phase) &&
        options.roundState !== RoundState.WAITING;
    const shouldEnterLobbyState =
        !!syncState.abandoned || serverReturnedToLobby;
    const shouldEnterGameOverState =
        options.model?.matchState === 'gameOver' &&
        options.roundState !== RoundState.WAITING &&
        options.roundState !== RoundState.GAME_OVER;
    const syncLobbySlots =
        (options.roundState === RoundState.WAITING || serverReturnedToLobby) &&
        !shouldStartRound;

    return {
        clearAbandonedRequeue: !syncState.abandoned,
        clearLocalReadyRequest: syncState.clearLocalReadyRequest,
        enterGameOverState: shouldEnterGameOverState,
        enterLobbyState: shouldEnterLobbyState,
        playReadySound: syncState.clientBecameReady,
        renderHud: !shouldStartRound,
        scheduleAbandonedRequeue: !!syncState.abandoned,
        startRoundRitual: shouldStartRound,
        syncNameEditor: true,
        syncStoredPlayerName: true,
        syncPlayers: {
            localPlayerFirst: syncLobbySlots,
            localPlayerId: syncLobbySlots ? options.playerId : undefined,
            resetChangedSlots: options.roundState === RoundState.WAITING,
            resetExisting: serverReturnedToLobby || undefined,
            slots: syncLobbySlots
                ? Config.player.lobbySlots
                : getScenarioPlayerStarts(options.model)
        }
    };
}

function canStartRoundFromState(roundState: RoundState): boolean {
    return (
        roundState === RoundState.WAITING ||
        roundState === RoundState.HIT_PAUSE ||
        roundState === RoundState.ROUND_OVER
    );
}

function isServerLobbyPhase(phase?: GamePhase): boolean {
    return phase === 'waiting' || phase === 'readying';
}

function getScenarioPlayerStarts(model: PublicModel | null) {
    const starts =
        model && model.currentScenario && model.currentScenario.playerStarts;

    return starts && starts.length >= 2 ? starts : Config.player.slots;
}

export const ClientModelUpdatePlan = {
    create
};
