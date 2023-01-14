// World manages a history of GameState to provide a game simulation. It can
// rewind a game from a certain point in the past as needed for rollback
// networking.
class World {
  constructor(initialGameState) {
    this.frame = 0;
    this.states = {};

    this.playerInputsToApply = [];
    this.remoteInputsToApply = [];
    this.inputsToSend = [];

    this.playerInputs = {};
    this.remoteInputs = {};

    this.initialState = initialGameState;
    this.states[this.frame] = this.initialState.clone(this.frame);
  }

  update(dt, input) {
    this.advanceFrame(input);
    this.applyLocalInput(dt);
    this.applyRemoteInput(dt);
    this.deleteOldStates();
  }

  state(framesBack=0) {
    return this.states[this.frame - framesBack] || this.states[this.frame];
  }

  advanceFrame(input) {
    if (this.frame <= 60) {
      input = BLANK_INPUT;
    }
    input = Object.assign({}, input);
    const prevFrame = this.frame;
    const newFrame = ++this.frame;
    const state = this.states[prevFrame].clone(newFrame)
    this.states[newFrame] = state;

    const inputWrapper = {
      frame: newFrame + INPUT_DELAY,
      input: Object.assign({}, input),
    };
    this.inputsToSend.push(inputWrapper);
    this.playerInputsToApply.push(inputWrapper.frame);
    this.playerInputs[inputWrapper.frame] = input;
  }

  applyLocalInput(dt) {
    if (this.playerInputsToApply.length && this.states[this.playerInputsToApply[0]]) {
      const frame = this.playerInputsToApply.shift();
      const prevState = this.states[frame-1] || this.initialState;
      const state = prevState.clone(frame);
      state.update(dt, this.playerInputs[frame], this.remoteInputs[frame]);
      this.states[frame] = state;
    }
  }

  rewind(dt, startingFrame) {
    // this.frame currently points to the NEXT frame so loop until before it.
    // eh, while true we need to propagate state into next no?
    for (let frame = startingFrame; frame <= this.frame; frame++) {
      let prev = this.states[frame-1]
      if (!prev) {
        prev = this.initialState; // hmmm could also be out of bounds.
      }
      // Means not ticked yet for local player - shouldn't happen?
      if (!this.states[frame]) {
        continue;
      }
      const state = prev.clone(frame);
      state.update(dt, this.playerInputs[frame], this.remoteInputs[frame]);
      this.states[frame] = state;
    }
  }

  addRemoteInputs(packets, droppedInputFrames) {
    this.remoteInputsToApply = this.remoteInputsToApply.concat(packets);
    const droppedFrames = Object.keys(droppedInputFrames).map(frameStr => +frameStr);

    // Replace local inputs with the BLANK_INPUT if it remote peer did not receive
    // input for a given frame.
    for (let droppedFrame of droppedFrames) {
      this.playerInputs[droppedFrame] = BLANK_INPUT;
    }

    if (droppedFrames.length) {
      const earliestFrame = droppedFrames.slice(1).reduce((accum, frame) => Math.min(accum, frame), droppedFrames[0]);
      this.rewind(DT, earliestFrame);
    }
  }

  applyRemoteInput(dt) {
    const numInputsToApply = this.remoteInputsToApply.length > INPUT_BUFFER_SIZE ? this.remoteInputsToApply.length - INPUT_BUFFER_SIZE : 1;
    for (let i = 0; i < Math.min(numInputsToApply, this.remoteInputsToApply.length); i++) {
      const remoteInput = this.remoteInputsToApply[0];
      if (this.states[remoteInput.frame]) {
        this.remoteInputsToApply.shift();
        this.remoteInputs[remoteInput.frame] = remoteInput.input;
        this.rewind(dt, remoteInput.frame);
      }
      else {
        break;
      }
    }
  }

  deleteOldStates() {
    // Don't want too many states to buffer up in memory. Only enough to
    // rewind.
    const maxHistorySeconds = 5;
    const maxHistoryFrames = maxHistorySeconds * SIMULATION_FRAME_RATE;
    for (let frame = this.frame - maxHistoryFrames*2; frame < this.frame - maxHistoryFrames; frame++) {
      if (this.states[frame]) {
        delete this.states[frame];
      }
      if (this.playerInputs[frame]) {
        delete this.playerInputs[frame];
      }
      if (this.remoteInputs[frame]) {
        delete this.remoteInputs[frame];
      }
    }
  }
}
