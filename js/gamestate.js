class GameState {
  constructor(frame, {player, remote, blocks, enemies, pickups, projectiles, spawner}) {
    this.frame = frame;
    this.player = player.clone();
    this.remote = remote.clone();
    this.blocks = blocks.map(x => x.clone());
    this.enemies = enemies.map(x => x.clone());
    this.pickups = pickups.map(x => x.clone());
    this.projectiles = projectiles.map(x => x.clone());
    this.spawner = spawner.clone();
  }

  update(dt, playerInput, remoteInput) {
    let rand = new MersenneTwister(this.frame);

    // Must be deterministic so the order of player doing an action must
    // be same for both players. This can be more "fair" by using a random or
    // alternating the players but for simplicity the smaller id person
    // will always go first.
    let firstPlayer = this.player
      , secondPlayer = this.remote
      , firstInput = playerInput
      , secondInput = remoteInput

    if (this.player.id > this.remote.id) {
      firstPlayer = this.remote;
      secondPlayer = this.player;
      firstInput = remoteInput;
      secondInput = playerInput;
    }

    const firstObjects = firstPlayer.update(dt, firstInput, this) || {};
    const secondObjects = secondPlayer.update(dt, secondInput, this) || {};

    const createdProjectiles = (firstObjects.projectiles || []).concat(secondObjects.projectiles || []);
    const createdPickups = (firstObjects.pickups || []).concat(secondObjects.pickups || []);

    const {createdEnemies} = this.spawner.update(dt, rand, this.frame);
    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      enemy.update(dt, this);
      if (enemy.dead()) {
        this.enemies.splice(i, 1);
        i--;
      }
    }
    for (let i = 0; i < this.pickups.length; i++) {
      const pickup = this.pickups[i];
      pickup.update(dt, this);
      if (pickup.dead()) {
        this.pickups.splice(i, 1);
        i--;
      }
    }
    for (let i = 0; i < this.projectiles.length; i++) {
      const projectile = this.projectiles[i];
      projectile.update(dt, this);
      if (projectile.dead()) {
        this.projectiles.splice(i, 1);
        i--;
      }
    }

    // Randomly make a block a question block every so often
    rand = new MersenneTwister(this.frame);
    if (this.frame > 60 && (this.frame % 120) == 0 && ~~(rand.random() * 100) <= 50 && this.blocks.length) {
      this.blocks[~~(rand.random() * this.blocks.length)].changeToQuestionBlock();
    }
    for (let block of this.blocks) {
      block.update(dt);
    }

    this.enemies = this.enemies.concat(createdEnemies);
    this.pickups = this.pickups.concat(createdPickups);
    this.projectiles = this.projectiles.concat(createdProjectiles);
  }

  clone(newFrame) {
    return new GameState(newFrame || this.frame, this);
  }
}