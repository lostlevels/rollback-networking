## Rollback Networking multiplayer game.

This is the source code for a Mario Bros style in-browser online co-op game with rollback networking. The accompanying tutorial for this can be found [here](https://outof.fish/posts/rollback/). The game can be played [here](https://rollback-networking.pages.dev).

![Screenshot](/screenshot.png? "In-game screenshot")

### How to start a game

Once the game has loaded and a connection has been established, a link for another player to join your game will be shown. Copy this url and give it to another player. Once that player connects, the game will begin.

### How to play

Jump into a block to flip a mushroom enemy. Then run into the flipped enemy to gain points. Running into unflipped enemies will stun you for a brief period.

### Controls

| Action      | Keys            |
| ----------- | --------------- |
| Move Left   | ←, A            |
| Move Right  | →, D            |
| Jump        | SPACE, Z, ENTER |

### Building

From the repository root run

```bash
$ make all
```

This should create a `build` folder with all the markup and resources needed. Serve that folder with your tool of choice.

