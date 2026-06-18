import { create } from './clientModelUpdatePlan.js';

type CreatePlanOptions = Parameters<typeof create>[0];
type ModelUpdatePlan = ReturnType<typeof create>;
type CreatePlan = (options: CreatePlanOptions) => ModelUpdatePlan;
type PublicModel = CreatePlanOptions['model'];

type SyncOptions = {
    clearAbandonedRequeue: () => void;
    clearLocalReadyRequest: () => void;
    enterGameOverState: () => void;
    enterLobbyState: () => void;
    model: PublicModel;
    playerId?: CreatePlanOptions['playerId'];
    players: {
        sync(model: PublicModel, options: ModelUpdatePlan['syncPlayers']): void;
    };
    playReadySound: () => void;
    previousModel: PublicModel;
    renderHud: () => void;
    duelState: CreatePlanOptions['duelState'];
    scheduleAbandonedRequeue: () => void;
    startDuelRitual: () => void;
    syncNameEditor: () => void;
    syncStoredPlayerName: () => void;
};

export function sync(options: SyncOptions, createPlan: CreatePlan = create) {
    const plan = createPlan({
        model: options.model,
        playerId: options.playerId,
        previousModel: options.previousModel,
        duelState: options.duelState
    });

    if (plan.clearLocalReadyRequest) {
        options.clearLocalReadyRequest();
    }

    if (plan.syncStoredPlayerName) {
        options.syncStoredPlayerName();
    }

    if (plan.enterLobbyState) {
        options.enterLobbyState();
    }

    if (plan.scheduleAbandonedRequeue) {
        options.scheduleAbandonedRequeue();
    }

    if (plan.clearAbandonedRequeue) {
        options.clearAbandonedRequeue();
    }

    if (plan.playReadySound) {
        options.playReadySound();
    }

    options.players.sync(options.model, plan.syncPlayers);

    if (plan.syncNameEditor) {
        options.syncNameEditor();
    }

    if (plan.startDuelRitual) {
        options.startDuelRitual();
        return plan;
    }

    if (plan.renderHud) {
        options.renderHud();
    }

    if (plan.enterGameOverState) {
        options.enterGameOverState();
    }

    return plan;
}

export const ClientModelUpdateFlow = {
    sync
};
