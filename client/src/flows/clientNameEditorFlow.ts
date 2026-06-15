import type { SocketEvent } from '../../../shared/contracts.js';

const SOCKET_EVENT = {
    UpdateName: 'updateName'
} as const satisfies Record<string, SocketEvent>;

type UpdateNameSocket = {
    emit: (
        event: typeof SOCKET_EVENT.UpdateName,
        payload: { name: string }
    ) => void;
};

type SubmitNameChangeOptions = {
    name?: string;
    socket?: UpdateNameSocket | null;
};

type SyncClient = {
    name?: string;
    slot?: number;
};

type SyncEditor = {
    isActive: () => boolean;
    setName: (name: string) => void;
};

type SyncOptions = {
    client?: SyncClient | null;
    editor?: SyncEditor | null;
    identity: {
        syncNameEditor: (options: {
            client?: SyncClient | null;
            editor?: SyncEditor | null;
        }) => boolean;
    };
};

type NameEditor = {
    close: () => void;
    isActive: () => boolean;
};

export function submitNameChange(options: SubmitNameChangeOptions) {
    if (!options.socket) {
        return false;
    }

    options.socket.emit(SOCKET_EVENT.UpdateName, {
        name: options.name || ''
    });

    return true;
}

export function sync(options: SyncOptions) {
    return options.identity.syncNameEditor({
        client: options.client,
        editor: options.editor
    });
}

export function close(editor?: NameEditor | null) {
    if (!editor || !editor.isActive()) {
        return false;
    }

    editor.close();

    return true;
}

export const ClientNameEditorFlow = {
    close,
    submitNameChange,
    sync
};
