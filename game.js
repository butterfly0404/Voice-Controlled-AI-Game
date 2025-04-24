// Game configuration
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

// Game variables
let player;
let cursors;
let obstacles = [];
let lanes = [];
let score = 0;
let scoreText;
let gameOver = false;
let difficultyLevel = 1;
let gameSpeed = 100;
let obstacleFrequency = 2000;
let obstacleTimer;
let emitter;

// Game instance
const game = new Phaser.Game(config);

// Preload game assets
function preload() {
  this.load.image('player', 'https://labs.phaser.io/assets/sprites/phaser-dude.png');
  this.load.image('road', 'https://labs.phaser.io/assets/skies/sky1.png');
  this.load.image('car', 'https://labs.phaser.io/assets/sprites/car90.png');
  this.load.image('log', 'https://labs.phaser.io/assets/sprites/block.png');
  this.load.image('grass', 'https://labs.phaser.io/assets/sprites/grass.png');
  this.load.image('water', 'https://labs.phaser.io/assets/skies/underwater1.png');
}

// Create game elements
function create() {
  // Background
  this.add.image(400, 300, 'road').setScale(2);
  
  // Create lanes
  createLanes(this);
  
  // Player
  player = this.physics.add.sprite(400, 500, 'player');
  player.setCollideWorldBounds(true);
  player.setOrigin(0.5, 0.5);
  player.setScale(1.5);
  
  // Score
  scoreText = this.add.text(16, 16, 'Score: 0', { 
    fontSize: '24px', 
    fill: '#fff',
    stroke: '#000',
    strokeThickness: 4
  });
  
  // Game over text (hidden initially)
  gameOverText = this.add.text(400, 300, 'GAME OVER', {
    fontSize: '64px',
    fill: '#ff0000',
    stroke: '#000',
    strokeThickness: 6
  }).setOrigin(0.5).setVisible(false);
  
  // Keyboard controls
  cursors = this.input.keyboard.createCursorKeys();
  
  // Start obstacles
  startObstacles(this);
  
  // Create event emitter for game events
  emitter = new Phaser.Events.EventEmitter();
}

function update() {
  if (gameOver) return;
  
  // Update score as player moves forward
  if (player.y < 100) {
    player.y = 500;
    score += 10;
    scoreText.setText('Score: ' + score);
  }
  
  // Handle keyboard input
  if (cursors.left.isDown) {
    movePlayer('left');
  } else if (cursors.right.isDown) {
    movePlayer('right');
  } else if (cursors.up.isDown) {
    movePlayer('up');
  } else if (cursors.down.isDown) {
    movePlayer('down');
  }
  
  // Move obstacles
  moveObstacles();
  
  // Check collision with obstacles
  checkCollisions();
}

// Create lane types
function createLanes(scene) {
  const laneTypes = ['road', 'grass', 'road', 'grass', 'road', 'grass'];
  const laneHeight = 100;
  
  for (let i = 0; i < 6; i++) {
    const y = i * laneHeight;
    const type = laneTypes[i]; // Use predefined patterns instead of random to avoid too many water lanes
    
    // Create lane background
    let lane;
    if (type === 'water') {
      lane = scene.add.tileSprite(400, y + 50, 800, laneHeight, 'water');
    } else if (type === 'grass') {
      lane = scene.add.tileSprite(400, y + 50, 800, laneHeight, 'grass');
    } else {
      lane = scene.add.tileSprite(400, y + 50, 800, laneHeight, 'road');
    }
    
    lanes.push({
      sprite: lane,
      type: type,
      y: y + 50
    });
  }
}

// Start obstacle generation
function startObstacles(scene) {
  // Clear previous timer if it exists
  if (obstacleTimer) clearInterval(obstacleTimer);
  
  // Create obstacles periodically
  obstacleTimer = setInterval(() => {
    if (!gameOver) {
      createObstacle(scene);
    }
  }, obstacleFrequency);
}

// Create a new obstacle
function createObstacle(scene) {
  // Randomly select a lane
  const laneIndex = Math.floor(Math.random() * lanes.length);
  const lane = lanes[laneIndex];
  
  // Create obstacle based on lane type
  let obstacle;
  if (lane.type === 'road') {
    // Car on road
    const x = Math.random() < 0.5 ? -50 : 850;
    const direction = x < 0 ? 1 : -1;
    
    obstacle = scene.physics.add.sprite(x, lane.y, 'car');
    obstacle.direction = direction;
    obstacle.speed = gameSpeed * (0.5 + Math.random() * 0.5); // Random speed variation
    obstacle.type = 'car';
    
    if (direction < 0) {
      obstacle.flipX = true;
    }
  } else if (lane.type === 'water') {
    // Log on water
    const x = Math.random() < 0.5 ? -100 : 900;
    const direction = x < 0 ? 1 : -1;
    
    obstacle = scene.physics.add.sprite(x, lane.y, 'log');
    obstacle.direction = direction;
    obstacle.speed = gameSpeed * 0.3;
    obstacle.type = 'log';
    obstacle.setScale(2, 0.5);
  } else {
    // No obstacles on grass
    return;
  }
  
  obstacles.push(obstacle);
}

// Move obstacles across the screen
function moveObstacles() {
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obstacle = obstacles[i];
    
    // Move obstacle
    obstacle.x += obstacle.direction * (obstacle.speed / 60);
    
    // Check if obstacle is out of bounds
    if ((obstacle.direction > 0 && obstacle.x > 850) || 
        (obstacle.direction < 0 && obstacle.x < -50)) {
      // Remove obstacle
      obstacle.destroy();
      obstacles.splice(i, 1);
    }
  }
}

// Check collisions between player and obstacles
function checkCollisions() {
  let onLog = false;
  let inWater = false;
  
  // Find the lane the player is on
  const playerY = player.y;
  let currentLane = null;
  
  for (const lane of lanes) {
    if (Math.abs(lane.y - playerY) < 50) {
      currentLane = lane;
      if (lane.type === 'water') {
        inWater = true;
      }
      break;
    }
  }
  
  // Check collisions with obstacles
  for (const obstacle of obstacles) {
    if (Math.abs(obstacle.y - player.y) < 40) {  // Reduced collision threshold
      const dx = Math.abs(obstacle.x - player.x);
      
      if (obstacle.type === 'car' && dx < 40) {  // Reduced collision threshold
        // Hit by car
        handleGameOver();
        return;
      } else if (obstacle.type === 'log' && dx < 60) {
        // Standing on log
        onLog = true;
        player.x += obstacle.direction * (obstacle.speed / 60);
      }
    }
  }
  
  // Check if player is in water without a log
  if (inWater && !onLog) {
    handleGameOver();
  }
  
  // Keep player within bounds
  if (player.x < 50) player.x = 50;
  if (player.x > 750) player.x = 750;
}

// Handle game over
function handleGameOver() {
  gameOver = true;
  gameOverText.setVisible(true);
  
  // Stop obstacle generation
  clearInterval(obstacleTimer);
  
  // Emit game over event
  emitter.emit('gameOver');
}

// Move player according to direction
function movePlayer(direction) {
  if (gameOver) return;
  
  // Store previous position to revert if needed
  const prevX = player.x;
  const prevY = player.y;
  
  if (direction === 'up') {
    player.y -= 50;
    emitter.emit('playerMoved');
  } else if (direction === 'left') {
    player.x -= 50;
    player.flipX = true;
    emitter.emit('playerMoved');
  } else if (direction === 'right') {
    player.x += 50;
    player.flipX = false;
    emitter.emit('playerMoved');
  } else if (direction === 'down') {
    if (player.y < 550) {
      player.y += 50;
      emitter.emit('playerMoved');
    }
  }
  
  // Add a small delay before checking collisions to give time for rendering
  setTimeout(() => {
    // Keep player within bounds
    if (player.x < 50) player.x = 50;
    if (player.x > 750) player.x = 750;
  }, 50);
}

// Reset the game
function restartGame() {
  gameOver = false;
  score = 0;
  
  if (scoreText) scoreText.setText('Score: 0');
  if (gameOverText) gameOverText.setVisible(false);
  
  // Reset player position
  if (player) {
    player.x = 400;
    player.y = 500;
  }
  
  // Clear obstacles
  for (const obstacle of obstacles) {
    obstacle.destroy();
  }
  obstacles = [];
  
  // Reset difficulty
  difficultyLevel = 1;
  gameSpeed = 100;
  obstacleFrequency = 2000;
  
  // Restart obstacles
  if (game.scene.scenes[0]) {
    startObstacles(game.scene.scenes[0]);
  }
}

// Adjust game difficulty
function adjustDifficulty(changeAmount) {
  difficultyLevel += changeAmount;
  
  // Ensure difficulty stays within reasonable bounds
  if (difficultyLevel < 0.5) difficultyLevel = 0.5;
  if (difficultyLevel > 3) difficultyLevel = 3;
  
  // Update game parameters
  gameSpeed = 100 * difficultyLevel;
  obstacleFrequency = 2000 / difficultyLevel;
  
  // Restart obstacle timer with new frequency
  if (game.scene.scenes[0]) {
    startObstacles(game.scene.scenes[0]);
  }
  
  console.log(`Difficulty adjusted to ${difficultyLevel}`);
}

// Adjust game speed based on emotion
function increaseSpeed() {
  adjustDifficulty(0.5);
}

function reduceObstacles() {
  adjustDifficulty(-0.5);
}

// Listen for restart button
document.getElementById('restart-game').addEventListener('click', restartGame);