type ClientId = number | string;

type HitMessage = {
    targetId?: ClientId;
    text?: string;
};

type ClientRoundStateOptions = {
    getTime?: () => number;
};

export function ClientRoundState(options: ClientRoundStateOptions = {}) {
    const getTime =
        options.getTime ||
        function () {
            return new Date().getTime();
        };
    let roundEndsAt: number | null = null;
    let roundMessage = '';
    let hitMessage: HitMessage | null = null;
    let scenarioStartedAt: number | null = null;
    let obstacleDamage: Record<string, number> = {};

    function resetRoundFlags(): void {
        roundEndsAt = null;
        hitMessage = null;
        obstacleDamage = {};
    }

    function clearRoundPauseFlags(): void {
        roundEndsAt = null;
        hitMessage = null;
    }

    function getSecondsLeft(defaultSeconds: number): number {
        if (!roundEndsAt) {
            return defaultSeconds;
        }

        return Math.max(0, Math.ceil((roundEndsAt - getTime()) / 1000));
    }

    function hasMatchTimeExpired(): boolean {
        return !!(roundEndsAt && getTime() >= roundEndsAt);
    }

    function setRoundEndsAt(value: number | null): void {
        roundEndsAt = value;
    }

    function getRoundEndsAt(): number | null {
        return roundEndsAt;
    }

    function clearRoundEnd(): void {
        roundEndsAt = null;
    }

    function setRoundMessage(message?: string): void {
        roundMessage = message || '';
    }

    function getRoundMessage(): string {
        return roundMessage;
    }

    function setHitMessage(message: HitMessage | null): void {
        hitMessage = message;
    }

    function getHitMessage(): HitMessage | null {
        return hitMessage;
    }

    function clearHitMessage(): void {
        hitMessage = null;
    }

    function startScenario(): void {
        scenarioStartedAt = getTime();
    }

    function getScenarioStartedAt(): number | null {
        return scenarioStartedAt;
    }

    function clearObstacleDamage(): void {
        obstacleDamage = {};
    }

    function getObstacleDamage(id: string): number {
        return obstacleDamage[id] || 0;
    }

    function damageObstacle(id: string): void {
        obstacleDamage[id] = getObstacleDamage(id) + 1;
    }

    return {
        clearHitMessage,
        clearObstacleDamage,
        clearRoundPauseFlags,
        clearRoundEnd,
        damageObstacle,
        getHitMessage,
        getObstacleDamage,
        getRoundEndsAt,
        getRoundMessage,
        getScenarioStartedAt,
        getSecondsLeft,
        hasMatchTimeExpired,
        resetRoundFlags,
        setHitMessage,
        setRoundEndsAt,
        setRoundMessage,
        startScenario
    };
}
