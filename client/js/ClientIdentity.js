GF.ClientIdentity = function (options) {
    options = options || {};

    var storage = options.storage || window.localStorage;
    var storageKey = options.storageKey || 'gunfight-player-name';
    var getClientName = options.getClientName;

    function getStoredPlayerName() {
        try {
            return storage.getItem(storageKey) || '';
        } catch (error) {
            return '';
        }
    }

    function storePlayerName(name) {
        if (!name) {
            return false;
        }

        try {
            storage.setItem(storageKey, name);
            return true;
        } catch (error) {
            return false;
        }
    }

    function syncStoredPlayerName(client) {
        if (!client) {
            return false;
        }

        return storePlayerName(getClientName(client));
    }

    function syncNameEditor(options) {
        var client = options.client;
        var editor = options.editor;
        var name;

        if (!editor || editor.isActive()) {
            return false;
        }

        if (!client) {
            return false;
        }

        name = getClientName(client);
        storePlayerName(name);
        editor.setName(name);

        return true;
    }

    return {
        getStoredPlayerName: getStoredPlayerName,
        storePlayerName: storePlayerName,
        syncNameEditor: syncNameEditor,
        syncStoredPlayerName: syncStoredPlayerName
    };
};
