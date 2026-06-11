GF.ClientTouchEnvironment = (function () {
    function isTouchInterface(window) {
        if (window.location.search.indexOf('touch=1') >= 0) {
            return true;
        }

        return (
            window.matchMedia && window.matchMedia('(pointer: coarse)').matches
        );
    }

    return {
        isTouchInterface: isTouchInterface
    };
})();
