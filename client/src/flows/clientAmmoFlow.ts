import { DuelState } from '../state/clientScreens.js';

type AmmoClient = {
    id: number | string;
};

type AmmoModel = {
    clients?: AmmoClient[];
};

type ClientAmmoLike = {
    reloadIfAllEmpty: (clients?: AmmoClient[]) => boolean;
};

type ReloadIfBothPlayersAreOutOptions = {
    ammo: ClientAmmoLike;
    model?: AmmoModel | null;
    duelState: DuelState;
};

export function reloadIfBothPlayersAreOut(
    options: ReloadIfBothPlayersAreOutOptions
) {
    if (options.duelState !== DuelState.PLAYING || !options.model) {
        return false;
    }

    const clients = options.model.clients || [];

    if (clients.length < 2) {
        return false;
    }

    return options.ammo.reloadIfAllEmpty(clients);
}

export const ClientAmmoFlow = {
    reloadIfBothPlayersAreOut
};
