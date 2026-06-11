GF.ClientNameEditorFlow = (function () {
    function submitNameChange(options) {
        if (!options.socket) {
            return false;
        }

        options.socket.emit('updateName', {
            name: options.name || ''
        });

        return true;
    }

    function sync(options) {
        return options.identity.syncNameEditor({
            client: options.client,
            editor: options.editor
        });
    }

    function close(editor) {
        if (!editor || !editor.isActive()) {
            return false;
        }

        editor.close();

        return true;
    }

    return {
        close: close,
        submitNameChange: submitNameChange,
        sync: sync
    };
})();
