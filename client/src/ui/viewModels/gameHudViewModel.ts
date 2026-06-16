import { RoundState } from '../../state/clientScreens.js';

type ClientId = number | string;

type Point = {
    x: number;
    y: number;
};

type PlayerPosition = {
    x: number;
    y: number;
};

type HitMessage = {
    targetId: ClientId;
    text: string;
};

type RoundData = {
    getHitMessage(): HitMessage | null;
    getRoundMessage(): string;
    getSecondsLeft(defaultSeconds: number): number;
};

type ScoreKeeper = {
    getScore(slot: number): number;
};

type CameraController = {
    worldToHudPoint(options: {
        camera: unknown;
        roundState: RoundState;
        x: number;
        y: number;
    }): Point;
};

type Players = {
    all: Record<ClientId, PlayerPosition>;
};

type HudOptions = {
    camera: unknown;
    cameraController: CameraController;
    defaultSeconds: number;
    players: Players;
    roundData: RoundData;
    roundState: RoundState;
    scoreKeeper: ScoreKeeper;
};

type TimerOptions = Pick<
    HudOptions,
    'defaultSeconds' | 'roundData' | 'roundState'
>;

type HitMessageOptions = Pick<
    HudOptions,
    'camera' | 'cameraController' | 'players' | 'roundData' | 'roundState'
>;

export function getState(options: HudOptions) {
    return {
        leftScore: options.scoreKeeper.getScore(0),
        rightScore: options.scoreKeeper.getScore(1),
        timerLabel: getTimerLabel(options),
        roundMessage: options.roundData.getRoundMessage(),
        hitMessage: getHitMessage(options)
    };
}

export function getTimerLabel(options: TimerOptions): number | string {
    if (options.roundState === RoundState.GAME_OVER) {
        return 'GAME OVER';
    }

    return options.roundData.getSecondsLeft(options.defaultSeconds);
}

export function getHitMessage(options: HitMessageOptions) {
    const hitMessage = options.roundData.getHitMessage();

    if (!hitMessage) {
        return null;
    }

    const target = options.players.all[hitMessage.targetId];

    if (!target) {
        return null;
    }

    const point = options.cameraController.worldToHudPoint({
        camera: options.camera,
        roundState: options.roundState,
        x: target.x,
        y: Math.max(80, target.y - 150)
    });

    return {
        text: hitMessage.text,
        x: point.x,
        y: point.y
    };
}

export const GameHudViewModel = {
    getHitMessage,
    getState,
    getTimerLabel
};
