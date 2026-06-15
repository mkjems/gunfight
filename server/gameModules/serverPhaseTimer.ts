import type {
    GamePhase,
    GameResultPayload,
    PublicGameModel
} from '../../shared/contracts.js';

export interface TimedPhaseLobby<GameSession> {
    getGame(gameId: string): GameSession | null;
    getModel(game: GameSession): PublicGameModel;
    startMatch(game: GameSession): boolean;
    enterPlaying(game: GameSession): GameResultPayload | null;
    finishMatch(game: GameSession): GameResultPayload | null;
    finishHitPause(game: GameSession): GameResultPayload | null;
    returnToLobbyAfterGameOver(game: GameSession): boolean;
}

export interface TimedPhaseAdvanceOptions<GameSession> {
    lobby: TimedPhaseLobby<GameSession>;
    gameId: string;
    version: number;
    phase: GamePhase;
}

export interface TimedPhaseAdvanceResult<GameSession> {
    advanced: boolean;
    game: GameSession | null;
    result: GameResultPayload | null;
}

export function advanceTimedGamePhase<GameSession>(
    options: TimedPhaseAdvanceOptions<GameSession>
): TimedPhaseAdvanceResult<GameSession> {
    const game = options.lobby.getGame(options.gameId);
    const model = game && options.lobby.getModel(game);
    let result: GameResultPayload | null = null;

    if (
        !game ||
        !model ||
        model.version !== options.version ||
        model.phase !== options.phase
    ) {
        return {
            advanced: false,
            game: game || null,
            result: null
        };
    }

    if (options.phase === 'readyCountdown') {
        options.lobby.startMatch(game);
    } else if (options.phase === 'roundIntro') {
        result = options.lobby.enterPlaying(game);
    } else if (options.phase === 'playing') {
        result = options.lobby.finishMatch(game);
    } else if (options.phase === 'hitPause') {
        result = options.lobby.finishHitPause(game);
    } else if (options.phase === 'gameOver') {
        options.lobby.returnToLobbyAfterGameOver(game);
    }

    return {
        advanced: true,
        game: game,
        result: result
    };
}
