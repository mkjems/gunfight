type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

type Client = {
    name?: string;
    slot?: number;
};

type NameEditor = {
    isActive: () => boolean;
    setName: (name: string) => void;
};

type ClientIdentityOptions = {
    getClientName: (client: Client) => string;
    storage?: StorageLike;
    storageKey?: string;
};

type SyncNameEditorOptions = {
    client?: Client | null;
    editor?: NameEditor | null;
};

export function ClientIdentity(options: ClientIdentityOptions) {
    const storage = options.storage || window.localStorage;
    const storageKey = options.storageKey || 'gunfight-player-name';
    const getClientName = options.getClientName;

    function getStoredPlayerName() {
        try {
            return storage.getItem(storageKey) || '';
        } catch {
            return '';
        }
    }

    function storePlayerName(name: string) {
        if (!name) {
            return false;
        }

        try {
            storage.setItem(storageKey, name);
            return true;
        } catch {
            return false;
        }
    }

    function syncStoredPlayerName(client?: Client | null) {
        if (!client) {
            return false;
        }

        return storePlayerName(getClientName(client));
    }

    function syncNameEditor(options: SyncNameEditorOptions) {
        const client = options.client;
        const editor = options.editor;

        if (!editor || editor.isActive()) {
            return false;
        }

        if (!client) {
            return false;
        }

        const name = getClientName(client);
        storePlayerName(name);
        editor.setName(name);

        return true;
    }

    return {
        getStoredPlayerName,
        storePlayerName,
        syncNameEditor,
        syncStoredPlayerName
    };
}
