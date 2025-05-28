// js/audio/recorder-host.js
console.log('RecorderHost: Script loaded.');

class RecorderHost {
    constructor(config) {
        console.log('RecorderHost: constructor invoked. Config:', config);
        this.config = config || {};
        this.worker = null;
        this.audioContext = this.config.audioContext || new (window.AudioContext || window.webkitAudioContext)();
        console.log('RecorderHost: AudioContext sample rate:', this.audioContext.sampleRate);
        this.scriptProcessor = null;
        this.mediaStreamSource = null;
        this.onCompleteCallback = null;
        this.onErrorCallback = null;
        this.onStatusCallback = null;

        // Buffer size for ScriptProcessorNode, affects how often data is sent to worker
        // Should be a power of 2, e.g., 2048, 4096, 8192, 16384
        this.bufferSize = this.config.bufferSize || 4096;
        this.numChannels = this.config.numChannels || 2; // Default to stereo
        console.log('RecorderHost: Initialized with bufferSize:', this.bufferSize, 'numChannels:', this.numChannels);
    }

    initWorker(stream) {
        console.log('RecorderHost: initWorker invoked. Stream:', stream);
        if (this.worker) {
            console.log('RecorderHost: Terminating existing worker.');
            this.worker.terminate();
        }
        const workerPath = this.config.workerPath || 'js/audio/recorder-worker.js';
        console.log('RecorderHost: Creating new Worker from path:', workerPath);
        this.worker = new Worker(workerPath);

        this.worker.onmessage = (event) => {
            console.log('RecorderHost: worker.onmessage received. Event data:', event.data);
            const data = event.data;
            switch (data.command) {
                case 'ready':
                    console.log('RecorderHost: Worker reported "ready".');
                    if (this.onStatusCallback) this.onStatusCallback('Worker ready.');
                    break;
                case 'complete':
                    console.log('RecorderHost: Worker reported "complete". Blob size:', data.blob ? data.blob.size : 'N/A');
                    if (this.onCompleteCallback) this.onCompleteCallback(data.blob);
                    this._cleanupAfterRecording();
                    break;
                case 'error':
                    console.error('RecorderHost: Worker reported "error". Message:', data.message);
                    if (this.onErrorCallback) this.onErrorCallback(data.message);
                    this._cleanupAfterRecording();
                    break;
                case 'status':
                    console.log('RecorderHost: Worker reported "status". Message:', data.message);
                    if (this.onStatusCallback) this.onStatusCallback(data.message);
                    break;
                default:
                    console.warn('RecorderHost: Unknown command from worker:', data.command, data);
            }
        };

        this.worker.onerror = (error) => {
            console.error('RecorderHost: Error in worker (worker.onerror). Message:', error.message, 'Full error event:', error);
            if (this.onErrorCallback) {
                this.onErrorCallback('Worker error: ' + error.message);
            }
            this._cleanupAfterRecording();
        };

        console.log('RecorderHost: Posting "init" command to worker. Sample rate:', this.audioContext.sampleRate, 'Num channels:', this.numChannels);
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
        console.log('RecorderHost: _setupAudioProcessing invoked. Stream:', stream);
        if (!this.worker) {
            console.error('RecorderHost: _setupAudioProcessing - Worker not initialized.');
            if (this.onErrorCallback) this.onErrorCallback("Worker not initialized before setting up audio processing.");
            return;
        }

        console.log('RecorderHost: Creating MediaStreamSource from stream.');
        this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);

        console.log('RecorderHost: Creating ScriptProcessorNode. Buffer size:', this.bufferSize, 'Input/Output channels:', this.numChannels);
        // Using ScriptProcessorNode for wider compatibility, though AudioWorklet is preferred for new designs
        // The bufferSize, input channels, output channels
        this.scriptProcessor = this.audioContext.createScriptProcessor(this.bufferSize, this.numChannels, this.numChannels);

        this.scriptProcessor.onaudioprocess = (event) => {
            // console.log('RecorderHost: scriptProcessor.onaudioprocess invoked.'); // This is too noisy
            if (!this.worker) {
                // console.warn('RecorderHost: onaudioprocess - Worker is null, returning.'); // Can be noisy
                return;
            }

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
        console.log('RecorderHost: scriptProcessor.onaudioprocess handler assigned.');

        console.log('RecorderHost: Connecting mediaStreamSource to scriptProcessor.');
        this.mediaStreamSource.connect(this.scriptProcessor);
        console.log('RecorderHost: Connecting scriptProcessor to audioContext.destination.');
        this.scriptProcessor.connect(this.audioContext.destination); // Connect to destination to keep processing alive
        // This might not be necessary if the stream is only for recording.
        // If not connected, in some browsers, onaudioprocess stops firing.
        if (this.onStatusCallback) this.onStatusCallback('Audio processing set up.');
        console.log('RecorderHost: _setupAudioProcessing completed.');
    }

    startRecording() {
        console.log('RecorderHost: startRecording invoked.');
        if (!this.worker) {
            console.error('RecorderHost: startRecording - Worker not initialized.');
            if (this.onErrorCallback) this.onErrorCallback('Worker not initialized. Cannot start recording.');
            return;
        }
        console.log('RecorderHost: Posting "start" command to worker.');
        this.worker.postMessage({ command: 'start' });
        if (this.onStatusCallback) this.onStatusCallback('Recording started command sent.');
    }

    stopRecording() {
        console.log('RecorderHost: stopRecording invoked.');
        if (!this.worker) {
            // It's possible stop is called after an error/completion that already cleaned up.
            // If onErrorCallback is present, it would have been called already.
            console.warn('RecorderHost: stopRecording called but worker is not initialized.');
            return;
        }
        console.log('RecorderHost: Posting "finish" command to worker.');
        this.worker.postMessage({ command: 'finish' });
        if (this.onStatusCallback) this.onStatusCallback('Recording finish command sent.');
        // Do not call _cleanupAfterRecording here; wait for 'complete' or 'error' from worker
    }

    _cleanupAfterRecording() {
        console.log('RecorderHost: _cleanupAfterRecording invoked.');
        if (this.scriptProcessor) {
            console.log('RecorderHost: Disconnecting scriptProcessor.');
            this.scriptProcessor.disconnect();
            this.scriptProcessor.onaudioprocess = null; // Remove reference to stop processing
            this.scriptProcessor = null;
            console.log('RecorderHost: scriptProcessor nulled.');
        }
        if (this.mediaStreamSource) {
            console.log('RecorderHost: Disconnecting mediaStreamSource.');
            this.mediaStreamSource.disconnect();
            this.mediaStreamSource = null;
            console.log('RecorderHost: mediaStreamSource nulled.');
        }
        // Worker is terminated by initWorker or if an unrecoverable error occurs in the worker itself.
        // Or it can be terminated here if we don't plan to reuse it immediately.
        // For simplicity now, let's assume initWorker will handle termination if a new recording starts.
        if (this.onStatusCallback) this.onStatusCallback('Host cleanup after recording finished.');
        console.log('RecorderHost: _cleanupAfterRecording completed.');
    }

    setOnCompleteListener(callback) {
        console.log('RecorderHost: setOnCompleteListener invoked. Callback:', callback);
        this.onCompleteCallback = callback;
    }

    setOnErrorListener(callback) {
        console.log('RecorderHost: setOnErrorListener invoked. Callback:', callback);
        this.onErrorCallback = callback;
    }

    setOnStatusListener(callback) {
        console.log('RecorderHost: setOnStatusListener invoked. Callback:', callback);
        this.onStatusCallback = callback;
    }

    terminateWorker() {
        console.log('RecorderHost: terminateWorker invoked.');
        if (this.worker) {
            console.log('RecorderHost: Posting "cancel" command to worker and terminating.');
            this.worker.postMessage({ command: 'cancel' }); // Gracefully ask worker to cancel
            this.worker.terminate();
            this.worker = null;
            console.log('RecorderHost: Worker terminated and nulled.');
        }
        this._cleanupAfterRecording(); // Ensure audio nodes are also cleaned up
        console.log('RecorderHost: terminateWorker completed.');
    }
}

// Example Usage (will be done in RecordMic.js):
// const recorderHost = new RecorderHost({
//     audioContext: globalAudioContext, // Assuming globalAudioContext is available
//     workerPath: 'js/audio/recorder-worker.js',
//     mp3BitRate: 192,
//     bufferSize: 4096
// });
//
// recorderHost.setOnCompleteListener((blob) => {
//     console.log('Recording complete, blob:', blob);
//     // Create download link or pass to WaveSurfer
// });
//
// recorderHost.setOnErrorListener((error) => {
//     console.error('Recording error:', error);
// });
//
// navigator.mediaDevices.getUserMedia({ audio: true })
//     .then(stream => {
//         recorderHost.initWorker(stream); // Pass the stream here
//         recorderHost.startRecording();
//         // Later, to stop: recorderHost.stopRecording();
//     })
//     .catch(err => {
//         console.error('Error getting user media:', err);
//     });
