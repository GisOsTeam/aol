// Mock ResizeObserver for jsdom environment
if (typeof global.ResizeObserver === 'undefined') {
    global.ResizeObserver = class {
        observe() { }
        unobserve() { }
        disconnect() { }
    };
}
