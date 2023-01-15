const JUMP_IMPULSE                = -toFixed(750);
const PLAYER_STATE_IDLE           = 0;
const PLAYER_STATE_RUNNING        = 1;
const PLAYER_STATE_HURT           = 2;
const PLAYER_HURT_DURATION_FRAMES = 60;
const PLAYER_SPEED                = toFixed(350);
const PLAYER_WIDTH                = 64;
const PLAYER_HEIGHT               = 64;

class Player {
  constructor({id, x, y, vy=0, score=0, state=PLAYER_STATE_IDLE, dir=DIR_LEFT, hurtFramesLeft=0, speed=PLAYER_SPEED}) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.vy = vy;
    this.width = PLAYER_WIDTH;
    this.height = PLAYER_HEIGHT;
    this.speed = speed;
    this.state = state;
    this.dir = dir;
    this.score = score;
    this.hurtFramesLeft = hurtFramesLeft;
  }

  // input may be null if input hasn't arrived yet from remote player.
  update(dt, input, state) {
    this.updateHorizontal(dt, input, state);
    const canJump = this.updateVertical(dt, input, state);
    this.checkEnemyCollisions(state.enemies, input);
    this.updateJump(input, canJump);
    this.updateState(input);
  }

  updateState(input) {
    if (this.hurtFramesLeft > 0) {
      if (--this.hurtFramesLeft <= 0) {
        this.state = PLAYER_STATE_IDLE;
      }
    }

    wrapAroundScreen(this, SCREEN_WIDTH);

    if (this.canMove() && input && this.vy >= 0 && !input.left && !input.right) {
      this.state = PLAYER_STATE_IDLE;
    }
  }

  updateHorizontal(dt, input, state) {
    if (input && input.left && this.canMove()) {
      this.x -= mulFixed(this.speed, dt);
      for (let block of state.blocks) {
        if (collision(this, block)) {
          setToRight(this, block);
        }
      }
      this.state = PLAYER_STATE_RUNNING;
      this.dir = DIR_LEFT;
    }
    if (input && input.right && this.canMove()) {
      this.x += mulFixed(this.speed, dt);
      for (let block of state.blocks) {
        if (collision(this, block)) {
          setToLeft(this, block);
        }
      }
      this.state = PLAYER_STATE_RUNNING;
      this.dir = DIR_RIGHT;
    }
  }

  checkEnemyCollisions(enemies, input) {
    for (let enemy of enemies) {
      if (collision(this, enemy)) {
        if (enemy.state == ENEMY_STATE_HURT && input && (input.left || input.right)) {
          enemy.kill(this.dir);
          this.score++;
        }
        else if (!enemy.dying()) {
          this.hurt();
          this.score = Math.max(0, this.score - 1);
        }
      }
    }
  }

  updateJump(input, canJump) {
    if (canJump && this.canMove() && input && input.action && this.vy >= 0) {
      this.vy = JUMP_IMPULSE;
    }
  }

  updateVertical(dt, input, state) {
    this.vy += mulFixed(GRAVITY, dt);
    this.y += mulFixed(this.vy, dt);
    let canJump = false;
    for (let block of state.blocks) {
      if (collision(this, block)) {
        if (this.vy >= 0 && above(this, block)) {
          setOnTop(this, block);
          this.vy = 0;
          canJump = true;
        }
        else {
          setOnBottom(this, block);
          block.hit();
          this.vy = 0;
        }
        break;
      }
    }
    return canJump;
  }

  hurt() {
    if (this.state != PLAYER_STATE_HURT) {
      this.state = PLAYER_STATE_HURT;
      this.hurtFramesLeft = PLAYER_HURT_DURATION_FRAMES;
      this.vy = -toFixed(200);
    }
  }

  canMove() {
    return this.state != PLAYER_STATE_HURT;
  }

  clone() {
    return new Player(this);
  }
}