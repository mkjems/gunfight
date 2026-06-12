type MatchTimerOptions = {
    endGame: () => void;
    now?: () => number;
    roundData: {
        getRoundEndsAt(): number | null;
    };
    timers: {
        set(name: string, callback: () => void, delay: number): void;
    };
};

function defaultNow(): number {
    return new Date().getTime();
}

export function scheduleEnd(options: MatchTimerOptions): boolean {
    const roundEndsAt = options.roundData.getRoundEndsAt();
    const now = options.now || defaultNow;
    let delay: number;

    if (!roundEndsAt) {
        return false;
    }

    delay = Math.max(0, roundEndsAt - now());
    options.timers.set('matchEnd', options.endGame, delay);

    return true;
}

export const ClientMatchTimer = {
    scheduleEnd
};
