type ClientLike = {
    slot: number;
};

export function ScoreKeeper() {
    let scores = [0, 0];

    function normalizeScore(score: unknown): number {
        const value = Number(score);

        if (!Number.isFinite(value) || value < 0) {
            return 0;
        }

        return Math.floor(value);
    }

    function resetScores() {
        scores = [0, 0];
    }

    function setScores(nextScores: unknown) {
        if (!Array.isArray(nextScores)) {
            return false;
        }

        scores = [normalizeScore(nextScores[0]), normalizeScore(nextScores[1])];

        return true;
    }

    function getScores() {
        return scores.slice();
    }

    function getScore(slot: number) {
        return scores[slot] || 0;
    }

    function getFinalScoreLabel() {
        return getScore(0) + '-' + getScore(1);
    }

    function getWinnerSlot() {
        if (getScore(0) === getScore(1)) {
            return -1;
        }

        return getScore(0) > getScore(1) ? 0 : 1;
    }

    function getGameOverMessage(
        clients: ClientLike[] | null | undefined,
        getClientName: (client: ClientLike) => string
    ) {
        const winnerSlot = getWinnerSlot();
        const scoreLabel = getFinalScoreLabel();

        if (winnerSlot < 0) {
            return 'TIE ' + scoreLabel;
        }

        const winnerClient = clients && clients[winnerSlot];

        return (
            (winnerClient
                ? getClientName(winnerClient)
                : 'PLAYER ' + (winnerSlot + 1)) +
            ' WINS ' +
            scoreLabel
        );
    }

    return {
        getGameOverMessage,
        getScore,
        getScores,
        resetScores,
        setScores
    };
}
