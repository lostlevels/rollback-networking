class GameScene extends Phaser.Scene {
  constructor({onGameStarted, onHosted, remoteHostId}) {
    super('GameScene');

    // Fixed point accumulated time for fixed time step.
    this.accumulatedTime = 0;
    this.lastTime = 0;

    // sprites / views
    this.blocks = [];
    this.enemies = [];
    this.player = null;
    this.playerMirror = null;
    this.remote = null;
    this.remoteMirror = null;

    // inputs
    this.leftInputs = [];
    this.rightInputs = [];
    this.actionInputs = [];

    // models / state
    this.playerId = '';
    this.remoteId = '';
    this.world = null;

    const onRemoteData = (data, droppedFrames) => {
      if (Array.isArray(data) && this.world) {
        this.world.addRemoteInputs(data, droppedFrames);
      }
    };

    const onRemoteJoined = (remoteId) => {
      this.remoteId = remoteId;
      this.createWorld();
      if (onGameStarted) {
        onGameStarted();
      }
    };

    const onRemoteClosed = () => {
      delete this.world;
      window.alert('Peer has left.');
    };

    const onConnectedToRemote = () => {
      this.createWorld();
      if (onGameStarted) {
        onGameStarted();
      }
    };

    const onIdCreated = (id) => {
      this.playerId = id;
      if (remoteHostId) {
        this.remoteId = remoteHostId;
        this.connection.connect(remoteHostId, onConnectedToRemote);
      }
      else if (onHosted) {
        onHosted(id);
      }
    };

    this.connection = new ConnectionHandler({
      onIdCreated,
      onRemoteData,
      onRemoteJoined,
      onRemoteClosed,
    });
  }

  createWorld() {
    this.world = new World(createInitialGameState({playerId: this.playerId, remoteId: this.remoteId}));
  }

  preload() {
    this.load.image('sky-scroll-further', 'assets/sky-scroll-further.png');
    this.load.image('sky-scroll-closer', 'assets/sky-scroll-closer.png');
    this.load.image('sky-scroll-furthest', 'assets/sky-scroll-furthest.png');
    this.load.image('fg-top', 'assets/fg-top.png');
    this.load.image('fg-top', 'assets/fg-top.png');
    this.load.image('fg-bottom', 'assets/fg-bottom.png');
    this.load.image('bg-hills', 'assets/bg-hills.png');
    this.load.image('block', 'assets/block.png');
    this.load.spritesheet('enemy', 'assets/enemy.png', { frameWidth: 80, frameHeight: 62 });
    this.load.image('background', 'assets/background.png');
    this.load.spritesheet('player', 'assets/player.png', { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('player-remote', 'assets/player-remote.png', { frameWidth: 64, frameHeight: 64 });
  }

  create() {
    this.add.image(0, 0, 'bg-hills').setOrigin(0, 0);
    this.scrollingSkyFurthest = this.add.tileSprite(0, 0, SCREEN_WIDTH, 398, 'sky-scroll-furthest').setOrigin(0, 0);
    this.scrollingSkyFurther = this.add.tileSprite(0, 0, SCREEN_WIDTH, 220, 'sky-scroll-further').setOrigin(0, 0);
    this.scrollingSkyCloser = this.add.tileSprite(0, 0, SCREEN_WIDTH, 220, 'sky-scroll-closer').setOrigin(0, 0);

    this.player = this.add.sprite(SCREEN_WIDTH, SCREEN_HEIGHT, 'player').setOrigin(0, 0);
    this.playerMirror = this.add.sprite(SCREEN_WIDTH, SCREEN_HEIGHT, 'player').setOrigin(0, 0);
    this.remote = this.add.sprite(SCREEN_WIDTH, SCREEN_HEIGHT, 'player-remote').setOrigin(0, 0);
    this.remoteMirror = this.add.sprite(SCREEN_WIDTH, SCREEN_HEIGHT, 'player-remote').setOrigin(0, 0);

    // arbritrary limit on number of visible blocks and enemies.
    const maxVisibleBlocks = 64;
    for (let i = 0; i < maxVisibleBlocks; i++) {
      this.blocks.push(this.add.image(SCREEN_WIDTH, SCREEN_HEIGHT, 'block').setOrigin(0, 0));
    }
    const maxVisibleEnemies = 64;
    for (let i = 0; i < maxVisibleEnemies; i++) {
      this.enemies.push(this.add.sprite(SCREEN_WIDTH, SCREEN_HEIGHT, 'enemy').setOrigin(0, 0));
    }

    this.add.image(0, 0, 'fg-top').setOrigin(0, 0);
    this.add.image(0, SCREEN_HEIGHT, 'fg-bottom').setOrigin(0, 1);

    this.leftInputs = [this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),  this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT)];
    this.rightInputs = [this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D), this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT)];
    this.actionInputs = [this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE), this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z)];

    const playerStyle = { font: 'bold 16pt Trebuchet MS', fill: 'white', align: 'left' };
    this.playerText = this.add.text(4, SCREEN_HEIGHT-4, 'Score: 0', playerStyle).setOrigin(0, 1);
    const remoteStyle = { font: 'bold 16pt Trebuchet MS', fill: 'white', align: 'right' };
    this.remoteText = this.add.text(SCREEN_WIDTH-4, SCREEN_HEIGHT-4, 'Score: 0', remoteStyle).setOrigin(1, 1);
  }

  update(timestep, dt) {
    if (!this.world)
      return;

    if (!this.lastTime) {
      this.lastTime = timestep;
    }
    // The passed in dt does some smoothing that makes it not the actual delta
    // since the last frame so rely on the timestep difference instead.
    const delta = timestep - this.lastTime;
    this.lastTime = timestep;
    this.updateSimulation(delta, this.pollInput());

    this.updateNetwork();
    this.updateViews(delta);
  }

  updateNetwork() {
    if (this.world.inputsToSend.length >= ~~(60/PACKET_SEND_RATE)) {
      if (this.connection) {
        this.connection.sendWithAcks(this.world.inputsToSend);
      }
      this.world.inputsToSend = [];
    }
  }

  pollInput() {
    return {
      left: this.leftInputs.some(key => key.isDown),
      right: this.rightInputs.some(key => key.isDown),
      action: this.actionInputs.some(key => key.isDown),
    };
  }

  updateSimulation(dt, input) {
    this.accumulatedTime += toFixed(dt/1000);
    while (this.accumulatedTime >= DT) {
      this.world.update(DT, input);
      this.accumulatedTime -= DT;
    }
  }

  updateViews(dt) {
    const framesBack = 2; // Render in the past a bit for a smoother appearance.
    const state = this.world.state(framesBack);
    setSpriteFromPlayer(this.player, this.playerMirror, state.player);
    setSpriteFromPlayer(this.remote, this.remoteMirror, state.remote);
    this.playerText.setText(`Your score: ${state.player.score}`);
    this.remoteText.setText(`Remote score: ${state.remote.score}`);

    for (let i = 0; i < Math.min(state.blocks.length, this.blocks.length); i++) {
      this.blocks[i].x = fromFixed(state.blocks[i].x);
      this.blocks[i].y = fromFixed(state.blocks[i].y);
    }

    let enemyModels = state.enemies;
    for (let i = 0; i < Math.min(enemyModels.length, this.enemies.length); i++) {
      const sprite = this.enemies[i];
      const model = enemyModels[i];
      setSpriteFromEnemy(sprite, model);
    }
    // hide the rest
    for (let i = Math.min(enemyModels.length, this.enemies.length); i < this.enemies.length; i++) {
      this.enemies[i].visible = false;
    }

    this.scrollingSkyCloser.tilePositionX -= dt/1000 * 100;
    this.scrollingSkyFurther.tilePositionX -= dt/1000 * 50;
    this.scrollingSkyFurthest.tilePositionX -= dt/1000 * 25;
  }
}

function setSpriteFromPlayer(sprite, spriteMirror, player) {
  const animations = {
    [PLAYER_STATE_RUNNING]: [0, 1],
    [PLAYER_STATE_IDLE]: [0],
    [PLAYER_STATE_HURT]: [3],
  };
  sprite.x = fromFixed(player.x);
  sprite.y = spriteMirror.y = fromFixed(player.y);
  const hurtVisibleToggle = player.state == PLAYER_STATE_HURT ? (Date.now() % 200) > 100 : true;
  sprite.visible = hurtVisibleToggle;
  if (sprite.x < 0) {
    spriteMirror.x = SCREEN_WIDTH + sprite.x;
    spriteMirror.visible = hurtVisibleToggle;
  }
  else if (sprite.x > SCREEN_WIDTH - sprite.width) {
    spriteMirror.x = sprite.x - SCREEN_WIDTH;
    spriteMirror.visible = hurtVisibleToggle;
  }
  else {
    spriteMirror.visible = false;
  }
  sprite.flipX = spriteMirror.flipX = player.dir == DIR_LEFT;
  const anims = animations[player.state];
  const millisPerFrame = Math.ceil(1000/ANIMATION_FPS);
  const millisDuration = millisPerFrame * anims.length
  const frame = anims[ ~~((Date.now() % millisDuration) / millisPerFrame) % anims.length];
  sprite.setFrame(frame);
  spriteMirror.setFrame(frame);
}

function setSpriteFromEnemy(sprite, enemy) {
  const walkAnims = enemy.alternate ? [2, 3] : [0, 1];
  const hurtAnims = enemy.alternate ? [6, 7] : [4, 5];
  const anims = enemy.state == ENEMY_STATE_WALKING ? walkAnims : hurtAnims;
  const millisPerFrame = Math.ceil(1000/ANIMATION_FPS);
  const millisDuration = millisPerFrame * anims.length
  const frame = anims[ ~~((Date.now() % millisDuration) / millisPerFrame) % anims.length];
  sprite.x = fromFixed(enemy.x);
  sprite.y = fromFixed(enemy.y);
  sprite.flipX = enemy.dir == DIR_LEFT;
  sprite.setFrame(frame);
  sprite.visible = true;
}
