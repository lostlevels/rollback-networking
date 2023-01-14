// Creates initial / starting game state. For simplicity this is hardcoded.
// Could also be loaded from a file, config, etc.
function createInitialGameState({playerId, remoteId, frame=0}) {
  const GRID_SIZE = BLOCK_HEIGHT;
  const blocks = [
    // ground
    new Block({x: toFixed(-1 * BLOCK_WIDTH), y: toFixed(SCREEN_HEIGHT - BLOCK_HEIGHT*2), width: SCREEN_WIDTH + BLOCK_HEIGHT * 2, height: 48*2, name: BLOCK_NAME_GROUND}),

    new Block({x: toFixed(-1 * BLOCK_WIDTH), y: toFixed(2 * GRID_SIZE)}), // hidden block on edges to allow wrap around
    new Block({x: toFixed(0 * BLOCK_WIDTH), y: toFixed(2 * GRID_SIZE)}),
    new Block({x: toFixed(1 * BLOCK_WIDTH), y: toFixed(2 * GRID_SIZE)}),
    new Block({x: toFixed(2 * BLOCK_WIDTH), y: toFixed(2 * GRID_SIZE)}),

    new Block({x: toFixed(13 * BLOCK_WIDTH), y: toFixed(2 * GRID_SIZE)}),
    new Block({x: toFixed(14 * BLOCK_WIDTH), y: toFixed(2 * GRID_SIZE)}),
    new Block({x: toFixed(15 * BLOCK_WIDTH), y: toFixed(2 * GRID_SIZE)}),
    new Block({x: toFixed(16 * BLOCK_WIDTH), y: toFixed(2 * GRID_SIZE)}), // hidden

    new Block({x: toFixed(-1 * BLOCK_WIDTH), y: toFixed(7 * GRID_SIZE)}), // hidden block on edges to allow wrap around
    new Block({x: toFixed(0 * BLOCK_WIDTH), y: toFixed(7 * GRID_SIZE)}),
    new Block({x: toFixed(1 * BLOCK_WIDTH), y: toFixed(7 * GRID_SIZE)}),
    new Block({x: toFixed(2 * BLOCK_WIDTH), y: toFixed(7 * GRID_SIZE)}),

    new Block({x: toFixed(13 * BLOCK_WIDTH), y: toFixed(7 * GRID_SIZE)}),
    new Block({x: toFixed(14 * BLOCK_WIDTH), y: toFixed(7 * GRID_SIZE)}),
    new Block({x: toFixed(15 * BLOCK_WIDTH), y: toFixed(7 * GRID_SIZE)}),
    new Block({x: toFixed(16 * BLOCK_WIDTH), y: toFixed(7 * GRID_SIZE)}), // hidden

    new Block({x: toFixed(-1 * BLOCK_WIDTH), y: toFixed(10 * GRID_SIZE)}), // hidden block
    new Block({x: toFixed(0 * BLOCK_WIDTH), y: toFixed(10 * GRID_SIZE)}),
    new Block({x: toFixed(1 * BLOCK_WIDTH), y: toFixed(10 * GRID_SIZE)}),
    new Block({x: toFixed(2 * BLOCK_WIDTH), y: toFixed(10 * GRID_SIZE)}),
    new Block({x: toFixed(3 * BLOCK_WIDTH), y: toFixed(10 * GRID_SIZE)}),
    new Block({x: toFixed(4 * BLOCK_WIDTH), y: toFixed(10 * GRID_SIZE)}),
    new Block({x: toFixed(5 * BLOCK_WIDTH), y: toFixed(10 * GRID_SIZE)}),


    new Block({x: toFixed(10 * BLOCK_WIDTH), y: toFixed(10 * GRID_SIZE)}),
    new Block({x: toFixed(11 * BLOCK_WIDTH), y: toFixed(10 * GRID_SIZE)}),
    new Block({x: toFixed(12 * BLOCK_WIDTH), y: toFixed(10 * GRID_SIZE)}),
    new Block({x: toFixed(13 * BLOCK_WIDTH), y: toFixed(10 * GRID_SIZE)}),
    new Block({x: toFixed(14 * BLOCK_WIDTH), y: toFixed(10 * GRID_SIZE)}),
    new Block({x: toFixed(15 * BLOCK_WIDTH), y: toFixed(10 * GRID_SIZE)}),
    new Block({x: toFixed(16 * BLOCK_WIDTH), y: toFixed(10 * GRID_SIZE)}), // hidden

    new Block({x: toFixed(5 * BLOCK_WIDTH), y: toFixed(5 * GRID_SIZE)}),
    new Block({x: toFixed(6 * BLOCK_WIDTH), y: toFixed(5 * GRID_SIZE)}),
    new Block({x: toFixed(7 * BLOCK_WIDTH), y: toFixed(5 * GRID_SIZE)}),
    new Block({x: toFixed(8 * BLOCK_WIDTH), y: toFixed(5 * GRID_SIZE)}),
    new Block({x: toFixed(9 * BLOCK_WIDTH), y: toFixed(5 * GRID_SIZE)}),
    new Block({x: toFixed(10 * BLOCK_WIDTH), y: toFixed(5 * GRID_SIZE)}),
  ];

  const enemies = [];

  const spawner = new Spawner();
  const objects = {
    player: new Player({id: playerId, x: toFixed(SCREEN_WIDTH/2), y: toFixed(128)}),
    remote: new Player({id: remoteId, x: toFixed(SCREEN_WIDTH/2), y: toFixed(128)}),
    blocks,
    enemies,
    spawner,
  };

  return new GameState(frame, objects);
}