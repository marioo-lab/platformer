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
    this.keys = {
      jump: {
        pressed: false,
        handled: false,
      },
      left: {
        pressed: false,
        handled: false,
      },
      right: {
        pressed: false,
        handled: false,
      },
      attack: {
        pressed: false,
        handled: false,
      },
      hit: {
        pressed: false,
        handled: false,
      },
    };
    this.level = new Level(this);
    this.player = new Player(this);
    this.enemies.push(new Pig(this));
    this.input = new InputHandler(this);
    this.ui = new UI(this);

    // Combat system properties
    this.playerAttackRange = 80;
    this.playerAttackActive = false;
    this.playerAttackTimer = 0;
    this.playerAttackDuration = 300; // Attack lasts 300ms
  }

  update(deltaTime) {
    if (!this.gameOver) this.gameTime += deltaTime;

    this.level.update();
    this.player.update(deltaTime);

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

    this.enemies.forEach((enemy) => {
      enemy.update(deltaTime);

      // Check enemy-player collision for damage to player
      if (this.checkEnemyPlayerCollision(enemy)) {
        // Only damage player if enemy is attacking or in hostile state
        if (
          enemy.isHostile &&
          enemy.isHostile() &&
          (enemy.state === enemy.States.attack ||
            enemy.getAIState() === "attack")
        ) {
          // Prevent continuous damage by checking attack state timing
          if (
            enemy.state === enemy.States.attack &&
            enemy.frame > 2 &&
            enemy.frame < enemy.frameCount - 1
          ) {
            this.player.hit(enemy.damage);

            // Knockback effect
            const direction = this.player.x > enemy.x ? 1 : -1;
            this.player.speedX = direction * 5;

            if (this.player.life <= 0) {
              this.gameOver = true;
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
      }
    });

    // Remove marked enemies
    this.enemies = this.enemies.filter((enemy) => !enemy.marked);

    // Spawn new enemies if needed
    if (
      this.enemyTimer > this.enemyInterval &&
      !this.gameOver &&
      this.enemies.length < 3
    ) {
      this.addEnemy();
      this.enemyTimer = 0;
    } else {
      this.enemyTimer += deltaTime;
    }

    this.ui.update(deltaTime);
  }

  draw(context) {
    this.level.draw(context);
    this.ui.draw(context);
    this.player.draw(context);
    this.enemies.forEach((enemy) => enemy.draw(context));
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

      // Check if enemy is within attack range
      if (distance <= this.playerAttackRange) {
        // Check if enemy is in front of player
        const directionToEnemy = dx > 0 ? 1 : -1;
        if (directionToEnemy === this.player.direction) {
          // Deal damage to enemy
          const attackDamage = 20;
          enemy.hit(attackDamage);

          // Knockback effect on enemy
          enemy.speedX = this.player.direction * 8;

          // Visual feedback could be added here (screen shake, particles, etc.)
          console.log(
            `Player hit ${enemy.constructor.name} for ${attackDamage} damage!`
          );
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
    // Spawn enemies at random positions away from player
    const spawnSide = Math.random() > 0.5 ? 1 : -1;
    const spawnX = this.player.x + spawnSide * (400 + Math.random() * 200);
    const spawnY = 300; // Default spawn height

    const newPig = new Pig(this);
    newPig.x = Math.max(100, Math.min(this.width - 200, spawnX));
    newPig.y = spawnY;

    this.enemies.push(newPig);
    console.log(`Spawned new pig at ${newPig.x}, ${newPig.y}`);
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

  // Utility method to get distance between two points
  getDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Method to check if a point is within the game boundaries
  isInBounds(x, y) {
    return x >= 0 && x <= this.width && y >= 0 && y <= this.height;
  }
}
