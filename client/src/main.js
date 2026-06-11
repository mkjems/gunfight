import scenarioRendererSource from '../js/ScenarioRenderer.js?raw';
import soundEffectsSource from '../js/SoundEffects.js?raw';
import cameraSource from '../js/Camera.js?raw';
import touchControlsSource from '../js/TouchControls.js?raw';
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
import { CollisionDebugRenderer } from './modules/collisionDebugRenderer';
import { AmmoHudRenderer } from './modules/ammoHudRenderer';
import { Color } from './modules/color';
import { GameHud } from './modules/gameHud';
import { GameHudViewModel } from './modules/gameHudViewModel';
import { HighScoresScreen } from './modules/highScoresScreen';
import { InstallPrompt } from './modules/installPrompt';
import { KeysModel } from './modules/keysModel';
import { LobbyScreen } from './modules/lobbyScreen';
import { NameEditorScreen } from './modules/nameEditorScreen';
import { NameEditor } from './modules/nameEditor';
import { Pen } from './modules/pen';
import { PlayerPositionSync } from './modules/playerPositionSync';
import { requestAnimFrame } from './modules/requestAnimationFrame';
import { RoundIntro } from './modules/roundIntro';
import { ScoreKeeper } from './modules/scoreKeeper';

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
    ['js/ScenarioRenderer.js', scenarioRendererSource],
    ['js/SoundEffects.js', soundEffectsSource],
    ['js/Camera.js', cameraSource],
    ['js/TouchControls.js', touchControlsSource],
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
globalThis.requestAnimFrame = requestAnimFrame;
globalThis.GF.AmmoHudRenderer = AmmoHudRenderer;
globalThis.GF.CanvasTools = CanvasTools;
globalThis.GF.ClientAmmo = ClientAmmo;
globalThis.GF.ClientAmmoFlow = ClientAmmoFlow;
globalThis.GF.ClientAssets = ClientAssets;
globalThis.GF.ClientCameraController = ClientCameraController;
globalThis.GF.ClientCanvasSetup = ClientCanvasSetup;
globalThis.GF.ClientCollisionEnvironment = ClientCollisionEnvironment;
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
globalThis.GF.ClientLobbyFlow = ClientLobbyFlow;
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
globalThis.GF.ClientRoundRitual = ClientRoundRitual;
globalThis.GF.ClientRoundState = ClientRoundState;
globalThis.GF.ClientRoundTransition = ClientRoundTransition;
globalThis.GF.ClientScreens = ClientScreens;
globalThis.GF.ClientTouchEnvironment = ClientTouchEnvironment;
globalThis.GF.ClientTouchState = ClientTouchState;
globalThis.GF.ClientTouchControlsFlow = ClientTouchControlsFlow;
globalThis.GF.ClientTimers = ClientTimers;
globalThis.GF.CollisionDebugRenderer = CollisionDebugRenderer;
globalThis.GF.Color = Color;
globalThis.GF.GameHud = GameHud;
globalThis.GF.GameHudViewModel = GameHudViewModel;
globalThis.GF.HighScoresScreen = HighScoresScreen;
globalThis.GF.InstallPrompt = InstallPrompt;
globalThis.GF.KeysModel = KeysModel;
globalThis.GF.LobbyScreen = LobbyScreen;
globalThis.GF.NameEditorScreen = NameEditorScreen;
globalThis.GF.NameEditor = NameEditor;
globalThis.GF.Pen = Pen;
globalThis.GF.PlayerPositionSync = PlayerPositionSync;
globalThis.GF.RoundIntro = RoundIntro;
globalThis.GF.ScoreKeeper = ScoreKeeper;
(0, eval)('var GF = globalThis.GF;');

scripts.forEach(function ([name, source]) {
    (0, eval)(source + '\n//# sourceURL=' + location.origin + '/' + name);
});

if (document.readyState !== 'loading' && globalThis.GF.Game) {
    globalThis.GF.Game.start();
}
