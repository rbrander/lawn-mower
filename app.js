const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const KEY_LEFT = 37;
const KEY_RIGHT = 39;
const KEY_UP = 38;
const KEY_DOWN = 40;

const PAY_PER_BLOCK = 2; // $2 for each block cut

const GRASS_TILE_IMAGE = document.getElementById('grass');
const FADE_OUT_DURATION = 2000;

/*
TODO:
- show money animation on grass cut
- add dirt to slow you down, and -1 money (for maintenance) or add damage
- add conconcrete, no money but you don't get slowed down
- add damage
- add menu
- add upgrade
*/

const state = {
  keys: new Set(),
  level: {
    visited: [],
    width: 3, // 10,
    height: 1, // 7,
    blockSize: 10
  },
  player: {
    money: 0,
    x: 0,
    y: 0,
    xVel: 0,
    yVel: 0,
    msPerMove: 300,
    lastMove: 0
  },
  isRunning: false,
  gameOver: false
};

const hasVisited = (x, y) => state.level.visited.some(node => node.x === x && node.y === y)
const hasVisitedAllBlocks = () => {
  for (let y = 0; y < state.level.height; y++) {
    for (let x = 0; x < state.level.width; x++) {
      if (!hasVisited(x, y)) {
        return false;
      }
    }
  }
  return true;
};

const visitBlock = (x, y) => {
  if (!hasVisited(x, y)) {
    state.level.visited.push({x, y});
    state.player.money += PAY_PER_BLOCK;
  }
};

const updateMenu = (tick) => {
  // When any key is pressed, the game starts
  if (state.keys.size > 0) {
    state.gameOver = false;
    state.isRunning = true;
  }
};

const updateGame = (tick) => {
  if (state.keys.has(KEY_UP)) {
    state.player.yVel = -1;
    state.player.xVel = 0;
  }
  if (state.keys.has(KEY_DOWN)) {
    state.player.yVel = 1;
    state.player.xVel = 0;
  }
  if (state.keys.has(KEY_LEFT)) {
    state.player.xVel = -1;
    state.player.yVel = 0;
  }
  if (state.keys.has(KEY_RIGHT)) {
    state.player.xVel = 1;
    state.player.yVel = 0;
  }
  if (state.player.lastMove + state.player.msPerMove < tick) {
    state.player.lastMove = tick;

    const newX = state.player.x + state.player.xVel;
    if (newX >= 0 && newX < state.level.width) {
      state.player.x = newX;
    }

    const newY = state.player.y + state.player.yVel;
    if (newY >= 0 && newY < state.level.height) {
      state.player.y = newY;
    }

    visitBlock(state.player.x, state.player.y);
  }
  // Check for end state
  if (hasVisitedAllBlocks() && state.gameOver === false) {
    state.gameOver = tick;
    setTimeout(() => { state.isRunning = false; }, FADE_OUT_DURATION);
  }
};

const drawGrass = (x, y, isLightGrass = false) => {
  const TILE_SIZE = 32;
  const LIGHT_GRASS_XOFFSET = 0;
  const DARK_GRASS_XOFFSET = 32;
  const xOffset = isLightGrass ? LIGHT_GRASS_XOFFSET : DARK_GRASS_XOFFSET;
  const { blockSize } = state.level;
  ctx.drawImage(GRASS_TILE_IMAGE,
    // Source Image (x, y, width, height)
    xOffset, 0, TILE_SIZE, TILE_SIZE,
    // Destination on canvas (x, y, width, height)
    x * blockSize, y * blockSize, blockSize, blockSize
  );
}

const drawMenu = (tick) => {
  // clear background
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'white';
  ctx.font = '100px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Lawn Mower', canvas.width / 2, canvas.height / 3);

  ctx.font = '50px Arial';
  ctx.fillText('press any key...', canvas.width / 2, (canvas.height / 3) * 2);
};

const drawGame = (tick) => {
  const { blockSize } = state.level;
  const visitedSpots = [...state.level.visited];

  // clear background
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // draw grid
  const buffer = 4;
  const halfBuffer = buffer / 2;
  ctx.lineWidth = halfBuffer;
  for (let y = 0; y < state.level.height; y++) {
    for (let x = 0; x < state.level.width; x++) {
      drawGrass(x, y, hasVisited(x, y));
      /*
      if (!hasVisited(x, y)) {
        // draw grass
        const boxX = x * blockSize + halfBuffer;
        const boxY = y * blockSize + halfBuffer;
        ctx.strokeStyle = 'lightgreen';
        ctx.fillStyle = 'green';
        ctx.fillRect(boxX + halfBuffer, boxY + halfBuffer, blockSize - buffer, blockSize - buffer);
        ctx.strokeRect(boxX + halfBuffer, boxY + halfBuffer, blockSize - buffer, blockSize - buffer);
      }
      */
    }
  }

  // draw player (as blue circle)
  ctx.fillStyle = 'blue';
  ctx.beginPath();
  const playerX = state.player.x * blockSize;
  const playerY = state.player.y * blockSize;
  ctx.arc(playerX + blockSize / 2, playerY + blockSize / 2, state.level.blockSize * 0.4, 0, Math.PI * 2);
  ctx.fill();

   // draw text
  ctx.fillStyle = 'white';
  ctx.font = '40px Arial';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  // ctx.fillText(`(${[...state.keys]})`, 30, 30);
  // ctx.fillText(`(${state.player.x}, ${state.player.y})`, 30, 30);


  if (state.gameOver) {
    ctx.font = '100px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('You Win!', canvas.width / 2, canvas.height / 2 - 50);
    ctx.fillText(`$${state.player.money}`, canvas.width / 2, canvas.height / 2 + 50);

    // fade to black
    const pctFaded = ((tick - state.gameOver) / FADE_OUT_DURATION);
    console.log(pctFaded.toFixed(2));
    ctx.fillStyle = `rgba(0, 0, 0, ${pctFaded.toFixed(2)})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
};

const resize = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const biggestVerticalSize = canvas.height / state.level.height;
  const biggestHorizontalSize = canvas.width / state.level.width;
  state.level.blockSize = Math.min(biggestHorizontalSize, biggestVerticalSize);
};
resize();

const loop = (tick) => {
  const update = state.isRunning ? updateGame : updateMenu;
  const draw = state.isRunning ? drawGame : drawMenu;
  update(tick);
  draw(tick);
  requestAnimationFrame(loop);
};

// setup event handlers
const onKeyDown = (e) => { state.keys.add(e.which); };
const onKeyUp = (e) => { state.keys.delete(e.which); };
window.addEventListener('keydown', onKeyDown);
window.addEventListener('keyup', onKeyUp);

requestAnimationFrame(loop);
