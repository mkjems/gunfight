import { CanvasTools } from './modules/canvasTools.js';
import { Camera } from './modules/camera.js';
import { Bullet } from './modules/bullet.js';
import { Bullets } from './modules/bullets.js';
import { ClientAmmo } from './modules/clientAmmo.js';
import { ClientAmmoFlow } from './modules/clientAmmoFlow.js';
import { ClientAssets } from './modules/clientAssets.js';
import { ClientCameraController } from './modules/clientCameraController.js';
import { ClientCanvasSetup } from './modules/clientCanvasSetup.js';
import { ClientCollisionEnvironment } from './modules/clientCollisionEnvironment.js';
import { ClientFrameFlow } from './modules/clientFrameFlow.js';
import { ClientGameplayInput } from './modules/clientGameplayInput.js';
import { ClientGameLoop } from './modules/clientGameLoop.js';
import { ClientGameSystems } from './modules/clientGameSystems.js';
import { ClientGameSounds } from './modules/clientGameSounds.js';
import { ClientHitDetection } from './modules/clientHitDetection.js';
import { ClientHudFlow } from './modules/clientHudFlow.js';
import { ClientHudOverlay } from './modules/clientHudOverlay.js';
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
import { ClientModelUpdatePlan } from './modules/clientModelUpdatePlan.js';
import { ClientNameEditorFlow } from './modules/clientNameEditorFlow.js';
import { ClientNetwork } from './modules/clientNetwork.js';
import { ClientObstacleSync } from './modules/clientObstacleSync.js';
import { ClientPlayerHitFlow } from './modules/clientPlayerHitFlow.js';
import { ClientRoundEndFlow } from './modules/clientRoundEndFlow.js';
import { ClientRoundResetFlow } from './modules/clientRoundResetFlow.js';
import { ClientRoundRitual } from './modules/clientRoundRitual.js';
import { ClientRoundState } from './modules/clientRoundState.js';
import { ClientRoundTransition } from './modules/clientRoundTransition.js';
import { ClientScreens } from './modules/clientScreens.js';
import { ClientTouchEnvironment } from './modules/clientTouchEnvironment.js';
import { ClientTouchState } from './modules/clientTouchState.js';
import { ClientTouchControlsFlow } from './modules/clientTouchControlsFlow.js';
import { ClientTimers } from './modules/clientTimers.js';
import { Collision } from './modules/collision.js';
import { CollisionDebugRenderer } from './modules/collisionDebugRenderer.js';
import { AmmoHudRenderer } from './modules/ammoHudRenderer.js';
import { Color } from './modules/color.js';
import { Controllable } from './modules/controllable.js';
import { createGame, type ClientGameDependencies } from './modules/game.js';
import { GameHud } from './modules/gameHud.js';
import { GameHudViewModel } from './modules/gameHudViewModel.js';
import { HighScoresScreen } from './modules/highScoresScreen.js';
import { InstallPrompt } from './modules/installPrompt.js';
import { KeysModel } from './modules/keysModel.js';
import { LobbyScreen } from './modules/lobbyScreen.js';
import { NameEditorScreen } from './modules/nameEditorScreen.js';
import { NameEditor } from './modules/nameEditor.js';
import { Obstacles } from './modules/obstacles.js';
import { Pen } from './modules/pen.js';
import { Players } from './modules/players.js';
import { PlayerPositionSync } from './modules/playerPositionSync.js';
import { requestAnimFrame } from './modules/requestAnimationFrame.js';
import { RoundIntro } from './modules/roundIntro.js';
import { ScenarioRenderer } from './modules/scenarioRenderer.js';
import { Scene } from './modules/scene.js';
import { ScoreKeeper } from './modules/scoreKeeper.js';
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
    Bullet,
    Bullets,
    Camera,
    CanvasTools,
    ClientAmmo,
    ClientAmmoFlow,
    ClientAssets,
    ClientCameraController,
    ClientCanvasSetup,
    ClientCollisionEnvironment,
    ClientFrameFlow,
    ClientGameplayInput,
    ClientGameLoop,
    ClientGameSystems,
    ClientGameSounds,
    ClientHitDetection,
    ClientHudFlow,
    ClientHudOverlay,
    ClientIdentity,
    ClientInputStartup,
    ClientKeyEventFlow,
    ClientLobbyFlow,
    ClientLobbyHudFlow,
    ClientLobbyViewModel,
    ClientMatchTimer,
    ClientModelSync,
    ClientModelUpdateFlow,
    ClientModelUpdatePlan,
    ClientNameEditorFlow,
    ClientNetwork,
    ClientObstacleSync,
    ClientPlayerHitFlow,
    ClientRoundEndFlow,
    ClientRoundResetFlow,
    ClientRoundRitual,
    ClientRoundState,
    ClientRoundTransition,
    ClientScreens,
    ClientTimers,
    ClientTouchControlsFlow,
    ClientTouchEnvironment,
    ClientTouchState,
    Collision,
    CollisionDebugRenderer,
    Color,
    Config,
    Controllable,
    GameHud,
    GameHudViewModel,
    HighScoresScreen,
    InstallPrompt,
    KeysModel,
    LobbyScreen,
    NameEditor,
    NameEditorScreen,
    Obstacles,
    Pen,
    PlayerPositionSync,
    Players,
    requestAnimFrame,
    RoundIntro,
    ScenarioRenderer,
    Scene,
    ScoreKeeper,
    SoundEffects,
    TouchControls
} satisfies ClientGameDependencies;

createGame(dependencies, {
    document,
    Image,
    window
});
