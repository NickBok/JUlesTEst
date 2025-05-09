"use strict";
/**
 * Minimap is a tiny copy of the main waveform serving as a navigation tool.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_plugin_js_1 = __importDefault(require("../base-plugin.js"));
const wavesurfer_js_1 = __importDefault(require("../wavesurfer.js"));
const dom_js_1 = __importDefault(require("../dom.js"));
const defaultOptions = {
    height: 50,
    overlayColor: 'rgba(100, 100, 100, 0.1)',
    insertPosition: 'afterend',
};
class MinimapPlugin extends base_plugin_js_1.default {
    options;
    minimapWrapper;
    miniWavesurfer = null;
    overlay;
    container = null;
    constructor(options) {
        super(options);
        this.options = Object.assign({}, defaultOptions, options);
        this.minimapWrapper = this.initMinimapWrapper();
        this.overlay = this.initOverlay();
    }
    static create(options) {
        return new MinimapPlugin(options);
    }
    /** Called by wavesurfer, don't call manually */
    onInit() {
        if (!this.wavesurfer) {
            throw Error('WaveSurfer is not initialized');
        }
        if (this.options.container) {
            if (typeof this.options.container === 'string') {
                this.container = document.querySelector(this.options.container);
            }
            else if (this.options.container instanceof HTMLElement) {
                this.container = this.options.container;
            }
            this.container?.appendChild(this.minimapWrapper);
        }
        else {
            this.container = this.wavesurfer.getWrapper().parentElement;
            this.container?.insertAdjacentElement(this.options.insertPosition, this.minimapWrapper);
        }
        this.initWaveSurferEvents();
        Promise.resolve().then(() => {
            this.initMinimap();
        });
    }
    initMinimapWrapper() {
        return (0, dom_js_1.default)('div', {
            part: 'minimap',
            style: {
                position: 'relative',
            },
        });
    }
    initOverlay() {
        return (0, dom_js_1.default)('div', {
            part: 'minimap-overlay',
            style: {
                position: 'absolute',
                zIndex: '2',
                left: '0',
                top: '0',
                bottom: '0',
                transition: 'left 100ms ease-out',
                pointerEvents: 'none',
                backgroundColor: this.options.overlayColor,
            },
        }, this.minimapWrapper);
    }
    initMinimap() {
        if (this.miniWavesurfer) {
            this.miniWavesurfer.destroy();
            this.miniWavesurfer = null;
        }
        if (!this.wavesurfer)
            return;
        const data = this.wavesurfer.getDecodedData();
        const media = this.wavesurfer.getMediaElement();
        if (!data || !media)
            return;
        const peaks = [];
        for (let i = 0; i < data.numberOfChannels; i++) {
            peaks.push(data.getChannelData(i));
        }
        this.miniWavesurfer = wavesurfer_js_1.default.create({
            ...this.options,
            container: this.minimapWrapper,
            minPxPerSec: 0,
            fillParent: true,
            media,
            peaks,
            duration: data.duration,
        });
        this.subscriptions.push(this.miniWavesurfer.on('audioprocess', (currentTime) => {
            this.emit('audioprocess', currentTime);
        }), this.miniWavesurfer.on('click', (relativeX, relativeY) => {
            this.emit('click', relativeX, relativeY);
        }), this.miniWavesurfer.on('dblclick', (relativeX, relativeY) => {
            this.emit('dblclick', relativeX, relativeY);
        }), this.miniWavesurfer.on('decode', (duration) => {
            this.emit('decode', duration);
        }), this.miniWavesurfer.on('destroy', () => {
            this.emit('destroy');
        }), this.miniWavesurfer.on('drag', (relativeX) => {
            this.emit('drag', relativeX);
        }), this.miniWavesurfer.on('dragend', (relativeX) => {
            this.emit('dragend', relativeX);
        }), this.miniWavesurfer.on('dragstart', (relativeX) => {
            this.emit('dragstart', relativeX);
        }), this.miniWavesurfer.on('interaction', () => {
            this.emit('interaction');
        }), this.miniWavesurfer.on('init', () => {
            this.emit('init');
        }), this.miniWavesurfer.on('ready', () => {
            this.emit('ready');
        }), this.miniWavesurfer.on('redraw', () => {
            this.emit('redraw');
        }), this.miniWavesurfer.on('redrawcomplete', () => {
            this.emit('redrawcomplete');
        }), this.miniWavesurfer.on('seeking', (currentTime) => {
            this.emit('seeking', currentTime);
        }), this.miniWavesurfer.on('timeupdate', (currentTime) => {
            this.emit('timeupdate', currentTime);
        }));
    }
    getOverlayWidth() {
        const waveformWidth = this.wavesurfer?.getWrapper().clientWidth || 1;
        return Math.round((this.minimapWrapper.clientWidth / waveformWidth) * 100);
    }
    onRedraw() {
        const overlayWidth = this.getOverlayWidth();
        this.overlay.style.width = `${overlayWidth}%`;
    }
    onScroll(startTime) {
        if (!this.wavesurfer)
            return;
        const duration = this.wavesurfer.getDuration();
        this.overlay.style.left = `${(startTime / duration) * 100}%`;
    }
    initWaveSurferEvents() {
        if (!this.wavesurfer)
            return;
        this.subscriptions.push(this.wavesurfer.on('decode', () => {
            this.initMinimap();
        }), this.wavesurfer.on('scroll', (startTime) => {
            this.onScroll(startTime);
        }), this.wavesurfer.on('redraw', () => {
            this.onRedraw();
        }));
    }
    /** Unmount */
    destroy() {
        this.miniWavesurfer?.destroy();
        this.minimapWrapper.remove();
        super.destroy();
    }
}
exports.default = MinimapPlugin;
