import { Config } from '../platform/config.js';

type ClientId = number | string;

type AmmoClient = {
    id: ClientId;
};

type ClientAmmoOptions = {
    maxAmmo?: number;
};

export function ClientAmmo(options: ClientAmmoOptions = {}) {
    const maxAmmo = options.maxAmmo || Config.round.ammo;
    let ammo: Record<string, number> = {};

    function reset(clients: AmmoClient[] = []) {
        ammo = {};

        clients.forEach(function (client) {
            ammo[client.id] = maxAmmo;
        });
    }

    function get(playerId: ClientId) {
        return ammo[playerId] || 0;
    }

    function hasAmmo(playerId: ClientId) {
        return get(playerId) > 0;
    }

    function spend(playerId: ClientId) {
        if (!hasAmmo(playerId)) {
            return false;
        }

        ammo[playerId]--;

        return true;
    }

    function reloadIfAllEmpty(clients: AmmoClient[] = []) {
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
        get,
        hasAmmo,
        reloadIfAllEmpty,
        reset,
        spend
    };
}
