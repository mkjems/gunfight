import { Config } from '../platform/config.js';

type PlayerSlot = {
    facing: number;
    frame: number;
    x: number;
    y: number;
};

type PlayerLike = {
    animationFrameTime: number;
    animationFrames: number[];
    frame: number;
    getBounds: () => {
        maxX: number;
        minX: number;
    };
    resetTo: (slot: PlayerSlot) => void;
    slot: number;
    x: number;
    y: number;
};

type PlayersLike = {
    all: Record<string, PlayerLike>;
    clearKeys: () => void;
};

type RoundIntroOptions = {
    now?: () => number;
    players: PlayersLike;
};

type IntroTarget = {
    fromX: number;
    fromY: number;
    idleFrame: number;
    player: PlayerLike;
    toX: number;
    toY: number;
};

type IntroState = {
    duration: number;
    startedAt: number;
    targets: IntroTarget[];
};

export function RoundIntro(options: RoundIntroOptions) {
    const players = options.players;
    const now =
        options.now ||
        function () {
            return new Date().getTime();
        };
    let intro: IntroState | null = null;

    function start() {
        const startedAt = now();
        const duration = Config.round.introWalkDelay;
        const targets: IntroTarget[] = [];

        players.clearKeys();

        Object.keys(players.all).forEach(function (id) {
            const player = players.all[id];
            const slot =
                Config.player.slots[player.slot % Config.player.slots.length];

            player.resetTo(slot);
            const bounds = player.getBounds();

            targets.push({
                player,
                fromX: slot.facing > 0 ? bounds.minX : bounds.maxX,
                fromY: slot.y,
                toX: slot.x,
                toY: slot.y,
                idleFrame: slot.frame
            });
        });

        intro = {
            startedAt,
            duration,
            targets
        };

        update();
    }

    function update() {
        if (!intro) {
            return;
        }

        const elapsed = now() - intro.startedAt;
        const progress = Math.min(1, Math.max(0, elapsed / intro.duration));
        const eased = 1 - Math.pow(1 - progress, 3);

        intro.targets.forEach(function (target) {
            const player = target.player;

            player.x = target.fromX + (target.toX - target.fromX) * eased;
            player.y = target.fromY + (target.toY - target.fromY) * eased;
            player.frame =
                player.animationFrames[
                    Math.floor(elapsed / (player.animationFrameTime * 1000)) %
                        player.animationFrames.length
                ];
        });

        if (progress >= 1) {
            complete();
        }
    }

    function complete() {
        if (!intro) {
            return;
        }

        intro.targets.forEach(function (target) {
            target.player.x = target.toX;
            target.player.y = target.toY;
            target.player.frame = target.idleFrame;
        });

        intro = null;
    }

    function clear() {
        intro = null;
    }

    return {
        clear,
        complete,
        start,
        update
    };
}
