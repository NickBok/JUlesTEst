function Uint8ArrayToFloat32Array(u8a){
    var len = u8a.length;
    var f32Buffer = new Float32Array(len);
    for (var i = 0; i < len; i++) {
        var value = u8a[i<<1] + (u8a[(i<<1)+1]<<8);
        if (value >= 0x8000) value |= ~0x7FFF;
        f32Buffer[i] = value / 0x8000;
    }

    return f32Buffer;
}
function parseWav(wav) {
    function readInt(i, bytes) {
        var ret = 0,
            shft = 0;

        while (bytes) {
            ret += wav[i] << shft;
            shft += 8;
            i++;
            bytes--;
        }
        return ret;
    }
    if (readInt(20, 2) != 1) throw 'Invalid compression code, not PCM';
    if (readInt(22, 2) != 1) throw 'Invalid number of channels, not 1';
    return {
        sampleRate: readInt(24, 4),
        bitsPerSample: readInt(34, 2),
        samples: wav.subarray(44)
    };
}


class RecordWaveSurfer extends WaveSurfer {
    constructor(options) {
        super(options);

        // Initialize fields from Record function
        this.tracks = [];
        this.soloedTracks = [];
        this.mutedTracks = [];
        this.collapsedTracks = [];
        this.playoutPromises = [];

        this.cursor = 0;
        this.playbackSeconds = 0;
        this.duration = 0;
        this.scrollLeft = 0;
        this.scrollTimer = undefined;
        this.showTimescale = false;
        this.isScrolling = false;

        this.fadeType = 'logarithmic';
        this.masterGain = 1;
        this.annotations = [];
        this.durationFormat = 'hh:mm:ss.uuu';
        this.isAutomaticScroll = false;
        this.resetDrawTimer = undefined;

        // Audio processing nodes
        this.gainNode = null;
        this.eqsetting1 = null;
        this.eqsetting2 = null;
        this.eqsetting3 = null;
        this.eqsetting4 = null;
        this.eqsetting5 = null;
        // this.mp3Recorder = null; // Replaced by recorderHost
        // this.recorderWorker = null; // Replaced by recorderHost's worker
        this.recorderHost = null;
    }

    initRecorder(stream, compressionChk, eqChk, eq1, eq2, eq3, eq4, eq5) {
        // console.log('RecordMic: initRecorder started. Current this.mp3Recorder:', this.mp3Recorder); // Old log
        console.log('RecordMic: initRecorder started.');
        if (this.gainNode != null) {
            this.gainNode.disconnect();
        }
        // let _this = this; // Keep for now, might be needed for UI emit or other callbacks
        const audioContext = globalAudioContext; // Assuming globalAudioContext is available
        const input = audioContext.createMediaStreamSource(stream);
        this.gainNode = audioContext.createGain();
        this.gainNode.connect(sampleMixer); // Assuming sampleMixer is a global or accessible AudioNode
        input.connect(this.gainNode);

        const compressor = audioContext.createDynamicsCompressor();
        this.gainNode.connect(compressor);

        let destination1 = this.gainNode;
        if (compressionChk == true) {
            destination1 = compressor;
        }

        // Setup EQ filters - these might be for monitoring path, not necessarily for recording
        this.eqsetting1 = audioContext.createBiquadFilter();
        this.eqsetting1.type = "lowshelf";
        this.eqsetting1.frequency.value = 80;
        this.eqsetting1.gain.value = eq1;
        destination1.connect(this.eqsetting1);

        this.eqsetting2 = audioContext.createBiquadFilter();
        this.eqsetting2.type = "lowshelf";
        this.eqsetting2.frequency.value = 800;
        this.eqsetting2.gain.value = eq2;
        this.eqsetting1.connect(this.eqsetting2);

        this.eqsetting3 = audioContext.createBiquadFilter();
        this.eqsetting3.type = "lowshelf";
        this.eqsetting3.frequency.value = 2000;
        this.eqsetting3.gain.value = eq3;
        this.eqsetting2.connect(this.eqsetting3);

        this.eqsetting4 = audioContext.createBiquadFilter();
        this.eqsetting4.type = "lowshelf";
        this.eqsetting4.frequency.value = 5000;
        this.eqsetting4.gain.value = eq4;
        this.eqsetting3.connect(this.eqsetting4);

        this.eqsetting5 = audioContext.createBiquadFilter();
        this.eqsetting5.type = "lowshelf";
        this.eqsetting5.frequency.value = 10000;
        this.eqsetting5.gain.value = eq5;
        this.eqsetting4.connect(this.eqsetting5);

        var destination2 = destination1; // This is the output of the EQ chain
        if (eqChk == true)
            destination2 = this.eqsetting5;

        // The old code created an audiosource from input.buffer, which seems incorrect for a live stream.
        // It also connected it to gainNode, which is already connected to the input stream.
        // This part is likely redundant or was for a specific non-obvious purpose. Removing for now.
        // const audiosource = audioContext.createBufferSource();
        // audiosource.buffer = input.buffer; // input is MediaStreamAudioSourceNode, its .buffer is undefined
        // audiosource.connect(this.gainNode);
        // audiosource.start();

        // console.log(input.context.state); // State of the general audio context

        // The old WebAudioRecorder was connected to 'mixedAudioSource' which was derived from 'sampleMixer.stream'.
        // For now, RecorderHost will receive the original 'stream' parameter given to initRecorder.
        // If 'sampleMixer.stream' or 'destination2' is needed, this needs adjustment.
        // For simplicity, we pass the original 'stream' to RecorderHost.

        // Old VU Meter logic - mixedAudioSource was from sampleMixer.stream.
        // This might need to be adapted based on where the VU meter should get its signal.
        // For now, let's assume it can still use sampleMixer.stream if sampleMixer is global/accessible.
        // var mixedAudioSource = audioContext.createMediaStreamSource(sampleMixer.stream); // This line assumes sampleMixer is global and has a stream
        // if (!scriptprocessor) {
        //     globalAudioContext.audioWorklet.addModule('js/audio/vumeter-worklet-processor.js').then(() => {
        //         const vtVUmeterWorklet = new VtVUmeterWorklet(globalAudioContext)
        //         mixedAudioSource.connect(vtVUmeterWorklet);
        //         function drawMeter () {
        //             vtVUmeterWorklet.draw()
        //             requestAnimationFrame(drawMeter)
        //         }
        //         drawMeter()
        //     })
        // } else {
        //     var audioMeter = createAudioMeter(audioContext)
        //     mixedAudioSource.connect(audioMeter)
        // }

        // Initialize RecorderHost
        if (this.recorderHost) {
            this.recorderHost.terminateWorker(); // Clean up any existing worker
        }

        this.recorderHost = new RecorderHost({
            audioContext: globalAudioContext,
            workerPath: 'js/audio/recorder-worker.js',
            mp3BitRate: 160, // TODO: Make configurable if needed
            bufferSize: 4096, // TODO: Make configurable if needed
            numChannels: this.params.numChannels || 2 // Assuming WaveSurfer params might have numChannels
        });

        this.recorderHost.setOnCompleteListener((blob) => {
            console.log('RecordMic: recorderHost.onComplete blob received, size:', blob.size);

            if (this.voicetrackname === undefined || this.nextstart === undefined || this.vtstart === undefined) {
                console.warn("RecordMic: onComplete - Missing metadata (voicetrackname, nextstart, vtstart). Using original blob for URL.");
                let blobUrl = URL.createObjectURL(blob);
                this.load(blobUrl);
                this.ee.emit('voicetrackblob', blob);
            } else {
                blob.arrayBuffer().then(buffer => {
                    var mp3file = writeMp3Tag(buffer, this.voicetrackname, this.nextstart, this.vtstart); // writeMp3Tag must be accessible
                    var taggedBlob = new Blob([mp3file], { type: 'audio/mpeg' });
                    let blobUrl = URL.createObjectURL(taggedBlob);
                    this.load(blobUrl);
                    this.ee.emit('voicetrackblob', mp3file); // Emitting the File object from writeMp3Tag
                }).catch(e => {
                    console.error("RecordMic: Error processing arrayBuffer for tagging", e);
                    let blobUrl = URL.createObjectURL(blob); // Fallback to untagged blob
                    this.load(blobUrl);
                    this.ee.emit('voicetrackblob', blob);
                });
            }
        });

        this.recorderHost.setOnErrorListener((error) => {
            console.error('RecordMic: recorderHost.onError:', error);
            // TODO: Add user-facing error handling
        });

        this.recorderHost.setOnStatusListener((status) => {
            console.log('RecordMic: recorderHost.onStatus:', status);
        });

        // Pass the original userMediaStream ('stream') to RecorderHost
        // The RecorderHost will create its own MediaStreamSourceNode from this stream.
        this.recorderHost.initWorker(stream);

        console.log("RecordMic: RecorderHost initialized.");

        // Handle UI reset on WaveSurfer "ready" event
        // This ensures UI is updated after the waveform is loaded and WaveSurfer is ready.
        // Remove any previous 'ready' listeners to avoid multiple firings if initRecorder is called again.
        this.un('ready'); // WaveSurfer's method to remove event listeners
        this.on('ready', () => {
            console.log('RecordMic: WaveSurfer "ready" event fired. Waveform loaded.');
            // Emit a general event that other parts of the application (e.g., eventmanager.js) can listen to
            // to update UI elements like buttons and labels.
            this.ee.emit('audioprocess_finished_ui_reset');

            // Example of direct global state change, if still used:
            // window.recordstate = "stopped";

            // Log duration as in original code example
            // console.log('RecordMic: Decoded data duration (via getDuration):', this.getDuration());
            // window.listUpdateState = false; // If this global var is still used.
        });

        // Old WebAudioRecorder instantiation and onComplete logic is now replaced by RecorderHost.
        // Old recorderWorker (inline worker for peaks) is also removed. Peak calculation
        // would need to be handled by WaveSurfer itself upon load, or by a new mechanism
        // if custom peak generation is still required before loading into WaveSurfer.
        // For now, assume WaveSurfer's default peak calculation is sufficient.
    }

    removeTrack(fname) {
        // console.log("in removetrack", this, fname);
        if (fname === "Recording" && this.recorderHost) {
            this.recorderHost.stopRecording(); // Or terminateWorker() if a more forceful stop is needed
        }

        var trackLists = [this.mutedTracks, this.soloedTracks, this.collapsedTracks, this.tracks];
        trackLists.forEach(function (list) {
            list.forEach(function (item) {
                if (item.name == fname) {
                    if (item.isPlaying()) {
                        item.scheduleStop();
                    }
                    var index = list.indexOf(item);
                    if (index > -1) {
                        list.splice(index, 1);
                    }
                }
            });
        });
        this.empty();
        //   if (track.isPlaying()) {
        //     track.scheduleStop();
        //   }

        //   var trackLists = [this.mutedTracks, this.soloedTracks, this.collapsedTracks, this.tracks];
        //   trackLists.forEach(function (list) {
        //     var index = list.indexOf(track);
        //     if (index > -1) {
        //       list.splice(index, 1);
        //     }
        //   });
    }

    stop() {
        // console.log('RecordMic: stop() called. Current this.mp3Recorder:', this.mp3Recorder, 'SurferID:', this.surferID); // Old log
        console.log('RecordMic: stop() called. Current this.recorderHost:', this.recorderHost, 'SurferID:', this.surferID);
        if (this.recorderHost) {
            this.recorderHost.stopRecording();
        }

        this.pausedAt = undefined;
        this.playbackSeconds = 0;
        return this.playbackReset();
    }
    playbackReset() {
        // var _this8 = this;
        //
        // this.lastSeeked = undefined;
        // this.stopAnimation();
        //
        // this.tracks.forEach(function (track) {
        //     track.scheduleStop();
        //     track.setState(_this8.getState());
        // });
        //
        // this.drawRequest();
        // return Promise.all(this.playoutPromises);
    }

    record() {
        // this // This was an orphaned 'this'
        var _this12 = this; // Keep if playoutPromises logic below is restored
        var playoutPromises = []; // Keep if logic below is restored

        if (this.recorderHost) {
            this.recorderHost.startRecording();
        } else {
            console.error("RecordMic: record() called but recorderHost is not initialized.");
        }

        // var track = new _Track2.default();
        // track.setName('Recording');
        // track.setEnabledStates();
        // track.setEventEmitter(this.ee);
        // this.recordingTrack = track;
        this.tracks = [];
        // this.tracks.push(track);
        //
        // this.tracks.forEach(function (track) {
        //     track.setState('none');
        //     playoutPromises.push(track.schedulePlay(_this12.ac.currentTime, 0, undefined, {
        //         shouldPlay: _this12.shouldTrackPlay(track)
        //     }));
        // });

        this.playoutPromises = playoutPromises;
    }

    recordstop(voicetrackname) {
        // console.log('RecordMic: recordstop() called. Current this.mp3Recorder:', this.mp3Recorder, 'Voicetrack Name:', voicetrackname); // Old log
        console.log('RecordMic: recordstop() called. Current this.recorderHost:', this.recorderHost, 'Voicetrack Name:', voicetrackname);

        this.waveWidth = document.getElementById("recordform").clientWidth; ///WP
        this.voicetrackname = voicetrackname; // Ensure these are set before stopRecording for onComplete

        // Ensure nextstart and vtstart are also set if they are class properties like voicetrackname
        // Assuming they are set elsewhere as per the original logic, e.g., from UI input.
        // this.nextstart = ... ;
        // this.vtstart = ... ;

        if (this.recorderHost) {
            this.recorderHost.stopRecording();
        }
    }

    // Add any additional methods needed for recording functionality
}
