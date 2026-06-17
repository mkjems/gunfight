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
    slot?: number;
};

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
    resetChangedSlots?: boolean;
    resetExisting?: boolean;
    slots?: PlayerSlot[];
};

export class Players {
    all: Record<string, Controllable>;
    bullets: BulletsLike;
    scene: SceneLike;
    slots: PlayerSlot[];

    constructor(scene: SceneLike, bullets: BulletsLike) {
        this.scene = scene;
        this.bullets = bullets;
        this.all = {};
        this.slots = Config.player.slots;
    }

    getSlot(index: number, slotSet?: PlayerSlot[]): PlayerSlot {
        const slots: PlayerSlot[] = slotSet || this.slots;

        return slots[index % slots.length];
    }

    ensure(client: ClientLike, index: number, options: PlayersOptions = {}) {
        this.rememberSlots(options.slots);
        const slot = this.getSlot(index, options.slots);
        const id = client.id;

        if (this.all[id]) {
            const slotChanged = this.all[id].slot !== index;
            this.all[id].playerId = id;
            this.all[id].slot = index;
            this.all[id].facing = slot.facing;
            this.all[id].idleFrame = slot.frame;
            this.all[id].shootingStraightness =
                Config.bullet.defaultStraightness;
            this.all[id].setMovementBounds(slot.movementBounds);

            if (
                options.resetExisting ||
                (slotChanged && options.resetChangedSlots)
            ) {
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

    sync(model: { clients: ClientLike[] }, options: PlayersOptions = {}) {
        const activePlayers: Record<string, boolean> = {};

        model.clients.forEach((client, index) => {
            const slotIndex =
                typeof client.slot === 'number' ? client.slot : index;

            activePlayers[client.id] = true;
            this.ensure(client, slotIndex, options);
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
        this.rememberSlots(options.slots);

        Object.keys(this.all).forEach((id) => {
            const player = this.all[id];
            const slot = this.getSlot(player.slot || 0, options.slots);

            player.resetTo(slot);
        });
    }

    rememberSlots(slots?: PlayerSlot[]) {
        if (slots && slots.length > 0) {
            this.slots = slots;
        }
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
