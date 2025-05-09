"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasePlugin = void 0;
const event_emitter_js_1 = __importDefault(require("./event-emitter.js"));
/** Base class for wavesurfer plugins */
class BasePlugin extends event_emitter_js_1.default {
    wavesurfer;
    subscriptions = [];
    options;
    /** Create a plugin instance */
    constructor(options) {
        super();
        this.options = options;
    }
    /** Called after this.wavesurfer is available */
    onInit() {
        return;
    }
    /** Do not call directly, only called by WavesSurfer internally */
    _init(wavesurfer) {
        this.wavesurfer = wavesurfer;
        this.onInit();
    }
    /** Destroy the plugin and unsubscribe from all events */
    destroy() {
        this.emit('destroy');
        this.subscriptions.forEach((unsubscribe) => unsubscribe());
    }
}
exports.BasePlugin = BasePlugin;
exports.default = BasePlugin;
