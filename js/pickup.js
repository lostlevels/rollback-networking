const PICKUP_WIDTH  = 32;
const PICKUP_HEIGHT = 32;
const PICKUP_SPEED  = toFixed(100);
const PICKUP_STATE_ACTIVE = 0;
const PICKUP_STATE_DEAD   = 1;

class Pickup {
  constructor({x, y, dir=DIR_LEFT, vy=toFixed(-400), speed=PICKUP_SPEED, bouncesLeft=4, state=PICKUP_STATE_ACTIVE}) {
    this.x = x;
    this.y = y;
    this.vy = vy;
    this.bouncesLeft = bouncesLeft;
    this.speed = speed;
    this.width = PICKUP_WIDTH;
    this.height = PICKUP_HEIGHT;
    this.dir = dir;
    this.state = state;
  }

  update(dt, state) {
    this.updateHorizontal(dt, state.blocks);
    this.updateVertical(dt, state.blocks);
  }


  updateHorizontal(dt, blocks) {
    if (this.bouncesLeft >= 0) {
      this.x += this.dir == DIR_LEFT ? -mulFixed(dt, this.speed) : mulFixed(dt, this.speed);
    }
  }

  updateVertical(dt, blocks) {
    this.vy += mulFixed(dt, GRAVITY);
    this.y += mulFixed(this.vy, dt);
    for (let block of blocks) {
      if (collision(this, block)) {
        setOnTop(this, block);
        if (--this.bouncesLeft > 0) {
          this.vy = toFixed(-100 * this.bouncesLeft);
        }
        else {
          this.vy = 0;
        }
      }
    }

    // No wraparound for pickups
    if (this.x < toFixed(this.width) || this.x > toFixed(SCREEN_WIDTH)) {
      this.kill();
    }
  }

  kill() {
    if (this.state != PICKUP_STATE_DEAD) {
      this.state = PICKUP_STATE_DEAD;
      return true;
    }
    return false
  }

  dead() {
    return this.state == PICKUP_STATE_DEAD;
  }

  clone() {
    return new Pickup(this);
  }
}

function createRandPickup(x, y, rand) {
  const dir = ~~(rand.random() * 100) <= 50 ? DIR_LEFT : DIR_RIGHT;
  const speed = toFixed(50 + ~~(rand.random() * 100));
  const vy = -toFixed(250 + ~~(rand.random() * 350));
  return new Pickup({x, y, dir, speed, vy});
}