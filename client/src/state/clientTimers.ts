type TimerHandle = ReturnType<typeof setTimeout>;

export function ClientTimers() {
    const timers: Record<string, TimerHandle | null> = {};

    function set(name: string, callback: () => void, delay: number): void {
        clear(name);

        timers[name] = setTimeout(function () {
            timers[name] = null;
            callback();
        }, delay);
    }

    function has(name: string): boolean {
        return !!timers[name];
    }

    function clear(name: string): void {
        if (!timers[name]) {
            return;
        }

        clearTimeout(timers[name]);
        timers[name] = null;
    }

    function clearMany(names: string[]): void {
        names.forEach(clear);
    }

    function clearAll(): void {
        Object.keys(timers).forEach(clear);
    }

    return {
        clear,
        clearAll,
        clearMany,
        has,
        set
    };
}
