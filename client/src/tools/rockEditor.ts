import {
    DEFAULT_ROCK_EDITOR_JSON,
    definitionToPoints,
    duplicateRockDefinition,
    formatRockDefinitions,
    insertPointAfter,
    normalizeRockType,
    parseRockEditorJson,
    removePointAt,
    renameRockDefinition,
    scaleRockDefinition,
    setRockDefinition,
    updateRockPoint,
    validateRockCollection,
    validateRockDefinition,
    type Point
} from './rockEditorCore.js';
import type {
    RockDefinition,
    RockDefinitions
} from '../../../shared/contracts.js';
import { CanvasTools } from '../platform/canvasTools.js';

type ViewTransform = {
    originX: number;
    originY: number;
    scale: number;
};

const HANDLE_RADIUS = 7;
const GRID_STEP = 10;
const PREVIEW_PADDING = 38;
const PREVIEW_COLORS = {
    axis: 'rgba(86,197,255,0.34)',
    background: 'rgb(8,11,13)',
    grid: 'rgba(137,156,165,0.18)',
    handle: 'rgb(219,229,234)',
    handleText: 'rgb(11,14,16)',
    outline: 'rgb(200,200,200)',
    rock: 'rgba(28, 159, 192, 0.6)',
    selectedHandle: 'rgb(86,197,255)',
    shadow: 'rgba(0,0,0,0.55)'
};

const elements = {
    addPointButton: requireElement('rockAddPointButton', HTMLButtonElement),
    applySizeButton: requireElement('rockApplySizeButton', HTMLButtonElement),
    canvas: requireElement('rockEditorCanvas', HTMLCanvasElement),
    copyOutputButton: requireElement('rockCopyOutputButton', HTMLButtonElement),
    duplicateButton: requireElement('rockDuplicateButton', HTMLButtonElement),
    heightInput: requireElement('rockHeightInput', HTMLInputElement),
    input: requireElement('rockJsonInput', HTMLTextAreaElement),
    loadButton: requireElement('rockLoadJsonButton', HTMLButtonElement),
    output: requireElement('rockJsonOutput', HTMLTextAreaElement),
    pointXInput: requireElement('rockPointXInput', HTMLInputElement),
    pointYInput: requireElement('rockPointYInput', HTMLInputElement),
    removePointButton: requireElement(
        'rockRemovePointButton',
        HTMLButtonElement
    ),
    renameButton: requireElement('rockRenameButton', HTMLButtonElement),
    selectedPointLabel: requireElement('rockSelectedPointLabel', HTMLElement),
    typeInput: requireElement('rockTypeInput', HTMLInputElement),
    typeSelect: requireElement('rockTypeSelect', HTMLSelectElement),
    useOutputButton: requireElement('rockUseOutputButton', HTMLButtonElement),
    validation: requireElement('rockValidation', HTMLElement),
    widthInput: requireElement('rockWidthInput', HTMLInputElement)
};

let definitions: RockDefinitions = {};
let selectedPointIndex = 0;
let selectedType = '';
let dragPointIndex: number | null = null;
let statusMessage: string | null = null;
let statusIsError = false;

async function start() {
    elements.input.value = DEFAULT_ROCK_EDITOR_JSON;
    await loadInitialRockJson();
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
            elements.input.value = await response.text();
        }
    } catch (error) {
        statusMessage = 'Using built-in rock JSON sample.';
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
    elements.typeSelect.addEventListener('change', function () {
        selectedType = elements.typeSelect.value;
        selectedPointIndex = 0;
        clearStatus();
        render();
    });
    elements.renameButton.addEventListener('click', renameSelectedRock);
    elements.duplicateButton.addEventListener('click', duplicateSelectedRock);
    elements.addPointButton.addEventListener('click', addPoint);
    elements.removePointButton.addEventListener('click', removePoint);
    elements.applySizeButton.addEventListener('click', applySize);
    elements.pointXInput.addEventListener('change', applySelectedPointInput);
    elements.pointYInput.addEventListener('change', applySelectedPointInput);
    elements.canvas.addEventListener('pointerdown', startDrag);
    elements.canvas.addEventListener('pointermove', continueDrag);
    elements.canvas.addEventListener('pointerup', endDrag);
    elements.canvas.addEventListener('pointercancel', endDrag);
    window.addEventListener('resize', function () {
        renderCanvas();
    });
}

function importInputJson() {
    try {
        const parsed = parseRockEditorJson(elements.input.value, selectedType);

        definitions = parsed.definitions;
        selectedType = parsed.selectedType;
        selectedPointIndex = 0;
        statusMessage = null;
        statusIsError = false;
    } catch (error) {
        statusMessage =
            error instanceof Error
                ? error.message
                : 'Unable to read rock JSON.';
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

function renameSelectedRock() {
    const nextType = normalizeRockType(elements.typeInput.value);

    if (nextType !== selectedType && definitions[nextType]) {
        statusMessage = 'Rock type "' + nextType + '" already exists.';
        statusIsError = true;
        renderValidation();
        return;
    }

    definitions = renameRockDefinition(definitions, selectedType, nextType);
    selectedType = nextType;
    clearStatus();
    render();
}

function duplicateSelectedRock() {
    const duplicated = duplicateRockDefinition(definitions, selectedType);

    definitions = duplicated.definitions;
    selectedType = duplicated.selectedType;
    selectedPointIndex = 0;
    clearStatus();
    render();
}

function addPoint() {
    const definition = getSelectedDefinition();

    if (!definition) {
        return;
    }

    updateSelectedDefinition(insertPointAfter(definition, selectedPointIndex));
    selectedPointIndex += 1;
}

function removePoint() {
    const definition = getSelectedDefinition();

    if (!definition) {
        return;
    }

    updateSelectedDefinition(removePointAt(definition, selectedPointIndex));
    selectedPointIndex = Math.max(0, selectedPointIndex - 1);
}

function applySize() {
    const definition = getSelectedDefinition();
    const width = Number(elements.widthInput.value);
    const height = Number(elements.heightInput.value);

    if (!definition || !Number.isFinite(width) || !Number.isFinite(height)) {
        return;
    }

    updateSelectedDefinition(scaleRockDefinition(definition, width, height));
}

function applySelectedPointInput() {
    const definition = getSelectedDefinition();
    const x = Number(elements.pointXInput.value);
    const y = Number(elements.pointYInput.value);

    if (!definition || !Number.isFinite(x) || !Number.isFinite(y)) {
        return;
    }

    updateSelectedDefinition(
        updateRockPoint(definition, selectedPointIndex, {
            x,
            y
        })
    );
}

function startDrag(event: PointerEvent) {
    const definition = getSelectedDefinition();

    if (!definition) {
        return;
    }

    const points = definitionToPoints(definition);
    const hitIndex = getPointAtCanvasPosition(points, event);

    if (hitIndex === null) {
        return;
    }

    event.preventDefault();
    elements.canvas.setPointerCapture(event.pointerId);
    dragPointIndex = hitIndex;
    selectedPointIndex = hitIndex;
    clearStatus();
    render();
}

function continueDrag(event: PointerEvent) {
    const definition = getSelectedDefinition();

    if (dragPointIndex === null || !definition) {
        return;
    }

    event.preventDefault();
    updateSelectedDefinition(
        updateRockPoint(
            definition,
            dragPointIndex,
            screenToWorld(getCanvasPoint(event), getViewTransform(definition))
        )
    );
}

function endDrag(event: PointerEvent) {
    if (dragPointIndex !== null) {
        event.preventDefault();
    }

    dragPointIndex = null;
}

function updateSelectedDefinition(definition: RockDefinition) {
    definitions = setRockDefinition(definitions, selectedType, definition);
    clearStatus();
    render();
}

function render() {
    renderTypeControls();
    renderSelectedControls();
    renderOutput();
    renderValidation();
    renderCanvas();
}

function renderTypeControls() {
    const types = Object.keys(definitions);

    elements.typeSelect.replaceChildren(
        ...types.map(function (type) {
            const option = document.createElement('option');

            option.value = type;
            option.textContent = type;

            return option;
        })
    );
    elements.typeSelect.value = selectedType;
    elements.typeInput.value = selectedType;
}

function renderSelectedControls() {
    const definition = getSelectedDefinition();

    if (!definition) {
        elements.selectedPointLabel.textContent = 'No point';
        return;
    }

    const points = definitionToPoints(definition);
    const point = points[selectedPointIndex] || points[0];
    const validation = validateRockDefinition(definition);
    const bounds = validation.bounds;

    selectedPointIndex = Math.min(selectedPointIndex, points.length - 1);
    elements.selectedPointLabel.textContent =
        'Point ' + String(selectedPointIndex + 1);
    elements.pointXInput.value = String(point.x);
    elements.pointYInput.value = String(point.y);
    elements.widthInput.value = bounds ? String(bounds.width) : '';
    elements.heightInput.value = bounds ? String(bounds.height) : '';
    elements.removePointButton.disabled = points.length <= 3;
}

function renderOutput() {
    if (Object.keys(definitions).length > 0) {
        elements.output.value = formatRockDefinitions(definitions);
    }
}

function renderValidation() {
    const errors = validateRockCollection(definitions);
    const messages = statusMessage
        ? [statusMessage]
        : errors.length > 0
          ? errors
          : ['Valid rock JSON.'];

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
    const definition = getSelectedDefinition();
    const context = prepareCanvasContext();
    const rect = elements.canvas.getBoundingClientRect();

    context.clearRect(0, 0, rect.width, rect.height);
    drawGrid(context, rect.width, rect.height);

    if (!definition) {
        return;
    }

    drawRock(context, definition);
}

function drawGrid(
    context: CanvasRenderingContext2D,
    width: number,
    height: number
) {
    context.save();
    context.fillStyle = PREVIEW_COLORS.background;
    context.fillRect(0, 0, width, height);
    context.strokeStyle = PREVIEW_COLORS.grid;
    context.lineWidth = 1;

    for (let x = width / 2; x < width; x += GRID_STEP) {
        drawLine(context, x, 0, x, height);
    }

    for (let x = width / 2 - GRID_STEP; x > 0; x -= GRID_STEP) {
        drawLine(context, x, 0, x, height);
    }

    for (let y = height / 2; y < height; y += GRID_STEP) {
        drawLine(context, 0, y, width, y);
    }

    for (let y = height / 2 - GRID_STEP; y > 0; y -= GRID_STEP) {
        drawLine(context, 0, y, width, y);
    }

    context.strokeStyle = PREVIEW_COLORS.axis;
    drawLine(context, width / 2, 0, width / 2, height);
    drawLine(context, 0, height / 2, width, height / 2);
    context.restore();
}

function drawRock(
    context: CanvasRenderingContext2D,
    definition: RockDefinition
) {
    const points = definitionToPoints(definition);
    const transform = getViewTransform(definition);
    const firstPoint = worldToScreen(points[0], transform);

    context.save();
    context.shadowColor = PREVIEW_COLORS.shadow;
    context.shadowOffsetX = 3;
    context.shadowOffsetY = 3;
    context.fillStyle = PREVIEW_COLORS.rock;
    context.strokeStyle = PREVIEW_COLORS.outline;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(firstPoint.x, firstPoint.y);
    points.slice(1).forEach(function (point) {
        const screenPoint = worldToScreen(point, transform);

        context.lineTo(screenPoint.x, screenPoint.y);
    });
    context.closePath();
    context.fill();
    context.stroke();
    context.restore();

    points.forEach(function (point, index) {
        drawHandle(context, worldToScreen(point, transform), index);
    });
}

function drawHandle(
    context: CanvasRenderingContext2D,
    point: Point,
    pointIndex: number
) {
    const selected = pointIndex === selectedPointIndex;

    context.save();
    context.fillStyle = selected
        ? PREVIEW_COLORS.selectedHandle
        : PREVIEW_COLORS.handle;
    context.strokeStyle = PREVIEW_COLORS.outline;
    context.lineWidth = 2;
    context.beginPath();
    context.arc(point.x, point.y, HANDLE_RADIUS, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.fillStyle = selected
        ? PREVIEW_COLORS.outline
        : PREVIEW_COLORS.handleText;
    context.font = '10px monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(String(pointIndex + 1), point.x, point.y + 1);
    context.restore();
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
        throw new Error('Unable to create rock editor canvas context');
    }

    elements.canvas.width = Math.max(1, Math.round(rect.width * pixelRatio));
    elements.canvas.height = Math.max(1, Math.round(rect.height * pixelRatio));
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    CanvasTools.disableImageSmoothing(context);

    return context;
}

function getViewTransform(definition: RockDefinition): ViewTransform {
    const points = definitionToPoints(definition);
    const validation = validateRockDefinition(definition);
    const bounds = validation.bounds || {
        height: 80,
        maxX: 40,
        maxY: 40,
        minX: -40,
        minY: -40,
        width: 80
    };
    const rect = elements.canvas.getBoundingClientRect();
    const available = Math.max(
        1,
        Math.min(rect.width, rect.height) - PREVIEW_PADDING * 2
    );
    const maxDimension = Math.max(bounds.width, bounds.height, 1);
    const scale = available / maxDimension;
    const center = calculateCenter(points);

    return {
        originX: rect.width / 2 - center.x * scale,
        originY: rect.height / 2 - center.y * scale,
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
        x: Math.round((point.x - transform.originX) / transform.scale),
        y: Math.round((point.y - transform.originY) / transform.scale)
    };
}

function getPointAtCanvasPosition(
    points: Point[],
    event: PointerEvent
): number | null {
    const transform = getViewTransform(
        getSelectedDefinition() as RockDefinition
    );
    const canvasPoint = getCanvasPoint(event);
    let hitIndex: number | null = null;
    let hitDistance = Infinity;

    points.forEach(function (point, index) {
        const screenPoint = worldToScreen(point, transform);
        const dx = canvasPoint.x - screenPoint.x;
        const dy = canvasPoint.y - screenPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= HANDLE_RADIUS + 5 && distance < hitDistance) {
            hitIndex = index;
            hitDistance = distance;
        }
    });

    return hitIndex;
}

function getCanvasPoint(event: PointerEvent): Point {
    const rect = elements.canvas.getBoundingClientRect();

    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

function calculateCenter(points: Point[]): Point {
    const x =
        points.reduce(function (sum, point) {
            return sum + point.x;
        }, 0) / points.length;
    const y =
        points.reduce(function (sum, point) {
            return sum + point.y;
        }, 0) / points.length;

    return {
        x,
        y
    };
}

function getSelectedDefinition(): RockDefinition | null {
    return definitions[selectedType] || null;
}

function clearStatus() {
    statusMessage = null;
    statusIsError = false;
}

function requireElement<T extends HTMLElement>(
    id: string,
    constructor: new () => T
): T {
    const element = document.getElementById(id);

    if (!(element instanceof constructor)) {
        throw new Error('Missing #' + id);
    }

    return element;
}

void start();
