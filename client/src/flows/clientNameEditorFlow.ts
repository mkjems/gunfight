type UpdateNameSocket = {
    emit: (event: 'updateName', payload: { name: string }) => void;
};

type SubmitNameChangeOptions = {
    name?: string;
    socket?: UpdateNameSocket | null;
};

type SyncOptions = {
    client: unknown;
    editor: unknown;
    identity: {
        syncNameEditor: (options: {
            client: unknown;
            editor: unknown;
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

    options.socket.emit('updateName', {
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
