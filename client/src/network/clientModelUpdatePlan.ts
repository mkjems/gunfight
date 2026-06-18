import type { GamePhase, MatchState } from '../../../shared/contracts.js';
import { Config } from '../platform/config.js';
import { analyze } from './clientModelSync.js';
import { DuelState } from '../state/clientScreens.js';

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
    matchState?: MatchState;
    phase?: GamePhase;
    duelNumber?: number;
};

type CreatePlanOptions = {
    model: PublicModel | null;
    playerId?: ClientId | null;
    previousModel: PublicModel | null;
    duelState: DuelState;
};

const MATCH_STATE = {
    GameOver: 'gameOver'
} as const satisfies Record<string, MatchState>;

const GAME_PHASE = {
    GameOver: 'gameOver',
    HitPause: 'hitPause',
    Playing: 'playing',
    Waiting: 'waiting',
    Readying: 'readying',
    DuelIntro: 'duelIntro'
} as const satisfies Record<string, GamePhase>;

export function create(options: CreatePlanOptions) {
    const syncState = analyze(
        options.previousModel,
        options.model,
        options.playerId
    );
    const serverStartedDuel =
        options.model?.phase === GAME_PHASE.DuelIntro &&
        options.previousModel?.phase !== GAME_PHASE.DuelIntro;
    const shouldStartDuel =
        canStartDuelFromState(options.duelState) && serverStartedDuel;
    const serverReturnedToLobby =
        isServerLobbyPhase(options.model?.phase) &&
        options.duelState !== DuelState.WAITING;
    const shouldEnterLobbyState =
        !!syncState.abandoned || serverReturnedToLobby;
    const shouldEnterGameOverState =
        options.model?.matchState === MATCH_STATE.GameOver &&
        options.duelState !== DuelState.WAITING &&
        options.duelState !== DuelState.GAME_OVER;
    const syncLobbySlots =
        (options.duelState === DuelState.WAITING || serverReturnedToLobby) &&
        !shouldStartDuel;

    return {
        clearAbandonedRequeue: !syncState.abandoned,
        clearLocalReadyRequest: syncState.clearLocalReadyRequest,
        enterGameOverState: shouldEnterGameOverState,
        enterLobbyState: shouldEnterLobbyState,
        playReadySound: syncState.clientBecameReady,
        renderHud: !shouldStartDuel,
        scheduleAbandonedRequeue: !!syncState.abandoned,
        startDuelRitual: shouldStartDuel,
        syncNameEditor: true,
        syncStoredPlayerName: true,
        syncPlayers: {
            resetChangedSlots: options.duelState === DuelState.WAITING,
            resetExisting: serverReturnedToLobby || undefined,
            duelNumber: syncLobbySlots ? undefined : options.model?.duelNumber,
            showStraightnessMeter: isGameplayPresentationPhase(
                options.model?.phase
            ),
            slots: syncLobbySlots
                ? Config.player.lobbySlots
                : getScenarioPlayerStarts(options.model)
        }
    };
}

function canStartDuelFromState(duelState: DuelState): boolean {
    return (
        duelState === DuelState.WAITING ||
        duelState === DuelState.HIT_PAUSE ||
        duelState === DuelState.DUEL_OVER
    );
}

function isServerLobbyPhase(phase?: GamePhase): boolean {
    return phase === GAME_PHASE.Waiting || phase === GAME_PHASE.Readying;
}

function isGameplayPresentationPhase(phase?: GamePhase): boolean {
    return (
        phase === GAME_PHASE.DuelIntro ||
        phase === GAME_PHASE.Playing ||
        phase === GAME_PHASE.HitPause ||
        phase === GAME_PHASE.GameOver
    );
}

function getScenarioPlayerStarts(model: PublicModel | null) {
    const starts =
        model && model.currentScenario && model.currentScenario.playerStarts;

    return starts && starts.length >= 2 ? starts : Config.player.slots;
}

export const ClientModelUpdatePlan = {
    create
};
