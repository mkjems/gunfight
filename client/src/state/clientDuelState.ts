type ClientId = number | string;

type HitMessage = {
    targetId?: ClientId;
    text?: string;
};

type ClientDuelStateOptions = {
    getTime?: () => number;
};

export function ClientDuelState(options: ClientDuelStateOptions = {}) {
    const getTime =
        options.getTime ||
        function () {
            return new Date().getTime();
        };
    let matchEndsAt: number | null = null;
    let duelMessage = '';
    let hitMessage: HitMessage | null = null;
    let scenarioStartedAt: number | null = null;
    let obstacleDamage: Record<string, number> = {};

    function resetDuelFlags(): void {
        matchEndsAt = null;
        hitMessage = null;
        obstacleDamage = {};
    }

    function clearDuelPauseFlags(): void {
        matchEndsAt = null;
        hitMessage = null;
    }

    function getSecondsLeft(defaultSeconds: number): number {
        if (!matchEndsAt) {
            return defaultSeconds;
        }

        return Math.max(0, Math.ceil((matchEndsAt - getTime()) / 1000));
    }

    function setMatchEndsAt(value: number | null): void {
        matchEndsAt = value;
    }

    function getMatchEndsAt(): number | null {
        return matchEndsAt;
    }

    function clearMatchEnd(): void {
        matchEndsAt = null;
    }

    function setDuelMessage(message?: string): void {
        duelMessage = message || '';
    }

    function getDuelMessage(): string {
        return duelMessage;
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
        clearDuelPauseFlags,
        clearMatchEnd,
        damageObstacle,
        getHitMessage,
        getObstacleDamage,
        getMatchEndsAt,
        getDuelMessage,
        getScenarioStartedAt,
        getSecondsLeft,
        resetDuelFlags,
        setHitMessage,
        setMatchEndsAt,
        setDuelMessage,
        startScenario
    };
}
