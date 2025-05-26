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

    initRecorder(stream, compressionChk, eqChk, eq1, eq2, eq3, eq4, eq5) {
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


        this.mp3Recorder.onComplete = function(recorder, mp3blob) {
            // createDownloadLink(blob,recorder.encoding);
            // console.log("in record completed", mp3blob);

            if (_this.nextstart == undefined)
                return;

            mp3blob.arrayBuffer().then(buffer => {
                var mp3file = writeMp3Tag(buffer, _this.voicetrackname, _this.nextstart, _this.vtstart);
                _this.ee.emit('voicetrackblob', mp3file);
                // saveFile(tagblob, "record.mp3");
                // console.log("metadatawriter", mp3file);
            });

            var blb_content = new Blob([mp3file], {
                type: "audio"
            });
            let bUrl = URL.createObjectURL(blb_content)
            this.load(bUrl);
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
        if (this.mp3Recorder) {
            this.mp3Recorder.finishRecording();
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
            // if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            // 	this.mediaRecorder.stop();
            //   }
            this.waveWidth = document.getElementById("recordform").clientWidth; ///WP
            this.voicetrackname = voicetrackname;
            if (this.mp3Recorder) {
                this.mp3Recorder.finishRecording();
            }
        }

    // Add any additional methods needed for recording functionality
}
