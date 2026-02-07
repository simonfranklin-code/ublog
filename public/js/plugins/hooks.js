const Hooks = (function () {
    const listeners = {};

    function on(event, fn) {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(fn);
    }

    function off(event, fn) {
        if (!listeners[event]) return;
        listeners[event] = listeners[event].filter(f => f !== fn);
    }

    function emit(event, ...args) {
        if (!listeners[event]) return;
        for (const fn of listeners[event]) {
            try {
                fn(...args);
            } catch (e) {
                console.error(`Hook error [${event}]`, e);
            }
        }
    }

    return { on, off, emit };
})();
