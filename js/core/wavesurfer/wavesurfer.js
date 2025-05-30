"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_plugin_js_1 = __importDefault(require("./base-plugin.js"));
const decoder_js_1 = __importDefault(require("./decoder.js"));
const dom = __importStar(require("./dom.js"));
const fetcher_js_1 = __importDefault(require("./fetcher.js"));
const player_js_1 = __importDefault(require("./player.js"));
const renderer_js_1 = __importDefault(require("./renderer.js"));
const timer_js_1 = __importDefault(require("./timer.js"));
const webaudio_js_1 = __importDefault(require("./webaudio.js"));
const defaultOptions = {
    waveColor: '#999',
    progressColor: '#555',
    cursorWidth: 1,
    minPxPerSec: 0,
    fillParent: true,
    interact: true,
    dragToSeek: false,
    autoScroll: true,
    autoCenter: true,
    sampleRate: 8000,
};
class WaveSurfer extends player_js_1.default {
    options;
    renderer;
    timer;
    plugins = [];
    decodedData = null;
    stopAtPosition = null;
    subscriptions = [];
    mediaSubscriptions = [];
    abortController = null;
    static BasePlugin = base_plugin_js_1.default;
    static dom = dom;
    /** Create a new WaveSurfer instance */
    static create(options) {
        return new WaveSurfer(options);
    }
    /** Create a new WaveSurfer instance */
    constructor(options) {
        const media = options.media ||
            (options.backend === 'WebAudio' ? new webaudio_js_1.default() : undefined);
        super({
            media,
            mediaControls: options.mediaControls,
            autoplay: options.autoplay,
            playbackRate: options.audioRate,
        });
        this.options = Object.assign({}, defaultOptions, options);
        this.timer = new timer_js_1.default();
        const audioElement = media ? undefined : this.getMediaElement();
        this.renderer = new renderer_js_1.default(this.options, audioElement);
        this.initPlayerEvents();
        this.initRendererEvents();
        this.initTimerEvents();
        this.initPlugins();
        // Read the initial URL before load has been called
        const initialUrl = this.options.url || this.getSrc() || '';
        // Init and load async to allow external events to be registered
        Promise.resolve().then(() => {
            this.emit('init');
            // Load audio if URL or an external media with an src is passed,
            // of render w/o audio if pre-decoded peaks and duration are provided
            const { peaks, duration } = this.options;
            if (initialUrl || (peaks && duration)) {
                // Swallow async errors because they cannot be caught from a constructor call.
                // Subscribe to the wavesurfer's error event to handle them.
                this.load(initialUrl, peaks, duration).catch(() => null);
            }
        });
    }
    updateProgress(currentTime = this.getCurrentTime()) {
        this.renderer.renderProgress(currentTime / this.getDuration(), this.isPlaying());
        return currentTime;
    }
    initTimerEvents() {
        // The timer fires every 16ms for a smooth progress animation
        this.subscriptions.push(this.timer.on('tick', () => {
            if (!this.isSeeking()) {
                const currentTime = this.updateProgress();
                this.emit('timeupdate', currentTime);
                this.emit('audioprocess', currentTime);
                // Pause audio when it reaches the stopAtPosition
                if (this.stopAtPosition != null && this.isPlaying() && currentTime >= this.stopAtPosition) {
                    this.pause();
                }
            }
        }));
    }
    initPlayerEvents() {
        if (this.isPlaying()) {
            this.emit('play');
            this.timer.start();
        }
        this.mediaSubscriptions.push(this.onMediaEvent('timeupdate', () => {
            const currentTime = this.updateProgress();
            this.emit('timeupdate', currentTime);
        }), this.onMediaEvent('play', () => {
            this.emit('play');
            this.timer.start();
        }), this.onMediaEvent('pause', () => {
            this.emit('pause');
            this.timer.stop();
            this.stopAtPosition = null;
        }), this.onMediaEvent('emptied', () => {
            this.timer.stop();
            this.stopAtPosition = null;
        }), this.onMediaEvent('ended', () => {
            this.emit('timeupdate', this.getDuration());
            this.emit('finish');
            this.stopAtPosition = null;
        }), this.onMediaEvent('seeking', () => {
            this.emit('seeking', this.getCurrentTime());
        }), this.onMediaEvent('error', () => {
            this.emit('error', (this.getMediaElement().error ?? new Error('Media error')));
            this.stopAtPosition = null;
        }));
    }
    initRendererEvents() {
        this.subscriptions.push(
        // Seek on click
        this.renderer.on('click', (relativeX, relativeY) => {
            if (this.options.interact) {
                this.seekTo(relativeX);
                this.emit('interaction', relativeX * this.getDuration());
                this.emit('click', relativeX, relativeY);
            }
        }), 
        // Double click
        this.renderer.on('dblclick', (relativeX, relativeY) => {
            this.emit('dblclick', relativeX, relativeY);
        }), 
        // Scroll
        this.renderer.on('scroll', (startX, endX, scrollLeft, scrollRight) => {
            const duration = this.getDuration();
            this.emit('scroll', startX * duration, endX * duration, scrollLeft, scrollRight);
        }), 
        // Redraw
        this.renderer.on('render', () => {
            this.emit('redraw');
        }), 
        // RedrawComplete
        this.renderer.on('rendered', () => {
            this.emit('redrawcomplete');
        }), 
        // DragStart
        this.renderer.on('dragstart', (relativeX) => {
            this.emit('dragstart', relativeX);
        }), 
        // DragEnd
        this.renderer.on('dragend', (relativeX) => {
            this.emit('dragend', relativeX);
        }));
        // Drag
        {
            let debounce;
            this.subscriptions.push(this.renderer.on('drag', (relativeX) => {
                if (!this.options.interact)
                    return;
                // Update the visual position
                this.renderer.renderProgress(relativeX);
                // Set the audio position with a debounce
                clearTimeout(debounce);
                let debounceTime;
                if (this.isPlaying()) {
                    debounceTime = 0;
                }
                else if (this.options.dragToSeek === true) {
                    debounceTime = 200;
                }
                else if (typeof this.options.dragToSeek === 'object' && this.options.dragToSeek !== undefined) {
                    debounceTime = this.options.dragToSeek['debounceTime'];
                }
                debounce = setTimeout(() => {
                    this.seekTo(relativeX);
                }, debounceTime);
                this.emit('interaction', relativeX * this.getDuration());
                this.emit('drag', relativeX);
            }));
        }
    }
    initPlugins() {
        if (!this.options.plugins?.length)
            return;
        this.options.plugins.forEach((plugin) => {
            this.registerPlugin(plugin);
        });
    }
    unsubscribePlayerEvents() {
        this.mediaSubscriptions.forEach((unsubscribe) => unsubscribe());
        this.mediaSubscriptions = [];
    }
    /** Set new wavesurfer options and re-render it */
    setOptions(options) {
        this.options = Object.assign({}, this.options, options);
        if (options.duration && !options.peaks) {
            this.decodedData = decoder_js_1.default.createBuffer(this.exportPeaks(), options.duration);
        }
        if (options.peaks && options.duration) {
            // Create new decoded data buffer from peaks and duration
            this.decodedData = decoder_js_1.default.createBuffer(options.peaks, options.duration);
        }
        this.renderer.setOptions(this.options);
        if (options.audioRate) {
            this.setPlaybackRate(options.audioRate);
        }
        if (options.mediaControls != null) {
            this.getMediaElement().controls = options.mediaControls;
        }
    }
    /** Register a wavesurfer.js plugin */
    registerPlugin(plugin) {
        plugin._init(this);
        this.plugins.push(plugin);
        // Unregister plugin on destroy
        this.subscriptions.push(plugin.once('destroy', () => {
            this.plugins = this.plugins.filter((p) => p !== plugin);
        }));
        return plugin;
    }
    /** For plugins only: get the waveform wrapper div */
    getWrapper() {
        return this.renderer.getWrapper();
    }
    /** For plugins only: get the scroll container client width */
    getWidth() {
        return this.renderer.getWidth();
    }
    /** Get the current scroll position in pixels */
    getScroll() {
        return this.renderer.getScroll();
    }
    /** Set the current scroll position in pixels */
    setScroll(pixels) {
        return this.renderer.setScroll(pixels);
    }
    /** Move the start of the viewing window to a specific time in the audio (in seconds) */
    setScrollTime(time) {
        const percentage = time / this.getDuration();
        this.renderer.setScrollPercentage(percentage);
    }
    /** Get all registered plugins */
    getActivePlugins() {
        return this.plugins;
    }
    async loadAudio(url, blob, channelData, duration) {
        this.emit('load', url);
        if (!this.options.media && this.isPlaying())
            this.pause();
        this.decodedData = null;
        this.stopAtPosition = null;
        // Fetch the entire audio as a blob if pre-decoded data is not provided
        if (!blob && !channelData) {
            const fetchParams = this.options.fetchParams || {};
            if (window.AbortController && !fetchParams.signal) {
                this.abortController = new AbortController();
                fetchParams.signal = this.abortController?.signal;
            }
            const onProgress = (percentage) => this.emit('loading', percentage);
            blob = await fetcher_js_1.default.fetchBlob(url, onProgress, fetchParams);
            const overridenMimeType = this.options.blobMimeType;
            if (overridenMimeType) {
                blob = new Blob([blob], { type: overridenMimeType });
            }
        }
        // Set the mediaelement source
        this.setSrc(url, blob);
        // Wait for the audio duration
        const audioDuration = await new Promise((resolve) => {
            const staticDuration = duration || this.getDuration();
            if (staticDuration) {
                resolve(staticDuration);
            }
            else {
                this.mediaSubscriptions.push(this.onMediaEvent('loadedmetadata', () => resolve(this.getDuration()), { once: true }));
            }
        });
        // Set the duration if the player is a WebAudioPlayer without a URL
        if (!url && !blob) {
            const media = this.getMediaElement();
            if (media instanceof webaudio_js_1.default) {
                media.duration = audioDuration;
            }
        }
        // Decode the audio data or use user-provided peaks
        if (channelData) {
            this.decodedData = decoder_js_1.default.createBuffer(channelData, audioDuration || 0);
        }
        else if (blob) {
            const arrayBuffer = await blob.arrayBuffer();
            this.decodedData = await decoder_js_1.default.decode(arrayBuffer, this.options.sampleRate);
        }
        if (this.decodedData) {
            this.emit('decode', this.getDuration());
            this.renderer.render(this.decodedData);
        }
        this.emit('ready', this.getDuration());
    }
    /** Load an audio file by URL, with optional pre-decoded audio data */
    async load(url, channelData, duration) {
        try {
            return await this.loadAudio(url, undefined, channelData, duration);
        }
        catch (err) {
            this.emit('error', err);
            throw err;
        }
    }
    /** Load an audio blob */
    async loadBlob(blob, channelData, duration) {
        try {
            return await this.loadAudio('', blob, channelData, duration);
        }
        catch (err) {
            this.emit('error', err);
            throw err;
        }
    }
    /** Zoom the waveform by a given pixels-per-second factor */
    zoom(minPxPerSec) {
        if (!this.decodedData) {
            throw new Error('No audio loaded');
        }
        this.renderer.zoom(minPxPerSec);
        this.emit('zoom', minPxPerSec);
    }
    /** Get the decoded audio data */
    getDecodedData() {
        return this.decodedData;
    }
    /** Get decoded peaks */
    exportPeaks({ channels = 2, maxLength = 8000, precision = 10_000 } = {}) {
        if (!this.decodedData) {
            throw new Error('The audio has not been decoded yet');
        }
        const maxChannels = Math.min(channels, this.decodedData.numberOfChannels);
        const peaks = [];
        for (let i = 0; i < maxChannels; i++) {
            const channel = this.decodedData.getChannelData(i);
            const data = [];
            const sampleSize = channel.length / maxLength;
            for (let i = 0; i < maxLength; i++) {
                const sample = channel.slice(Math.floor(i * sampleSize), Math.ceil((i + 1) * sampleSize));
                let max = 0;
                for (let x = 0; x < sample.length; x++) {
                    const n = sample[x];
                    if (Math.abs(n) > Math.abs(max))
                        max = n;
                }
                data.push(Math.round(max * precision) / precision);
            }
            peaks.push(data);
        }
        return peaks;
    }
    /** Get the duration of the audio in seconds */
    getDuration() {
        let duration = super.getDuration() || 0;
        // Fall back to the decoded data duration if the media duration is incorrect
        if ((duration === 0 || duration === Infinity) && this.decodedData) {
            duration = this.decodedData.duration;
        }
        return duration;
    }
    /** Toggle if the waveform should react to clicks */
    toggleInteraction(isInteractive) {
        this.options.interact = isInteractive;
    }
    /** Jump to a specific time in the audio (in seconds) */
    setTime(time) {
        this.stopAtPosition = null;
        super.setTime(time);
        this.updateProgress(time);
        this.emit('timeupdate', time);
    }
    /** Seek to a percentage of audio as [0..1] (0 = beginning, 1 = end) */
    seekTo(progress) {
        const time = this.getDuration() * progress;
        this.setTime(time);
    }
    /** Start playing the audio */
    async play(start, end) {
        if (start != null) {
            this.setTime(start);
        }
        const playResult = await super.play();
        if (end != null) {
            if (this.media instanceof webaudio_js_1.default) {
                this.media.stopAt(end);
            }
            else {
                this.stopAtPosition = end;
            }
        }
        return playResult;
    }
    /** Play or pause the audio */
    async playPause() {
        return this.isPlaying() ? this.pause() : this.play();
    }
    /** Stop the audio and go to the beginning */
    stop() {
        this.pause();
        this.setTime(0);
    }
    /** Skip N or -N seconds from the current position */
    skip(seconds) {
        this.setTime(this.getCurrentTime() + seconds);
    }
    /** Empty the waveform */
    empty() {
        this.load('', [[0]], 0.001);
    }
    /** Set HTML media element */
    setMediaElement(element) {
        this.unsubscribePlayerEvents();
        super.setMediaElement(element);
        this.initPlayerEvents();
    }
    async exportImage(format = 'image/png', quality = 1, type = 'dataURL') {
        return this.renderer.exportImage(format, quality, type);
    }
    /** Unmount wavesurfer */
    destroy() {
        this.emit('destroy');
        this.abortController?.abort();
        this.plugins.forEach((plugin) => plugin.destroy());
        this.subscriptions.forEach((unsubscribe) => unsubscribe());
        this.unsubscribePlayerEvents();
        this.timer.destroy();
        this.renderer.destroy();
        super.destroy();
    }
}
exports.default = WaveSurfer;
