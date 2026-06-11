import requestAnimationFrameSource from '../js/requestAnimationFrame.js?raw';
import ammoHudRendererSource from '../js/AmmoHudRenderer.js?raw';
import canvasToolsSource from '../js/CanvasTools.js?raw';
import installPromptSource from '../js/InstallPrompt.js?raw';
import clientAmmoSource from '../js/ClientAmmo.js?raw';
import clientAmmoFlowSource from '../js/ClientAmmoFlow.js?raw';
import clientCanvasSetupSource from '../js/ClientCanvasSetup.js?raw';
import clientCameraControllerSource from '../js/ClientCameraController.js?raw';
import clientAssetsSource from '../js/ClientAssets.js?raw';
import clientCollisionEnvironmentSource from '../js/ClientCollisionEnvironment.js?raw';
import clientGameplayInputSource from '../js/ClientGameplayInput.js?raw';
import clientFrameFlowSource from '../js/ClientFrameFlow.js?raw';
import clientGameSoundsSource from '../js/ClientGameSounds.js?raw';
import clientGameSystemsSource from '../js/ClientGameSystems.js?raw';
import clientGameLoopSource from '../js/ClientGameLoop.js?raw';
import clientHitDetectionSource from '../js/ClientHitDetection.js?raw';
import clientHudFlowSource from '../js/ClientHudFlow.js?raw';
import clientHudOverlaySource from '../js/ClientHudOverlay.js?raw';
import clientIdentitySource from '../js/ClientIdentity.js?raw';
import clientInputStartupSource from '../js/ClientInputStartup.js?raw';
import clientKeyEventFlowSource from '../js/ClientKeyEventFlow.js?raw';
import clientLobbyHudFlowSource from '../js/ClientLobbyHudFlow.js?raw';
import clientLobbyFlowSource from '../js/ClientLobbyFlow.js?raw';
import clientNetworkSource from '../js/ClientNetwork.js?raw';
import clientModelUpdateFlowSource from '../js/ClientModelUpdateFlow.js?raw';
import clientNameEditorFlowSource from '../js/ClientNameEditorFlow.js?raw';
import clientObstacleSyncSource from '../js/ClientObstacleSync.js?raw';
import clientPlayerHitFlowSource from '../js/ClientPlayerHitFlow.js?raw';
import clientRoundEndFlowSource from '../js/ClientRoundEndFlow.js?raw';
import clientRoundResetFlowSource from '../js/ClientRoundResetFlow.js?raw';
import clientRoundRitualSource from '../js/ClientRoundRitual.js?raw';
import clientTouchControlsFlowSource from '../js/ClientTouchControlsFlow.js?raw';
import collisionDebugRendererSource from '../js/CollisionDebugRenderer.js?raw';
import playerPositionSyncSource from '../js/PlayerPositionSync.js?raw';
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
import { Config } from './modules/config';
import { ClientLobbyViewModel } from './modules/clientLobbyViewModel';
import { ClientMatchTimer } from './modules/clientMatchTimer';
import { ClientModelSync } from './modules/clientModelSync';
import { ClientModelUpdatePlan } from './modules/clientModelUpdatePlan';
import { ClientRoundState } from './modules/clientRoundState';
import { ClientRoundTransition } from './modules/clientRoundTransition';
import { ClientScreens } from './modules/clientScreens';
import { ClientTouchEnvironment } from './modules/clientTouchEnvironment';
import { ClientTouchState } from './modules/clientTouchState';
import { ClientTimers } from './modules/clientTimers';
import { GameHudViewModel } from './modules/gameHudViewModel';

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
    ['js/CanvasTools.js', canvasToolsSource],
    ['js/InstallPrompt.js', installPromptSource],
    ['js/ClientAmmo.js', clientAmmoSource],
    ['js/ClientAmmoFlow.js', clientAmmoFlowSource],
    ['js/ClientCanvasSetup.js', clientCanvasSetupSource],
    ['js/ClientCameraController.js', clientCameraControllerSource],
    ['js/ClientAssets.js', clientAssetsSource],
    ['js/ClientCollisionEnvironment.js', clientCollisionEnvironmentSource],
    ['js/ClientGameplayInput.js', clientGameplayInputSource],
    ['js/ClientFrameFlow.js', clientFrameFlowSource],
    ['js/ClientGameSounds.js', clientGameSoundsSource],
    ['js/ClientGameSystems.js', clientGameSystemsSource],
    ['js/ClientGameLoop.js', clientGameLoopSource],
    ['js/ClientHitDetection.js', clientHitDetectionSource],
    ['js/ClientHudFlow.js', clientHudFlowSource],
    ['js/ClientHudOverlay.js', clientHudOverlaySource],
    ['js/ClientIdentity.js', clientIdentitySource],
    ['js/ClientInputStartup.js', clientInputStartupSource],
    ['js/ClientKeyEventFlow.js', clientKeyEventFlowSource],
    ['js/ClientLobbyHudFlow.js', clientLobbyHudFlowSource],
    ['js/ClientLobbyFlow.js', clientLobbyFlowSource],
    ['js/ClientNetwork.js', clientNetworkSource],
    ['js/ClientModelUpdateFlow.js', clientModelUpdateFlowSource],
    ['js/ClientNameEditorFlow.js', clientNameEditorFlowSource],
    ['js/ClientObstacleSync.js', clientObstacleSyncSource],
    ['js/ClientPlayerHitFlow.js', clientPlayerHitFlowSource],
    ['js/ClientRoundEndFlow.js', clientRoundEndFlowSource],
    ['js/ClientRoundResetFlow.js', clientRoundResetFlowSource],
    ['js/ClientRoundRitual.js', clientRoundRitualSource],
    ['js/ClientTouchControlsFlow.js', clientTouchControlsFlowSource],
    ['js/CollisionDebugRenderer.js', collisionDebugRendererSource],
    ['js/PlayerPositionSync.js', playerPositionSyncSource],
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
globalThis.GF.Config = Config;
globalThis.GF.ClientLobbyViewModel = ClientLobbyViewModel;
globalThis.GF.ClientMatchTimer = ClientMatchTimer;
globalThis.GF.ClientModelSync = ClientModelSync;
globalThis.GF.ClientModelUpdatePlan = ClientModelUpdatePlan;
globalThis.GF.ClientRoundState = ClientRoundState;
globalThis.GF.ClientRoundTransition = ClientRoundTransition;
globalThis.GF.ClientScreens = ClientScreens;
globalThis.GF.ClientTouchEnvironment = ClientTouchEnvironment;
globalThis.GF.ClientTouchState = ClientTouchState;
globalThis.GF.ClientTimers = ClientTimers;
globalThis.GF.GameHudViewModel = GameHudViewModel;
(0, eval)('var GF = globalThis.GF;');

scripts.forEach(function ([name, source]) {
    (0, eval)(source + '\n//# sourceURL=' + location.origin + '/' + name);
});

if (document.readyState !== 'loading' && globalThis.GF.Game) {
    globalThis.GF.Game.start();
}
