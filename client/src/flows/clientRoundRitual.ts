import type { GamePhase } from '../../../shared/contracts.js';
import { Config } from '../platform/config.js';
import { RoundState } from '../state/clientScreens.js';

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
        set: (name: 'ritual', callback: () => void, delay: number) => void;
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
        'ritual',
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
                'ritual',
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

    return phase === 'roundIntro';
}

function canEnterPlayingPresentation(
    options: ClientRoundRitualOptions
): boolean {
    const phase = options.getServerPhase();

    return phase === 'roundIntro' || phase === 'playing';
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
