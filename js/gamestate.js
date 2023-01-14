class GameState {
  constructor(frame, {player, remote, blocks, enemies, spawner}) {
    this.frame = frame;
    this.player = player.clone();
    this.remote = remote.clone();
    this.blocks = blocks.map(x => x.clone());
    this.enemies = enemies.map(x => x.clone());
    this.spawner = spawner.clone();
  }

  update(dt, playerInput, remoteInput) {
    const rand = new MersenneTwister(this.frame);

    // Must be deterministic so the order of player doing an action must
    // be same for both players. This can be more "fair" by using a random or
    // alternating the players but for simplicity the smaller id person
    // will always go first.
    if (this.player.id < this.remote.id) {
      this.player.update(dt, playerInput, this);
      this.remote.update(dt, remoteInput, this);
    }
    else {
      this.remote.update(dt, remoteInput, this);
      this.player.update(dt, playerInput, this);
    }

    let createdEnemies = this.spawner.update(dt, rand, this.frame);
    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      enemy.update(dt, this);
      if (enemy.dead()) {
        this.enemies.splice(i, 1);
        i--;
      }
    }
    for (let block of this.blocks) {
      block.update(dt);
    }
    this.enemies = this.enemies.concat(createdEnemies);
  }

  clone(newFrame) {
    return new GameState(newFrame || this.frame, this);
  }
}