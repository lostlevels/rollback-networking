const ENEMY_STATE_WALKING = 0;
const ENEMY_STATE_HURT    = 1;
const ENEMY_STATE_DYING   = 2;
const ENEMY_STATE_DEAD    = 3;
const ENEMY_WIDTH         = 80;
const ENEMY_HEIGHT        = 62;

class Enemy {
  constructor({x, y, dir, speed, alternate=false, vy=0, state=ENEMY_STATE_WALKING}) {
    this.x = x;
    this.y = y;
    this.dir = dir;
    this.speed = speed;
    this.vy = vy;
    this.alternate = alternate;
    this.width = ENEMY_WIDTH;
    this.height = ENEMY_HEIGHT;
    this.state = state;
  }

  update(dt, state) {
    this.updateHorizontal(dt, state);
    const blockBelow = this.updateVertical(dt, state);
    this.updateState(dt, state, blockBelow);
    this.checkProjectileCollisions(state.projectiles);
  }

  updateHorizontal(dt, state) {
    if (this.shouldMoveHorizontally()) {
      if (this.dir == DIR_LEFT) {
        this.x -= mulFixed(this.speed, dt);
      }
      else {
        this.x += mulFixed(this.speed, dt);
      }
    }
  }

  updateVertical(dt, state) {
    this.vy += mulFixed(GRAVITY, dt);
    this.y += mulFixed(this.vy, dt);
    let blockBelow = null;
    if (!this.dying()) {
      for (let block of state.blocks) {
        if (collision(this, block)) {
          setOnTop(this, block);
          blockBelow = block;

          if (block.state == BLOCK_STATE_FLIPPING && this.vy >= 0) {
            this.flip();
          }
          else {
            this.vy = 0;
          }
          break;
        }
      }
    }
    return blockBelow;
  }

  updateState(dt, state, blockBelow) {
    if (this.dying() && this.y >= toFixed(SCREEN_HEIGHT)) {
      this.state = ENEMY_STATE_DEAD;
      this.vy = 0;
    }
    if (this.y >= toFixed(SCREEN_HEIGHT + this.width)) {
      this.state = ENEMY_STATE_DEAD;
    }

    // If wrapped around on ground floor block, kill enemy
    const wrappedAround = wrapAroundScreen(this, SCREEN_WIDTH);
    if (wrappedAround && blockBelow && blockBelow.name == BLOCK_NAME_GROUND) {
      this.state = ENEMY_STATE_DEAD;
    }
  }

  checkProjectileCollisions(projectiles) {
    if (this.dying())
      return;
    for (let projectile of projectiles) {
      if (projectile.canHurt() && collision(this, projectile)) {
        this.kill(projectile.dir);
        break;
      }
    }
  }

  flip() {
    this.state = this.state == ENEMY_STATE_HURT ? ENEMY_STATE_WALKING : ENEMY_STATE_HURT;
    this.vy = -toFixed(300);
  }

  dying() {
    return this.state == ENEMY_STATE_DEAD || this.state == ENEMY_STATE_DYING;
  }

  dead() {
    return this.state == ENEMY_STATE_DEAD;
  }

  kill(dir=DIR_LEFT) {
    if (!this.dying()) {
      this.dir = dir;
      this.state = ENEMY_STATE_DYING;
      this.vy = -toFixed(300);
    }
  }

  shouldMoveHorizontally() {
    return this.dying() || (this.state == ENEMY_STATE_WALKING && this.vy >= 0);
  }

  clone() {
    return new Enemy(this);
  }
}