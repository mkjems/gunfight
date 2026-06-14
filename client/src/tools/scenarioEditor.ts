import {
    DEFAULT_SCENARIO_EDITOR_JSON,
    DEFAULT_PLAYER_STARTS,
    addScenarioObject,
    duplicateScenarioSource,
    ensureScenarioPlayerStarts,
    formatScenarioSources,
    getScenarioName,
    getScenarioObject,
    getScenarioObjectAnchor,
    getScenarioObjectId,
    listScenarioObjects,
    parseScenarioEditorJson,
    parseScenarioEditorRockJson,
    parseScenarioObjectId,
    removeScenarioObject,
    setScenarioName,
    updateScenarioObjectFields,
    updateScenarioObjectPosition,
    validateScenarioSources,
    type ScenarioObjectRef
} from './scenarioEditorCore.js';
import { DEFAULT_ROCK_EDITOR_JSON } from './rockEditorCore.js';
import type {
    Decoration,
    RockDefinitions,
    RockPlacement,
    ScenarioSource,
    WagonInstance
} from '../../../shared/contracts.js';
import { CanvasTools } from '../platform/canvasTools.js';

type Point = {
    x: number;
    y: number;
};

type ViewTransform = {
    originX: number;
    originY: number;
    scale: number;
};

type SpriteSet = {
    cactus: HTMLImageElement;
    saloon: HTMLImageElement;
    wagon: HTMLImageElement;
};

const ARENA_WIDTH = 950;
const ARENA_HEIGHT = 640;
const GRID_STEP = 40;
const HANDLE_RADIUS = 8;
const PREVIEW_COLORS = {
    arena: 'rgb(8,11,13)',
    cactus: 'rgba(113,214,137,0.82)',
    grid: 'rgba(137,156,165,0.18)',
    handle: 'rgb(219,229,234)',
    handleText: 'rgb(11,14,16)',
    playerStart: 'rgba(255,255,255,0.36)',
    rock: 'rgba(28, 159, 192, 0.64)',
    saloon: 'rgba(170,128,84,0.5)',
    selected: 'rgb(86,197,255)',
    text: 'rgb(219,229,234)',
    wagon: 'rgba(200,200,200,0.74)',
    wagonPath: 'rgba(86,197,255,0.45)'
};

const elements = {
    addKindSelect: requireElement('scenarioAddKindSelect', HTMLSelectElement),
    addObjectButton: requireElement(
        'scenarioAddObjectButton',
        HTMLButtonElement
    ),
    canvas: requireElement('scenarioEditorCanvas', HTMLCanvasElement),
    copyOutputButton: requireElement(
        'scenarioCopyOutputButton',
        HTMLButtonElement
    ),
    duplicateButton: requireElement(
        'scenarioDuplicateButton',
        HTMLButtonElement
    ),
    input: requireElement('scenarioJsonInput', HTMLTextAreaElement),
    loadButton: requireElement('scenarioLoadJsonButton', HTMLButtonElement),
    nameInput: requireElement('scenarioNameInput', HTMLInputElement),
    newButton: requireElement('scenarioNewButton', HTMLButtonElement),
    objectSelect: requireElement('scenarioObjectSelect', HTMLSelectElement),
    objectTypeControl: requireElement('scenarioObjectTypeControl', HTMLElement),
    objectTypeSelect: requireElement(
        'scenarioObjectTypeSelect',
        HTMLSelectElement
    ),
    objectXInput: requireElement('scenarioObjectXInput', HTMLInputElement),
    objectYControl: requireElement('scenarioObjectYControl', HTMLElement),
    objectYInput: requireElement('scenarioObjectYInput', HTMLInputElement),
    output: requireElement('scenarioJsonOutput', HTMLTextAreaElement),
    removeObjectButton: requireElement(
        'scenarioRemoveObjectButton',
        HTMLButtonElement
    ),
    rockTypeLabel: requireElement('scenarioRockTypeLabel', HTMLElement),
    rockTypeSelect: requireElement('scenarioRockTypeSelect', HTMLSelectElement),
    scenarioSelect: requireElement('scenarioSelect', HTMLSelectElement),
    selectedObjectLabel: requireElement(
        'scenarioSelectedObjectLabel',
        HTMLElement
    ),
    useOutputButton: requireElement(
        'scenarioUseOutputButton',
        HTMLButtonElement
    ),
    validation: requireElement('scenarioValidation', HTMLElement),
    wagonDurationControl: requireElement(
        'scenarioWagonDurationControl',
        HTMLElement
    ),
    wagonDurationInput: requireElement(
        'scenarioWagonDurationInput',
        HTMLInputElement
    ),
    wagonFromYControl: requireElement('scenarioWagonFromYControl', HTMLElement),
    wagonFromYInput: requireElement(
        'scenarioWagonFromYInput',
        HTMLInputElement
    ),
    wagonToYControl: requireElement('scenarioWagonToYControl', HTMLElement),
    wagonToYInput: requireElement('scenarioWagonToYInput', HTMLInputElement)
};

const sprites = loadSprites();

let scenarios: ScenarioSource[] = [];
let rockDefinitions: RockDefinitions = {};
let selectedScenarioIndex = 0;
let selectedObjectRef: ScenarioObjectRef | null = null;
let dragObjectRef: ScenarioObjectRef | null = null;
let statusMessage: string | null = null;
let statusIsError = false;

async function start() {
    elements.input.value = DEFAULT_SCENARIO_EDITOR_JSON;
    await loadInitialRockJson();
    await loadInitialScenarioJson();
    importInputJson();
    installEvents();
    render();
}

async function loadInitialRockJson() {
    try {
        const response = await fetch('/api/rocks', {
            cache: 'no-store'
        });

        if (response.ok) {
            rockDefinitions = parseScenarioEditorRockJson(
                await response.text()
            );
            return;
        }
    } catch (error) {
        statusMessage = 'Using built-in rock JSON sample.';
        statusIsError = false;
    }

    rockDefinitions = parseScenarioEditorRockJson(DEFAULT_ROCK_EDITOR_JSON);
}

async function loadInitialScenarioJson() {
    try {
        const response = await fetch('/api/scenarios', {
            cache: 'no-store'
        });

        if (response.ok) {
            elements.input.value = await response.text();
        }
    } catch (error) {
        statusMessage = 'Using built-in scenario JSON sample.';
        statusIsError = false;
    }
}

function installEvents() {
    elements.loadButton.addEventListener('click', function () {
        importInputJson();
        render();
    });
    elements.useOutputButton.addEventListener('click', function () {
        elements.input.value = elements.output.value;
        importInputJson();
        render();
    });
    elements.copyOutputButton.addEventListener('click', copyOutputJson);
    elements.scenarioSelect.addEventListener('change', function () {
        selectedScenarioIndex = Number(elements.scenarioSelect.value);
        selectedObjectRef = null;
        clearStatus();
        render();
    });
    elements.nameInput.addEventListener('change', function () {
        scenarios = setScenarioName(
            scenarios,
            selectedScenarioIndex,
            elements.nameInput.value
        );
        clearStatus();
        render();
    });
    elements.newButton.addEventListener('click', addScenario);
    elements.duplicateButton.addEventListener('click', duplicateScenario);
    elements.addKindSelect.addEventListener('change', renderObjectPalette);
    elements.addObjectButton.addEventListener('click', addObject);
    elements.objectSelect.addEventListener('change', function () {
        selectedObjectRef = parseScenarioObjectId(elements.objectSelect.value);
        clearStatus();
        render();
    });
    elements.removeObjectButton.addEventListener('click', removeObject);
    elements.objectTypeSelect.addEventListener('change', applyObjectInputs);
    elements.objectXInput.addEventListener('change', applyObjectInputs);
    elements.objectYInput.addEventListener('change', applyObjectInputs);
    elements.wagonFromYInput.addEventListener('change', applyObjectInputs);
    elements.wagonToYInput.addEventListener('change', applyObjectInputs);
    elements.wagonDurationInput.addEventListener('change', applyObjectInputs);
    elements.canvas.addEventListener('pointerdown', startDrag);
    elements.canvas.addEventListener('pointermove', continueDrag);
    elements.canvas.addEventListener('pointerup', endDrag);
    elements.canvas.addEventListener('pointercancel', endDrag);
    Object.values(sprites).forEach(function (sprite) {
        sprite.addEventListener('load', function () {
            renderCanvas();
        });
    });
    window.addEventListener('resize', function () {
        renderCanvas();
    });
}

function importInputJson() {
    try {
        scenarios = ensureScenarioPlayerStarts(
            parseScenarioEditorJson(elements.input.value, rockDefinitions)
        );
        selectedScenarioIndex = Math.min(
            selectedScenarioIndex,
            Math.max(0, scenarios.length - 1)
        );
        selectedObjectRef = null;
        clearStatus();
    } catch (error) {
        statusMessage =
            error instanceof Error
                ? error.message
                : 'Unable to read scenario JSON.';
        statusIsError = true;
    }
}

async function copyOutputJson() {
    try {
        await navigator.clipboard.writeText(elements.output.value);
        statusMessage = 'Output JSON copied.';
        statusIsError = false;
    } catch (error) {
        statusMessage = 'Copy failed; select the output JSON manually.';
        statusIsError = true;
    }

    renderValidation();
}

function addScenario() {
    scenarios = [
        ...scenarios,
        {
            name: 'new-scenario',
            playerStarts: DEFAULT_PLAYER_STARTS.map(function (start) {
                return { ...start };
            }),
            decorations: [{ type: 'saloon', x: 0, y: 220 }],
            cacti: [],
            rocks: []
        }
    ];
    selectedScenarioIndex = scenarios.length - 1;
    selectedObjectRef = null;
    clearStatus();
    render();
}

function duplicateScenario() {
    const duplicated = duplicateScenarioSource(
        scenarios,
        selectedScenarioIndex
    );

    scenarios = duplicated.scenarios;
    selectedScenarioIndex = duplicated.selectedIndex;
    selectedObjectRef = null;
    clearStatus();
    render();
}

function addObject() {
    const kind = elements.addKindSelect.value as
        | 'rock'
        | 'cactus'
        | 'decoration'
        | 'wagon';
    const added = addScenarioObject(
        scenarios,
        selectedScenarioIndex,
        kind,
        { x: ARENA_WIDTH / 2, y: ARENA_HEIGHT / 2 },
        { rockType: elements.rockTypeSelect.value }
    );

    scenarios = added.scenarios;
    selectedObjectRef = added.ref;
    clearStatus();
    render();
}

function removeObject() {
    scenarios = removeScenarioObject(
        scenarios,
        selectedScenarioIndex,
        selectedObjectRef
    );
    selectedObjectRef = null;
    clearStatus();
    render();
}

function applyObjectInputs() {
    if (!selectedObjectRef) {
        return;
    }

    if (selectedObjectRef.kind === 'wagon') {
        scenarios = updateScenarioObjectFields(
            scenarios,
            selectedScenarioIndex,
            selectedObjectRef,
            {
                duration: elements.wagonDurationInput.value,
                fromY: elements.wagonFromYInput.value,
                toY: elements.wagonToYInput.value,
                x: elements.objectXInput.value
            }
        );
    } else if (
        selectedObjectRef.kind === 'rock' ||
        selectedObjectRef.kind === 'decoration'
    ) {
        scenarios = updateScenarioObjectFields(
            scenarios,
            selectedScenarioIndex,
            selectedObjectRef,
            {
                type: elements.objectTypeSelect.value,
                x: elements.objectXInput.value,
                y: elements.objectYInput.value
            }
        );
    } else {
        scenarios = updateScenarioObjectFields(
            scenarios,
            selectedScenarioIndex,
            selectedObjectRef,
            {
                x: elements.objectXInput.value,
                y: elements.objectYInput.value
            }
        );
    }

    clearStatus();
    render();
}

function startDrag(event: PointerEvent) {
    const hitRef = getObjectAtCanvasPosition(event);

    if (!hitRef) {
        return;
    }

    event.preventDefault();
    elements.canvas.setPointerCapture(event.pointerId);
    selectedObjectRef = hitRef;
    dragObjectRef = hitRef;
    clearStatus();
    render();
}

function continueDrag(event: PointerEvent) {
    if (!dragObjectRef) {
        return;
    }

    event.preventDefault();
    scenarios = updateScenarioObjectPosition(
        scenarios,
        selectedScenarioIndex,
        dragObjectRef,
        screenToWorld(getCanvasPoint(event), getViewTransform())
    );
    render();
}

function endDrag(event: PointerEvent) {
    if (dragObjectRef) {
        event.preventDefault();
    }

    dragObjectRef = null;
}

function render() {
    selectedScenarioIndex = Math.min(
        selectedScenarioIndex,
        Math.max(0, scenarios.length - 1)
    );
    ensureSelectedObjectStillExists();
    renderScenarioControls();
    renderObjectPalette();
    renderObjectControls();
    renderOutput();
    renderValidation();
    renderCanvas();
}

function renderScenarioControls() {
    elements.scenarioSelect.replaceChildren(
        ...scenarios.map(function (_scenario, index) {
            const option = document.createElement('option');

            option.value = String(index);
            option.textContent = getScenarioName(scenarios, index);

            return option;
        })
    );
    elements.scenarioSelect.value = String(selectedScenarioIndex);
    elements.nameInput.value = getScenarioName(
        scenarios,
        selectedScenarioIndex
    );
    elements.duplicateButton.disabled = scenarios.length === 0;
}

function renderObjectPalette() {
    const rockTypes = Object.keys(rockDefinitions);
    const addingRock = elements.addKindSelect.value === 'rock';

    elements.rockTypeLabel.hidden = !addingRock;
    elements.rockTypeSelect.replaceChildren(
        ...rockTypes.map(function (type) {
            const option = document.createElement('option');

            option.value = type;
            option.textContent = type;

            return option;
        })
    );
    elements.addObjectButton.disabled =
        scenarios.length === 0 || (addingRock && rockTypes.length === 0);
}

function renderObjectControls() {
    const scenario = scenarios[selectedScenarioIndex];
    const objects = listScenarioObjects(scenario);
    const selectedObject = getScenarioObject(scenario, selectedObjectRef);
    const selectedAnchor = getScenarioObjectAnchor(scenario, selectedObjectRef);
    const selectedId = selectedObjectRef
        ? getScenarioObjectId(selectedObjectRef)
        : '';

    elements.objectSelect.replaceChildren(
        ...objects.map(function (object) {
            const option = document.createElement('option');

            option.value = object.id;
            option.textContent = object.label;

            return option;
        })
    );
    elements.objectSelect.value = selectedId;
    elements.removeObjectButton.disabled =
        !selectedObject ||
        (!!selectedObjectRef && selectedObjectRef.kind === 'player-start');
    elements.selectedObjectLabel.textContent = selectedObject
        ? getSelectedObjectLabel()
        : 'No object';

    renderTypeControl(selectedObject);
    renderCoordinateControls(selectedObject, selectedAnchor);
}

function renderTypeControl(
    selectedObject: ReturnType<typeof getScenarioObject>
) {
    const isRock = selectedObjectRef && selectedObjectRef.kind === 'rock';
    const isDecoration =
        selectedObjectRef && selectedObjectRef.kind === 'decoration';
    const options = isRock
        ? Object.keys(rockDefinitions)
        : isDecoration
          ? ['saloon']
          : [];

    elements.objectTypeControl.hidden = !isRock && !isDecoration;
    elements.objectTypeSelect.replaceChildren(
        ...options.map(function (type) {
            const option = document.createElement('option');

            option.value = type;
            option.textContent = type;

            return option;
        })
    );

    if (selectedObject && 'type' in selectedObject) {
        elements.objectTypeSelect.value = selectedObject.type;
    }
}

function renderCoordinateControls(
    selectedObject: ReturnType<typeof getScenarioObject>,
    selectedAnchor: Point | null
) {
    const isWagon = !!selectedObjectRef && selectedObjectRef.kind === 'wagon';
    const wagon = isWagon ? (selectedObject as WagonInstance | null) : null;

    elements.objectYControl.hidden = isWagon;
    elements.wagonFromYControl.hidden = !isWagon;
    elements.wagonToYControl.hidden = !isWagon;
    elements.wagonDurationControl.hidden = !isWagon;
    elements.objectXInput.disabled = !selectedObject;
    elements.objectYInput.disabled = !selectedObject || isWagon;
    elements.objectTypeSelect.disabled = !selectedObject;
    elements.wagonFromYInput.disabled = !wagon;
    elements.wagonToYInput.disabled = !wagon;
    elements.wagonDurationInput.disabled = !wagon;
    elements.objectXInput.value = selectedAnchor
        ? String(selectedAnchor.x)
        : '';
    elements.objectYInput.value = selectedAnchor
        ? String(selectedAnchor.y)
        : '';
    elements.wagonFromYInput.value = wagon ? String(wagon.fromY) : '';
    elements.wagonToYInput.value = wagon ? String(wagon.toY) : '';
    elements.wagonDurationInput.value =
        wagon && wagon.duration ? String(wagon.duration) : '';
}

function renderOutput() {
    elements.output.value = formatScenarioSources(scenarios);
}

function renderValidation() {
    const errors = validateScenarioSources(scenarios, rockDefinitions);
    const messages = statusMessage
        ? [statusMessage]
        : errors.length > 0
          ? errors
          : ['Valid scenario JSON.'];

    elements.validation.classList.toggle(
        'is-error',
        statusIsError || errors.length > 0
    );
    elements.validation.replaceChildren(
        ...messages.map(function (message) {
            const item = document.createElement('div');

            item.textContent = message;

            return item;
        })
    );
}

function renderCanvas() {
    const context = prepareCanvasContext();
    const transform = getViewTransform();
    const scenario = scenarios[selectedScenarioIndex];

    context.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
    drawArena(context, transform);

    if (!scenario) {
        return;
    }

    drawDecorations(context, transform, scenario);
    drawCacti(context, transform, scenario);
    drawRocks(context, transform, scenario);
    drawWagon(context, transform, scenario);
    drawPlayerStarts(context, transform, scenario);
    drawObjectHandles(context, transform, scenario);
}

function drawArena(
    context: CanvasRenderingContext2D,
    transform: ViewTransform
) {
    const topLeft = worldToScreen({ x: 0, y: 0 }, transform);
    const bottomRight = worldToScreen(
        { x: ARENA_WIDTH, y: ARENA_HEIGHT },
        transform
    );

    context.save();
    context.fillStyle = PREVIEW_COLORS.arena;
    context.fillRect(
        topLeft.x,
        topLeft.y,
        bottomRight.x - topLeft.x,
        bottomRight.y - topLeft.y
    );
    context.strokeStyle = PREVIEW_COLORS.grid;
    context.lineWidth = 1;

    for (let x = 0; x <= ARENA_WIDTH; x += GRID_STEP) {
        drawWorldLine(context, transform, { x, y: 0 }, { x, y: ARENA_HEIGHT });
    }

    for (let y = 0; y <= ARENA_HEIGHT; y += GRID_STEP) {
        drawWorldLine(context, transform, { x: 0, y }, { x: ARENA_WIDTH, y });
    }

    context.strokeStyle = PREVIEW_COLORS.selected;
    context.strokeRect(
        topLeft.x,
        topLeft.y,
        bottomRight.x - topLeft.x,
        bottomRight.y - topLeft.y
    );
    context.restore();
}

function drawDecorations(
    context: CanvasRenderingContext2D,
    transform: ViewTransform,
    scenario: ScenarioSource
) {
    (scenario.decorations || []).forEach(function (decoration, index) {
        const selected = isSelected({ kind: 'decoration', index });

        if (decoration.type === 'saloon') {
            drawSaloon(context, transform, decoration, selected);
        }
    });
}

function drawSaloon(
    context: CanvasRenderingContext2D,
    transform: ViewTransform,
    decoration: Decoration,
    selected: boolean
) {
    const point = worldToScreen(decoration, transform);
    const width = 128 * transform.scale;
    const height = 256 * transform.scale;

    context.save();

    if (sprites.saloon.complete) {
        context.drawImage(sprites.saloon, point.x, point.y, width, height);
    } else {
        context.fillStyle = PREVIEW_COLORS.saloon;
        context.fillRect(point.x, point.y, width, height);
    }

    if (selected) {
        context.strokeStyle = PREVIEW_COLORS.selected;
        context.lineWidth = 2;
        context.strokeRect(point.x, point.y, width, height);
    }

    context.restore();
}

function drawCacti(
    context: CanvasRenderingContext2D,
    transform: ViewTransform,
    scenario: ScenarioSource
) {
    (scenario.cacti || []).forEach(function (cactus, index) {
        const point = worldToScreen(cactus, transform);
        const width = 34 * transform.scale;
        const height = 64 * transform.scale;

        context.save();

        if (sprites.cactus.complete) {
            context.drawImage(
                sprites.cactus,
                0,
                0,
                17,
                32,
                point.x - width / 2,
                point.y - height,
                width,
                height
            );
        } else {
            context.fillStyle = PREVIEW_COLORS.cactus;
            context.fillRect(
                point.x - width / 2,
                point.y - height,
                width,
                height
            );
        }

        if (isSelected({ kind: 'cactus', index })) {
            drawSelectionBox(
                context,
                point.x - width / 2,
                point.y - height,
                width,
                height
            );
        }

        context.restore();
    });
}

function drawRocks(
    context: CanvasRenderingContext2D,
    transform: ViewTransform,
    scenario: ScenarioSource
) {
    (scenario.rocks || []).forEach(function (rock, index) {
        const definition = rockDefinitions[rock.type];

        if (!definition || definition.lines.length === 0) {
            return;
        }

        const firstPoint = worldToScreen(
            {
                x: rock.x + definition.lines[0].from[0],
                y: rock.y + definition.lines[0].from[1]
            },
            transform
        );

        context.save();
        context.fillStyle = PREVIEW_COLORS.rock;
        context.strokeStyle = isSelected({ kind: 'rock', index })
            ? PREVIEW_COLORS.selected
            : PREVIEW_COLORS.text;
        context.lineWidth = isSelected({ kind: 'rock', index }) ? 2 : 1;
        context.beginPath();
        context.moveTo(firstPoint.x, firstPoint.y);

        definition.lines.forEach(function (line) {
            const point = worldToScreen(
                {
                    x: rock.x + line.to[0],
                    y: rock.y + line.to[1]
                },
                transform
            );

            context.lineTo(point.x, point.y);
        });

        context.closePath();
        context.fill();
        context.stroke();
        context.restore();
    });
}

function drawWagon(
    context: CanvasRenderingContext2D,
    transform: ViewTransform,
    scenario: ScenarioSource
) {
    const wagon = scenario.wagon;

    if (!wagon) {
        return;
    }

    const from = worldToScreen({ x: wagon.x, y: wagon.fromY }, transform);
    const to = worldToScreen({ x: wagon.x, y: wagon.toY }, transform);
    const anchor = worldToScreen(
        {
            x: wagon.x,
            y: (wagon.fromY + wagon.toY) / 2
        },
        transform
    );
    const width = 74 * transform.scale;
    const height = 76 * transform.scale;

    context.save();
    context.strokeStyle = PREVIEW_COLORS.wagonPath;
    context.lineWidth = 2;
    context.setLineDash([6, 6]);
    drawLine(context, from.x, from.y, to.x, to.y);
    context.setLineDash([]);

    if (sprites.wagon.complete) {
        context.drawImage(
            sprites.wagon,
            0,
            0,
            37,
            38,
            anchor.x - width / 2,
            anchor.y - height / 2,
            width,
            height
        );
    } else {
        context.fillStyle = PREVIEW_COLORS.wagon;
        context.fillRect(
            anchor.x - width / 2,
            anchor.y - height / 2,
            width,
            height
        );
    }

    if (isSelected({ kind: 'wagon', index: 0 })) {
        drawSelectionBox(
            context,
            anchor.x - width / 2,
            anchor.y - height / 2,
            width,
            height
        );
    }

    context.restore();
}

function drawPlayerStarts(
    context: CanvasRenderingContext2D,
    transform: ViewTransform,
    scenario: ScenarioSource
) {
    context.save();
    context.strokeStyle = PREVIEW_COLORS.playerStart;
    context.fillStyle = PREVIEW_COLORS.playerStart;
    context.font = '12px monospace';
    context.textAlign = 'center';

    (scenario.playerStarts || DEFAULT_PLAYER_STARTS).forEach(
        function (start, index) {
            const point = worldToScreen(start, transform);

            drawLine(context, point.x - 12, point.y, point.x + 12, point.y);
            drawLine(context, point.x, point.y - 12, point.x, point.y + 12);
            context.fillText('P' + String(index + 1), point.x, point.y - 16);
        }
    );

    context.restore();
}

function drawObjectHandles(
    context: CanvasRenderingContext2D,
    transform: ViewTransform,
    scenario: ScenarioSource
) {
    listScenarioObjects(scenario).forEach(function (object) {
        const point = worldToScreen(object, transform);
        const selected = selectedObjectRef
            ? object.id === getScenarioObjectId(selectedObjectRef)
            : false;

        context.save();
        context.fillStyle = selected
            ? PREVIEW_COLORS.selected
            : PREVIEW_COLORS.handle;
        context.strokeStyle = PREVIEW_COLORS.text;
        context.lineWidth = 2;
        context.beginPath();
        context.arc(point.x, point.y, HANDLE_RADIUS, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        context.fillStyle = selected
            ? PREVIEW_COLORS.text
            : PREVIEW_COLORS.handleText;
        context.font = '10px monospace';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(
            object.type.slice(0, 1).toUpperCase(),
            point.x,
            point.y + 1
        );
        context.restore();
    });
}

function drawSelectionBox(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
) {
    context.strokeStyle = PREVIEW_COLORS.selected;
    context.lineWidth = 2;
    context.strokeRect(x, y, width, height);
}

function drawWorldLine(
    context: CanvasRenderingContext2D,
    transform: ViewTransform,
    start: Point,
    end: Point
) {
    const screenStart = worldToScreen(start, transform);
    const screenEnd = worldToScreen(end, transform);

    drawLine(context, screenStart.x, screenStart.y, screenEnd.x, screenEnd.y);
}

function drawLine(
    context: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number
) {
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
}

function prepareCanvasContext(): CanvasRenderingContext2D {
    const context = elements.canvas.getContext('2d');
    const rect = elements.canvas.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;

    if (!context) {
        throw new Error('Unable to create scenario editor canvas context');
    }

    elements.canvas.width = Math.max(1, Math.round(rect.width * pixelRatio));
    elements.canvas.height = Math.max(1, Math.round(rect.height * pixelRatio));
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    CanvasTools.disableImageSmoothing(context);

    return context;
}

function getViewTransform(): ViewTransform {
    const rect = elements.canvas.getBoundingClientRect();
    const scale = Math.min(
        rect.width / ARENA_WIDTH,
        rect.height / ARENA_HEIGHT
    );

    return {
        originX: (rect.width - ARENA_WIDTH * scale) / 2,
        originY: (rect.height - ARENA_HEIGHT * scale) / 2,
        scale
    };
}

function worldToScreen(point: Point, transform: ViewTransform): Point {
    return {
        x: transform.originX + point.x * transform.scale,
        y: transform.originY + point.y * transform.scale
    };
}

function screenToWorld(point: Point, transform: ViewTransform): Point {
    return {
        x: cleanNumber((point.x - transform.originX) / transform.scale),
        y: cleanNumber((point.y - transform.originY) / transform.scale)
    };
}

function getObjectAtCanvasPosition(
    event: PointerEvent
): ScenarioObjectRef | null {
    const scenario = scenarios[selectedScenarioIndex];
    const transform = getViewTransform();
    const canvasPoint = getCanvasPoint(event);
    let hitRef: ScenarioObjectRef | null = null;
    let hitDistance = Infinity;

    listScenarioObjects(scenario).forEach(function (object) {
        const point = worldToScreen(object, transform);
        const distance = Math.hypot(
            point.x - canvasPoint.x,
            point.y - canvasPoint.y
        );

        if (distance <= HANDLE_RADIUS * 2 && distance < hitDistance) {
            hitDistance = distance;
            hitRef = object.ref;
        }
    });

    return hitRef;
}

function getCanvasPoint(event: PointerEvent): Point {
    const rect = elements.canvas.getBoundingClientRect();

    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

function ensureSelectedObjectStillExists() {
    if (
        selectedObjectRef &&
        !getScenarioObject(scenarios[selectedScenarioIndex], selectedObjectRef)
    ) {
        selectedObjectRef = null;
    }
}

function getSelectedObjectLabel() {
    if (!selectedObjectRef) {
        return 'No object';
    }

    const object = listScenarioObjects(scenarios[selectedScenarioIndex]).find(
        function (summary) {
            return (
                summary.id ===
                getScenarioObjectId(selectedObjectRef as ScenarioObjectRef)
            );
        }
    );

    return object ? object.label : 'No object';
}

function isSelected(ref: ScenarioObjectRef) {
    return (
        !!selectedObjectRef &&
        selectedObjectRef.kind === ref.kind &&
        selectedObjectRef.index === ref.index
    );
}

function clearStatus() {
    statusMessage = null;
    statusIsError = false;
}

function loadSprites(): SpriteSet {
    return {
        cactus: createSprite('images/cactus-1-4-17X32.png'),
        saloon: createSprite('images/saloon-64x128.png'),
        wagon: createSprite('images/wagon-1-4-37x38.png')
    };
}

function createSprite(source: string) {
    const image = new Image();

    image.src = source;

    return image;
}

function requireElement<T extends typeof HTMLElement>(
    id: string,
    constructor: T
): InstanceType<T> {
    const element = document.getElementById(id);

    if (!(element instanceof constructor)) {
        throw new Error('Missing scenario editor element: ' + id);
    }

    return element as InstanceType<T>;
}

function cleanNumber(value: number): number {
    return Math.round(value * 100) / 100;
}

start();
