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

type DragState =
    | {
          pointIndex: number;
          type: 'point';
      }
    | {
          lastPoint: Point;
          type: 'pan';
      };

const HANDLE_RADIUS = 7;
const GRID_WORLD_STEPS = [5, 10, 20, 25, 50, 100, 200, 500];
const MIN_GRID_PIXEL_STEP = 32;
const ORIGIN_MARKER_HIT_RADIUS = 12;
const ORIGIN_MARKER_RADIUS = 5;
const SCALE_BAR_MIN_WIDTH = 58;
const ZOOM_LEVELS = [1, 1.5, 2, 3, 4, 5, 6, 8, 10];
const DEFAULT_ZOOM_INDEX = 4;
const PREVIEW_COLORS = {
    axis: 'rgba(86,197,255,0.34)',
    background: 'rgb(8,11,13)',
    grid: 'rgba(137,156,165,0.18)',
    handle: 'rgb(219,229,234)',
    handleText: 'rgb(11,14,16)',
    label: 'rgba(219,229,234,0.58)',
    origin: 'rgba(255,232,145,0.86)',
    outline: 'rgb(200,200,200)',
    rock: 'rgba(28, 159, 192, 0.6)',
    scaleBar: 'rgba(219,229,234,0.68)',
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
    widthInput: requireElement('rockWidthInput', HTMLInputElement),
    zoomInButton: requireElement('rockZoomInButton', HTMLButtonElement),
    zoomLabel: requireElement('rockZoomLabel', HTMLElement),
    zoomOutButton: requireElement('rockZoomOutButton', HTMLButtonElement),
    resetViewButton: requireElement('rockResetViewButton', HTMLButtonElement)
};

let definitions: RockDefinitions = {};
let selectedPointIndex = 0;
let selectedType = '';
let dragState: DragState | null = null;
let panOffset: Point = { x: 0, y: 0 };
let statusMessage: string | null = null;
let statusIsError = false;
let zoomIndex = DEFAULT_ZOOM_INDEX;

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
    } catch {
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
    elements.zoomOutButton.addEventListener('click', zoomOut);
    elements.zoomInButton.addEventListener('click', zoomIn);
    elements.resetViewButton.addEventListener('click', resetView);
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
    } catch {
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

function zoomOut() {
    setZoomIndex(zoomIndex - 1);
}

function zoomIn() {
    setZoomIndex(zoomIndex + 1);
}

function setZoomIndex(nextZoomIndex: number) {
    const clampedZoomIndex = clamp(nextZoomIndex, 0, ZOOM_LEVELS.length - 1);

    if (clampedZoomIndex === zoomIndex) {
        return;
    }

    const rect = elements.canvas.getBoundingClientRect();
    const centerScreen = {
        x: rect.width / 2,
        y: rect.height / 2
    };
    const centerWorld = screenToWorldExact(centerScreen, getViewTransform());

    zoomIndex = clampedZoomIndex;
    panOffset = {
        x: centerScreen.x - rect.width / 2 - centerWorld.x * getZoomScale(),
        y: centerScreen.y - rect.height / 2 - centerWorld.y * getZoomScale()
    };

    renderZoomControls();
    renderCanvas();
}

function resetView() {
    zoomIndex = DEFAULT_ZOOM_INDEX;
    panOffset = { x: 0, y: 0 };
    renderZoomControls();
    renderCanvas();
}

function startDrag(event: PointerEvent) {
    const definition = getSelectedDefinition();
    const canvasPoint = getCanvasPoint(event);
    const transform = getViewTransform();

    const hitIndex = definition
        ? getPointAtCanvasPosition(definitionToPoints(definition), canvasPoint)
        : null;

    event.preventDefault();
    elements.canvas.setPointerCapture(event.pointerId);

    if (hitIndex !== null) {
        dragState = {
            pointIndex: hitIndex,
            type: 'point'
        };
        selectedPointIndex = hitIndex;
        clearStatus();
        render();
        return;
    }

    dragState = {
        lastPoint: canvasPoint,
        type: 'pan'
    };

    if (isOriginMarkerAtCanvasPosition(canvasPoint, transform)) {
        renderCanvas();
    }
}

function continueDrag(event: PointerEvent) {
    const definition = getSelectedDefinition();
    const canvasPoint = getCanvasPoint(event);

    if (!dragState) {
        return;
    }

    event.preventDefault();

    if (dragState.type === 'point') {
        if (!definition) {
            return;
        }

        updateSelectedDefinition(
            updateRockPoint(
                definition,
                dragState.pointIndex,
                screenToWorld(canvasPoint, getViewTransform())
            )
        );
        return;
    }

    panOffset = {
        x: panOffset.x + canvasPoint.x - dragState.lastPoint.x,
        y: panOffset.y + canvasPoint.y - dragState.lastPoint.y
    };
    dragState.lastPoint = canvasPoint;
    renderCanvas();
}

function endDrag(event: PointerEvent) {
    if (dragState) {
        event.preventDefault();
    }

    dragState = null;
}

function updateSelectedDefinition(definition: RockDefinition) {
    definitions = setRockDefinition(definitions, selectedType, definition);
    clearStatus();
    render();
}

function render() {
    renderTypeControls();
    renderSelectedControls();
    renderZoomControls();
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

function renderZoomControls() {
    const scale = getZoomScale();
    const gridStep = getGridWorldStep(scale);

    elements.zoomOutButton.disabled = zoomIndex <= 0;
    elements.zoomInButton.disabled = zoomIndex >= ZOOM_LEVELS.length - 1;
    elements.zoomLabel.textContent =
        formatScale(scale) + ' px/unit · grid ' + String(gridStep);
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
    const transform = getViewTransform();

    context.clearRect(0, 0, rect.width, rect.height);
    drawGrid(context, rect.width, rect.height, transform);

    if (definition) {
        drawRock(context, definition, transform);
    }

    drawOriginMarker(context, transform, rect.width, rect.height);
}

function drawGrid(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    transform: ViewTransform
) {
    const gridStep = getGridWorldStep(transform.scale);
    const topLeft = screenToWorldExact({ x: 0, y: 0 }, transform);
    const bottomRight = screenToWorldExact({ x: width, y: height }, transform);
    const firstX = Math.floor(topLeft.x / gridStep) * gridStep;
    const lastX = Math.ceil(bottomRight.x / gridStep) * gridStep;
    const firstY = Math.floor(topLeft.y / gridStep) * gridStep;
    const lastY = Math.ceil(bottomRight.y / gridStep) * gridStep;

    context.save();
    context.fillStyle = PREVIEW_COLORS.background;
    context.fillRect(0, 0, width, height);
    context.strokeStyle = PREVIEW_COLORS.grid;
    context.lineWidth = 1;

    for (let x = firstX; x <= lastX; x += gridStep) {
        if (x !== 0) {
            const screenX = worldToScreen({ x, y: 0 }, transform).x;

            drawLine(context, screenX, 0, screenX, height);
        }
    }

    for (let y = firstY; y <= lastY; y += gridStep) {
        if (y !== 0) {
            const screenY = worldToScreen({ x: 0, y }, transform).y;

            drawLine(context, 0, screenY, width, screenY);
        }
    }

    context.strokeStyle = PREVIEW_COLORS.axis;
    if (transform.originX >= 0 && transform.originX <= width) {
        drawLine(context, transform.originX, 0, transform.originX, height);
    }
    if (transform.originY >= 0 && transform.originY <= height) {
        drawLine(context, 0, transform.originY, width, transform.originY);
    }
    drawAxisLabels(context, width, height, transform, gridStep);
    drawScaleReference(context, height, transform.scale);
    context.restore();
}

function drawRock(
    context: CanvasRenderingContext2D,
    definition: RockDefinition,
    transform: ViewTransform
) {
    const points = definitionToPoints(definition);
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

function drawOriginMarker(
    context: CanvasRenderingContext2D,
    transform: ViewTransform,
    width: number,
    height: number
) {
    const origin = worldToScreen({ x: 0, y: 0 }, transform);

    if (
        origin.x < -ORIGIN_MARKER_HIT_RADIUS ||
        origin.x > width + ORIGIN_MARKER_HIT_RADIUS ||
        origin.y < -ORIGIN_MARKER_HIT_RADIUS ||
        origin.y > height + ORIGIN_MARKER_HIT_RADIUS
    ) {
        return;
    }

    context.save();
    context.strokeStyle = PREVIEW_COLORS.origin;
    context.fillStyle = PREVIEW_COLORS.origin;
    context.lineWidth = 1.5;
    context.beginPath();
    context.arc(origin.x, origin.y, ORIGIN_MARKER_RADIUS, 0, Math.PI * 2);
    context.stroke();
    drawLine(
        context,
        origin.x - ORIGIN_MARKER_HIT_RADIUS,
        origin.y,
        origin.x + ORIGIN_MARKER_HIT_RADIUS,
        origin.y
    );
    drawLine(
        context,
        origin.x,
        origin.y - ORIGIN_MARKER_HIT_RADIUS,
        origin.x,
        origin.y + ORIGIN_MARKER_HIT_RADIUS
    );
    context.font = '11px monospace';
    context.textAlign = 'left';
    context.textBaseline = 'bottom';
    context.fillText('(0,0)', origin.x + 8, origin.y - 7);
    context.restore();
}

function drawAxisLabels(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    transform: ViewTransform,
    gridStep: number
) {
    context.save();
    context.fillStyle = PREVIEW_COLORS.label;
    context.font = '10px monospace';
    context.textBaseline = 'top';

    if (transform.originY >= 0 && transform.originY <= height) {
        drawXAxisLabels(context, width, height, transform, gridStep);
    }

    if (transform.originX >= 0 && transform.originX <= width) {
        drawYAxisLabels(context, height, transform, gridStep);
    }

    context.restore();
}

function drawXAxisLabels(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    transform: ViewTransform,
    gridStep: number
) {
    const topLeft = screenToWorldExact({ x: 0, y: 0 }, transform);
    const bottomRight = screenToWorldExact({ x: width, y: height }, transform);
    const labelStep = getLabelWorldStep(gridStep, transform.scale);
    const firstX = Math.floor(topLeft.x / labelStep) * labelStep;
    const lastX = Math.ceil(bottomRight.x / labelStep) * labelStep;
    const labelY = clamp(transform.originY + 5, 8, height - 15);

    context.textAlign = 'center';

    for (let x = firstX; x <= lastX; x += labelStep) {
        if (x !== 0) {
            const screenX = worldToScreen({ x, y: 0 }, transform).x;

            context.fillText(String(x), screenX, labelY);
        }
    }
}

function drawYAxisLabels(
    context: CanvasRenderingContext2D,
    height: number,
    transform: ViewTransform,
    gridStep: number
) {
    const topLeft = screenToWorldExact({ x: 0, y: 0 }, transform);
    const bottomRight = screenToWorldExact(
        {
            x: 0,
            y: height
        },
        transform
    );
    const labelStep = getLabelWorldStep(gridStep, transform.scale);
    const firstY = Math.floor(topLeft.y / labelStep) * labelStep;
    const lastY = Math.ceil(bottomRight.y / labelStep) * labelStep;
    const labelX = clamp(transform.originX + 5, 8, 46);

    context.textAlign = 'left';

    for (let y = firstY; y <= lastY; y += labelStep) {
        if (y !== 0) {
            const screenY = worldToScreen({ x: 0, y }, transform).y;

            context.fillText(String(y), labelX, screenY + 3);
        }
    }
}

function drawScaleReference(
    context: CanvasRenderingContext2D,
    height: number,
    scale: number
) {
    const worldLength = getScaleBarWorldLength(scale);
    const screenLength = worldLength * scale;
    const x = 16;
    const y = height - 20;

    context.save();
    context.strokeStyle = PREVIEW_COLORS.scaleBar;
    context.fillStyle = PREVIEW_COLORS.label;
    context.lineWidth = 2;
    drawLine(context, x, y, x + screenLength, y);
    drawLine(context, x, y - 4, x, y + 4);
    drawLine(context, x + screenLength, y - 4, x + screenLength, y + 4);
    context.font = '10px monospace';
    context.textAlign = 'left';
    context.textBaseline = 'bottom';
    context.fillText(String(worldLength) + ' units', x, y - 6);
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

function getViewTransform(): ViewTransform {
    const rect = elements.canvas.getBoundingClientRect();

    return {
        originX: rect.width / 2 + panOffset.x,
        originY: rect.height / 2 + panOffset.y,
        scale: getZoomScale()
    };
}

function worldToScreen(point: Point, transform: ViewTransform): Point {
    return {
        x: transform.originX + point.x * transform.scale,
        y: transform.originY + point.y * transform.scale
    };
}

function screenToWorld(point: Point, transform: ViewTransform): Point {
    const worldPoint = screenToWorldExact(point, transform);

    return {
        x: Math.round(worldPoint.x),
        y: Math.round(worldPoint.y)
    };
}

function screenToWorldExact(point: Point, transform: ViewTransform): Point {
    return {
        x: (point.x - transform.originX) / transform.scale,
        y: (point.y - transform.originY) / transform.scale
    };
}

function getPointAtCanvasPosition(points: Point[], canvasPoint: Point) {
    const transform = getViewTransform();
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

function isOriginMarkerAtCanvasPosition(
    canvasPoint: Point,
    transform: ViewTransform
) {
    const originPoint = worldToScreen({ x: 0, y: 0 }, transform);
    const dx = canvasPoint.x - originPoint.x;
    const dy = canvasPoint.y - originPoint.y;

    return Math.sqrt(dx * dx + dy * dy) <= ORIGIN_MARKER_HIT_RADIUS;
}

function getCanvasPoint(event: PointerEvent): Point {
    const rect = elements.canvas.getBoundingClientRect();

    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

function getZoomScale() {
    return ZOOM_LEVELS[zoomIndex];
}

function getGridWorldStep(scale: number) {
    return (
        GRID_WORLD_STEPS.find(function (step) {
            return step * scale >= MIN_GRID_PIXEL_STEP;
        }) || GRID_WORLD_STEPS[GRID_WORLD_STEPS.length - 1]
    );
}

function getLabelWorldStep(gridStep: number, scale: number) {
    const labelStep = gridStep * 2;

    return labelStep * scale >= 56 ? labelStep : gridStep * 4;
}

function getScaleBarWorldLength(scale: number) {
    return (
        GRID_WORLD_STEPS.find(function (step) {
            return step * scale >= SCALE_BAR_MIN_WIDTH;
        }) || GRID_WORLD_STEPS[GRID_WORLD_STEPS.length - 1]
    );
}

function formatScale(scale: number) {
    return Number.isInteger(scale) ? String(scale) : String(scale.toFixed(1));
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
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
