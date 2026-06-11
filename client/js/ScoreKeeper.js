GF.ScoreKeeper = function () {
    var scores = [0, 0];
    var lastRecordedResultId = null;

    function resetScores() {
        scores = [0, 0];
    }

    function resetRecordedResult() {
        lastRecordedResultId = null;
    }

    function addPoint(slot) {
        if (slot >= 0 && slot < scores.length) {
            scores[slot]++;
        }
    }

    function getScores() {
        return scores.slice();
    }

    function getScore(slot) {
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

    function getGameOverMessage(clients, getClientName) {
        var winnerSlot = getWinnerSlot();
        var winnerClient;
        var scoreLabel = getFinalScoreLabel();

        if (winnerSlot < 0) {
            return 'TIE ' + scoreLabel;
        }

        winnerClient = clients && clients[winnerSlot];

        return (
            (winnerClient
                ? getClientName(winnerClient)
                : 'PLAYER ' + (winnerSlot + 1)) +
            ' WINS ' +
            scoreLabel
        );
    }

    function createGameResult(model, getClientName) {
        var resultId;

        if (!model || !model.gameId || !model.clients) {
            return null;
        }

        resultId = model.gameId + ':' + model.roundNumber;

        if (lastRecordedResultId === resultId) {
            return null;
        }

        lastRecordedResultId = resultId;

        return {
            resultId: resultId,
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
        addPoint: addPoint,
        createGameResult: createGameResult,
        getGameOverMessage: getGameOverMessage,
        getScore: getScore,
        getScores: getScores,
        resetRecordedResult: resetRecordedResult,
        resetScores: resetScores
    };
};
