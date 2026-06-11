import requestAnimationFrameSource from '../js/requestAnimationFrame.js?raw';
import ammoHudRendererSource from '../js/AmmoHudRenderer.js?raw';
import installPromptSource from '../js/InstallPrompt.js?raw';
import clientCollisionEnvironmentSource from '../js/ClientCollisionEnvironment.js?raw';
import clientLobbyFlowSource from '../js/ClientLobbyFlow.js?raw';
import clientRoundRitualSource from '../js/ClientRoundRitual.js?raw';
import collisionDebugRendererSource from '../js/CollisionDebugRenderer.js?raw';
import scenarioRendererSource from '../js/ScenarioRenderer.js?raw';
import gameHudSource from '../js/GameHud.js?raw';
import highScoresScreenSource from '../js/HighScoresScreen.js?raw';
import lobbyScreenSource from '../js/LobbyScreen.js?raw';
import nameEditorScreenSource from '../js/NameEditorScreen.js?raw';
import soundEffectsSource from '../js/SoundEffects.js?raw';
import scoreKeeperSource from '../js/ScoreKeeper.js?raw';
import roundIntroSource from '../js/RoundIntro.js?raw';
import keysModelSource from '../js/KeysModel.js?raw';
import nameEditorSource from '../js/NameEditor.js?raw';
import cameraSource from '../js/Camera.js?raw';
import touchControlsSource from '../js/TouchControls.js?raw';
import colorSource from '../js/Color.js?raw';
import penSource from '../js/Pen.js?raw';
import sceneSource from '../js/Scene.js?raw';
import obstaclesSource from '../js/Obstacles.js?raw';
import controllableSource from '../js/Controllable.js?raw';
import bulletSource from '../js/Bullet.js?raw';
import bulletsSource from '../js/Bullets.js?raw';
import playersSource from '../js/Players.js?raw';
import collisionSource from '../js/Collision.js?raw';
import indexSource from '../js/index.js?raw';
import { CanvasTools } from './modules/canvasTools';
import { ClientAmmo } from './modules/clientAmmo';
import { ClientAmmoFlow } from './modules/clientAmmoFlow';
import { ClientAssets } from './modules/clientAssets';
import { ClientCameraController } from './modules/clientCameraController';
import { ClientCanvasSetup } from './modules/clientCanvasSetup';
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
import { ClientRoundState } from './modules/clientRoundState';
import { ClientRoundTransition } from './modules/clientRoundTransition';
import { ClientScreens } from './modules/clientScreens';
import { ClientTouchEnvironment } from './modules/clientTouchEnvironment';
import { ClientTouchState } from './modules/clientTouchState';
import { ClientTouchControlsFlow } from './modules/clientTouchControlsFlow';
import { ClientTimers } from './modules/clientTimers';
import { GameHudViewModel } from './modules/gameHudViewModel';
import { PlayerPositionSync } from './modules/playerPositionSync';

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

const scripts = [
    ['js/requestAnimationFrame.js', requestAnimationFrameSource],
    ['js/AmmoHudRenderer.js', ammoHudRendererSource],
    ['js/InstallPrompt.js', installPromptSource],
    ['js/ClientCollisionEnvironment.js', clientCollisionEnvironmentSource],
    ['js/ClientLobbyFlow.js', clientLobbyFlowSource],
    ['js/ClientRoundRitual.js', clientRoundRitualSource],
    ['js/CollisionDebugRenderer.js', collisionDebugRendererSource],
    ['js/ScenarioRenderer.js', scenarioRendererSource],
    ['js/GameHud.js', gameHudSource],
    ['js/HighScoresScreen.js', highScoresScreenSource],
    ['js/LobbyScreen.js', lobbyScreenSource],
    ['js/NameEditorScreen.js', nameEditorScreenSource],
    ['js/SoundEffects.js', soundEffectsSource],
    ['js/ScoreKeeper.js', scoreKeeperSource],
    ['js/RoundIntro.js', roundIntroSource],
    ['js/KeysModel.js', keysModelSource],
    ['js/NameEditor.js', nameEditorSource],
    ['js/Camera.js', cameraSource],
    ['js/TouchControls.js', touchControlsSource],
    ['js/Color.js', colorSource],
    ['js/Pen.js', penSource],
    ['js/Scene.js', sceneSource],
    ['js/Obstacles.js', obstaclesSource],
    ['js/Controllable.js', controllableSource],
    ['js/Bullet.js', bulletSource],
    ['js/Bullets.js', bulletsSource],
    ['js/Players.js', playersSource],
    ['js/Collision.js', collisionSource],
    ['js/index.js', indexSource]
];

await loadScript('/socket.io/socket.io.js');

globalThis.GF = globalThis.GF || {};
globalThis.GF.CanvasTools = CanvasTools;
globalThis.GF.ClientAmmo = ClientAmmo;
globalThis.GF.ClientAmmoFlow = ClientAmmoFlow;
globalThis.GF.ClientAssets = ClientAssets;
globalThis.GF.ClientCameraController = ClientCameraController;
globalThis.GF.ClientCanvasSetup = ClientCanvasSetup;
globalThis.GF.ClientFrameFlow = ClientFrameFlow;
globalThis.GF.ClientGameplayInput = ClientGameplayInput;
globalThis.GF.ClientGameLoop = ClientGameLoop;
globalThis.GF.ClientGameSystems = ClientGameSystems;
globalThis.GF.ClientGameSounds = ClientGameSounds;
globalThis.GF.ClientHitDetection = ClientHitDetection;
globalThis.GF.ClientHudFlow = ClientHudFlow;
globalThis.GF.ClientHudOverlay = ClientHudOverlay;
globalThis.GF.ClientIdentity = ClientIdentity;
globalThis.GF.ClientInputStartup = ClientInputStartup;
globalThis.GF.ClientKeyEventFlow = ClientKeyEventFlow;
globalThis.GF.ClientLobbyHudFlow = ClientLobbyHudFlow;
globalThis.GF.Config = Config;
globalThis.GF.ClientLobbyViewModel = ClientLobbyViewModel;
globalThis.GF.ClientMatchTimer = ClientMatchTimer;
globalThis.GF.ClientModelSync = ClientModelSync;
globalThis.GF.ClientModelUpdateFlow = ClientModelUpdateFlow;
globalThis.GF.ClientModelUpdatePlan = ClientModelUpdatePlan;
globalThis.GF.ClientNameEditorFlow = ClientNameEditorFlow;
globalThis.GF.ClientNetwork = ClientNetwork;
globalThis.GF.ClientObstacleSync = ClientObstacleSync;
globalThis.GF.ClientPlayerHitFlow = ClientPlayerHitFlow;
globalThis.GF.ClientRoundEndFlow = ClientRoundEndFlow;
globalThis.GF.ClientRoundResetFlow = ClientRoundResetFlow;
globalThis.GF.ClientRoundState = ClientRoundState;
globalThis.GF.ClientRoundTransition = ClientRoundTransition;
globalThis.GF.ClientScreens = ClientScreens;
globalThis.GF.ClientTouchEnvironment = ClientTouchEnvironment;
globalThis.GF.ClientTouchState = ClientTouchState;
globalThis.GF.ClientTouchControlsFlow = ClientTouchControlsFlow;
globalThis.GF.ClientTimers = ClientTimers;
globalThis.GF.GameHudViewModel = GameHudViewModel;
globalThis.GF.PlayerPositionSync = PlayerPositionSync;
(0, eval)('var GF = globalThis.GF;');

scripts.forEach(function ([name, source]) {
    (0, eval)(source + '\n//# sourceURL=' + location.origin + '/' + name);
});

if (document.readyState !== 'loading' && globalThis.GF.Game) {
    globalThis.GF.Game.start();
}
