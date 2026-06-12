import { AmmoHudRenderer } from './ammoHudRenderer.js';
import { Camera } from './camera.js';
import { CanvasTools } from './canvasTools.js';
import { ClientAmmoFlow } from './clientAmmoFlow.js';
import { ClientAssets } from './clientAssets.js';
import { ClientCameraController } from './clientCameraController.js';
import { ClientCanvasSetup } from './clientCanvasSetup.js';
import { ClientRuntimeCollisionEnvironment as ClientCollisionEnvironment } from './clientRuntimeCollisionEnvironment.js';
import { ClientFrameFlow } from './clientFrameFlow.js';
import { ClientGameLoop } from './clientGameLoop.js';
import { ClientRuntimeGameSystems as ClientGameSystems } from './clientRuntimeGameSystems.js';
import { ClientGameSounds } from './clientGameSounds.js';
import { ClientHitDetection } from './clientHitDetection.js';
import { ClientHudFlow } from './clientHudFlow.js';
import { ClientIdentity } from './clientIdentity.js';
import { ClientInputStartup } from './clientInputStartup.js';
import { ClientKeyEventFlow } from './clientKeyEventFlow.js';
import { ClientLobbyFlow } from './clientLobbyFlow.js';
import { ClientLobbyHudFlow } from './clientLobbyHudFlow.js';
import { ClientLobbyViewModel } from './clientLobbyViewModel.js';
import { ClientMatchTimer } from './clientMatchTimer.js';
import { ClientModelSync } from './clientModelSync.js';
import { ClientModelUpdateFlow } from './clientModelUpdateFlow.js';
import { ClientNameEditorFlow } from './clientNameEditorFlow.js';
import { ClientNetwork } from './clientNetwork.js';
import { ClientObstacleSync } from './clientObstacleSync.js';
import { ClientPlayerHitFlow } from './clientPlayerHitFlow.js';
import { ClientRoundEndFlow } from './clientRoundEndFlow.js';
import { ClientRoundResetFlow } from './clientRoundResetFlow.js';
import { ClientRoundRitual } from './clientRoundRitual.js';
import { ClientRoundTransition } from './clientRoundTransition.js';
import { ClientScreens } from './clientScreens.js';
import { ClientTouchControlsFlow } from './clientTouchControlsFlow.js';
import { ClientTouchEnvironment } from './clientTouchEnvironment.js';
import { ClientUi } from './clientUi.js';
import { Collision } from './collision.js';
import { CollisionDebugRenderer } from './collisionDebugRenderer.js';
import { Config } from './config.js';
import { type ClientGameDependencies } from './game.js';
import { KeysModel } from './keysModel.js';
import { NameEditor } from './nameEditor.js';
import { Obstacles } from './obstacles.js';
import { requestAnimFrame } from './requestAnimationFrame.js';
import { ScenarioRenderer } from './scenarioRenderer.js';
import { SoundEffects } from './soundEffects.js';
import { TouchControls } from './touchControls.js';

export const ClientRuntimeDependencies = {
    bootstrap: {
        ClientAssets,
        ClientCanvasSetup,
        ClientGameLoop,
        ClientGameSystems,
        ClientInputStartup,
        ClientNetwork,
        requestAnimFrame
    },
    environment: {
        CanvasTools,
        ClientCollisionEnvironment,
        Collision,
        Obstacles
    },
    flow: {
        ClientAmmoFlow,
        ClientFrameFlow,
        ClientHitDetection,
        ClientKeyEventFlow,
        ClientLobbyFlow,
        ClientMatchTimer,
        ClientModelUpdateFlow,
        ClientNameEditorFlow,
        ClientObstacleSync,
        ClientPlayerHitFlow,
        ClientRoundEndFlow,
        ClientRoundResetFlow,
        ClientRoundRitual,
        ClientRoundTransition,
        ClientTouchControlsFlow
    },
    model: {
        ClientLobbyViewModel,
        ClientModelSync,
        ClientScreens
    },
    platform: {
        Config
    },
    ui: {
        AmmoHudRenderer,
        ClientHudFlow,
        ClientLobbyHudFlow,
        ClientUi
    },
    browserConstructors: {
        Camera,
        ClientCameraController,
        ClientGameSounds,
        ClientIdentity,
        ClientTouchEnvironment,
        CollisionDebugRenderer,
        KeysModel,
        NameEditor,
        ScenarioRenderer,
        SoundEffects,
        TouchControls
    }
} satisfies ClientGameDependencies;
