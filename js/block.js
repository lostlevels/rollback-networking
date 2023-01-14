const BLOCK_STATE_IDLE     = 0;
const BLOCK_STATE_FLIPPING = 1;
const BLOCK_WIDTH          = 48;
const BLOCK_HEIGHT         = 48;
const BLOCK_NAME_REGULAR   = 'block';
const BLOCK_NAME_GROUND    = 'ground';

class Block {
  constructor({x, y, name=BLOCK_NAME_REGULAR, width=BLOCK_WIDTH, height=BLOCK_HEIGHT, startY=0, vy=0, state=BLOCK_STATE_IDLE}) {
    this.x = x;
    this.y = y;
    if (!startY) {
      startY = y;
    }
    this.name = name;
    this.startY = startY;
    this.vy = vy;
    this.width = width;
    this.height = height;
    this.state = state;
  }

  update(dt) {
    if (this.state == BLOCK_STATE_FLIPPING) {
      this.vy += mulFixed(GRAVITY, dt);
      this.y += mulFixed(this.vy, dt);
      if (this.y >= this.startY) {
        this.y = this.startY;
        this.vy = 0;
        this.state = BLOCK_STATE_IDLE;
      }
    }
  }

  hit() {
    if (this.state != BLOCK_STATE_IDLE)
      return;
    this.state = BLOCK_STATE_FLIPPING;
    this.vy = -toFixed(200);
  }

  clone() {
    return new Block(this);
  }
}