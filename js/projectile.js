const PROJECTILE_SPEED        = toFixed(350); // should be faster than player
const PROJECTILE_WIDTH        = 30;
const PROJECTILE_HEIGHT       = 27;
const PROJECTILE_STATE_IDLE   = 0;
const PROJECTILE_STATE_MOVING = 1;
const PROJECTILE_STATE_DEAD   = 2;

class Projectile {
  constructor({x, y, vy=-toFixed(300), state=PROJECTILE_STATE_IDLE, dir=DIR_LEFT, speed=PROJECTILE_SPEED, inactiveFrames=0}) {
    this.x = x;
    this.y = y;
    this.vy = vy;
    this.width = PROJECTILE_WIDTH;
    this.height = PROJECTILE_HEIGHT;
    this.speed = speed;
    this.dir = dir;
    this.state = state;
    this.inactiveFrames = inactiveFrames;
  }

  update(dt, state) {
    const blockBelow = this.updateVertical(dt, state.blocks);
    this.updateHorizontal(dt, state.blocks, blockBelow);
    this.updateState(dt);
  }

  updateVertical(dt, blocks) {
    this.vy += mulFixed(dt, GRAVITY);
    this.y += mulFixed(this.vy, dt);
    let collidedBlock = null;
    for (let block of blocks) {
      if (collision(this, block)) {
        setOnTop(this, block);
        this.vy = 0;
        collidedBlock = block;
        break;
      }
    }

    return collidedBlock;
  }

  updateHorizontal(dt, blocks, blockBelow) {
    if (this.state != PROJECTILE_STATE_IDLE) {
      this.x += this.dir == DIR_LEFT ? -mulFixed(dt, this.speed) : mulFixed(dt, this.speed);
      for (let block of blocks) {
        if (collision(this, block)) {
          if (this.dir == DIR_LEFT) {
            setToRight(this, block);
          }
          else {
            setToLeft(this, block);
          }
        }
      }
    }
    const wrappedAround = wrapAroundScreen(this, SCREEN_WIDTH);
    if (wrappedAround && blockBelow && blockBelow.name == BLOCK_NAME_GROUND) {
      this.state = PROJECTILE_STATE_DEAD;
    }
  }

  updateState(dt) {
    if (this.inactiveFrames > 0) {
      --this.inactiveFrames;
    }
  }

  activate(dir=DIR_LEFT) {
    if (this.state == PROJECTILE_STATE_IDLE) {
      this.dir = dir;
      this.state = PROJECTILE_STATE_MOVING;
      // When a player activates the projectile they will already be colliding
      // with it so we don't want to immediately trigger hurting the player so
      // wait a few frames before registering projectile collisions
      this.inactiveFrames = 10;
    }
  }

  canHurt() {
    return this.state == PROJECTILE_STATE_MOVING && this.inactiveFrames <= 0;
  }

  dead() {
    return this.state == PROJECTILE_STATE_DEAD;
  }

  active() {
    return this.state == PROJECTILE_STATE_MOVING;
  }

  clone() {
    return new Projectile(this);
  }
}