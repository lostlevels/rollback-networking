const GRAVITY               = toFixed(1600);
const INPUT_DELAY           = 4;
const INPUT_BUFFER_SIZE     = 8;
const SCREEN_WIDTH          = 768;
const SCREEN_HEIGHT         = 720;
const ANIMATION_FPS         = 10;
const SIMULATION_FRAME_RATE = 60;
const DT                    = toFixed(1/SIMULATION_FRAME_RATE);
const DIR_LEFT              = 0;
const DIR_RIGHT             = 1;
const PACKET_SEND_RATE      = 30; // number of packets to send per second.


const BLANK_INPUT = {
  left: 0,
  right: 0,
  action:0,
};
