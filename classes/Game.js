class Game {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.enemies = [];
    this.enemyTimer = 0;
    this.enemyInterval = 2000;
    this.gameOver = false;
    this.gameTime = 0;
    this.speed = 0;
    this.debug = false;
    this.score = 0;

    // Game states
    this.gameStates = {
      MENU: "menu",
      PLAYING: "playing",
      PAUSED: "paused",
      GAME_OVER: "game_over",
    };
    this.currentState = this.gameStates.MENU;

    // Menu properties
    this.menuSelection = 0;
    this.menuOptions = ["Start Game", "Controls", "Debug Mode"];

    this.keys = {
      jump: { pressed: false, handled: false },
      left: { pressed: false, handled: false },
      right: { pressed: false, handled: false },
      attack: { pressed: false, handled: false },
      hit: { pressed: false, handled: false },
      pause: { pressed: false, handled: false },
      enter: { pressed: false, handled: false },
      up: { pressed: false, handled: false },
      down: { pressed: false, handled: false },
    };

    this.level = new Level(this);
    this.player = new Player(this);
    this.camera = new Camera(this);
    this.particleSystem = new ParticleSystem(this);
    this.audioManager = new AudioManager(this);
    this.input = new InputHandler(this);
    this.ui = new UI(this);

    // Combat system properties
    this.playerAttackRange = 80;
    this.playerAttackActive = false;
    this.playerAttackTimer = 0;
    this.playerAttackDuration = 300;

    // Wave system
    this.wave = 1;
    this.enemiesKilled = 0;
    this.enemiesPerWave = 3;
  }

  update(deltaTime) {
    switch (this.currentState) {
      case this.gameStates.MENU:
        this.updateMenu(deltaTime);
        break;
      case this.gameStates.PLAYING:
        this.updateGame(deltaTime);
        break;
      case this.gameStates.PAUSED:
        this.updatePause(deltaTime);
        break;
      case this.gameStates.GAME_OVER:
        this.updateGameOver(deltaTime);
        break;
    }
  }

  updateMenu(deltaTime) {
    // Handle menu navigation
    if (this.keys.up.pressed && !this.keys.up.handled) {
      this.keys.up.handled = true;
      this.menuSelection =
        (this.menuSelection - 1 + this.menuOptions.length) %
        this.menuOptions.length;
      this.audioManager.playSound("menuMove");
    }

    if (this.keys.down.pressed && !this.keys.down.handled) {
      this.keys.down.handled = true;
      this.menuSelection = (this.menuSelection + 1) % this.menuOptions.length;
      this.audioManager.playSound("menuMove");
    }

    if (this.keys.enter.pressed && !this.keys.enter.handled) {
      this.keys.enter.handled = true;
      this.handleMenuSelection();
    }
  }

  updateGame(deltaTime) {
    if (!this.gameOver) this.gameTime += deltaTime;

    // Handle pause
    if (this.keys.pause.pressed && !this.keys.pause.handled) {
      this.keys.pause.handled = true;
      this.currentState = this.gameStates.PAUSED;
      this.audioManager.pauseMusic();
      return;
    }

    this.level.update();
    this.player.update(deltaTime);
    this.camera.update(deltaTime);
    this.particleSystem.update(deltaTime);

    // Update player attack timer
    if (this.playerAttackActive) {
      this.playerAttackTimer += deltaTime;
      if (this.playerAttackTimer >= this.playerAttackDuration) {
        this.playerAttackActive = false;
        this.playerAttackTimer = 0;
      }
    }

    // Check if player is attacking
    if (
      this.player.state === this.player.States.attack &&
      !this.playerAttackActive
    ) {
      this.playerAttackActive = true;
      this.playerAttackTimer = 0;
      this.handlePlayerAttack();
    }

    this.updateEnemies(deltaTime);
    this.updateWaveSystem();
    this.ui.update(deltaTime);
  }

  updatePause(deltaTime) {
    if (this.keys.pause.pressed && !this.keys.pause.handled) {
      this.keys.pause.handled = true;
      this.currentState = this.gameStates.PLAYING;
      this.audioManager.resumeMusic();
    }
  }

  updateGameOver(deltaTime) {
    if (this.keys.enter.pressed && !this.keys.enter.handled) {
      this.keys.enter.handled = true;
      this.resetGame();
    }
  }

  updateEnemies(deltaTime) {
    this.enemies.forEach((enemy) => {
      enemy.update(deltaTime);

      // Check enemy-player collision for damage to player
      if (this.checkEnemyPlayerCollision(enemy)) {
        if (
          enemy.isHostile &&
          enemy.isHostile() &&
          (enemy.state === enemy.States.attack ||
            enemy.getAIState() === "attack")
        ) {
          if (
            enemy.state === enemy.States.attack &&
            enemy.frame > 2 &&
            enemy.frame < enemy.frameCount - 1
          ) {
            this.player.hit(enemy.damage);
            this.audioManager.playSound("playerHit");
            this.camera.shake(8, 200);

            // Create hit particles
            this.particleSystem.createImpactParticles(
              this.player.x + this.player.width / 2,
              this.player.y + this.player.height / 2,
              "red"
            );

            const direction = this.player.x > enemy.x ? 1 : -1;
            this.player.speedX = direction * 5;

            if (this.player.life <= 0) {
              this.gameOver = true;
              this.currentState = this.gameStates.GAME_OVER;
              this.audioManager.stopMusic();
              this.audioManager.playSound("gameOver");
            }
          }
        }
      }

      // Remove dead enemies
      if (
        enemy.life <= 0 &&
        enemy.state === enemy.States.dead &&
        enemy.frame >= enemy.frameCount - 1
      ) {
        enemy.marked = true;
        this.score += 100;
        this.enemiesKilled++;
        this.audioManager.playSound("enemyDie");

        // Create death particles
        this.particleSystem.createExplosionParticles(
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 2,
          "orange"
        );
      }
    });

    // Remove marked enemies
    this.enemies = this.enemies.filter((enemy) => !enemy.marked);

    // Spawn new enemies
    if (
      this.enemyTimer > this.enemyInterval &&
      !this.gameOver &&
      this.enemies.length < this.enemiesPerWave
    ) {
      this.addEnemy();
      this.enemyTimer = 0;
    } else {
      this.enemyTimer += deltaTime;
    }
  }

  updateWaveSystem() {
    if (
      this.enemiesKilled >= this.enemiesPerWave &&
      this.enemies.length === 0
    ) {
      this.wave++;
      this.enemiesKilled = 0;
      this.enemiesPerWave += 2;
      this.enemyInterval = Math.max(1000, this.enemyInterval - 200);
      this.score += 500 * this.wave;
      this.audioManager.playSound("waveComplete");

      // Create celebration particles
      this.particleSystem.createCelebrationParticles(
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height / 2
      );
    }
  }

  draw(context) {
    // Clear screen
    context.fillStyle = "#4d79bc";
    context.fillRect(0, 0, this.width, this.height);

    switch (this.currentState) {
      case this.gameStates.MENU:
        this.drawMenu(context);
        break;
      case this.gameStates.PLAYING:
        this.drawGame(context);
        break;
      case this.gameStates.PAUSED:
        this.drawGame(context);
        this.drawPause(context);
        break;
      case this.gameStates.GAME_OVER:
        this.drawGame(context);
        this.drawGameOver(context);
        break;
    }
  }

  drawMenu(context) {
    context.save();
    context.fillStyle = "white";
    context.textAlign = "center";
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;
    context.shadowColor = "black";

    // Title
    context.font = "72px Bangers";
    context.fillText(
      "PLATFORMER ADVENTURE",
      this.width / 2,
      this.height / 2 - 100
    );

    // Menu options
    context.font = "36px Bangers";
    this.menuOptions.forEach((option, index) => {
      context.fillStyle = index === this.menuSelection ? "yellow" : "white";
      context.fillText(option, this.width / 2, this.height / 2 + index * 50);
    });

    // Instructions
    context.font = "24px Bangers";
    context.fillStyle = "lightgray";
    context.fillText(
      "Use UP/DOWN arrows and ENTER to select",
      this.width / 2,
      this.height - 100
    );

    context.restore();
  }

  drawGame(context) {
    context.save();
    this.camera.apply(context);

    this.level.draw(context);
    this.player.draw(context);
    this.enemies.forEach((enemy) => enemy.draw(context));
    this.particleSystem.draw(context);

    context.restore();

    this.ui.draw(context);
  }

  drawPause(context) {
    // Semi-transparent overlay
    context.fillStyle = "rgba(0, 0, 0, 0.7)";
    context.fillRect(0, 0, this.width, this.height);

    context.save();
    context.fillStyle = "white";
    context.textAlign = "center";
    context.font = "48px Bangers";
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;
    context.shadowColor = "black";
    context.fillText("PAUSED", this.width / 2, this.height / 2);

    context.font = "24px Bangers";
    context.fillText(
      "Press P to continue",
      this.width / 2,
      this.height / 2 + 50
    );
    context.restore();
  }

  drawGameOver(context) {
    // Semi-transparent overlay
    context.fillStyle = "rgba(0, 0, 0, 0.8)";
    context.fillRect(0, 0, this.width, this.height);

    context.save();
    context.fillStyle = "red";
    context.textAlign = "center";
    context.font = "48px Bangers";
    context.shadowOffsetX = 3;
    context.shadowOffsetY = 3;
    context.shadowColor = "black";
    context.fillText("GAME OVER", this.width / 2, this.height / 2 - 50);

    context.fillStyle = "white";
    context.font = "24px Bangers";
    context.fillText(
      `Final Score: ${this.score}`,
      this.width / 2,
      this.height / 2
    );
    context.fillText(
      `Wave Reached: ${this.wave}`,
      this.width / 2,
      this.height / 2 + 30
    );
    context.fillText(
      "Press ENTER to return to menu",
      this.width / 2,
      this.height / 2 + 80
    );
    context.restore();
  }

  handleMenuSelection() {
    switch (this.menuSelection) {
      case 0: // Start Game
        this.startGame();
        break;
      case 1: // Controls
        this.showControls();
        break;
      case 2: // Debug Mode
        this.debug = !this.debug;
        this.audioManager.playSound("menuSelect");
        break;
    }
  }

  startGame() {
    this.currentState = this.gameStates.PLAYING;
    this.audioManager.playSound("menuSelect");
    this.audioManager.playMusic("game");
    this.resetGame();
  }

  showControls() {
    // Could be expanded to show a controls screen
    this.audioManager.playSound("menuSelect");
  }

  resetGame() {
    this.gameOver = false;
    this.gameTime = 0;
    this.score = 0;
    this.wave = 1;
    this.enemiesKilled = 0;
    this.enemiesPerWave = 3;
    this.enemyInterval = 2000;
    this.currentState = this.gameStates.PLAYING;

    // Reset player
    this.player.x = 150;
    this.player.y = 200;
    this.player.life = 100;
    this.player.speedX = 0;
    this.player.speedY = 0;
    this.player.idle();

    // Clear enemies
    this.enemies = [];

    // Reset camera
    this.camera.reset();

    // Clear particles
    this.particleSystem.clear();

    // Start music
    this.audioManager.playMusic("game");
  }

  handlePlayerAttack() {
    const playerCenterX = this.player.x + this.player.width / 2;
    const playerCenterY = this.player.y + this.player.height / 2;

    this.enemies.forEach((enemy) => {
      const enemyCenterX = enemy.x + enemy.width / 2;
      const enemyCenterY = enemy.y + enemy.height / 2;
      const dx = enemyCenterX - playerCenterX;
      const dy = enemyCenterY - playerCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= this.playerAttackRange) {
        const directionToEnemy = dx > 0 ? 1 : -1;
        if (directionToEnemy === this.player.direction) {
          const attackDamage = 20;
          enemy.hit(attackDamage);
          this.audioManager.playSound("playerAttack");
          this.camera.shake(5, 150);

          // Create attack particles
          this.particleSystem.createAttackParticles(
            enemyCenterX,
            enemyCenterY,
            this.player.direction
          );

          enemy.speedX = this.player.direction * 8;
        }
      }
    });
  }

  checkEnemyPlayerCollision(enemy) {
    const playerHitbox = {
      x: this.player.x + this.player.hitbox.ox,
      y: this.player.y + this.player.hitbox.oy,
      width: this.player.hitbox.width,
      height: this.player.hitbox.height,
    };

    const enemyHitbox = {
      x: enemy.x + enemy.hitbox.ox,
      y: enemy.y + enemy.hitbox.oy,
      width: enemy.hitbox.width,
      height: enemy.hitbox.height,
    };

    return this.checkCollision(playerHitbox, enemyHitbox);
  }

  addEnemy() {
    const spawnSide = Math.random() > 0.5 ? 1 : -1;
    const spawnX = this.player.x + spawnSide * (100 + Math.random() * 100);
    const spawnY = 300;

    const newPig = new Pig(this);
    newPig.x = Math.max(100, Math.min(this.width - 200, spawnX));
    newPig.y = spawnY;

    this.enemies.push(newPig);
  }

  checkCollision(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  lerp(a, b, amount) {
    return (1 - amount) * a + amount * b;
  }

  // Safe audio helper method
  playSound(soundName, volume = 1.0) {
    if (this.audioManager) {
      this.audioManager.playSound(soundName, volume);
    }
  }

  getDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  isInBounds(x, y) {
    return x >= 0 && x <= this.width && y >= 0 && y <= this.height;
  }
}
