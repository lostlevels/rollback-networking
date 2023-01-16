class Spawner {
  constructor(level=1) {
    this.level = level;
  }

  update(dt, rand, frame) {
    const createdEnemies = [];

    // How many seconds does the rate of enemy spawning speed up
    const speedUpAfterSeconds = 60;
    const minFramesBetweenEnemies = 120; // No faster enemy spawn than this.
    const intervalBetweenEnemies = Math.max(minFramesBetweenEnemies, 300 - ~~(frame / (SIMULATION_FRAME_RATE * speedUpAfterSeconds)) * 60);
    if (frame >= 90 && (frame % intervalBetweenEnemies) == 0) {
      // Create enemy on left or right 50/50 chance
      const randomChance = ~~(rand.random() * 100);
      const alternateColor = (frame / 300) & 1 == 1;
      if (randomChance <= 50) {
        createdEnemies.push(new Enemy({x: toFixed(0), y: toFixed(96 - ENEMY_HEIGHT - 1), dir: DIR_RIGHT, speed: toFixed(70), alternate: alternateColor}));
      }
      else {
        createdEnemies.push(new Enemy({x: toFixed(SCREEN_WIDTH-ENEMY_WIDTH), y: toFixed(96 - ENEMY_HEIGHT - 1), dir: DIR_LEFT, speed: toFixed(70), alternate: alternateColor}));
      }
    }
    return {createdEnemies};
  }

  clone() {
    return new Spawner(this.level);
  }
}