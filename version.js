// Universal version file - works for both ES6 modules and service workers
const VERSION = "2.4.5";

// For service workers (must be first, before any exports)
if (typeof self !== 'undefined' && typeof importScripts !== 'undefined') {
    self.VERSION = VERSION;
}

// ES6 export for modules (must be at top level)
export { VERSION };
