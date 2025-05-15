
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

	function Record() {
	  function _class() {
	    _classCallCheck(this, _class);

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
	    // whether a user is scrolling the waveform
	    this.isScrolling = false;

	    this.fadeType = 'logarithmic';
	    this.masterGain = 1;
	    this.annotations = [];
	    this.durationFormat = 'hh:mm:ss.uuu';
	    this.isAutomaticScroll = false;
	    this.resetDrawTimer = undefined;
	  }

	  // TODO extract into a plugin


	  _createClass(_class, [{
	    key: 'initExporter',
	    value: function initExporter() {
	      this.exportWorker = new _inlineWorker2.default(_exportWavWorker2.default);
	    }

	    // TODO extract into a plugin

	  }, {
		  key: 'initRecorder',
		  value: function initRecorder(stream, compressionChk, eqChk, eq1, eq2, eq3, eq4, eq5) {
			  var _this = this;

			  //if(globalAudioContext.state != "running"){return;}

			  //   var audioContext = new AudioContext();

			  if (this.gainNode != null) {
				  this.gainNode.disconnect();
				  //audiosource.stop();
				  //input.stop;
				  //compressor.stop;
			  } ///WP goLive 8/22

			  var audioContext = globalAudioContext;
			  var input = audioContext.createMediaStreamSource(stream);
			  this.gainNode = audioContext.createGain();
			  this.gainNode.connect(sampleMixer); //wp changed
			  input.connect(this.gainNode);

			  ///removed WP
			  // audioMeter = createAudioMeter(audioContext);
			  //input.connect(audioMeter);
			  //this.ee.emit("audiometer", audioMeter);

			  var compressor = audioContext.createDynamicsCompressor();

			  ///added WP 12/22
			  //compressor.threshold.setValueAtTime(-15, audioContext.currentTime);
			  //compressor.knee.setValueAtTime(10, audioContext.currentTime);``
			  //compressor.attack.setValueAtTime(0.07, audioContext.currentTime);
			  //compressor.release.setValueAtTime(0.14, audioContext.currentTime);
			  //compressor.ratio.setValueAtTime(12, audioContext.currentTime);
			  //WP 12/22

			  this.gainNode.connect(compressor);

			  var destination1 = this.gainNode;
			  if (compressionChk == true)
				  destination1 = compressor;

			  this.eqsetting1 = audioContext.createBiquadFilter();
			  this.eqsetting1.type = "lowshelf";
			  this.eqsetting1.frequency.value = 80;
			  this.eqsetting1.gain.value = eq1;//range.value;
			  destination1.connect(this.eqsetting1);

			  this.eqsetting2 = audioContext.createBiquadFilter();
			  this.eqsetting2.type = "lowshelf";
			  this.eqsetting2.frequency.value = 800;
			  this.eqsetting2.gain.value = eq2;//range.value;
			  this.eqsetting1.connect(this.eqsetting2);

			  this.eqsetting3 = audioContext.createBiquadFilter();
			  this.eqsetting3.type = "lowshelf";
			  this.eqsetting3.frequency.value = 2000;
			  this.eqsetting3.gain.value = eq3;//range.value;
			  this.eqsetting2.connect(this.eqsetting3);

			  this.eqsetting4 = audioContext.createBiquadFilter();
			  this.eqsetting4.type = "lowshelf";
			  this.eqsetting4.frequency.value = 5000;
			  this.eqsetting4.gain.value = eq4;//range.value;
			  this.eqsetting3.connect(this.eqsetting4);

			  this.eqsetting5 = audioContext.createBiquadFilter();
			  this.eqsetting5.type = "lowshelf";
			  this.eqsetting5.frequency.value = 10000;
			  this.eqsetting5.gain.value = eq5;//range.value;
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
				  class VtVUmeterWorklet extends AudioWorkletNode {
					  constructor(context, updateIntervalInMS) {
						  super(context, 'vumeter-worklet-processor', {
							  numberOfInputs: 1,
							  numberOfOutputs: 0,
							  channelCount: 1,
							  processorOptions: {
								  updateIntervalInMS: updateIntervalInMS || 16.67
							  }
						  })
						  this.clipping = false
						  this.lastClip = 0
						  this.clipLevel = 0.8
						  this.clipLag = 50
						  this._updateIntervalInMS = updateIntervalInMS
						  this._volume = 0
						  this.port.onmessage = event => {
							  if (event.data.volume)
								  this._volume = event.data.volume
						  }
						  this.port.start()
					  }

					  checkClipping() {
						  if (this._volume >= this.clipLevel) {
							  this.clipping = true
							  this.lastClip = window.performance.now()
						  }

						  if (!this.clipping)
							  return false
						  if ((this.lastClip + this.clipLag) < window.performance.now())
							  this.clipping = false
						  return this.clipping
					  }

					  draw() {
						  if (recordstate != "recording") return
						  canvasContext.clearRect(0, 0, meterW * 1.6, 200/*meterH*/)
						  if (this.checkClipping()) {
							  canvasContext.fillStyle = "OrangeRed" ///05/10/23
						  } else {
							  canvasContext.fillStyle = "GreenYellow"
						  }
						  canvasContext.fillRect(0, 0, this._volume * meterW * 1.6 /*5*/, 200/*meterH*/)
					  }
				  }

				  globalAudioContext.audioWorklet.addModule('vumeter-worklet-processor.js').then(() => {
					  const vtVUmeterWorklet = new VtVUmeterWorklet(globalAudioContext)
					  mixedAudioSource.connect(vtVUmeterWorklet);

					  function drawMeter() {
						  vtVUmeterWorklet.draw()
						  requestAnimationFrame(drawMeter)
					  }

					  drawMeter()
				  })
			  } else {
				  // moved WP
				  var audioMeter = createAudioMeter(audioContext)
				  mixedAudioSource.connect(audioMeter)
				  this.ee.emit("audiometer", audioMeter)
			  }

			  this.mp3Recorder = new WebAudioRecorder(mixedAudioSource/*this.gainNode*/, {
				  workerDir: "./",
				  encoding: "mp3",
				  numChannels: 2,
				  onEncoderLoading: function (recorder, encoding) {
				  },
				  onEncoderLoaded: function (recorder, encoding) {
				  }
			  });


			  this.mp3Recorder.onComplete = function (recorder, mp3blob) {
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

				  var loader = _LoaderFactory2.default.createLoader(mp3blob, _this.ac);
				  loader.load().then(function (audioBuffer) {
					  // ask web worker for peaks.
					  // console.log("in recording data available", _this, audioBuffer, audioBuffer.getChannelData(0));
					  _this.recorderWorker.postMessage({
						  samples: audioBuffer.getChannelData(0),
						  // samplesPerPixel: _this.samplesPerPixel
						  canvasWidth: _this.waveWidth
					  });
					  _this.recordingTrack.setCues(0, audioBuffer.duration);
					  _this.recordingTrack.setBuffer(audioBuffer);
					  _this.recordingTrack.setPlayout(new _Playout2.default(_this.ac, audioBuffer));
					  _this.adjustDuration();
				  });
			  }

			  this.recorderWorker = new _inlineWorker2.default(_recorderWorker2.default);
			  // use a worker for calculating recording peaks.
			  this.recorderWorker.onmessage = function (e) {
				  // console.log("setPeaks111", e);

				  _this.recordingTrack.setPeaks(e.data);
				  _this.samplesPerPixel = e.data.samplesPerPixel;
				  // console.log("on stop onmessage", _this, e.data.samplesPerPixel);
				  // _this.working = false;
				  _this.drawRequest();
			  }
		  }
	  }])
	}
