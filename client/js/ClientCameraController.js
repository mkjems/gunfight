GF.ClientCameraController = function (options) {
    options = options || {};

    var win = options.window || window;
    var RoundState = GF.ClientScreens.RoundState;

    function shouldUseCamera(options) {
        if (!options.camera || options.roundState === RoundState.WAITING) {
            return false;
        }

        if (win.location.search.indexOf('camera=1') >= 0) {
            return true;
        }

        return win.matchMedia && win.matchMedia('(pointer: coarse)').matches;
    }

    function getCameraScale() {
        var queryScale = getQueryNumber('cameraScale');

        if (queryScale) {
            return queryScale;
        }

        if (win.location.search.indexOf('camera=1') >= 0) {
            return 1.85;
        }

        if (win.matchMedia && win.matchMedia('(pointer: coarse)').matches) {
            return 1.15;
        }

        return 1;
    }

    function getQueryNumber(name) {
        var match = new RegExp('[?&]' + name + '=([^&]+)').exec(
            win.location.search
        );
        var value = match ? parseFloat(decodeURIComponent(match[1])) : 0;

        return isNaN(value) ? 0 : value;
    }

    function update(options) {
        var camera = options.camera;
        var canvas = options.canvas;
        var visibleScreen;

        if (!camera) {
            return;
        }

        camera.setScreenSize(canvas.width, canvas.height);
        visibleScreen = getVisibleCanvasScreen(canvas);
        camera.setVisibleScreen(
            visibleScreen.x,
            visibleScreen.y,
            visibleScreen.width,
            visibleScreen.height
        );
        camera.setScale(getCameraScale());

        if (
            !shouldUseCamera({
                camera: camera,
                roundState: options.roundState
            })
        ) {
            camera.reset();
            return;
        }

        camera.follow(options.player);
    }

    function getVisibleCanvasScreen(canvas) {
        var rect = canvas.getBoundingClientRect();
        var visibleLeft = Math.max(0, rect.left);
        var visibleTop = Math.max(0, rect.top);
        var visibleRight = Math.min(win.innerWidth || rect.right, rect.right);
        var visibleBottom = Math.min(
            win.innerHeight || rect.bottom,
            rect.bottom
        );
        var scaleX = rect.width ? canvas.width / rect.width : 1;
        var scaleY = rect.height ? canvas.height / rect.height : 1;

        return {
            x: Math.max(0, (visibleLeft - rect.left) * scaleX),
            y: Math.max(0, (visibleTop - rect.top) * scaleY),
            width: Math.max(1, (visibleRight - visibleLeft) * scaleX),
            height: Math.max(1, (visibleBottom - visibleTop) * scaleY)
        };
    }

    function worldToHudPoint(options) {
        if (
            shouldUseCamera({
                camera: options.camera,
                roundState: options.roundState
            })
        ) {
            return {
                x: (options.x - options.camera.x) * options.camera.scale,
                y: (options.y - options.camera.y) * options.camera.scale
            };
        }

        return {
            x: options.x,
            y: options.y
        };
    }

    return {
        getCameraScale: getCameraScale,
        getVisibleCanvasScreen: getVisibleCanvasScreen,
        shouldUseCamera: shouldUseCamera,
        update: update,
        worldToHudPoint: worldToHudPoint
    };
};
