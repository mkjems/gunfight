GF.ClientRoundState = function (options) {
    options = options || {};

    var getTime =
        options.getTime ||
        function () {
            return new Date().getTime();
        };
    var roundEndsAt = null;
    var roundMessage = '';
    var hitMessage = null;
    var scenarioStartedAt = null;
    var advanceRoundAfterHit = false;
    var obstacleDamage = {};

    function resetRoundFlags() {
        roundEndsAt = null;
        hitMessage = null;
        advanceRoundAfterHit = false;
        obstacleDamage = {};
    }

    function clearRoundPauseFlags() {
        roundEndsAt = null;
        hitMessage = null;
        advanceRoundAfterHit = false;
    }

    function getSecondsLeft(defaultSeconds) {
        if (!roundEndsAt) {
            return defaultSeconds;
        }

        return Math.max(0, Math.ceil((roundEndsAt - getTime()) / 1000));
    }

    function hasMatchTimeExpired() {
        return !!(roundEndsAt && getTime() >= roundEndsAt);
    }

    function setRoundEndsAt(value) {
        roundEndsAt = value;
    }

    function getRoundEndsAt() {
        return roundEndsAt;
    }

    function clearRoundEnd() {
        roundEndsAt = null;
    }

    function setRoundMessage(message) {
        roundMessage = message || '';
    }

    function getRoundMessage() {
        return roundMessage;
    }

    function setHitMessage(message) {
        hitMessage = message;
    }

    function getHitMessage() {
        return hitMessage;
    }

    function clearHitMessage() {
        hitMessage = null;
    }

    function startScenario() {
        scenarioStartedAt = getTime();
    }

    function getScenarioStartedAt() {
        return scenarioStartedAt;
    }

    function setAdvanceRoundAfterHit(value) {
        advanceRoundAfterHit = !!value;
    }

    function shouldAdvanceRoundAfterHit() {
        return advanceRoundAfterHit;
    }

    function consumeAdvanceRoundAfterHit() {
        var shouldAdvance = advanceRoundAfterHit;

        advanceRoundAfterHit = false;

        return shouldAdvance;
    }

    function clearObstacleDamage() {
        obstacleDamage = {};
    }

    function getObstacleDamage(id) {
        return obstacleDamage[id] || 0;
    }

    function damageObstacle(id) {
        obstacleDamage[id] = getObstacleDamage(id) + 1;
    }

    return {
        clearHitMessage: clearHitMessage,
        clearObstacleDamage: clearObstacleDamage,
        clearRoundPauseFlags: clearRoundPauseFlags,
        clearRoundEnd: clearRoundEnd,
        consumeAdvanceRoundAfterHit: consumeAdvanceRoundAfterHit,
        damageObstacle: damageObstacle,
        getHitMessage: getHitMessage,
        getObstacleDamage: getObstacleDamage,
        getRoundEndsAt: getRoundEndsAt,
        getRoundMessage: getRoundMessage,
        getScenarioStartedAt: getScenarioStartedAt,
        getSecondsLeft: getSecondsLeft,
        hasMatchTimeExpired: hasMatchTimeExpired,
        resetRoundFlags: resetRoundFlags,
        setAdvanceRoundAfterHit: setAdvanceRoundAfterHit,
        setHitMessage: setHitMessage,
        setRoundEndsAt: setRoundEndsAt,
        setRoundMessage: setRoundMessage,
        shouldAdvanceRoundAfterHit: shouldAdvanceRoundAfterHit,
        startScenario: startScenario
    };
};
