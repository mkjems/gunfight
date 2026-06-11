import { CanvasTools } from './modules/canvasTools';
import { Camera } from './modules/camera';
import { Bullet } from './modules/bullet';
import { Bullets } from './modules/bullets';
import { ClientAmmo } from './modules/clientAmmo';
import { ClientAmmoFlow } from './modules/clientAmmoFlow';
import { ClientAssets } from './modules/clientAssets';
import { ClientCameraController } from './modules/clientCameraController';
import { ClientCanvasSetup } from './modules/clientCanvasSetup';
import { ClientCollisionEnvironment } from './modules/clientCollisionEnvironment';
import { ClientFrameFlow } from './modules/clientFrameFlow';
import { ClientGameplayInput } from './modules/clientGameplayInput';
import { ClientGameLoop } from './modules/clientGameLoop';
import { ClientGameSystems } from './modules/clientGameSystems';
import { ClientGameSounds } from './modules/clientGameSounds';
import { ClientHitDetection } from './modules/clientHitDetection';
import { ClientHudFlow } from './modules/clientHudFlow';
import { ClientHudOverlay } from './modules/clientHudOverlay';
import { ClientIdentity } from './modules/clientIdentity';
import { ClientInputStartup } from './modules/clientInputStartup';
import { ClientKeyEventFlow } from './modules/clientKeyEventFlow';
import { ClientLobbyFlow } from './modules/clientLobbyFlow';
import { ClientLobbyHudFlow } from './modules/clientLobbyHudFlow';
import { Config } from './modules/config';
import { ClientLobbyViewModel } from './modules/clientLobbyViewModel';
import { ClientMatchTimer } from './modules/clientMatchTimer';
import { ClientModelSync } from './modules/clientModelSync';
import { ClientModelUpdateFlow } from './modules/clientModelUpdateFlow';
import { ClientModelUpdatePlan } from './modules/clientModelUpdatePlan';
import { ClientNameEditorFlow } from './modules/clientNameEditorFlow';
import { ClientNetwork } from './modules/clientNetwork';
import { ClientObstacleSync } from './modules/clientObstacleSync';
import { ClientPlayerHitFlow } from './modules/clientPlayerHitFlow';
import { ClientRoundEndFlow } from './modules/clientRoundEndFlow';
import { ClientRoundResetFlow } from './modules/clientRoundResetFlow';
import { ClientRoundRitual } from './modules/clientRoundRitual';
import { ClientRoundState } from './modules/clientRoundState';
import { ClientRoundTransition } from './modules/clientRoundTransition';
import { ClientScreens } from './modules/clientScreens';
import { ClientTouchEnvironment } from './modules/clientTouchEnvironment';
import { ClientTouchState } from './modules/clientTouchState';
import { ClientTouchControlsFlow } from './modules/clientTouchControlsFlow';
import { ClientTimers } from './modules/clientTimers';
import { Collision } from './modules/collision';
import { CollisionDebugRenderer } from './modules/collisionDebugRenderer';
import { AmmoHudRenderer } from './modules/ammoHudRenderer';
import { Color } from './modules/color';
import { Controllable } from './modules/controllable';
import { createGame } from './modules/game';
import { GameHud } from './modules/gameHud';
import { GameHudViewModel } from './modules/gameHudViewModel';
import { HighScoresScreen } from './modules/highScoresScreen';
import { InstallPrompt } from './modules/installPrompt';
import { KeysModel } from './modules/keysModel';
import { LobbyScreen } from './modules/lobbyScreen';
import { NameEditorScreen } from './modules/nameEditorScreen';
import { NameEditor } from './modules/nameEditor';
import { Obstacles } from './modules/obstacles';
import { Pen } from './modules/pen';
import { Players } from './modules/players';
import { PlayerPositionSync } from './modules/playerPositionSync';
import { requestAnimFrame } from './modules/requestAnimationFrame';
import { RoundIntro } from './modules/roundIntro';
import { ScenarioRenderer } from './modules/scenarioRenderer';
import { Scene } from './modules/scene';
import { ScoreKeeper } from './modules/scoreKeeper';
import { SoundEffects } from './modules/soundEffects';
import { TouchControls } from './modules/touchControls';

function loadScript(src) {
    if (src === '/socket.io/socket.io.js' && globalThis.io) {
        return Promise.resolve();
    }

    return new Promise(function (resolve, reject) {
        var script = document.createElement('script');

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

createGame(
    {
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
    },
    {
        document,
        Image,
        window
    }
);
