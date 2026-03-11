// Universal version file - works for both ES6 modules and service workers
const VERSION = "2.0.6";

// ES6 export for modules
export { VERSION };

// Global variable for service workers
if (typeof self !== 'undefined') {
    self.VERSION = VERSION;

}

