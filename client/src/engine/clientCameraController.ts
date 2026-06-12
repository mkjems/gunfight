import { RoundState } from '../state/clientScreens.js';

type WindowLike = Pick<
    Window,
    'innerHeight' | 'innerWidth' | 'location' | 'matchMedia'
>;

type Camera = {
    scale: number;
    x: number;
    y: number;
    follow: (player: unknown) => void;
    reset: () => void;
    setScale: (scale: number) => void;
    setScreenSize: (width: number, height: number) => void;
    setVisibleScreen: (
        x: number,
        y: number,
        width: number,
        height: number
    ) => void;
};

type CanvasLike = Pick<
    HTMLCanvasElement,
    'height' | 'width' | 'getBoundingClientRect'
>;

type ClientCameraControllerOptions = {
    window?: WindowLike;
};

type CameraRoundOptions = {
    camera?: Camera | null;
    roundState: RoundState;
};

type UpdateOptions = {
    camera?: Camera | null;
    canvas: CanvasLike;
    player: unknown;
    roundState: RoundState;
};

type WorldToHudPointOptions = CameraRoundOptions & {
    x: number;
    y: number;
};

export function ClientCameraController(
    options: ClientCameraControllerOptions = {}
) {
    const win = options.window || window;

    function shouldUseCamera(options: CameraRoundOptions) {
        if (!options.camera || options.roundState === RoundState.WAITING) {
            return false;
        }

        if (win.location.search.indexOf('camera=1') >= 0) {
            return true;
        }

        return win.matchMedia && win.matchMedia('(pointer: coarse)').matches;
    }

    function getCameraScale() {
        const queryScale = getQueryNumber('cameraScale');

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

    function getQueryNumber(name: string) {
        const match = new RegExp('[?&]' + name + '=([^&]+)').exec(
            win.location.search
        );
        const value = match ? parseFloat(decodeURIComponent(match[1])) : 0;

        return isNaN(value) ? 0 : value;
    }

    function update(options: UpdateOptions) {
        const camera = options.camera;

        if (!camera) {
            return;
        }

        camera.setScreenSize(options.canvas.width, options.canvas.height);
        const visibleScreen = getVisibleCanvasScreen(options.canvas);
        camera.setVisibleScreen(
            visibleScreen.x,
            visibleScreen.y,
            visibleScreen.width,
            visibleScreen.height
        );
        camera.setScale(getCameraScale());

        if (
            !shouldUseCamera({
                camera,
                roundState: options.roundState
            })
        ) {
            camera.reset();
            return;
        }

        camera.follow(options.player);
    }

    function getVisibleCanvasScreen(canvas: CanvasLike) {
        const rect = canvas.getBoundingClientRect();
        const visibleLeft = Math.max(0, rect.left);
        const visibleTop = Math.max(0, rect.top);
        const visibleRight = Math.min(win.innerWidth || rect.right, rect.right);
        const visibleBottom = Math.min(
            win.innerHeight || rect.bottom,
            rect.bottom
        );
        const scaleX = rect.width ? canvas.width / rect.width : 1;
        const scaleY = rect.height ? canvas.height / rect.height : 1;

        return {
            x: Math.max(0, (visibleLeft - rect.left) * scaleX),
            y: Math.max(0, (visibleTop - rect.top) * scaleY),
            width: Math.max(1, (visibleRight - visibleLeft) * scaleX),
            height: Math.max(1, (visibleBottom - visibleTop) * scaleY)
        };
    }

    function worldToHudPoint(options: WorldToHudPointOptions) {
        const camera = options.camera;

        if (
            camera &&
            shouldUseCamera({
                camera,
                roundState: options.roundState
            })
        ) {
            return {
                x: (options.x - camera.x) * camera.scale,
                y: (options.y - camera.y) * camera.scale
            };
        }

        return {
            x: options.x,
            y: options.y
        };
    }

    return {
        getCameraScale,
        getVisibleCanvasScreen,
        shouldUseCamera,
        update,
        worldToHudPoint
    };
}
