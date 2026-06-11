import { RoundState } from './clientScreens.js';

type AmmoClient = {
    id: number | string;
};

type AmmoModel = {
    clients?: AmmoClient[];
};

type ClientAmmoLike = {
    reloadIfAllEmpty: (clients: AmmoClient[]) => boolean;
};

type ReloadIfBothPlayersAreOutOptions = {
    ammo: ClientAmmoLike;
    model?: AmmoModel | null;
    roundState: RoundState;
};

export function reloadIfBothPlayersAreOut(
    options: ReloadIfBothPlayersAreOutOptions
) {
    if (options.roundState !== RoundState.PLAYING || !options.model) {
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
