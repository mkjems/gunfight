import { CanvasTools } from './modules/canvasTools.js';
import { Camera } from './modules/camera.js';
import { ClientAmmoFlow } from './modules/clientAmmoFlow.js';
import { ClientAssets } from './modules/clientAssets.js';
import { ClientCameraController } from './modules/clientCameraController.js';
import { ClientCanvasSetup } from './modules/clientCanvasSetup.js';
import { ClientRuntimeCollisionEnvironment as ClientCollisionEnvironment } from './modules/clientRuntimeCollisionEnvironment.js';
import { ClientFrameFlow } from './modules/clientFrameFlow.js';
import { ClientGameLoop } from './modules/clientGameLoop.js';
import { ClientRuntimeGameSystems as ClientGameSystems } from './modules/clientRuntimeGameSystems.js';
import { ClientGameSounds } from './modules/clientGameSounds.js';
import { ClientHitDetection } from './modules/clientHitDetection.js';
import { ClientHudFlow } from './modules/clientHudFlow.js';
import { ClientIdentity } from './modules/clientIdentity.js';
import { ClientInputStartup } from './modules/clientInputStartup.js';
import { ClientKeyEventFlow } from './modules/clientKeyEventFlow.js';
import { ClientLobbyFlow } from './modules/clientLobbyFlow.js';
import { ClientLobbyHudFlow } from './modules/clientLobbyHudFlow.js';
import { Config } from './modules/config.js';
import { ClientLobbyViewModel } from './modules/clientLobbyViewModel.js';
import { ClientMatchTimer } from './modules/clientMatchTimer.js';
import { ClientModelSync } from './modules/clientModelSync.js';
import { ClientModelUpdateFlow } from './modules/clientModelUpdateFlow.js';
import { ClientNameEditorFlow } from './modules/clientNameEditorFlow.js';
import { ClientNetwork } from './modules/clientNetwork.js';
import { ClientObstacleSync } from './modules/clientObstacleSync.js';
import { ClientPlayerHitFlow } from './modules/clientPlayerHitFlow.js';
import { ClientRoundEndFlow } from './modules/clientRoundEndFlow.js';
import { ClientRoundResetFlow } from './modules/clientRoundResetFlow.js';
import { ClientRoundRitual } from './modules/clientRoundRitual.js';
import { ClientRoundTransition } from './modules/clientRoundTransition.js';
import { ClientScreens } from './modules/clientScreens.js';
import { ClientTouchEnvironment } from './modules/clientTouchEnvironment.js';
import { ClientTouchControlsFlow } from './modules/clientTouchControlsFlow.js';
import { Collision } from './modules/collision.js';
import { CollisionDebugRenderer } from './modules/collisionDebugRenderer.js';
import { AmmoHudRenderer } from './modules/ammoHudRenderer.js';
import { createGame, type ClientGameDependencies } from './modules/game.js';
import { ClientUi } from './modules/clientUi.js';
import { KeysModel } from './modules/keysModel.js';
import { NameEditor } from './modules/nameEditor.js';
import { Obstacles } from './modules/obstacles.js';
import { requestAnimFrame } from './modules/requestAnimationFrame.js';
import { ScenarioRenderer } from './modules/scenarioRenderer.js';
import { SoundEffects } from './modules/soundEffects.js';
import { TouchControls } from './modules/touchControls.js';

type GlobalWithSocketIo = typeof globalThis & {
    io?: unknown;
};

function loadScript(src: string): Promise<void> {
    if (
        src === '/socket.io/socket.io.js' &&
        (globalThis as GlobalWithSocketIo).io
    ) {
        return Promise.resolve();
    }

    return new Promise(function (resolve, reject) {
        const script = document.createElement('script');

        script.src = src;
        script.onload = function () {
            resolve();
        };
        script.onerror = function () {
            reject(new Error('Unable to load ' + src));
        };
        document.head.appendChild(script);
    });
}

await loadScript('/socket.io/socket.io.js');

const dependencies = {
    AmmoHudRenderer,
    Camera,
    CanvasTools,
    ClientAmmoFlow,
    ClientAssets,
    ClientCameraController,
    ClientCanvasSetup,
    ClientCollisionEnvironment,
    ClientFrameFlow,
    ClientGameLoop,
    ClientGameSystems,
    ClientGameSounds,
    ClientHitDetection,
    ClientHudFlow,
    ClientIdentity,
    ClientInputStartup,
    ClientKeyEventFlow,
    ClientLobbyFlow,
    ClientLobbyHudFlow,
    ClientLobbyViewModel,
    ClientMatchTimer,
    ClientModelSync,
    ClientModelUpdateFlow,
    ClientNameEditorFlow,
    ClientNetwork,
    ClientObstacleSync,
    ClientPlayerHitFlow,
    ClientRoundEndFlow,
    ClientRoundResetFlow,
    ClientRoundRitual,
    ClientRoundTransition,
    ClientScreens,
    ClientTouchControlsFlow,
    ClientTouchEnvironment,
    Collision,
    CollisionDebugRenderer,
    ClientUi,
    Config,
    KeysModel,
    NameEditor,
    Obstacles,
    requestAnimFrame,
    ScenarioRenderer,
    SoundEffects,
    TouchControls
} satisfies ClientGameDependencies;

createGame(dependencies, {
    document,
    Image,
    window
});
