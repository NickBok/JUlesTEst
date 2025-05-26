class VtVUmeterWorklet extends AudioWorkletNode {
    constructor (context, updateIntervalInMS) {
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
    checkClipping () {
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
    draw () {
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
