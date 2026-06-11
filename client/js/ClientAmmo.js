GF.ClientAmmo = function (options) {
    options = options || {};

    var maxAmmo = options.maxAmmo || GF.Config.round.ammo;
    var ammo = {};

    function reset(clients) {
        ammo = {};

        (clients || []).forEach(function (client) {
            ammo[client.id] = maxAmmo;
        });
    }

    function get(playerId) {
        return ammo[playerId] || 0;
    }

    function hasAmmo(playerId) {
        return get(playerId) > 0;
    }

    function spend(playerId) {
        if (!hasAmmo(playerId)) {
            return false;
        }

        ammo[playerId]--;

        return true;
    }

    function reloadIfAllEmpty(clients) {
        clients = clients || [];

        if (clients.length < 2) {
            return false;
        }

        if (
            !clients.every(function (client) {
                return get(client.id) <= 0;
            })
        ) {
            return false;
        }

        reset(clients);

        return true;
    }

    return {
        get: get,
        hasAmmo: hasAmmo,
        reloadIfAllEmpty: reloadIfAllEmpty,
        reset: reset,
        spend: spend
    };
};
