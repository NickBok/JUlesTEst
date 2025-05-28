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
        this.mp3Recorder = null;
        this.recorderWorker = null;
    }

    initRecorder(stream, compressionChk, eqChk, p_eq1, p_eq2, p_eq3, p_eq4, p_eq5) {
        if (this.mp3Recorder && this.mp3Recorder.instanceId) {
            console.warn("RecordMic: initRecorder called, mp3Recorder already exists. Old ID:", this.mp3Recorder.instanceId, ". Re-initializing.");
        }
        this.recordSurferInstanceId = "RecSurfer_" + Date.now();
        console.log("RecordMic: RecordWaveSurfer instance (this) ID set to:", this.recordSurferInstanceId);
        if (this.gainNode != null) {
            this.gainNode.disconnect();
        }
        let _this = this;
        const audioContext = globalAudioContext;
        const input = audioContext.createMediaStreamSource(stream);
        this.gainNode = audioContext.createGain();
        this.gainNode.connect(sampleMixer);
        input.connect(this.gainNode);

        const compressor = audioContext.createDynamicsCompressor();

        this.gainNode.connect(compressor);

        let destination1 = this.gainNode;
        if (compressionChk == true) {
            destination1 = compressor;
        }

        // Setup EQ filters
        this.eqsetting1 = audioContext.createBiquadFilter();
        this.eqsetting1.type = "lowshelf";
        this.eqsetting1.frequency.value = 80;
        if (!isFinite(p_eq1)) {
            console.warn(`RecordMic: p_eq1 is non-finite ('${p_eq1}' type: ${typeof p_eq1}). Defaulting to 0.0 for this.eqsetting1.gain.value.`);
            p_eq1 = 0.0;
        }
        this.eqsetting1.gain.value = p_eq1;
        destination1.connect(this.eqsetting1);

        this.eqsetting2 = audioContext.createBiquadFilter();
        this.eqsetting2.type = "lowshelf";
        this.eqsetting2.frequency.value = 800;
        if (!isFinite(p_eq2)) {
            console.warn(`RecordMic: p_eq2 is non-finite ('${p_eq2}' type: ${typeof p_eq2}). Defaulting to 0.0 for this.eqsetting2.gain.value.`);
            p_eq2 = 0.0;
        }
        this.eqsetting2.gain.value = p_eq2;
        this.eqsetting1.connect(this.eqsetting2);

        this.eqsetting3 = audioContext.createBiquadFilter();
        this.eqsetting3.type = "lowshelf";
        this.eqsetting3.frequency.value = 2000;
        if (!isFinite(p_eq3)) {
            console.warn(`RecordMic: p_eq3 is non-finite ('${p_eq3}' type: ${typeof p_eq3}). Defaulting to 0.0 for this.eqsetting3.gain.value.`);
            p_eq3 = 0.0;
        }
        this.eqsetting3.gain.value = p_eq3;
        this.eqsetting2.connect(this.eqsetting3);

        this.eqsetting4 = audioContext.createBiquadFilter();
        this.eqsetting4.type = "lowshelf";
        this.eqsetting4.frequency.value = 5000;
        if (!isFinite(p_eq4)) {
            console.warn(`RecordMic: p_eq4 is non-finite ('${p_eq4}' type: ${typeof p_eq4}). Defaulting to 0.0 for this.eqsetting4.gain.value.`);
            p_eq4 = 0.0;
        }
        this.eqsetting4.gain.value = p_eq4;
        this.eqsetting3.connect(this.eqsetting4);

        this.eqsetting5 = audioContext.createBiquadFilter();
        this.eqsetting5.type = "lowshelf";
        this.eqsetting5.frequency.value = 10000;
        if (!isFinite(p_eq5)) {
            console.warn(`RecordMic: p_eq5 is non-finite ('${p_eq5}' type: ${typeof p_eq5}). Defaulting to 0.0 for this.eqsetting5.gain.value.`);
            p_eq5 = 0.0;
        }
        this.eqsetting5.gain.value = p_eq5;
        this.eqsetting4.connect(this.eqsetting5);

        var destination2 = destination1;
        if (eqChk == true)
            destination2 = this.eqsetting5;

        //wp added
        const audiosource = audioContext.createBufferSource();
        audiosource.buffer = input.buffer;
        audiosource.connect(this.gainNode);
        audiosource.start();

        console.log(input.context.state);

        //var mixedAudioSource = audioContext.createMediaStreamSource(sampleMixer.stream);
        //   console.log("init recorder", sampleMixer, sampleMixer.stream, mixedAudioSource, destination2);

        // AUDIO WORKLET
        if (!scriptprocessor) {

            globalAudioContext.audioWorklet.addModule('js/audio/vumeter-worklet-processor.js').then(() => {
                const vtVUmeterWorklet = new VtVUmeterWorklet(globalAudioContext)
                mixedAudioSource.connect(vtVUmeterWorklet);
                function drawMeter () {
                    vtVUmeterWorklet.draw()
                    requestAnimationFrame(drawMeter)
                }
                drawMeter()
            })
        } else {
            // moved WP
            var audioMeter = createAudioMeter(audioContext)
            mixedAudioSource.connect(audioMeter)
            // this.ee.emit("audiometer", audioMeter)
        }

        this.mp3Recorder = new WebAudioRecorder(mixedAudioSource/*this.gainNode*/, {
            workerDir: "./",
            encoding: "mp3",
            numChannels: 2,
            onEncoderLoading: function(recorder, encoding) {
            },
            onEncoderLoaded: function(recorder, encoding) {
            }
        });
        this.mp3Recorder.instanceId = Date.now();
        console.log("RecordMic: this.mp3Recorder instance created/assigned. ID:", this.mp3Recorder.instanceId, this.mp3Recorder);


        console.log("RecordMic: Assigning mp3Recorder.onComplete callback. Instance ID:", this.mp3Recorder.instanceId);
        this.mp3Recorder.onComplete = function(recorder, mp3blob) {
            console.log("RecordMic: mp3Recorder.onComplete called. Recorder Instance ID:", recorder ? recorder.instanceId : "N/A", " Parent _this.mp3Recorder ID:", _this.mp3Recorder ? _this.mp3Recorder.instanceId : "N/A");
            console.log("RecordMic: onComplete - Initial _this.voicetrackname:", _this.voicetrackname, "_this.nextstart:", _this.nextstart, "_this.vtstart:", _this.vtstart);

            mp3blob.arrayBuffer().then(buffer => {
                let sourceDataForBlob = buffer; // Default to the original ArrayBuffer
                let wasTagged = false;

                if (_this.voicetrackname && _this.nextstart !== undefined && _this.vtstart !== undefined) {
                    console.log("RecordMic: All metadata present. Attempting to call writeMp3Tag.", {
                        voicetrackname: _this.voicetrackname,
                        nextstart: _this.nextstart,
                        vtstart: _this.vtstart
                    });
                    try {
                        const mp3FileFromWriter = writeMp3Tag(buffer, _this.voicetrackname, _this.nextstart, _this.vtstart);
                        // writeMp3Tag returns a File object (which is a Blob)
                        sourceDataForBlob = mp3FileFromWriter;
                        wasTagged = true;
                        console.log("RecordMic: writeMp3Tag successful. sourceDataForBlob is now a File/Blob object. Type:", sourceDataForBlob.type, "Size:", sourceDataForBlob.size);
                        _this.ee.emit('voicetrackblob', sourceDataForBlob);
                    } catch (e) {
                        console.error("RecordMic: Error calling writeMp3Tag:", e, ". Falling back to original ArrayBuffer.");
                        // sourceDataForBlob remains the original ArrayBuffer
                    }
                } else {
                    console.warn("RecordMic: Missing metadata for tagging. Using original ArrayBuffer.", {
                        voicetrackname: _this.voicetrackname,
                        nextstart: _this.nextstart,
                        vtstart: _this.vtstart
                    });
                }

                // Detailed logging for sourceDataForBlob (previously fileToLoadInWaveSurfer)
                console.log("RecordMic: Inspecting sourceDataForBlob before final Blob/URL creation. Tagged status:", wasTagged);
                if (sourceDataForBlob instanceof ArrayBuffer) {
                    console.log("RecordMic: sourceDataForBlob IS an ArrayBuffer. byteLength:", sourceDataForBlob.byteLength);
                    if (sourceDataForBlob.byteLength > 0) {
                        const firstBytesView = new Uint8Array(sourceDataForBlob, 0, Math.min(sourceDataForBlob.byteLength, 16));
                        console.log("RecordMic: sourceDataForBlob first up to 16 bytes (as ArrayBuffer):", firstBytesView);
                    } else {
                        console.warn("RecordMic: sourceDataForBlob is an empty ArrayBuffer!");
                    }
                } else if (sourceDataForBlob instanceof Blob) { // File is a subclass of Blob
                    console.log("RecordMic: sourceDataForBlob IS a Blob/File. Size:", sourceDataForBlob.size, "Type:", sourceDataForBlob.type);
                } else {
                    console.warn("RecordMic: sourceDataForBlob is NEITHER an ArrayBuffer NOR a Blob. Actual type is:", typeof sourceDataForBlob, sourceDataForBlob);
                }

                let blb_content;
                if (sourceDataForBlob instanceof ArrayBuffer) {
                    console.log("RecordMic: Creating new Blob from ArrayBuffer (sourceDataForBlob).");
                    blb_content = new Blob([sourceDataForBlob], { type: "audio/mpeg" });
                } else { // Assumes it's a File/Blob object from writeMp3Tag
                    console.log("RecordMic: Using sourceDataForBlob (File/Blob) directly as blb_content, as it's already a Blob.");
                    blb_content = sourceDataForBlob; // sourceDataForBlob is already a Blob (File)
                }

                const bUrl = URL.createObjectURL(blb_content);
                console.log("RecordMic: Created blob URL:", bUrl, "from blb_content of type:", blb_content.type, "and size:", blb_content.size);

                if (bUrl) {
                    console.log("RecordMic: Calling _this.load() with bUrl:", bUrl);
                    _this.load(bUrl);
                    _this.once('ready', function() {
                        console.log('RecordMic: WaveSurfer "ready" event fired. Waveform loaded.');
                        if (_this.backend) {
                            console.log('RecordMic: Decoded data duration:', _this.backend.getDuration());
                            console.log('RecordMic: Decoded data channels:', _this.backend.buffer ? _this.backend.buffer.numberOfChannels : 'N/A');
                        } else if (typeof _this.getDuration === 'function') {
                            console.log('RecordMic: Decoded data duration (via getDuration):', _this.getDuration());
                        } else {
                            console.warn('RecordMic: Could not determine decoded data properties from WaveSurfer instance.');
                        }

                        // Ensure listUpdateState is reset as the recording waveform is ready
                        if (typeof window.listUpdateState === 'boolean') {
                            window.listUpdateState = false;
                            console.log('RecordMic: window.listUpdateState set to false after WaveSurfer ready.');
                        } else {
                            console.warn('RecordMic: window.listUpdateState not found or not a boolean, cannot reset from here.');
                        }
                    });
                } else {
                    console.error("RecordMic: bUrl is invalid, not calling _this.load()");
                }

                // UI Reset Logic (from previous step - ensure it's still here)
                console.log("RecordMic: Attempting UI reset after recording completion.");
                const recordBtn = document.getElementById('recordbtn');
                if (recordBtn) {
                    recordBtn.disabled = false;
                    console.log("RecordMic: Record button disabled state set to:", recordBtn.disabled);
                } else {
                    console.warn("RecordMic: #recordbtn not found");
                }
                const recordLabel = document.getElementById('recordlabel');
                if (recordLabel) {
                    recordLabel.innerText = 'Press HERE to Record Voice Track';
                    console.log("RecordMic: Record label text set to:", recordLabel.innerText);
                } else {
                    console.warn("RecordMic: #recordlabel not found");
                }

                const playBtn = document.getElementById('playbtn');
                if (playBtn) {
                    playBtn.disabled = false;
                    console.log("RecordMic: Play button disabled state set to:", playBtn.disabled);
                } else {
                    console.warn("RecordMic: #playbtn not found");
                }

                const vtBtn = document.getElementById('vtbtn');
                if (vtBtn) {
                    vtBtn.disabled = false;
                    console.log("RecordMic: VT Process button disabled state set to:", vtBtn.disabled);
                } else {
                    console.warn("RecordMic: #vtbtn not found");
                }

                if (typeof window.recordstate !== 'undefined') {
                    window.recordstate = 'stopped';
                    console.log("RecordMic: Global window.recordstate set to:", window.recordstate);
                } else {
                    console.warn("RecordMic: Global window.recordstate variable not found. VU Meter might not reset correctly.");
                }

                if (typeof _this.setState === 'function') {
                    _this.setState('cursor');
                    console.log("RecordMic: RecordWaveSurfer instance state set to 'cursor'");
                }

            }).catch(error => {
                console.error("RecordMic: Error processing mp3blob.arrayBuffer():", error);
                // UI Reset Logic (repeat here for safety)
                console.warn("RecordMic: Resetting UI elements due to error during blob processing...");
                const recordBtn = document.getElementById('recordbtn');
                const recordLabel = document.getElementById('recordlabel');
                const playBtn = document.getElementById('playbtn');
                const vtBtn = document.getElementById('vtbtn');

                if (recordBtn) recordBtn.disabled = false;
                if (recordLabel) recordLabel.innerText = "Press HERE to Record Voice Track";
                if (playBtn) playBtn.disabled = false;
                if (vtBtn) vtBtn.disabled = false;
                if (typeof window.recordstate !== 'undefined') window.recordstate = 'stopped'; // Added window prefix
                if (typeof _this.setState === 'function') _this.setState('cursor'); // Added check
                console.log("RecordMic: UI elements reset after error.");
            });
            // var loader = _LoaderFactory2.default.createLoader(mp3blob, _this.ac);
            // loader.load().then(function (audioBuffer) {
            //     // ask web worker for peaks.
            //     // console.log("in recording data available", _this, audioBuffer, audioBuffer.getChannelData(0));
            //     _this.recorderWorker.postMessage({
            //         samples: audioBuffer.getChannelData(0),
            //         // samplesPerPixel: _this.samplesPerPixel
            //         canvasWidth: _this.waveWidth
            //     });
            //     _this.recordingTrack.setCues(0, audioBuffer.duration);
            //     _this.recordingTrack.setBuffer(audioBuffer);
            //     _this.recordingTrack.setPlayout(new _Playout2.default(_this.ac, audioBuffer));
            //     _this.adjustDuration();
            // });
        }
//TODO: uncomment
        // this.recorderWorker = new _inlineWorker2.default(_recorderWorker2.default);
        // // use a worker for calculating recording peaks.
        // this.recorderWorker.onmessage = function (e) {
        //     // console.log("setPeaks111", e);
        //
        //     _this.recordingTrack.setPeaks(e.data);
        //     _this.samplesPerPixel = e.data.samplesPerPixel;
        //     // console.log("on stop onmessage", _this, e.data.samplesPerPixel);
        //     // _this.working = false;
        //     _this.drawRequest();
        // };
    }

    removeTrack(fname) {
        // console.log("in removetrack", this, fname);
        //   if (fname === "Recording" && this.mediaRecorder.state === "recording")
        // 	this.mediaRecorder.stop();
        if (fname === "Recording")
            this.mp3Recorder.finishRecording();

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
        //   if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        //     this.mediaRecorder.stop();
        //   }
        console.log("RecordMic: stop() called. SurferID:", this.recordSurferInstanceId, "this.mp3Recorder:", this.mp3Recorder);
        console.log("RecordMic: Calling finishRecording() in stop... SurferID:", this.recordSurferInstanceId, "RecorderID:", this.mp3Recorder ? this.mp3Recorder.instanceId : "N/A");
        if (this.mp3Recorder) {
            this.mp3Recorder.finishRecording();
        }
        console.log("RecordMic: Called finishRecording() in stop. SurferID:", this.recordSurferInstanceId, "RecorderID:", this.mp3Recorder ? this.mp3Recorder.instanceId : "N/A", "(if mp3Recorder existed).");

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
        this
        var _this12 = this;
        var playoutPromises = [];
        this.mp3Recorder.startRecording();

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
        console.log("RecordMic: recordstop called. voicetrackname:", voicetrackname, "Current waveWidth:", this.waveWidth);
        // if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        // 	this.mediaRecorder.stop();
        //   }
        this.waveWidth = document.getElementById("recordform").clientWidth; ///WP
        this.voicetrackname = voicetrackname;
        if (this.mp3Recorder) {
            console.log("RecordMic: recordstop() called. SurferID:", this.recordSurferInstanceId, "this.mp3Recorder:", this.mp3Recorder);
            console.log("RecordMic: Calling finishRecording() in recordstop... SurferID:", this.recordSurferInstanceId, "RecorderID:", this.mp3Recorder ? this.mp3Recorder.instanceId : "N/A");
            this.mp3Recorder.finishRecording();
            console.log("RecordMic: Called finishRecording() in recordstop. SurferID:", this.recordSurferInstanceId, "RecorderID:", this.mp3Recorder ? this.mp3Recorder.instanceId : "N/A");
        }
    }

    // Add any additional methods needed for recording functionality
}
