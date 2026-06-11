type AnimationFrameCallback = () => void;

type AnimationFrameWindow = {
    mozRequestAnimationFrame?: (callback: AnimationFrameCallback) => void;
    msRequestAnimationFrame?: (callback: AnimationFrameCallback) => void;
    oRequestAnimationFrame?: (callback: AnimationFrameCallback) => void;
    requestAnimationFrame?: (callback: AnimationFrameCallback) => void;
    setTimeout: (callback: AnimationFrameCallback, delay: number) => unknown;
    webkitRequestAnimationFrame?: (callback: AnimationFrameCallback) => void;
};

export function createRequestAnimFrame(ownerWindow: AnimationFrameWindow) {
    return (
        ownerWindow.requestAnimationFrame ||
        ownerWindow.webkitRequestAnimationFrame ||
        ownerWindow.mozRequestAnimationFrame ||
        ownerWindow.oRequestAnimationFrame ||
        ownerWindow.msRequestAnimationFrame ||
        function (callback: AnimationFrameCallback) {
            ownerWindow.setTimeout(callback, 1000 / 60);
        }
    );
}

export const requestAnimFrame =
    typeof window === 'undefined'
        ? function (callback: AnimationFrameCallback) {
              setTimeout(callback, 1000 / 60);
          }
        : createRequestAnimFrame(window as AnimationFrameWindow);
