class Spawner {
  constructor(level=1) {
    this.level = level;
  }

  update(dt, rand, frame) {
    let createdEnemies = [];
    // can make this configurable on current level, difficulty, score etc.
    if (frame >= 120 && frame % 300 == 0) {
      // Create enemy on left or right 50/50 chance
      const randomChance = ~~(rand.random() * 100);
      const alternateColor = (frame / 300) & 1 == 1;
      if (randomChance <= 50) {
        createdEnemies.push(new Enemy({x: toFixed(0), y: toFixed(80), dir: DIR_RIGHT, speed: toFixed(70), alternate: alternateColor}));
      }
      else {
        createdEnemies.push(new Enemy({x: toFixed(SCREEN_WIDTH-ENEMY_WIDTH), y: toFixed(80), dir: DIR_LEFT, speed: toFixed(70), alternate: alternateColor}));
      }
    }
    return createdEnemies;
  }

  clone() {
    return new Spawner(this.level);
  }
}