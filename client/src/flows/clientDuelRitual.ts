import type { GamePhase } from '../../../shared/contracts.js';
import { Config } from '../platform/config.js';
import { DuelState } from '../state/clientScreens.js';
import { CLIENT_TIMER } from '../state/clientTimers.js';

const GAME_PHASE = {
    DuelIntro: 'duelIntro',
    Playing: 'playing'
} as const satisfies Record<string, GamePhase>;

type ClientDuelRitualOptions = {
    bullets: {
        reset: () => void;
    };
    closeNameEditor: () => void;
    getServerPhase: () => GamePhase | undefined;
    renderHud: () => void;
    resetAmmo: () => void;
    duelData: {
        clearObstacleDamage: () => void;
        startScenario: () => void;
    };
    duelIntro: {
        complete: () => void;
        start: () => void;
    };
    setDuelMessage: (message: string) => void;
    setDuelState: (duelState: DuelState) => void;
    timers: {
        set: (
            name: typeof CLIENT_TIMER.Ritual,
            callback: () => void,
            delay: number
        ) => void;
    };
};

export function start(options: ClientDuelRitualOptions) {
    const getReadyDelay = Math.max(
        Config.duel.getReadyDelay,
        Config.duel.introWalkDelay
    );

    options.setDuelState(DuelState.RITUAL);
    options.closeNameEditor();
    options.duelData.startScenario();
    options.duelData.clearObstacleDamage();
    options.bullets.reset();
    options.resetAmmo();
    options.duelIntro.start();
    options.setDuelMessage('GET READY');
    options.renderHud();

    options.timers.set(
        CLIENT_TIMER.Ritual,
        function () {
            if (!canShowDuelIntroPresentation(options)) {
                if (canEnterPlayingPresentation(options)) {
                    enterPlayingPresentation(options);
                }
                return;
            }

            options.duelIntro.complete();
            options.setDuelMessage('DRAW!');

            options.timers.set(
                CLIENT_TIMER.Ritual,
                function () {
                    if (!canEnterPlayingPresentation(options)) {
                        return;
                    }

                    enterPlayingPresentation(options);
                },
                Config.duel.drawDelay
            );
        },
        getReadyDelay
    );
}

function canShowDuelIntroPresentation(
    options: ClientDuelRitualOptions
): boolean {
    const phase = options.getServerPhase();

    return phase === GAME_PHASE.DuelIntro;
}

function canEnterPlayingPresentation(
    options: ClientDuelRitualOptions
): boolean {
    const phase = options.getServerPhase();

    return phase === GAME_PHASE.DuelIntro || phase === GAME_PHASE.Playing;
}

function enterPlayingPresentation(options: ClientDuelRitualOptions) {
    options.setDuelMessage('');
    options.resetAmmo();
    options.setDuelState(DuelState.PLAYING);
    options.renderHud();
}

export const ClientDuelRitual = {
    start
};
