class Pig extends Enemy {
  constructor(game) {
    super(game);
    this.x = 500;
    this.y = 300;
    this.width = 68;
    this.height = 56;
    this.speedX = 0;
    this.speedY = 0;
    this.weight = 0.5;
    this.runSpeed = 4;
    this.jumpForce = 10;
    this.life = 30; // Adjusted for better gameplay balance
    this.maxLife = 30;
    this.attackTimer = 500;
    this.attackInterval = 500;
    this.isStanding = false;
    this.damage = 15; // Increased damage for more challenge
    this.direction = -1;
    this.hitbox = {
      ox: 20,
      oy: 20,
      width: 38,
      height: 36,
    };

    // Enhanced pig properties
    this.spawnTimer = 0;
    this.spawnDuration = 1000; // Spawn animation duration
    this.isSpawning = true;
    this.deathTimer = 0;
    this.deathDuration = 2000; // Time before removal
    this.isDying = false;

    // Visual effects
    this.hitFlashTimer = 0;
    this.hitFlashDuration = 200;
    this.isFlashing = false;

    // Status effects
    this.statusEffects = {
      poisoned: false,
      slowed: false,
      stunned: false,
      burning: false,
    };

    // Drop system
    this.dropChance = 0.3; // 30% chance to drop something
    this.dropTypes = ["health", "score", "powerup"];

    this.animations = [
      {},
      //idle:
      {
        image: document.getElementById("pig-idle"),
        frameCount: 11,
        loop: true,
      },
      //run:
      {
        image: document.getElementById("pig-run"),
        frameCount: 6,
        loop: true,
      },
      //jump:
      {
        image: document.getElementById("pig-jump"),
        frameCount: 1,
        loop: true,
      },
      //fall:
      {
        image: document.getElementById("pig-fall"),
        frameCount: 1,
        loop: true,
      },
      //attack:
      {
        image: document.getElementById("pig-attack"),
        frameCount: 5,
        loop: false,
      },
      //hit:
      {
        image: document.getElementById("pig-hit"),
        frameCount: 2,
        loop: false,
      },
      //dead:
      {
        image: document.getElementById("pig-dead"),
        frameCount: 4,
        loop: false,
      },
    ];

    this.idle();
    this.ai = new PigAI(this);

    // Spawn effects
    this.createSpawnEffects();
  }

  update(deltaTime) {
    // Handle spawning phase
    if (this.isSpawning) {
      this.updateSpawning(deltaTime);
      return;
    }

    // Handle death phase
    if (this.isDying) {
      this.updateDying(deltaTime);
      return;
    }

    // Update status effects
    this.updateStatusEffects(deltaTime);

    // Update visual effects
    this.updateVisualEffects(deltaTime);

    // Normal enemy update
    super.update(deltaTime);

    // Check if should start dying
    if (this.life <= 0 && !this.isDying) {
      this.startDying();
    }
  }

  updateSpawning(deltaTime) {
    this.spawnTimer += deltaTime;

    if (this.spawnTimer >= this.spawnDuration) {
      this.isSpawning = false;
      this.spawnTimer = 0;
    } else {
      // Spawn animation effects
      if (Math.random() > 0.8) {
        this.game.particleSystem.createSpawnEffect(
          this.x + this.width / 2,
          this.y + this.height / 2,
          3
        );
      }

      // Simple idle animation during spawn
      this.idle();
    }
  }

  updateDying(deltaTime) {
    this.deathTimer += deltaTime;

    // Continue death animation
    this.die();

    // Create death particles occasionally
    if (Math.random() > 0.9) {
      this.game.particleSystem.createTrail(
        this.x + this.width / 2,
        this.y + this.height / 2,
        "red",
        0.5
      );
    }

    // Mark for removal after death duration
    if (this.deathTimer >= this.deathDuration) {
      this.marked = true;
    }
  }

  updateStatusEffects(deltaTime) {
    // Handle various status effects
    Object.keys(this.statusEffects).forEach((effect) => {
      if (this.statusEffects[effect]) {
        this.handleStatusEffect(effect, deltaTime);
      }
    });
  }

  updateVisualEffects(deltaTime) {
    // Handle hit flash effect
    if (this.isFlashing) {
      this.hitFlashTimer += deltaTime;
      if (this.hitFlashTimer >= this.hitFlashDuration) {
        this.isFlashing = false;
        this.hitFlashTimer = 0;
      }
    }
  }

  handleStatusEffect(effect, deltaTime) {
    switch (effect) {
      case "stunned":
        this.speedX *= 0.5;
        this.speedY *= 0.5;
        break;
      case "slowed":
        this.runSpeed *= 0.7;
        break;
      case "poisoned":
        // Take damage over time
        if (Math.random() > 0.99) {
          this.takeDamage(1, false);
        }
        break;
      case "burning":
        // Take damage and create fire particles
        if (Math.random() > 0.98) {
          this.takeDamage(2, false);
          this.game.particleSystem.createImpactParticles(
            this.x + this.width / 2,
            this.y + this.height / 2,
            "orange",
            3
          );
        }
        break;
    }
  }

  // Enhanced hit method with damage types
  hit(points, damageType = "normal") {
    if (this.isSpawning || this.isDying) return;

    this.takeDamage(points, true);

    // Apply status effects based on damage type
    this.applyDamageEffects(damageType);

    // Call parent hit method for basic behavior
    super.hit(0);

    // Visual effects
    this.isFlashing = true;
    this.hitFlashTimer = 0;

    // Notify AI that pig was hit
    if (this.ai && this.ai.onHit) {
      this.ai.onHit();
    }

    // Create enhanced hit effects
    this.createHitEffects(points);
  }

  takeDamage(points, showFloatingText = true) {
    this.life -= points;
    if (this.life < 0) this.life = 0;

    // Show floating damage text
    if (showFloatingText) {
      this.game.ui.onEnemyDamage(this, points);
    }
  }

  applyDamageEffects(damageType) {
    switch (damageType) {
      case "fire":
        this.statusEffects.burning = true;
        setTimeout(() => {
          this.statusEffects.burning = false;
        }, 3000);
        break;
      case "ice":
        this.statusEffects.slowed = true;
        setTimeout(() => {
          this.statusEffects.slowed = false;
        }, 2000);
        break;
      case "electric":
        this.statusEffects.stunned = true;
        setTimeout(() => {
          this.statusEffects.stunned = false;
        }, 1000);
        break;
      case "poison":
        this.statusEffects.poisoned = true;
        setTimeout(() => {
          this.statusEffects.poisoned = false;
        }, 5000);
        break;
    }
  }

  createHitEffects(damage) {
    // Blood/impact particles
    this.game.particleSystem.createBloodParticles(
      this.x + this.width / 2,
      this.y + this.height / 2,
      -this.direction,
      Math.min(damage, 8)
    );

    // Screen effects for big hits
    if (damage > 15) {
      this.game.camera.shake(4, 150);
    }
  }

  createSpawnEffects() {
    // Spawn particles
    this.game.particleSystem.createSpawnEffect(
      this.x + this.width / 2,
      this.y + this.height / 2,
      15
    );

    // Spawn sound
    this.game.audioManager.playSound("pickup", 0.8);
  }

  startDying() {
    this.isDying = true;
    this.deathTimer = 0;

    // Death effects
    this.game.particleSystem.createExplosionParticles(
      this.x + this.width / 2,
      this.y + this.height / 2,
      "orange",
      15
    );

    // Screen shake
    this.game.camera.shake(6, 300);

    // Drop items
    this.handleItemDrop();

    // Notify UI
    this.game.ui.addNotification(`Pig Defeated! +100 points`, "yellow");
  }

  handleItemDrop() {
    if (Math.random() < this.dropChance) {
      const dropType =
        this.dropTypes[Math.floor(Math.random() * this.dropTypes.length)];
      this.createDrop(dropType);
    }
  }

  createDrop(dropType) {
    // Create visual drop effect
    switch (dropType) {
      case "health":
        this.game.particleSystem.createCelebrationParticles(
          this.x + this.width / 2,
          this.y + this.height / 2,
          8
        );
        // Could implement actual health pickup here
        break;
      case "score":
        this.game.score += 50;
        this.game.ui.addNotification("+50 Bonus!", "gold");
        break;
      case "powerup":
        // Could implement power-up system here
        this.game.ui.addNotification("Power-up!", "cyan");
        break;
    }
  }

  // Override draw to include visual effects
  draw(context) {
    context.save(); // Single save for all effects

    // Handle spawn transparency
    if (this.isSpawning) {
      const spawnAlpha = Math.min(1, this.spawnTimer / this.spawnDuration);
      context.globalAlpha = spawnAlpha;
    }

    // Handle death fade
    if (this.isDying) {
      const deathAlpha = Math.max(0, 1 - this.deathTimer / this.deathDuration);
      context.globalAlpha = Math.min(context.globalAlpha, deathAlpha);
    }

    // Handle visual effects with filters
    let filters = [];

    if (this.isFlashing) {
      filters.push("brightness(150%)", "saturate(150%)");
    }

    if (this.statusEffects.burning) {
      filters.push("hue-rotate(30deg)", "brightness(120%)");
    }

    if (this.statusEffects.poisoned) {
      filters.push("hue-rotate(90deg)", "saturate(150%)");
    }

    if (this.statusEffects.stunned) {
      filters.push("blur(1px)", "brightness(80%)");
    }

    // Apply all filters at once
    if (filters.length > 0) {
      context.filter = filters.join(" ");
    }

    // Draw the pig
    super.draw(context);

    context.restore(); // Single restore

    // Draw AI debug information (outside of effects context)
    if (this.ai && this.ai.drawDebug) {
      this.ai.drawDebug(context);
    }

    // Draw health bar (outside of effects context)
    this.drawHealthBar(context);
  }

  drawHealthBar(context) {
    if (!this.game.debug && this.life === this.maxLife) return;

    const barWidth = this.width;
    const barHeight = 4;
    const barX = this.x;
    const barY = this.y - 10;

    // Background
    context.fillStyle = "rgba(0, 0, 0, 0.7)";
    context.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

    // Health bar
    const healthPercentage = this.life / this.maxLife;
    let healthColor = "#4CAF50"; // Green
    if (healthPercentage < 0.5) healthColor = "#FF9800"; // Orange
    if (healthPercentage < 0.3) healthColor = "#F44336"; // Red

    context.fillStyle = healthColor;
    context.fillRect(barX, barY, barWidth * healthPercentage, barHeight);

    // Border
    context.strokeStyle = "white";
    context.lineWidth = 1;
    context.strokeRect(barX, barY, barWidth, barHeight);
  }

  // Method to check if pig can see a specific point
  canSeePoint(targetX, targetY) {
    if (!this.ai) return false;
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    return this.ai.raycastToPlayer(centerX, centerY, targetX, targetY);
  }

  // Get the current AI state for external systems
  getAIState() {
    return this.ai ? this.ai.currentState : "none";
  }

  // Check if pig is currently hostile (chasing or attacking)
  isHostile() {
    if (!this.ai) return false;
    return (
      this.ai.currentState === this.ai.AIStates.CHASE ||
      this.ai.currentState === this.ai.AIStates.ATTACK
    );
  }

  // Apply status effect from external source
  applyStatusEffect(effect, duration = 3000) {
    this.statusEffects[effect] = true;
    setTimeout(() => {
      this.statusEffects[effect] = false;
    }, duration);
  }

  // Get pig status for UI/debug
  getStatus() {
    return {
      health: this.life,
      maxHealth: this.maxLife,
      aiState: this.getAIState(),
      isHostile: this.isHostile(),
      statusEffects: this.statusEffects,
      isSpawning: this.isSpawning,
      isDying: this.isDying,
      aggressionLevel: this.ai ? this.ai.aggressionLevel : 1,
    };
  }

  // Enhanced attack with better targeting
  attack() {
    super.attack();

    // Create attack effects
    this.game.particleSystem.createAttackParticles(
      this.x + this.width / 2 + this.direction * 30,
      this.y + this.height / 2,
      this.direction,
      "red",
      4
    );

    // Attack sound
    if (this.game.audioManager) {
      this.game.audioManager.playSound("enemyAttack", 0.8);
    }
  }

  // Clean up when pig is destroyed
  destroy() {
    // Clean up any timers or effects
    this.statusEffects = {};

    // Final death effects
    this.game.particleSystem.createExplosionParticles(
      this.x + this.width / 2,
      this.y + this.height / 2,
      "red",
      20
    );
  }
}
