class Player extends Sprite {
  constructor(game) {
    super();

    this.States = {
      none: 0,
      idle: 1,
      run: 2,
      jump: 3,
      fall: 4,
      attack: 5,
      hit: 6,
      dead: 7,
      doorIn: 8,
      doorOut: 9,
    };

    this.game = game;
    this.x = 150;
    this.y = 200;
    this.width = 156;
    this.height = 116;
    this.speedX = 0;
    this.speedY = 0;
    this.weight = 0.5;
    this.runSpeed = 4;
    this.jumpForce = 10;
    this.life = 100; // Increased to 100 for better gameplay
    this.maxLife = 100;
    this.lifeTimer = 0;
    this.lifeInterval = 100;
    this.attackTimer = 500;
    this.attackInterval = 500;
    this.isStanding = false;
    this.wasStanding = false; // Track previous standing state
    this.hitbox = {
      ox: 40,
      oy: 40,
      width: 50,
      height: 50,
    };
    this.flip = 1;

    // Enhanced movement properties
    this.doubleJumpAvailable = false;
    this.maxDoubleJumps = 1;
    this.currentDoubleJumps = 0;
    this.wallSlideSpeed = 2;
    this.isWallSliding = false;

    // Combat properties
    this.invulnerable = false;
    this.invulnerabilityTimer = 0;
    this.invulnerabilityDuration = 1000; // 1 second

    // Visual effects
    this.dashTrailTimer = 0;
    this.runDustTimer = 0;

    this.animations = [
      {},
      //idle:
      {
        image: document.getElementById("player-idle"),
        frameCount: 11,
        loop: true,
      },
      //run:
      {
        image: document.getElementById("player-run"),
        frameCount: 8,
        loop: true,
      },
      //jump:
      {
        image: document.getElementById("player-jump"),
        frameCount: 1,
        loop: true,
      },
      //fall:
      {
        image: document.getElementById("player-fall"),
        frameCount: 1,
        loop: true,
      },
      //attack:
      {
        image: document.getElementById("player-attack"),
        frameCount: 3,
        loop: false,
      },
      //hit:
      {
        image: document.getElementById("player-hit"),
        frameCount: 2,
        loop: false,
      },
      //dead:
      {
        image: document.getElementById("player-dead"),
        frameCount: 4,
        loop: false,
      },
    ];

    this.idle();
  }

  handleHorizontalCollisions() {
    this.isWallSliding = false;

    for (let i = 0; i < this.game.level.map.length; i++) {
      const block = this.game.level.map[i];

      if (
        this.x + this.hitbox.ox <= block.x + block.width &&
        this.x + this.hitbox.ox + this.hitbox.width >= block.x &&
        this.y + this.hitbox.oy + this.hitbox.height >= block.y &&
        this.y + this.hitbox.oy <= block.y + block.height
      ) {
        //collision on x axis going to the left
        if (this.speedX < 0) {
          const offset = this.hitbox.ox;
          this.x = block.x + block.width - offset + 0.1;

          // Wall sliding mechanic
          if (this.speedY > 0 && !this.isStanding) {
            this.isWallSliding = true;
            this.speedY = Math.min(this.speedY, this.wallSlideSpeed);
            this.currentDoubleJumps = 0; // Reset double jumps on wall slide
          }
          break;
        }

        //collision on x axis going to the right
        if (this.speedX > 0) {
          const offset = this.hitbox.ox + this.hitbox.width;
          this.x = block.x - offset - 0.1;

          // Wall sliding mechanic
          if (this.speedY > 0 && !this.isStanding) {
            this.isWallSliding = true;
            this.speedY = Math.min(this.speedY, this.wallSlideSpeed);
            this.currentDoubleJumps = 0; // Reset double jumps on wall slide
          }
          break;
        }
      }
    }
  }

  handleVerticalCollisions() {
    this.wasStanding = this.isStanding;
    this.isStanding = false;

    for (let i = 0; i < this.game.level.map.length; i++) {
      const block = this.game.level.map[i];

      if (
        this.x + this.hitbox.ox <= block.x + block.width &&
        this.x + this.hitbox.ox + this.hitbox.width >= block.x &&
        this.y + this.hitbox.oy + this.hitbox.height >= block.y &&
        this.y + this.hitbox.oy <= block.y + block.height
      ) {
        if (this.speedY < 0) {
          this.speedY = 0;
          const offset = this.hitbox.oy;
          this.y = block.y + block.height - offset + 0.1;
          break;
        }

        if (this.speedY > 0) {
          this.isStanding = true;
          this.speedY = 0;
          const offset = this.hitbox.oy + this.hitbox.height;
          this.y = block.y - offset - 0.1;

          // Landing effects
          if (!this.wasStanding && this.speedY >= 0) {
            this.onLanding();
          }

          // Reset double jumps when landing
          this.currentDoubleJumps = 0;
          break;
        }
      }
    }
  }

  handleInput(deltaTime) {
    if (this.life <= 0) {
      this.die();
      return;
    }

    // Update invulnerability
    if (this.invulnerable) {
      this.invulnerabilityTimer += deltaTime;
      if (this.invulnerabilityTimer >= this.invulnerabilityDuration) {
        this.invulnerable = false;
        this.invulnerabilityTimer = 0;
      }
    }

    //handle hit (debug/testing)
    if (this.game.keys.hit.pressed && !this.game.keys.hit.handled) {
      this.game.keys.hit.handled = true;
      this.hit(10);
      return;
    }

    //handle attack
    if (this.attackTimer >= this.attackInterval) {
      if (this.game.keys.attack.pressed && !this.game.keys.attack.handled) {
        this.game.keys.attack.handled = true;
        this.attack();
        this.attackTimer = 0;
        return;
      }
    } else {
      this.attackTimer += deltaTime;
    }

    //handle jump (with double jump)
    if (this.game.keys.jump.pressed && !this.game.keys.jump.handled) {
      this.game.keys.jump.handled = true;

      if (this.isStanding || this.isWallSliding) {
        this.jump();
      } else if (this.currentDoubleJumps < this.maxDoubleJumps) {
        this.doubleJump();
      }
      return;
    }

    //handle movement
    if (this.game.keys.right.pressed || this.game.keys.left.pressed) {
      const dir =
        this.game.keys.right.pressed < this.game.keys.left.pressed ? -1 : 1;
      this.turn(dir);
      this.run();
      return;
    }

    if (this.isStanding && this.speedY === 0 && Math.abs(this.speedX) < 1) {
      this.idle();
    } else if (this.speedY > 0) {
      this.fall();
    }
  }

  handleSpeed(factor = 0.2) {
    this.speedX = this.game.lerp(this.speedX, 0, factor);
  }

  handleMovement() {
    //horizontal movement
    this.handleSpeed();
    this.x += this.speedX;
    this.handleHorizontalCollisions();
  }

  handleJump() {
    //vertical movement
    this.speedY += this.weight;
    this.y += this.speedY;
    this.handleVerticalCollisions();
  }

  handleAttack() {}

  update(deltaTime) {
    super.update(deltaTime);

    this.handleInput(deltaTime);
    this.handleMovement();
    this.handleJump();
    this.handleAttack();
    this.updateVisualEffects(deltaTime);

    // Regenerate health slowly over time
    if (
      this.life > 0 &&
      this.life < this.maxLife &&
      this.lifeTimer > this.lifeInterval
    ) {
      this.life++;
      this.lifeTimer = 0;
    } else {
      this.lifeTimer += deltaTime;
    }

    // Prevent player from falling off the world
    if (this.y > 800) {
      this.hit(20); // Take damage from falling
      this.y = 200; // Reset position
      this.x = 150;
      this.speedY = 0;
      this.game.camera.focusOn(this.x, this.y);
    }
  }

  updateVisualEffects(deltaTime) {
    // Create running dust particles
    if (this.state === this.States.run && this.isStanding) {
      this.runDustTimer += deltaTime;
      if (this.runDustTimer > 100) {
        // Every 100ms
        this.game.particleSystem.createRunningDust(
          this.x + this.width / 2,
          this.y + this.height
        );
        this.runDustTimer = 0;

        // Play footstep sound occasionally
        if (this.game.audioManager && Math.random() > 0.9) {
          this.game.audioManager.playSound("land", 0.2);
        }
      }
    }

    // Create trail when moving fast
    if (Math.abs(this.speedX) > 3) {
      this.dashTrailTimer += deltaTime;
      if (this.dashTrailTimer > 50) {
        this.game.particleSystem.createTrail(
          this.x + this.width / 2,
          this.y + this.height / 2,
          "rgba(255, 255, 255, 0.5)",
          0.3
        );
        this.dashTrailTimer = 0;
      }
    }
  }

  draw(context) {
    // Flicker effect when invulnerable
    if (this.invulnerable && Math.floor(this.invulnerabilityTimer / 100) % 2) {
      context.save();
      context.globalAlpha = 0.5;
    }

    super.draw(context);

    if (this.invulnerable) {
      context.restore();
    }

    if (this.game.debug) {
      context.strokeRect(
        this.x + this.hitbox.ox,
        this.y + this.hitbox.oy,
        this.hitbox.width,
        this.hitbox.height
      );
      context.fillStyle = "black";
      context.font = "20px Helvetica";
      context.fillText(this.state, this.x, this.y);

      // Debug info
      context.fillStyle = "white";
      context.font = "12px Arial";
      context.fillText(
        `DJ: ${this.currentDoubleJumps}/${this.maxDoubleJumps}`,
        this.x,
        this.y - 20
      );
      context.fillText(`Wall: ${this.isWallSliding}`, this.x, this.y - 35);
    }
  }

  idle() {
    this.state = this.States.idle;
    this.animate(this.state);
  }

  turn(dir) {
    if (dir != this.direction) {
      this.direction = dir;
      const hx = this.x + this.hitbox.ox;
      this.hitbox.ox = this.width - (this.hitbox.ox + this.hitbox.width);
      this.x = hx - this.hitbox.ox;
    }
  }

  run() {
    this.speedX = this.direction * this.runSpeed;
    this.state = this.States.run;
    this.animate(this.state);
  }

  jump() {
    if (this.isStanding || this.isWallSliding) {
      this.speedY = -this.jumpForce;

      // Wall jump gives horizontal boost
      if (this.isWallSliding) {
        this.speedX = -this.direction * this.runSpeed * 0.8;
      }

      this.state = this.States.jump;
      this.animate(this.state);

      // Effects
      if (this.game.audioManager) {
        this.game.audioManager.playSound("jump");
      }
      this.game.particleSystem.createJumpDust(
        this.x + this.width / 2,
        this.y + this.height
      );
    }
  }

  doubleJump() {
    this.speedY = -this.jumpForce * 0.8; // Slightly weaker than normal jump
    this.currentDoubleJumps++;

    this.state = this.States.jump;
    this.animate(this.state);

    // Enhanced effects for double jump
    if (this.game.audioManager) {
      this.game.audioManager.playSound("jump", 1.2); // Higher volume for double jump
    }
  }

  fall() {
    this.state = this.States.fall;
    this.animate(this.state);
  }

  attack() {
    this.speedX = this.direction * this.runSpeed;
    this.state = this.States.attack;
    this.animate(this.state);

    // Attack effects
    if (this.game.audioManager) {
      this.game.audioManager.playSound("playerAttack");
    }
    this.game.camera.shake(3, 100);
  }

  hit(points) {
    if (this.invulnerable) return; // No damage during invulnerability

    this.speedX = -this.direction * this.runSpeed;
    this.life -= points;
    if (this.life < 0) this.life = 0;

    this.state = this.States.hit;
    this.animate(this.state);

    // Start invulnerability
    this.invulnerable = true;
    this.invulnerabilityTimer = 0;

    // Effects
    if (this.game.audioManager) {
      this.game.audioManager.playSound("playerHit");
    }
    this.game.camera.shake(6, 200);
    this.game.ui.onPlayerDamage(points);

    this.game.particleSystem.createImpactParticles(
      this.x + this.width / 2,
      this.y + this.height / 2,
      "red"
    );
  }

  die() {
    this.state = this.States.dead;
    this.animate(this.state);

    if (!this.game.gameOver) {
      if (this.game.audioManager) {
        this.game.audioManager.playSound("gameOver");
      }
      this.game.particleSystem.createExplosionParticles(
        this.x + this.width / 2,
        this.y + this.height / 2,
        "red",
        20
      );
    }
  }

  onLanding() {
    // Landing effects
    if (this.game.audioManager) {
      this.game.audioManager.playSound("land", 0.8);
    }
    this.game.particleSystem.createLandingDust(
      this.x + this.width / 2,
      this.y + this.height
    );

    // Small camera shake for heavy landings
    if (this.speedY > 8) {
      this.game.camera.shake(2, 100);
    }
  }

  // Utility methods
  heal(amount) {
    this.life = Math.min(this.maxLife, this.life + amount);

    // Healing effects
    this.game.particleSystem.createCelebrationParticles(
      this.x + this.width / 2,
      this.y + this.height / 2,
      5
    );
    this.game.ui.addNotification(`+${amount} Health`, "green");
  }

  addDoubleJump() {
    this.maxDoubleJumps++;
    this.game.ui.addNotification("Double Jump Unlocked!", "cyan");
  }

  // Get player status for other systems
  getStatus() {
    return {
      health: this.life,
      maxHealth: this.maxLife,
      position: { x: this.x, y: this.y },
      velocity: { x: this.speedX, y: this.speedY },
      isGrounded: this.isStanding,
      isWallSliding: this.isWallSliding,
      canDoubleJump: this.currentDoubleJumps < this.maxDoubleJumps,
      isInvulnerable: this.invulnerable,
    };
  }
}
