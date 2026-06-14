import {
    parseRockDefinitions,
    parseScenarioSources,
    type CactusInstance,
    type Decoration,
    type PlayerStart,
    type RockDefinitions,
    type RockPlacement,
    type ScenarioSource,
    type WagonInstance
} from '../../../shared/contracts.js';

export type ScenarioObjectKind =
    | 'rock'
    | 'cactus'
    | 'decoration'
    | 'wagon'
    | 'player-start';

export type ScenarioObjectRef = {
    index: number;
    kind: ScenarioObjectKind;
};

export type ScenarioObjectSummary = {
    id: string;
    label: string;
    ref: ScenarioObjectRef;
    type: string;
    x: number;
    y: number;
};

type Point = {
    x: number;
    y: number;
};

const ARENA_WIDTH = 950;
const ARENA_HEIGHT = 640;
export const DEFAULT_PLAYER_STARTS: PlayerStart[] = [
    { x: 150, y: 430, facing: 1, frame: 0 },
    { x: 800, y: 430, facing: -1, frame: 2 }
];

export const DEFAULT_SCENARIO_EDITOR_JSON = JSON.stringify(
    [
        {
            name: 'new-scenario',
            decorations: [{ type: 'saloon', x: 0, y: 220 }],
            cacti: [{ x: 475, y: 378 }],
            rocks: [{ type: 'small', x: 475, y: 445 }]
        }
    ],
    null,
    4
);

export function parseScenarioEditorRockJson(source: string): RockDefinitions {
    try {
        return parseRockDefinitions(JSON.parse(source), 'rock JSON');
    } catch (error) {
        throw new Error(
            'Rock JSON: ' +
                (error instanceof Error ? error.message : 'invalid JSON')
        );
    }
}

export function parseScenarioEditorJson(
    source: string,
    rockDefinitions: RockDefinitions
): ScenarioSource[] {
    try {
        return parseScenarioSources(
            JSON.parse(source),
            rockDefinitions,
            'scenario JSON'
        );
    } catch (error) {
        throw new Error(
            'Scenario JSON: ' +
                (error instanceof Error ? error.message : 'invalid JSON')
        );
    }
}

export function formatScenarioSources(scenarios: ScenarioSource[]): string {
    return JSON.stringify(scenarios.map(copyScenarioSource), null, 4) + '\n';
}

export function ensureScenarioPlayerStarts(
    scenarios: ScenarioSource[]
): ScenarioSource[] {
    return scenarios.map(function (scenario) {
        if (scenario.playerStarts && scenario.playerStarts.length >= 2) {
            return copyScenarioSource(scenario);
        }

        return {
            ...copyScenarioSource(scenario),
            playerStarts: DEFAULT_PLAYER_STARTS.map(function (start) {
                return { ...start };
            })
        };
    });
}

export function validateScenarioSources(
    scenarios: ScenarioSource[],
    rockDefinitions: RockDefinitions
): string[] {
    const errors: string[] = [];

    if (scenarios.length === 0) {
        errors.push('Add at least one scenario.');
    }

    scenarios.forEach(function (scenario, scenarioIndex) {
        const label =
            'Scenario ' +
            String(scenarioIndex + 1) +
            (scenario.name ? ' "' + scenario.name + '"' : '');

        (scenario.rocks || []).forEach(function (rock, rockIndex) {
            const rockLabel = label + ' rock ' + String(rockIndex + 1);

            if (!rockDefinitions[rock.type]) {
                errors.push(
                    rockLabel + ' uses unknown rock type "' + rock.type + '".'
                );
            }

            validateArenaPoint(errors, rockLabel, rock);
        });

        (scenario.playerStarts || []).forEach(function (start, startIndex) {
            validateArenaPoint(
                errors,
                label + ' player start ' + String(startIndex + 1),
                start
            );
        });

        if (scenario.playerStarts && scenario.playerStarts.length < 2) {
            errors.push(label + ' needs two player starts.');
        }

        (scenario.cacti || []).forEach(function (cactus, cactusIndex) {
            validateArenaPoint(
                errors,
                label + ' cactus ' + String(cactusIndex + 1),
                cactus
            );
        });

        (scenario.decorations || []).forEach(
            function (decoration, decorationIndex) {
                const decorationLabel =
                    label + ' decoration ' + String(decorationIndex + 1);

                if (decoration.type !== 'saloon') {
                    errors.push(
                        decorationLabel +
                            ' uses unsupported decoration type "' +
                            decoration.type +
                            '".'
                    );
                }

                validateArenaPoint(errors, decorationLabel, decoration);
            }
        );

        if (scenario.wagon) {
            if (scenario.wagon.x < 0 || scenario.wagon.x > ARENA_WIDTH) {
                errors.push(label + ' wagon x is outside the arena.');
            }

            if (
                scenario.wagon.duration !== undefined &&
                scenario.wagon.duration <= 0
            ) {
                errors.push(label + ' wagon duration must be greater than 0.');
            }
        }
    });

    return errors;
}

export function getScenarioName(
    scenarios: ScenarioSource[],
    scenarioIndex: number
): string {
    const scenario = scenarios[scenarioIndex];

    return scenario && scenario.name
        ? scenario.name
        : 'Scenario ' + String(scenarioIndex + 1);
}

export function setScenarioName(
    scenarios: ScenarioSource[],
    scenarioIndex: number,
    name: string
): ScenarioSource[] {
    return updateScenario(scenarios, scenarioIndex, function (scenario) {
        return {
            ...scenario,
            name: normalizeScenarioName(name)
        };
    });
}

export function duplicateScenarioSource(
    scenarios: ScenarioSource[],
    scenarioIndex: number
): {
    scenarios: ScenarioSource[];
    selectedIndex: number;
} {
    const source = scenarios[scenarioIndex];

    if (!source) {
        return {
            scenarios,
            selectedIndex: scenarioIndex
        };
    }

    const duplicate = copyScenarioSource(source);
    duplicate.name = getDuplicateScenarioName(scenarios, source.name);
    const nextScenarios = scenarios.slice();
    const nextIndex = scenarioIndex + 1;

    nextScenarios.splice(nextIndex, 0, duplicate);

    return {
        scenarios: nextScenarios,
        selectedIndex: nextIndex
    };
}

export function addScenarioObject(
    scenarios: ScenarioSource[],
    scenarioIndex: number,
    kind: ScenarioObjectKind,
    point: Point,
    options: {
        rockType?: string;
    } = {}
): {
    ref: ScenarioObjectRef;
    scenarios: ScenarioSource[];
} {
    const rockType = options.rockType || 'small';
    let ref: ScenarioObjectRef = { index: 0, kind };
    const nextScenarios = updateScenario(
        scenarios,
        scenarioIndex,
        function (scenario) {
            if (kind === 'rock') {
                const rocks = [...(scenario.rocks || [])];

                ref = { index: rocks.length, kind };
                rocks.push({
                    type: rockType,
                    x: cleanNumber(point.x),
                    y: cleanNumber(point.y)
                });

                return {
                    ...scenario,
                    rocks
                };
            }

            if (kind === 'cactus') {
                const cacti = [...(scenario.cacti || [])];

                ref = { index: cacti.length, kind };
                cacti.push({
                    x: cleanNumber(point.x),
                    y: cleanNumber(point.y)
                });

                return {
                    ...scenario,
                    cacti
                };
            }

            if (kind === 'decoration') {
                const decorations = [...(scenario.decorations || [])];

                ref = { index: decorations.length, kind };
                decorations.push({
                    type: 'saloon',
                    x: cleanNumber(point.x),
                    y: cleanNumber(point.y)
                });

                return {
                    ...scenario,
                    decorations
                };
            }

            if (kind === 'player-start') {
                const playerStarts = [...(scenario.playerStarts || [])];

                ref = { index: playerStarts.length, kind };
                playerStarts.push({
                    x: cleanNumber(point.x),
                    y: cleanNumber(point.y),
                    facing: playerStarts.length === 0 ? 1 : -1,
                    frame: playerStarts.length === 0 ? 0 : 2
                });

                return {
                    ...scenario,
                    playerStarts
                };
            }

            ref = { index: 0, kind };

            return {
                ...scenario,
                wagon: {
                    x: cleanNumber(point.x),
                    fromY: cleanNumber(point.y + 390),
                    toY: cleanNumber(point.y - 390),
                    duration: 40000
                }
            };
        }
    );

    return {
        ref,
        scenarios: nextScenarios
    };
}

export function removeScenarioObject(
    scenarios: ScenarioSource[],
    scenarioIndex: number,
    ref: ScenarioObjectRef | null
): ScenarioSource[] {
    if (!ref) {
        return scenarios;
    }

    return updateScenario(scenarios, scenarioIndex, function (scenario) {
        if (ref.kind === 'rock') {
            return {
                ...scenario,
                rocks: removeAt(scenario.rocks || [], ref.index)
            };
        }

        if (ref.kind === 'cactus') {
            return {
                ...scenario,
                cacti: removeAt(scenario.cacti || [], ref.index)
            };
        }

        if (ref.kind === 'decoration') {
            return {
                ...scenario,
                decorations: removeAt(scenario.decorations || [], ref.index)
            };
        }

        if (ref.kind === 'player-start') {
            return {
                ...scenario,
                playerStarts: removeAt(scenario.playerStarts || [], ref.index)
            };
        }

        return {
            ...scenario,
            wagon: undefined
        };
    });
}

export function updateScenarioObjectPosition(
    scenarios: ScenarioSource[],
    scenarioIndex: number,
    ref: ScenarioObjectRef | null,
    point: Point
): ScenarioSource[] {
    if (!ref) {
        return scenarios;
    }

    return updateScenarioObject(
        scenarios,
        scenarioIndex,
        ref,
        function (object) {
            if (ref.kind === 'wagon') {
                const wagon = object as WagonInstance;
                const currentAnchor = getWagonAnchor(wagon);
                const deltaY = point.y - currentAnchor.y;

                return {
                    ...wagon,
                    x: cleanNumber(point.x),
                    fromY: cleanNumber(wagon.fromY + deltaY),
                    toY: cleanNumber(wagon.toY + deltaY)
                };
            }

            return {
                ...object,
                x: cleanNumber(point.x),
                y: cleanNumber(point.y)
            };
        }
    );
}

export function updateScenarioObjectFields(
    scenarios: ScenarioSource[],
    scenarioIndex: number,
    ref: ScenarioObjectRef | null,
    fields: Record<string, string | number>
): ScenarioSource[] {
    if (!ref) {
        return scenarios;
    }

    return updateScenarioObject(
        scenarios,
        scenarioIndex,
        ref,
        function (object) {
            const next: Record<string, unknown> = { ...object };

            Object.entries(fields).forEach(function ([key, value]) {
                if (key === 'type') {
                    next[key] = String(value);
                    return;
                }

                next[key] = cleanNumber(Number(value));
            });

            return next as unknown as
                | RockPlacement
                | CactusInstance
                | Decoration
                | WagonInstance
                | PlayerStart;
        }
    );
}

export function listScenarioObjects(
    scenario: ScenarioSource | undefined
): ScenarioObjectSummary[] {
    if (!scenario) {
        return [];
    }

    const objects: ScenarioObjectSummary[] = [];

    (scenario.rocks || []).forEach(function (rock, index) {
        objects.push({
            id: getScenarioObjectId({ kind: 'rock', index }),
            label: 'Rock ' + String(index + 1) + ' (' + rock.type + ')',
            ref: { kind: 'rock', index },
            type: rock.type,
            x: rock.x,
            y: rock.y
        });
    });

    (scenario.cacti || []).forEach(function (cactus, index) {
        objects.push({
            id: getScenarioObjectId({ kind: 'cactus', index }),
            label: 'Cactus ' + String(index + 1),
            ref: { kind: 'cactus', index },
            type: 'cactus',
            x: cactus.x,
            y: cactus.y
        });
    });

    (scenario.decorations || []).forEach(function (decoration, index) {
        objects.push({
            id: getScenarioObjectId({ kind: 'decoration', index }),
            label:
                'Decoration ' +
                String(index + 1) +
                ' (' +
                decoration.type +
                ')',
            ref: { kind: 'decoration', index },
            type: decoration.type,
            x: decoration.x,
            y: decoration.y
        });
    });

    (scenario.playerStarts || []).forEach(function (start, index) {
        objects.push({
            id: getScenarioObjectId({ kind: 'player-start', index }),
            label: 'P' + String(index + 1) + ' start',
            ref: { kind: 'player-start', index },
            type: 'start',
            x: start.x,
            y: start.y
        });
    });

    if (scenario.wagon) {
        const anchor = getWagonAnchor(scenario.wagon);

        objects.push({
            id: getScenarioObjectId({ kind: 'wagon', index: 0 }),
            label: 'Wagon',
            ref: { kind: 'wagon', index: 0 },
            type: 'wagon',
            x: anchor.x,
            y: anchor.y
        });
    }

    return objects;
}

export function getScenarioObjectId(ref: ScenarioObjectRef): string {
    return ref.kind + ':' + String(ref.index);
}

export function parseScenarioObjectId(id: string): ScenarioObjectRef | null {
    const parts = id.split(':');
    const kind = parts[0] as ScenarioObjectKind;
    const index = Number(parts[1]);

    if (
        !['rock', 'cactus', 'decoration', 'wagon', 'player-start'].includes(
            kind
        ) ||
        !Number.isInteger(index)
    ) {
        return null;
    }

    return {
        kind,
        index
    };
}

export function getScenarioObject(
    scenario: ScenarioSource | undefined,
    ref: ScenarioObjectRef | null
):
    | RockPlacement
    | CactusInstance
    | Decoration
    | WagonInstance
    | PlayerStart
    | null {
    if (!scenario || !ref) {
        return null;
    }

    if (ref.kind === 'rock') {
        return (scenario.rocks || [])[ref.index] || null;
    }

    if (ref.kind === 'cactus') {
        return (scenario.cacti || [])[ref.index] || null;
    }

    if (ref.kind === 'decoration') {
        return (scenario.decorations || [])[ref.index] || null;
    }

    if (ref.kind === 'player-start') {
        return (scenario.playerStarts || [])[ref.index] || null;
    }

    return scenario.wagon || null;
}

export function getScenarioObjectAnchor(
    scenario: ScenarioSource | undefined,
    ref: ScenarioObjectRef | null
): Point | null {
    const object = getScenarioObject(scenario, ref);

    if (!object) {
        return null;
    }

    if (ref && ref.kind === 'wagon') {
        return getWagonAnchor(object as WagonInstance);
    }

    return {
        x: (object as RockPlacement | CactusInstance | Decoration | PlayerStart)
            .x,
        y: (object as RockPlacement | CactusInstance | Decoration | PlayerStart)
            .y
    };
}

function updateScenario(
    scenarios: ScenarioSource[],
    scenarioIndex: number,
    update: (scenario: ScenarioSource) => ScenarioSource
): ScenarioSource[] {
    return scenarios.map(function (scenario, index) {
        return index === scenarioIndex
            ? copyScenarioSource(update(copyScenarioSource(scenario)))
            : copyScenarioSource(scenario);
    });
}

function updateScenarioObject(
    scenarios: ScenarioSource[],
    scenarioIndex: number,
    ref: ScenarioObjectRef,
    update: (
        object:
            | RockPlacement
            | CactusInstance
            | Decoration
            | WagonInstance
            | PlayerStart
    ) =>
        | RockPlacement
        | CactusInstance
        | Decoration
        | WagonInstance
        | PlayerStart
): ScenarioSource[] {
    return updateScenario(scenarios, scenarioIndex, function (scenario) {
        if (ref.kind === 'rock') {
            return {
                ...scenario,
                rocks: updateAt(
                    scenario.rocks || [],
                    ref.index,
                    function (rock) {
                        return update(rock) as RockPlacement;
                    }
                )
            };
        }

        if (ref.kind === 'cactus') {
            return {
                ...scenario,
                cacti: updateAt(
                    scenario.cacti || [],
                    ref.index,
                    function (cactus) {
                        return update(cactus) as CactusInstance;
                    }
                )
            };
        }

        if (ref.kind === 'decoration') {
            return {
                ...scenario,
                decorations: updateAt(
                    scenario.decorations || [],
                    ref.index,
                    function (decoration) {
                        return update(decoration) as Decoration;
                    }
                )
            };
        }

        if (ref.kind === 'player-start') {
            return {
                ...scenario,
                playerStarts: updateAt(
                    scenario.playerStarts || [],
                    ref.index,
                    function (start) {
                        return update(start) as PlayerStart;
                    }
                )
            };
        }

        if (!scenario.wagon) {
            return scenario;
        }

        return {
            ...scenario,
            wagon: update(scenario.wagon) as WagonInstance
        };
    });
}

function updateAt<T extends object>(
    items: T[],
    itemIndex: number,
    update: (item: T) => T
): T[] {
    return items.map(function (item, index) {
        return index === itemIndex ? update({ ...item }) : { ...item };
    });
}

function removeAt<T>(items: T[], itemIndex: number): T[] {
    return items
        .filter(function (_item, index) {
            return index !== itemIndex;
        })
        .map(function (item) {
            return { ...item };
        });
}

function copyScenarioSource(scenario: ScenarioSource): ScenarioSource {
    return {
        name: scenario.name,
        playerStarts: scenario.playerStarts
            ? scenario.playerStarts.map(function (start) {
                  return { ...start };
              })
            : undefined,
        decorations: scenario.decorations
            ? scenario.decorations.map(function (decoration) {
                  return { ...decoration };
              })
            : undefined,
        cacti: scenario.cacti
            ? scenario.cacti.map(function (cactus) {
                  return { ...cactus };
              })
            : undefined,
        rocks: scenario.rocks
            ? scenario.rocks.map(function (rock) {
                  return { ...rock };
              })
            : undefined,
        wagon: scenario.wagon ? { ...scenario.wagon } : undefined
    };
}

function normalizeScenarioName(name: string): string {
    const normalized = name.trim();

    return normalized || 'untitled-scenario';
}

function getDuplicateScenarioName(
    scenarios: ScenarioSource[],
    sourceName: string | undefined
): string {
    const baseName = normalizeScenarioName(sourceName || 'scenario') + '-copy';
    const names = new Set(
        scenarios.map(function (scenario) {
            return scenario.name;
        })
    );
    let nextName = baseName;
    let copyIndex = 2;

    while (names.has(nextName)) {
        nextName = baseName + '-' + String(copyIndex);
        copyIndex += 1;
    }

    return nextName;
}

function validateArenaPoint(errors: string[], label: string, point: Point) {
    if (
        point.x < 0 ||
        point.x > ARENA_WIDTH ||
        point.y < 0 ||
        point.y > ARENA_HEIGHT
    ) {
        errors.push(label + ' anchor is outside the arena.');
    }
}

function getWagonAnchor(wagon: WagonInstance): Point {
    return {
        x: wagon.x,
        y: (wagon.fromY + wagon.toY) / 2
    };
}

function cleanNumber(value: number): number {
    return Math.round(value * 100) / 100;
}

export const ScenarioEditorCore = {
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
    validateScenarioSources
};
