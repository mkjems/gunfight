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
    status?: string;
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
    const shouldStartRound =
        options.roundState === RoundState.WAITING && syncState.readyToStart;
    const syncLobbySlots =
        options.roundState === RoundState.WAITING && !shouldStartRound;

    return {
        clearAbandonedRequeue: !syncState.abandoned,
        clearLocalReadyRequest: syncState.clearLocalReadyRequest,
        enterLobbyState: !!syncState.abandoned,
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
            slots: syncLobbySlots
                ? Config.player.lobbySlots
                : getScenarioPlayerStarts(options.model)
        }
    };
}

function getScenarioPlayerStarts(model: PublicModel | null) {
    const starts =
        model && model.currentScenario && model.currentScenario.playerStarts;

    return starts && starts.length >= 2 ? starts : Config.player.slots;
}

export const ClientModelUpdatePlan = {
    create
};
