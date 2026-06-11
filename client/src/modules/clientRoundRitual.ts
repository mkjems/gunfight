import { Config } from './config.js';
import { RoundState } from './clientScreens.js';

type ClientRoundRitualOptions = {
    bullets: {
        reset: () => void;
    };
    closeNameEditor: () => void;
    endGame: () => void;
    hasMatchTimeExpired: () => boolean;
    renderHud: () => void;
    resetAmmo: () => void;
    resetScores?: boolean;
    roundData: {
        clearObstacleDamage: () => void;
        clearRoundEnd: () => void;
        getRoundEndsAt: () => number | null | undefined;
        setRoundEndsAt: (value: number) => void;
        startScenario: () => void;
    };
    roundIntro: {
        complete: () => void;
        start: () => void;
    };
    scheduleMatchEnd: () => void;
    scoreKeeper: {
        resetScores: () => void;
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

    if (options.resetScores) {
        options.scoreKeeper.resetScores();
        options.roundData.clearRoundEnd();
    }

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
            if (options.hasMatchTimeExpired()) {
                options.endGame();
                return;
            }

            options.roundIntro.complete();
            options.setRoundMessage('DRAW!');

            options.timers.set(
                'ritual',
                function () {
                    if (options.hasMatchTimeExpired()) {
                        options.endGame();
                        return;
                    }

                    options.setRoundMessage('');
                    if (!options.roundData.getRoundEndsAt()) {
                        options.roundData.setRoundEndsAt(
                            new Date().getTime() + Config.game.seconds * 1000
                        );
                        options.scheduleMatchEnd();
                    }
                    options.resetAmmo();
                    options.setRoundState(RoundState.PLAYING);
                    options.renderHud();
                },
                Config.round.drawDelay
            );
        },
        getReadyDelay
    );
}

export const ClientRoundRitual = {
    start
};
