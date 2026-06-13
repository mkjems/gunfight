import { Config } from '../platform/config.js';
import { Controllable } from './controllable.js';

type SceneLike = {
    addFigure: (figure: Controllable) => void;
};

type BulletsLike = {
    remove: (id: string | number) => void;
};

type ClientLike = {
    id: string | number;
};

type ClientId = ClientLike['id'];

type PlayerSlot = {
    facing: number;
    frame: number;
    movementBounds?: {
        maxX: number;
        maxY: number;
        minX: number;
        minY: number;
    };
    x: number;
    y: number;
};

type PlayersOptions = {
    localPlayerFirst?: boolean;
    localPlayerId?: ClientId | null;
    resetChangedSlots?: boolean;
    slots?: PlayerSlot[];
};

export class Players {
    all: Record<string, Controllable>;
    bullets: BulletsLike;
    scene: SceneLike;

    constructor(scene: SceneLike, bullets: BulletsLike) {
        this.scene = scene;
        this.bullets = bullets;
        this.all = {};
    }

    getSlot(index: number, slotSet?: PlayerSlot[]): PlayerSlot {
        const slots: PlayerSlot[] = slotSet || Config.player.slots;

        return slots[index % slots.length];
    }

    ensure(client: ClientLike, index: number, options: PlayersOptions = {}) {
        const slot = this.getSlot(index, options.slots);
        const id = client.id;

        if (this.all[id]) {
            const slotChanged = this.all[id].slot !== index;
            this.all[id].playerId = id;
            this.all[id].slot = index;
            this.all[id].facing = slot.facing;
            this.all[id].idleFrame = slot.frame;
            this.all[id].setMovementBounds(slot.movementBounds);

            if (slotChanged && options.resetChangedSlots) {
                this.all[id].resetTo(slot);
            }

            return;
        }

        this.all[id] = new Controllable(slot.x, slot.y, {
            playerId: id,
            facing: slot.facing,
            frame: slot.frame
        });
        this.all[id].slot = index;
        this.all[id].setMovementBounds(slot.movementBounds);
        this.scene.addFigure(this.all[id]);
    }

    getOrderedClients(clients: ClientLike[], options: PlayersOptions = {}) {
        if (!options.localPlayerFirst || options.localPlayerId === undefined) {
            return clients;
        }

        const localClient = clients.find((client) => {
            return client.id === options.localPlayerId;
        });

        if (!localClient) {
            return clients;
        }

        return [
            localClient,
            ...clients.filter((client) => {
                return client.id !== options.localPlayerId;
            })
        ];
    }

    sync(model: { clients: ClientLike[] }, options: PlayersOptions = {}) {
        const activePlayers: Record<string, boolean> = {};
        const clients = this.getOrderedClients(model.clients, options);

        clients.forEach((client, index) => {
            activePlayers[client.id] = true;
            this.ensure(client, index, options);
        });

        Object.keys(this.all).forEach((id) => {
            if (!activePlayers[id]) {
                this.all[id].deleteMe = true;
                this.bullets.remove(id);
                delete this.all[id];
            }
        });
    }

    resetAll(options: PlayersOptions = {}) {
        Object.keys(this.all).forEach((id) => {
            const player = this.all[id];
            const slot = this.getSlot(player.slot || 0, options.slots);

            player.resetTo(slot);
        });
    }

    clearKeys() {
        Object.keys(this.all).forEach((id) => {
            this.all[id].clearKeys();
        });
    }

    label(id: string) {
        if (!this.all[id]) {
            return id;
        }

        return (this.all[id].slot || 0) + 1;
    }
}
