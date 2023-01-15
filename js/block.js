const BLOCK_STATE_IDLE        = 0;
const BLOCK_STATE_FLIPPING    = 1;
const BLOCK_WIDTH             = 48;
const BLOCK_HEIGHT            = 48;
const BLOCK_NAME_REGULAR      = 'block';
const BLOCK_NAME_GROUND       = 'ground';
const BLOCK_TYPE_REGULAR      = 'regular';
const BLOCK_TYPE_QUESTION     = 'question';
const BLOCK_QUESTION_DURATION = 60*8; // how many frames does a block remain a question block before becoming a regular block.

class Block {
  constructor({x, y, width=BLOCK_WIDTH, height=BLOCK_HEIGHT, name=BLOCK_NAME_REGULAR, startY=0, vy=0, state=BLOCK_STATE_IDLE, type=BLOCK_TYPE_REGULAR, framesToNormal=0}) {
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
    // How long this block remains a question block before going back to a regular one.
    this.framesToNormal = framesToNormal;
    this.type = type;
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
    if (this.type == BLOCK_TYPE_QUESTION && this.framesToNormal > 0) {
      if (--this.framesToNormal <= 0) {
        this.type = BLOCK_NAME_REGULAR;
      }
    }
  }

  changeToQuestionBlock() {
    this.framesToNormal = BLOCK_QUESTION_DURATION;
    this.type = BLOCK_TYPE_QUESTION;
  }

  hit(frame) {
    if (this.state != BLOCK_STATE_IDLE)
      return;

    this.state = BLOCK_STATE_FLIPPING;
    this.vy = -toFixed(200);

    if (this.type == BLOCK_TYPE_QUESTION) {
      this.type = BLOCK_NAME_REGULAR;
      const rand = new MersenneTwister(frame);
      if (~~(rand.random() * 100) <= 50) {
        return {
          projectiles: [new Projectile({x: this.x + toFixed(this.width/2 - PROJECTILE_WIDTH/2), y: this.y - toFixed(PROJECTILE_HEIGHT)})],
        };
      }
      else {
        const pickupsToSpawn = 1 + ~~(rand.random() * 3);
        return {
          pickups: [...Array(pickupsToSpawn).keys()].map(_ => createRandPickup(this.x + toFixed(this.width/2 - PICKUP_HEIGHT/2), this.y - toFixed(PICKUP_HEIGHT), rand)),
        };
      }
    }
  }

  clone() {
    return new Block(this);
  }
}