// js/audio/recorder-host.js

class RecorderHost {
    constructor(config) {
        this.config = config || {};
        this.worker = null;
        this.audioContext = this.config.audioContext || new (window.AudioContext || window.webkitAudioContext)();
        this.scriptProcessor = null;
        this.mediaStreamSource = null;
        this.onCompleteCallback = null;
        this.onErrorCallback = null;
        this.onStatusCallback = null;

        // Buffer size for ScriptProcessorNode, affects how often data is sent to worker
        // Should be a power of 2, e.g., 2048, 4096, 8192, 16384
        this.bufferSize = this.config.bufferSize || 4096;
        this.numChannels = this.config.numChannels || 2; // Default to stereo
    }

    initWorker(stream) {
        if (this.worker) {
            this.worker.terminate();
        }
        this.worker = new Worker(this.config.workerPath || 'js/audio/recorder-worker.js');

        this.worker.onmessage = (event) => {
            const data = event.data;
            switch (data.command) {
                case 'ready':
                    if (this.onStatusCallback) this.onStatusCallback('Worker ready.');
                    break;
                case 'complete':
                    if (this.onCompleteCallback) this.onCompleteCallback(data.blob);
                    this._cleanupAfterRecording();
                    break;
                case 'error':
                    if (this.onErrorCallback) this.onErrorCallback(data.message);
                    this._cleanupAfterRecording();
                    break;
                case 'status':
                    if (this.onStatusCallback) this.onStatusCallback(data.message);
                    break;
                default:
                    console.warn('RecorderHost: Unknown command from worker:', data.command);
            }
        };

        this.worker.onerror = (error) => {
            console.error('RecorderHost: Error in worker:', error.message, error);
            if (this.onErrorCallback) {
                this.onErrorCallback('Worker error: ' + error.message);
            }
            this._cleanupAfterRecording();
        };

        // Initialize the worker with necessary configurations
        this.worker.postMessage({
            command: 'init',
            config: {
                sampleRate: this.audioContext.sampleRate,
                numChannels: this.numChannels, // Pass numChannels to worker
                mp3BitRate: this.config.mp3BitRate || 160 // from WebAudioRecorder defaults
            }
        });

        this._setupAudioProcessing(stream);
    }

    _setupAudioProcessing(stream) {
        if (!this.worker) {
            if (this.onErrorCallback) this.onErrorCallback("Worker not initialized before setting up audio processing.");
            return;
        }

        this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);

        // Using ScriptProcessorNode for wider compatibility, though AudioWorklet is preferred for new designs
        // The bufferSize, input channels, output channels
        this.scriptProcessor = this.audioContext.createScriptProcessor(this.bufferSize, this.numChannels, this.numChannels);

        this.scriptProcessor.onaudioprocess = (event) => {
            if (!this.worker) return; // Worker might have been terminated

            const inputBuffer = event.inputBuffer;
            const channelData = [];
            for (let i = 0; i < this.numChannels; i++) {
                channelData.push(inputBuffer.getChannelData(i));
            }

            // Send a copy of the data; consider transferable objects if performance is an issue
            // and if recorder-worker.js is set up to handle them.
            // For now, send as is, WebAudioRecorder's worker likely copies it.
            this.worker.postMessage({
                command: 'process',
                buffers: channelData.map(ch => ch.slice(0)) // Send copies
            });
        };

        this.mediaStreamSource.connect(this.scriptProcessor);
        this.scriptProcessor.connect(this.audioContext.destination); // Connect to destination to keep processing alive
        // This might not be necessary if the stream is only for recording.
        // If not connected, in some browsers, onaudioprocess stops firing.
        if (this.onStatusCallback) this.onStatusCallback('Audio processing set up.');
    }

    startRecording() {
        if (!this.worker) {
            if (this.onErrorCallback) this.onErrorCallback('Worker not initialized. Cannot start recording.');
            return;
        }
        this.worker.postMessage({ command: 'start' });
        if (this.onStatusCallback) this.onStatusCallback('Recording started command sent.');
    }

    stopRecording() {
        if (!this.worker) {
            // It's possible stop is called after an error/completion that already cleaned up.
            // If onErrorCallback is present, it would have been called already.
            console.warn('RecorderHost: stopRecording called but worker is not initialized.');
            return;
        }
        this.worker.postMessage({ command: 'finish' });
        if (this.onStatusCallback) this.onStatusCallback('Recording finish command sent.');
        // Do not call _cleanupAfterRecording here; wait for 'complete' or 'error' from worker
    }

    _cleanupAfterRecording() {
        if (this.scriptProcessor) {
            this.scriptProcessor.disconnect();
            this.scriptProcessor.onaudioprocess = null; // Remove reference to stop processing
            this.scriptProcessor = null;
        }
        if (this.mediaStreamSource) {
            this.mediaStreamSource.disconnect();
            this.mediaStreamSource = null;
        }
        // Worker is terminated by initWorker or if an unrecoverable error occurs in the worker itself.
        // Or it can be terminated here if we don't plan to reuse it immediately.
        // For simplicity now, let's assume initWorker will handle termination if a new recording starts.
        if (this.onStatusCallback) this.onStatusCallback('Host cleanup after recording finished.');
    }

    setOnCompleteListener(callback) {
        this.onCompleteCallback = callback;
    }

    setOnErrorListener(callback) {
        this.onErrorCallback = callback;
    }

    setOnStatusListener(callback) {
        this.onStatusCallback = callback;
    }

    terminateWorker() {
        if (this.worker) {
            this.worker.postMessage({ command: 'cancel' }); // Gracefully ask worker to cancel
            this.worker.terminate();
            this.worker = null;
        }
        this._cleanupAfterRecording(); // Ensure audio nodes are also cleaned up
    }
}

// Example Usage (will be done in RecordMic.js):
// const recorderHost = new RecorderHost({
// audioContext: globalAudioContext, // Assuming globalAudioContext is available
// workerPath: 'js/audio/recorder-worker.js',
// mp3BitRate: 192,
// bufferSize: 4096
// });
//
// recorderHost.setOnCompleteListener((blob) => {
// console.log('Recording complete, blob:', blob);
// // Create download link or pass to WaveSurfer
// });
//
// recorderHost.setOnErrorListener((error) => {
// console.error('Recording error:', error);
// });
//
// navigator.mediaDevices.getUserMedia({ audio: true })
// .then(stream => {
// recorderHost.initWorker(stream); // Pass the stream here
// recorderHost.startRecording();
// // Later, to stop: recorderHost.stopRecording();
// })
// .catch(err => {
// console.error('Error getting user media:', err);
// });
