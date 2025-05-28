// js/audio/recorder-worker.js
console.log('RecorderWorker: Script loaded. Initializing...');

// Necessary to find WebAudioRecorderMp3.min.js and its .mem file if applicable.
// This path is relative to where recorder-worker.js itself is located.
const WORKER_BASE_PATH = '../..'; // Adjust if recorder-worker.js is moved

// Attempt to import the WebAudioRecorder library.
// self.importScripts can load multiple scripts.
try {
    console.log('RecorderWorker: Attempting to import WebAudioRecorder.min.js from:', WORKER_BASE_PATH + '/lib/audio/WebAudioRecorder.min.js');
    self.importScripts(
        WORKER_BASE_PATH + '/lib/audio/WebAudioRecorder.min.js'
        // WebAudioRecorder.min.js should internally load its specific encoder worker (e.g., WebAudioRecorderMp3.min.js)
        // Ensure that WebAudioRecorder.min.js correctly sets its own workerDir if it loads further sub-workers.
        // If WebAudioRecorderMp3.min.js and Mp3LameEncoder.min.js.mem are also needed at this top level:
        // WORKER_BASE_PATH + '/lib/audio/WebAudioRecorderMp3.min.js'
        // It's generally better if WebAudioRecorder.min.js handles its own dependencies.
    );
    console.log('RecorderWorker: WebAudioRecorder.min.js imported successfully.');
} catch (e) {
    console.error('RecorderWorker: Failed to import WebAudioRecorder scripts.', e);
    self.postMessage({ command: 'error', message: 'Failed to load WebAudioRecorder library in worker: ' + e.message });
    throw e; // Terminate worker if essential scripts fail
}


let recorder = null;
let currentSampleRate = 44100;
let currentNumChannels = 2;
let mp3BitRate = 160;

self.onmessage = function(event) {
    console.log('RecorderWorker: self.onmessage invoked, command:', event.data.command, 'data:', event.data);
    const data = event.data;

    switch (data.command) {
        case 'init':
            console.log('RecorderWorker: Command "init" received.');
            currentSampleRate = data.config.sampleRate || 44100;
            currentNumChannels = data.config.numChannels || 2;
            mp3BitRate = data.config.mp3BitRate || 160;

            // WebAudioRecorder's constructor needs the sourceNode, but in a worker, we don't have direct access
            // to AudioContext nodes from the main thread. WebAudioRecorder is designed to take a sourceNode
            // and internally create a ScriptProcessor/AudioWorklet.
            // Since we are manually feeding it buffers via its 'record' method (which isn't standard
            // but is how its internal worker communication is set up), we pass a dummy/minimal sourceNode-like object.
            // The key is that its .context.sampleRate is correct.
            const dummySourceNode = {
                context: {
                    sampleRate: currentSampleRate,
                    // If WebAudioRecorder uses createScriptProcessor or audioWorklet internally
                    // it might need these methods, but it's more likely it only needs sampleRate
                    // when used in this "manual buffer feed" mode via its own worker messages.
                    createScriptProcessor: () => { console.log('RecorderWorker: dummySourceNode.context.createScriptProcessor called'); },
                    // audioWorklet: { addModule: () => Promise.resolve() }
                },
                connect: () => { console.log('RecorderWorker: dummySourceNode.connect called'); }, // Dummy connect
                disconnect: () => { console.log('RecorderWorker: dummySourceNode.disconnect called'); } // Dummy disconnect
            };

            try {
                console.log('RecorderWorker: Initializing WebAudioRecorder with dummySourceNode. Expected to operate in direct buffer feeding mode.');
                recorder = new WebAudioRecorder(dummySourceNode, {
                    workerDir: WORKER_BASE_PATH + '/lib/audio/', // Path to WebAudioRecorderMp3.min.js etc.
                    encoding: 'mp3', // This worker currently hardcodes MP3
                    numChannels: currentNumChannels,
                    options: {
                        encodeAfterRecord: false, // We are feeding data progressively
                        progressInterval: 1000, // Example, may not be used directly here
                        mp3: {
                            mimeType: 'audio/mpeg',
                            bitRate: mp3BitRate
                        }
                        // bufferSize: data.config.bufferSize // This is for ScriptProcessor, recorder may handle its own
                    },
                    onEncoderLoading: function(rec, encoding) {
                        console.log("RecorderWorker: WebAudioRecorder onEncoderLoading callback invoked. Encoding:", encoding);
                        // WORKER_FILE is not defined in this scope, but WebAudioRecorder uses workerDir + specific encoder file.
                        // For mp3, it's typically WebAudioRecorderMp3.min.js.
                        let encoderWorkerName = '';
                        if (encoding === 'mp3') encoderWorkerName = 'WebAudioRecorderMp3.min.js';
                        else if (encoding === 'ogg') encoderWorkerName = 'WebAudioRecorderOgg.min.js';
                        else if (encoding === 'wav') encoderWorkerName = 'WebAudioRecorderWav.min.js';
                        let subWorkerPath = rec.workerDir + encoderWorkerName;
                        console.log('RecorderWorker: WebAudioRecorder onEncoderLoading - Sub-worker path should be: ' + subWorkerPath);
                        self.postMessage({ command: 'status', message: 'Encoder loading: ' + encoding });
                    },
                    onEncoderLoaded: function(rec, encoding) {
                        console.log("RecorderWorker: WebAudioRecorder onEncoderLoaded callback invoked. Encoding:", encoding);
                        self.postMessage({ command: 'status', message: 'Encoder loaded: ' + encoding });
                    },
                    onComplete: function(rec, blob) {
                        console.log("RecorderWorker: WebAudioRecorder onComplete callback invoked.");
                        self.postMessage({ command: 'complete', blob: blob });
                    },
                    onError: function(rec, message) {
                        console.error('RecorderWorker: WebAudioRecorder onError callback invoked. Message:', message);
                        self.postMessage({ command: 'error', message: 'WebAudioRecorder internal error: ' + message });
                    }
                });
                console.log('RecorderWorker: WebAudioRecorder instance created.');

                // The WebAudioRecorder itself uses a worker for encoding.
                // We need to tell it to initialize based on its "dummy" source node.
                // This mimics what happens if it were on the main thread with a real source.
                console.log('RecorderWorker: Sending "init" command to WebAudioRecorder\'s internal worker.');
                recorder.worker.postMessage({
                    command: "init",
                    config: {
                        sampleRate: currentSampleRate,
                        numChannels: currentNumChannels
                    },
                    options: recorder.options // Pass its configured options
                });
                self.postMessage({ command: 'status', message: 'Recorder initialized in worker.' });

            } catch (e) {
                console.error('RecorderWorker: Error initializing WebAudioRecorder:', e);
                self.postMessage({ command: 'error', message: 'Failed to initialize WebAudioRecorder in worker: ' + e.message });
                throw e;
            }
            break;

        case 'start':
            console.log('RecorderWorker: Command "start" received.');
            if (!recorder) {
                console.error('RecorderWorker: Start command received but recorder not initialized.');
                self.postMessage({ command: 'error', message: 'Recorder not initialized before start.' });
                return;
            }
            // The WebAudioRecorder's startRecording doesn't directly apply here as we are manually sending buffers.
            // Instead, we ensure its internal worker is ready via the 'init' message above.
            // Its internal worker expects a 'start' message too.
            console.log('RecorderWorker: Sending "start" command to WebAudioRecorder\'s internal worker.');
            recorder.worker.postMessage({
                command: "start",
                bufferSize: 0 // BufferSize might be determined by the main thread ScriptProcessor or irrelevant here
            });
            self.postMessage({ command: 'status', message: 'Recording started in worker.' });
            break;

        case 'process':
            // console.log('RecorderWorker: Command "process" received.'); // This can be very noisy
            if (recorder && recorder.worker) {
                // WebAudioRecorder's worker expects data in a specific format:
                // { command: "record", buffer: [channel0Data, channel1Data,...] }
                recorder.worker.postMessage({
                    command: 'record',
                    buffer: data.buffers // data.buffers should be an array of Float32Array
                });
            } else {
                // console.warn('RecorderWorker: Process command received but recorder or its worker not available.');
            }
            break;

        case 'finish':
            console.log('RecorderWorker: Command "finish" received.');
            if (recorder && recorder.worker) {
                console.log('RecorderWorker: Sending "finish" command to WebAudioRecorder\'s internal worker.');
                recorder.worker.postMessage({ command: 'finish' });
            } else {
                console.warn('RecorderWorker: Finish called but recorder or worker not available.');
                self.postMessage({ command: 'status', message: 'Finish called but recorder or worker not available.' });
            }
            break;

        case 'cancel':
            console.log('RecorderWorker: Command "cancel" received.');
            if (recorder) {
                // recorder.cancelRecording(); // This would try to disconnect nodes which don't exist here
                if (recorder.worker) {
                    console.log('RecorderWorker: Sending "cancel" command to WebAudioRecorder\'s internal worker.');
                    recorder.worker.postMessage({ command: 'cancel' });
                    // Optionally terminate the sub-worker if WebAudioRecorder doesn't do it on cancel
                    // recorder.worker.terminate();
                }
                recorder = null;
                console.log('RecorderWorker: Recorder instance nulled.');
            }
            self.postMessage({ command: 'status', message: 'Recording canceled in worker.' });
            break;

        default:
            console.warn('RecorderWorker: Unknown command received:', data.command, data);
            break;
    }
};

console.log('RecorderWorker: Event listener for messages assigned. Worker ready for commands.');
self.postMessage({ command: 'ready' }); // Signal that the worker script itself has loaded
