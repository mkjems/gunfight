import { Camera } from '../engine/camera.js';
import { CanvasTools } from '../platform/canvasTools.js';
import { ClientAmmoFlow } from '../flows/clientAmmoFlow.js';
import { ClientAssets } from '../platform/clientAssets.js';
import { ClientCameraController } from '../engine/clientCameraController.js';
import { ClientCanvasSetup } from '../platform/clientCanvasSetup.js';
import { ClientRuntimeCollisionEnvironment as ClientCollisionEnvironment } from '../engine/clientRuntimeCollisionEnvironment.js';
import { ClientFrameFlow } from '../flows/clientFrameFlow.js';
import { ClientGameLoop } from './clientGameLoop.js';
import { ClientRuntimeGameSystems as ClientGameSystems } from './clientRuntimeGameSystems.js';
import { ClientGameSounds } from '../platform/clientGameSounds.js';
import { ClientHitDetection } from '../flows/clientHitDetection.js';
import { ClientHudFlow } from '../flows/clientHudFlow.js';
import { ClientIdentity } from '../platform/clientIdentity.js';
import { ClientInputStartup } from './clientInputStartup.js';
import { ClientKeyEventFlow } from '../flows/clientKeyEventFlow.js';
import { ClientLobbyFlow } from '../flows/clientLobbyFlow.js';
import { ClientLobbyHudFlow } from '../flows/clientLobbyHudFlow.js';
import { ClientLobbyViewModel } from '../ui/viewModels/clientLobbyViewModel.js';
import { ClientModelSync } from '../network/clientModelSync.js';
import { ClientModelUpdateFlow } from '../network/clientModelUpdateFlow.js';
import { ClientNameEditorFlow } from '../flows/clientNameEditorFlow.js';
import { ClientNetwork } from '../network/clientNetwork.js';
import { ClientObstacleSync } from '../network/clientObstacleSync.js';
import { ClientPlayerHitFlow } from '../flows/clientPlayerHitFlow.js';
import { ClientRoundEndFlow } from '../flows/clientRoundEndFlow.js';
import { ClientRoundResetFlow } from '../flows/clientRoundResetFlow.js';
import { ClientRoundRitual } from '../flows/clientRoundRitual.js';
import { ClientRoundTransition } from '../flows/clientRoundTransition.js';
import { ClientScreens } from '../state/clientScreens.js';
import { ClientTouchControlsFlow } from '../flows/clientTouchControlsFlow.js';
import { ClientTouchEnvironment } from '../input/clientTouchEnvironment.js';
import { ClientUi } from '../ui/clientUi.js';
import { Collision } from '../engine/collision.js';
import { CollisionDebugRenderer } from '../engine/collisionDebugRenderer.js';
import { Config } from '../platform/config.js';
import { type ClientGameDependencies } from './game.js';
import { KeysModel } from '../input/keysModel.js';
import { NameEditor } from '../input/nameEditor.js';
import { Obstacles } from '../engine/obstacles.js';
import { requestAnimFrame } from '../platform/requestAnimationFrame.js';
import { ScenarioRenderer } from '../engine/scenarioRenderer.js';
import { SoundEffects } from '../platform/soundEffects.js';
import { TouchControls } from '../input/touchControls.js';

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
