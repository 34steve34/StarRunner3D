// Universal version file - works for both ES6 modules and service workers
const VERSION = "2.1.6";

// ES6 export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VERSION };
} else if (typeof window !== 'undefined') {
    // Browser ES6 modules
    export { VERSION };
}

// Global variable for service workers
if (typeof self !== 'undefined' && typeof importScripts !== 'undefined') {
    self.VERSION = VERSION;

}
