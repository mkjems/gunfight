/**
 * Value equality for component render props, so screens can skip virtual-DOM
 * work when flow modules re-render every frame with rebuilt-but-equal props.
 *
 * Callbacks are treated as equal regardless of identity: screen actions are
 * stable by contract, and comparing identity would force a re-render from
 * every flow that rebuilds closures per frame.
 */
export function arePropsEqual(a: unknown, b: unknown): boolean {
    if (a === b) {
        return true;
    }

    if (typeof a === 'function' && typeof b === 'function') {
        return true;
    }

    if (Array.isArray(a) && Array.isArray(b)) {
        return (
            a.length === b.length &&
            a.every(function (item, index) {
                return arePropsEqual(item, b[index]);
            })
        );
    }

    if (isPlainRenderObject(a) && isPlainRenderObject(b)) {
        const aKeys = Object.keys(a);
        const bKeys = Object.keys(b);

        return (
            aKeys.length === bKeys.length &&
            aKeys.every(function (key) {
                return key in b && arePropsEqual(a[key], b[key]);
            })
        );
    }

    return false;
}

function isPlainRenderObject(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

export const ComponentRenderProps = {
    arePropsEqual
};
