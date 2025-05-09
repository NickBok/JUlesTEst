"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const event_emitter_js_1 = __importDefault(require("./event-emitter.js"));
class Player extends event_emitter_js_1.default {
    media;
    isExternalMedia = false;
    constructor(options) {
        super();
        if (options.media) {
            this.media = options.media;
            this.isExternalMedia = true;
        }
        else {
            this.media = document.createElement('audio');
        }
        // Controls
        if (options.mediaControls) {
            this.media.controls = true;
        }
        // Autoplay
        if (options.autoplay) {
            this.media.autoplay = true;
        }
        // Speed
        if (options.playbackRate != null) {
            this.onMediaEvent('canplay', () => {
                if (options.playbackRate != null) {
                    this.media.playbackRate = options.playbackRate;
                }
            }, { once: true });
        }
    }
    onMediaEvent(event, callback, options) {
        this.media.addEventListener(event, callback, options);
        return () => this.media.removeEventListener(event, callback, options);
    }
    getSrc() {
        return this.media.currentSrc || this.media.src || '';
    }
    revokeSrc() {
        const src = this.getSrc();
        if (src.startsWith('blob:')) {
            URL.revokeObjectURL(src);
        }
    }
    canPlayType(type) {
        return this.media.canPlayType(type) !== '';
    }
    setSrc(url, blob) {
        const src = this.getSrc();
        if (url && src === url)
            return;
        this.revokeSrc();
        const newSrc = blob instanceof Blob && (this.canPlayType(blob.type) || !url) ? URL.createObjectURL(blob) : url;
        // Reset the media element, otherwise it keeps the previous source
        if (src) {
            this.media.src = '';
        }
        try {
            this.media.src = newSrc;
        }
        catch (e) {
            this.media.src = url;
        }
    }
    destroy() {
        if (this.isExternalMedia)
            return;
        this.media.pause();
        this.media.remove();
        this.revokeSrc();
        this.media.src = '';
        // Load resets the media element to its initial state
        this.media.load();
    }
    setMediaElement(element) {
        this.media = element;
    }
    /** Start playing the audio */
    async play() {
        return this.media.play();
    }
    /** Pause the audio */
    pause() {
        this.media.pause();
    }
    /** Check if the audio is playing */
    isPlaying() {
        return !this.media.paused && !this.media.ended;
    }
    /** Jump to a specific time in the audio (in seconds) */
    setTime(time) {
        this.media.currentTime = Math.max(0, Math.min(time, this.getDuration()));
    }
    /** Get the duration of the audio in seconds */
    getDuration() {
        return this.media.duration;
    }
    /** Get the current audio position in seconds */
    getCurrentTime() {
        return this.media.currentTime;
    }
    /** Get the audio volume */
    getVolume() {
        return this.media.volume;
    }
    /** Set the audio volume */
    setVolume(volume) {
        this.media.volume = volume;
    }
    /** Get the audio muted state */
    getMuted() {
        return this.media.muted;
    }
    /** Mute or unmute the audio */
    setMuted(muted) {
        this.media.muted = muted;
    }
    /** Get the playback speed */
    getPlaybackRate() {
        return this.media.playbackRate;
    }
    /** Check if the audio is seeking */
    isSeeking() {
        return this.media.seeking;
    }
    /** Set the playback speed, pass an optional false to NOT preserve the pitch */
    setPlaybackRate(rate, preservePitch) {
        // preservePitch is true by default in most browsers
        if (preservePitch != null) {
            this.media.preservesPitch = preservePitch;
        }
        this.media.playbackRate = rate;
    }
    /** Get the HTML media element */
    getMediaElement() {
        return this.media;
    }
    /** Set a sink id to change the audio output device */
    setSinkId(sinkId) {
        // See https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/setSinkId
        const media = this.media;
        return media.setSinkId(sinkId);
    }
}
exports.default = Player;
