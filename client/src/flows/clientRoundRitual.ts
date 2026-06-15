import type { GamePhase } from '../../../shared/contracts.js';
import { Config } from '../platform/config.js';
import { RoundState } from '../state/clientScreens.js';
import { CLIENT_TIMER } from '../state/clientTimers.js';

const GAME_PHASE = {
    RoundIntro: 'roundIntro',
    Playing: 'playing'
} as const satisfies Record<string, GamePhase>;

type ClientRoundRitualOptions = {
    bullets: {
        reset: () => void;
    };
    closeNameEditor: () => void;
    getServerPhase: () => GamePhase | undefined;
    renderHud: () => void;
    resetAmmo: () => void;
    roundData: {
        clearObstacleDamage: () => void;
        startScenario: () => void;
    };
    roundIntro: {
        complete: () => void;
        start: () => void;
    };
    setRoundMessage: (message: string) => void;
    setRoundState: (roundState: RoundState) => void;
    timers: {
        set: (
            name: typeof CLIENT_TIMER.Ritual,
            callback: () => void,
            delay: number
        ) => void;
    };
};

export function start(options: ClientRoundRitualOptions) {
    const getReadyDelay = Math.max(
        Config.round.getReadyDelay,
        Config.round.introWalkDelay
    );

    options.setRoundState(RoundState.RITUAL);
    options.closeNameEditor();
    options.roundData.startScenario();
    options.roundData.clearObstacleDamage();
    options.bullets.reset();
    options.resetAmmo();
    options.roundIntro.start();
    options.setRoundMessage('GET READY');
    options.renderHud();

    options.timers.set(
        CLIENT_TIMER.Ritual,
        function () {
            if (!canShowRoundIntroPresentation(options)) {
                if (canEnterPlayingPresentation(options)) {
                    enterPlayingPresentation(options);
                }
                return;
            }

            options.roundIntro.complete();
            options.setRoundMessage('DRAW!');

            options.timers.set(
                CLIENT_TIMER.Ritual,
                function () {
                    if (!canEnterPlayingPresentation(options)) {
                        return;
                    }

                    enterPlayingPresentation(options);
                },
                Config.round.drawDelay
            );
        },
        getReadyDelay
    );
}

function canShowRoundIntroPresentation(
    options: ClientRoundRitualOptions
): boolean {
    const phase = options.getServerPhase();

    return phase === GAME_PHASE.RoundIntro;
}

function canEnterPlayingPresentation(
    options: ClientRoundRitualOptions
): boolean {
    const phase = options.getServerPhase();

    return phase === GAME_PHASE.RoundIntro || phase === GAME_PHASE.Playing;
}

function enterPlayingPresentation(options: ClientRoundRitualOptions) {
    options.setRoundMessage('');
    options.resetAmmo();
    options.setRoundState(RoundState.PLAYING);
    options.renderHud();
}

export const ClientRoundRitual = {
    start
};
