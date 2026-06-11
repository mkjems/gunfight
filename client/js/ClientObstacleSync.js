GF.ClientObstacleSync = (function () {
    function handleLocalHit(options) {
        var hit = options.hit;
        var roundNumber = options.model && options.model.roundNumber;
        var payload;

        if (hit.bullet.ownerId !== options.playerId) {
            return false;
        }

        payload = {
            id: hit.obstacleId,
            ownerId: hit.bullet.ownerId,
            roundNumber: roundNumber
        };

        options.applyDamage(payload);
        options.socket.emit('obstacleDamage', payload);

        return true;
    }

    function applyDamage(options) {
        var data = options.data;

        if (options.model && data.roundNumber !== options.model.roundNumber) {
            return false;
        }

        options.damageObstacle(data.id);
        options.playObstacleHit(data.id);
        options.bullets.remove(data.ownerId);

        return true;
    }

    return {
        applyDamage: applyDamage,
        handleLocalHit: handleLocalHit
    };
})();
