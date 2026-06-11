type TouchWindow = {
    location: {
        search: string;
    };
    matchMedia?: (query: string) => {
        matches: boolean;
    };
};

export function isTouchInterface(window: TouchWindow): boolean {
    if (window.location.search.indexOf('touch=1') >= 0) {
        return true;
    }

    return !!(
        window.matchMedia && window.matchMedia('(pointer: coarse)').matches
    );
}

export const ClientTouchEnvironment = {
    isTouchInterface
};
