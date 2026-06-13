import type { Camera } from '../../engine/camera.js';
import type { CanvasTools } from '../../platform/canvasTools.js';
import type { ClientAmmoFlow } from '../../flows/clientAmmoFlow.js';
import type { ClientAssets } from '../../platform/clientAssets.js';
import type { ClientCameraController } from '../../engine/clientCameraController.js';
import type { ClientCanvasSetup } from '../../platform/clientCanvasSetup.js';
import type { ClientFrameFlow } from '../../flows/clientFrameFlow.js';
import type { ClientGameLoop } from '../clientGameLoop.js';
import type { ClientGameSounds } from '../../platform/clientGameSounds.js';
import type { ClientHitDetection } from '../../flows/clientHitDetection.js';
import type { ClientHudFlow } from '../../flows/clientHudFlow.js';
import type { ClientIdentity } from '../../platform/clientIdentity.js';
import type { ClientInputStartup } from '../clientInputStartup.js';
import type { ClientKeyEventFlow } from '../../flows/clientKeyEventFlow.js';
import type { ClientLobbyFlow } from '../../flows/clientLobbyFlow.js';
import type { ClientLobbyHudFlow } from '../../flows/clientLobbyHudFlow.js';
import type { ClientLobbyViewModel } from '../../ui/viewModels/clientLobbyViewModel.js';
import type { ClientMatchTimer } from '../../flows/clientMatchTimer.js';
import type { ClientModelSync } from '../../network/clientModelSync.js';
import type { ClientModelUpdateFlow } from '../../network/clientModelUpdateFlow.js';
import type { ClientNameEditorFlow } from '../../flows/clientNameEditorFlow.js';
import type { ClientNetwork } from '../../network/clientNetwork.js';
import type { ClientObstacleSync } from '../../network/clientObstacleSync.js';
import type { ClientPlayerHitFlow } from '../../flows/clientPlayerHitFlow.js';
import type { ClientRoundEndFlow } from '../../flows/clientRoundEndFlow.js';
import type { ClientRoundResetFlow } from '../../flows/clientRoundResetFlow.js';
import type { ClientRoundRitual } from '../../flows/clientRoundRitual.js';
import type { ClientRoundTransition } from '../../flows/clientRoundTransition.js';
import type { ClientRuntimeCollisionEnvironment } from '../../engine/clientRuntimeCollisionEnvironment.js';
import type { ClientRuntimeGameSystems } from '../clientRuntimeGameSystems.js';
import type { ClientScreens } from '../../state/clientScreens.js';
import type { ClientTouchControlsFlow } from '../../flows/clientTouchControlsFlow.js';
import type { ClientTouchEnvironment } from '../../input/clientTouchEnvironment.js';
import type { ClientUi } from '../../ui/clientUi.js';
import type { Collision } from '../../engine/collision.js';
import type { CollisionDebugRenderer } from '../../engine/collisionDebugRenderer.js';
import type { Config } from '../../platform/config.js';
import type { KeysModel } from '../../input/keysModel.js';
import type { NameEditor } from '../../input/nameEditor.js';
import type { Obstacles } from '../../engine/obstacles.js';
import type { requestAnimFrame } from '../../platform/requestAnimationFrame.js';
import type { ScenarioRenderer } from '../../engine/scenarioRenderer.js';
import type { SoundEffects } from '../../platform/soundEffects.js';
import type { TouchControls } from '../../input/touchControls.js';

export type ClientGameRuntimeModules = {
    Camera: typeof Camera;
    CanvasTools: typeof CanvasTools;
    ClientAmmoFlow: typeof ClientAmmoFlow;
    ClientAssets: typeof ClientAssets;
    ClientCameraController: typeof ClientCameraController;
    ClientCanvasSetup: typeof ClientCanvasSetup;
    ClientCollisionEnvironment: typeof ClientRuntimeCollisionEnvironment;
    ClientFrameFlow: typeof ClientFrameFlow;
    ClientGameLoop: typeof ClientGameLoop;
    ClientGameSounds: typeof ClientGameSounds;
    ClientGameSystems: typeof ClientRuntimeGameSystems;
    ClientHitDetection: typeof ClientHitDetection;
    ClientHudFlow: typeof ClientHudFlow;
    ClientIdentity: typeof ClientIdentity;
    ClientInputStartup: typeof ClientInputStartup;
    ClientKeyEventFlow: typeof ClientKeyEventFlow;
    ClientLobbyFlow: typeof ClientLobbyFlow;
    ClientLobbyHudFlow: typeof ClientLobbyHudFlow;
    ClientLobbyViewModel: typeof ClientLobbyViewModel;
    ClientMatchTimer: typeof ClientMatchTimer;
    ClientModelSync: typeof ClientModelSync;
    ClientModelUpdateFlow: typeof ClientModelUpdateFlow;
    ClientNameEditorFlow: typeof ClientNameEditorFlow;
    ClientNetwork: typeof ClientNetwork;
    ClientObstacleSync: typeof ClientObstacleSync;
    ClientPlayerHitFlow: typeof ClientPlayerHitFlow;
    ClientRoundEndFlow: typeof ClientRoundEndFlow;
    ClientRoundResetFlow: typeof ClientRoundResetFlow;
    ClientRoundRitual: typeof ClientRoundRitual;
    ClientRoundTransition: typeof ClientRoundTransition;
    ClientScreens: typeof ClientScreens;
    ClientTouchControlsFlow: typeof ClientTouchControlsFlow;
    ClientTouchEnvironment: typeof ClientTouchEnvironment;
    Collision: typeof Collision;
    CollisionDebugRenderer: typeof CollisionDebugRenderer;
    Config: typeof Config;
    KeysModel: typeof KeysModel;
    NameEditor: typeof NameEditor;
    Obstacles: typeof Obstacles;
    requestAnimFrame: typeof requestAnimFrame;
    ScenarioRenderer: typeof ScenarioRenderer;
    SoundEffects: typeof SoundEffects;
    TouchControls: typeof TouchControls;
    ClientUi: typeof ClientUi;
};

export type ClientGameDependencies = {
    bootstrap: {
        ClientAssets: typeof ClientAssets;
        ClientCanvasSetup: typeof ClientCanvasSetup;
        ClientGameLoop: typeof ClientGameLoop;
        ClientGameSystems: typeof ClientRuntimeGameSystems;
        ClientInputStartup: typeof ClientInputStartup;
        ClientNetwork: typeof ClientNetwork;
        requestAnimFrame: typeof requestAnimFrame;
    };
    environment: {
        CanvasTools: typeof CanvasTools;
        ClientCollisionEnvironment: typeof ClientRuntimeCollisionEnvironment;
        Collision: typeof Collision;
        Obstacles: typeof Obstacles;
    };
    flow: {
        ClientAmmoFlow: typeof ClientAmmoFlow;
        ClientFrameFlow: typeof ClientFrameFlow;
        ClientHitDetection: typeof ClientHitDetection;
        ClientKeyEventFlow: typeof ClientKeyEventFlow;
        ClientLobbyFlow: typeof ClientLobbyFlow;
        ClientMatchTimer: typeof ClientMatchTimer;
        ClientModelUpdateFlow: typeof ClientModelUpdateFlow;
        ClientNameEditorFlow: typeof ClientNameEditorFlow;
        ClientObstacleSync: typeof ClientObstacleSync;
        ClientPlayerHitFlow: typeof ClientPlayerHitFlow;
        ClientRoundEndFlow: typeof ClientRoundEndFlow;
        ClientRoundResetFlow: typeof ClientRoundResetFlow;
        ClientRoundRitual: typeof ClientRoundRitual;
        ClientRoundTransition: typeof ClientRoundTransition;
        ClientTouchControlsFlow: typeof ClientTouchControlsFlow;
    };
    model: {
        ClientLobbyViewModel: typeof ClientLobbyViewModel;
        ClientModelSync: typeof ClientModelSync;
        ClientScreens: ClientGameRuntimeModules['ClientScreens'];
    };
    platform: {
        Config: ClientGameRuntimeModules['Config'];
    };
    ui: {
        ClientHudFlow: typeof ClientHudFlow;
        ClientLobbyHudFlow: typeof ClientLobbyHudFlow;
        ClientUi: typeof ClientUi;
    };
    browserConstructors: {
        Camera: typeof Camera;
        ClientCameraController: typeof ClientCameraController;
        ClientGameSounds: typeof ClientGameSounds;
        ClientIdentity: typeof ClientIdentity;
        ClientTouchEnvironment: typeof ClientTouchEnvironment;
        CollisionDebugRenderer: typeof CollisionDebugRenderer;
        KeysModel: typeof KeysModel;
        NameEditor: typeof NameEditor;
        ScenarioRenderer: typeof ScenarioRenderer;
        SoundEffects: typeof SoundEffects;
        TouchControls: typeof TouchControls;
    };
};

export function flattenDependencies(
    dependencies: ClientGameDependencies
): ClientGameRuntimeModules {
    return {
        ...dependencies.bootstrap,
        ...dependencies.environment,
        ...dependencies.flow,
        ...dependencies.model,
        ...dependencies.platform,
        ...dependencies.ui,
        ...dependencies.browserConstructors
    };
}
