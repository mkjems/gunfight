type ClientLike = {
    slot: number;
};

type GameModelLike = {
    clients?: ClientLike[];
    gameId?: string;
    roundNumber?: number;
};

type GameResult = {
    clients: Array<{
        name: string;
        slot: number;
    }>;
    gameId: string;
    resultId: string;
    roundNumber: number | undefined;
    scores: number[];
};

export function ScoreKeeper() {
    let scores = [0, 0];
    let lastRecordedResultId: string | null = null;

    function resetScores() {
        scores = [0, 0];
    }

    function resetRecordedResult() {
        lastRecordedResultId = null;
    }

    function addPoint(slot: number) {
        if (slot >= 0 && slot < scores.length) {
            scores[slot]++;
        }
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

    function createGameResult(
        model: GameModelLike | null | undefined,
        getClientName: (client: ClientLike) => string
    ): GameResult | null {
        if (!model || !model.gameId || !model.clients) {
            return null;
        }

        const resultId = model.gameId + ':' + model.roundNumber;

        if (lastRecordedResultId === resultId) {
            return null;
        }

        lastRecordedResultId = resultId;

        return {
            resultId,
            gameId: model.gameId,
            roundNumber: model.roundNumber,
            clients: model.clients.map(function (client) {
                return {
                    name: getClientName(client),
                    slot: client.slot
                };
            }),
            scores: getScores()
        };
    }

    return {
        addPoint,
        createGameResult,
        getGameOverMessage,
        getScore,
        getScores,
        resetRecordedResult,
        resetScores
    };
}
