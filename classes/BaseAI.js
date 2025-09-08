class BaseAI {
  constructor(entity) {
    this.entity = entity;
    this.game = entity.game;

    // Common AI States
    this.AIStates = {
      PATROL: "patrol",
      CHASE: "chase",
      ATTACK: "attack",
      SEARCH: "search",
      STUNNED: "stunned",
      IDLE: "idle",
      FLEE: "flee",
    };

    this.currentState = this.AIStates.IDLE;
    this.previousState = this.AIStates.IDLE;
    this.stateTimer = 0;

    // Vision/Detection properties (can be overridden)
    this.visionRange = 200;
    this.visionAngle = 90;
    this.attackRange = 60;
    this.losePlayerDistance = 300;

    // Movement properties
    this.patrolSpeed = 1.5;
    this.chaseSpeed = 3;

    // Combat properties
    this.attackCooldown = 0;
    this.attackCooldownTime = 1500;
    this.comboAttackCount = 0;
    this.maxComboAttacks = 2;

    // Patrol behavior
    this.patrolPoint1 = this.entity.x - 150;
    this.patrolPoint2 = this.entity.x + 150;
    this.patrolTarget = this.patrolPoint2;

    // Chase/Search behavior
    this.lastKnownPlayerX = 0;
    this.lastKnownPlayerY = 0;
    this.aggressionLevel = 1;
    this.maxAggression = 3;

    // Search behavior
    this.searchTimer = 0;
    this.searchDuration = 4000;
    this.searchMoveTimer = 0;
    this.searchMoveInterval = 1200;

    // Stun behavior
    this.stunTimer = 0;
    this.stunDuration = 800;

    // Common timers
    this.reactionTime = 100;
    this.reactionTimer = 0;

    // Debug properties
    this.playerDetected = false;
    this.lastRaycastHit = null;
  }

  update(deltaTime) {
    this.stateTimer += deltaTime;
    this.updateAI(deltaTime);
  }

  updateAI(deltaTime) {
    // Update cooldowns
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }

    // Check for player detection
    const playerInSight = this.detectPlayer();

    // State machine - can be overridden by child classes
    switch (this.currentState) {
      case this.AIStates.PATROL:
        this.handlePatrol(deltaTime, playerInSight);
        break;
      case this.AIStates.CHASE:
        this.handleChase(deltaTime, playerInSight);
        break;
      case this.AIStates.ATTACK:
        this.handleAttack(deltaTime, playerInSight);
        break;
      case this.AIStates.SEARCH:
        this.handleSearch(deltaTime, playerInSight);
        break;
      case this.AIStates.STUNNED:
        this.handleStunned(deltaTime);
        break;
      case this.AIStates.FLEE:
        this.handleFlee(deltaTime, playerInSight);
        break;
      default:
        this.changeState(this.AIStates.PATROL);
    }
  }

  // Base patrol behavior
  handlePatrol(deltaTime, playerInSight) {
    if (playerInSight) {
      this.lastKnownPlayerX = this.game.player.x;
      this.lastKnownPlayerY = this.game.player.y;
      this.changeState(this.AIStates.CHASE);
      return;
    }

    // Simple patrol between two points
    const distanceToTarget = Math.abs(this.entity.x - this.patrolTarget);

    if (distanceToTarget < 20) {
      // Reached patrol point, switch to the other one
      this.patrolTarget =
        this.patrolTarget === this.patrolPoint1
          ? this.patrolPoint2
          : this.patrolPoint1;
    }

    // Move towards patrol target
    this.moveTowardsPoint(this.patrolTarget, this.entity.y, this.patrolSpeed);
  }

  // Base chase behavior
  handleChase(deltaTime, playerInSight) {
    const player = this.game.player;
    const distanceToPlayer = this.getDistanceToPlayer();

    if (playerInSight) {
      // Update last known position
      this.lastKnownPlayerX = player.x;
      this.lastKnownPlayerY = player.y;

      // Check if close enough to attack
      if (this.isPlayerInAttackRange() && this.attackCooldown <= 0) {
        this.changeState(this.AIStates.ATTACK);
        return;
      }

      // Chase the player
      this.moveTowardsPlayer(this.chaseSpeed);

      // Increase aggression over time when chasing
      if (this.stateTimer > 2000) {
        this.aggressionLevel = Math.min(
          this.aggressionLevel + 0.1,
          this.maxAggression
        );
      }
    } else {
      // Lost sight of player
      if (this.shouldLosePlayer()) {
        this.changeState(this.AIStates.SEARCH);
        this.aggressionLevel = Math.max(this.aggressionLevel - 0.5, 1);
      } else {
        // Move towards last known position
        this.moveTowardsPoint(
          this.lastKnownPlayerX,
          this.lastKnownPlayerY,
          this.chaseSpeed
        );
      }
    }
  }

  // Base attack behavior
  handleAttack(deltaTime, playerInSight) {
    const player = this.game.player;
    const distanceToPlayer = this.getDistanceToPlayer();

    if (distanceToPlayer <= this.attackRange && this.attackCooldown <= 0) {
      // Face the player and attack
      const dx = player.x - this.entity.x;
      const direction = dx > 0 ? 1 : -1;
      this.entity.turn(direction);
      this.entity.attack();

      this.attackCooldown = this.attackCooldownTime;
      this.comboAttackCount++;

      // Deal damage to player if in range
      this.attemptDamagePlayer();

      // After a combo of attacks, return to chase
      if (this.comboAttackCount >= this.maxComboAttacks) {
        this.comboAttackCount = 0;
        this.attackCooldown = this.attackCooldownTime * 1.5;
        this.changeState(this.AIStates.CHASE);
      }
    } else {
      // Player moved away or attack is on cooldown
      if (distanceToPlayer > this.attackRange * 1.5) {
        this.changeState(this.AIStates.CHASE);
      } else if (!playerInSight) {
        this.changeState(this.AIStates.SEARCH);
      }
    }
  }

  // Base search behavior
  handleSearch(deltaTime, playerInSight) {
    if (playerInSight) {
      // Found player again!
      this.lastKnownPlayerX = this.game.player.x;
      this.lastKnownPlayerY = this.game.player.y;
      this.changeState(this.AIStates.CHASE);
      return;
    }

    this.searchTimer += deltaTime;
    this.searchMoveTimer += deltaTime;

    if (this.searchTimer >= this.searchDuration) {
      // Give up searching, return to patrol
      this.aggressionLevel = 1;
      this.changeState(this.AIStates.PATROL);
      return;
    }

    // Search movement
    if (this.searchMoveTimer >= this.searchMoveInterval) {
      this.searchMoveTimer = 0;

      // Move towards last known player position with some randomness
      const randomOffset = (Math.random() - 0.5) * 200;
      const searchTargetX = this.lastKnownPlayerX + randomOffset;

      this.moveTowardsPoint(
        searchTargetX,
        this.entity.y,
        this.chaseSpeed * 0.7
      );

      // Sometimes jump while searching
      if (Math.random() > 0.8 && this.entity.isStanding) {
        this.entity.jump();
      }
    }
  }

  // Base stunned behavior
  handleStunned(deltaTime) {
    this.stunTimer += deltaTime;

    if (this.stunTimer >= this.stunDuration) {
      this.stunTimer = 0;
      // Return to appropriate state based on player detection
      if (this.detectPlayer()) {
        this.changeState(this.AIStates.CHASE);
      } else {
        this.changeState(this.AIStates.PATROL);
      }
      return;
    }

    // Entity is stunned, slow down gradually
    this.entity.speedX *= 0.85;
    this.entity.idle();
  }

  // Base flee behavior
  handleFlee(deltaTime, playerInSight) {
    const player = this.game.player;
    const distanceToPlayer = this.getDistanceToPlayer();

    // Flee until safe distance
    if (distanceToPlayer < 200) {
      // Move away from player
      const dx = this.entity.x - player.x;
      const direction = dx > 0 ? 1 : -1;
      this.moveTowardsPoint(
        this.entity.x + direction * 100,
        this.entity.y,
        this.chaseSpeed * 1.2
      );
    } else {
      // Safe distance reached, reassess situation
      if (this.entity.life > this.entity.damage * 2) {
        this.changeState(this.AIStates.CHASE); // Re-engage
      } else {
        this.changeState(this.AIStates.PATROL); // Retreat
      }
    }
  }

  // Base damage dealing method
  attemptDamagePlayer() {
    const player = this.game.player;
    const dx = player.x - this.entity.x;
    const distance = Math.abs(dx);

    if (distance < 70) {
      // Check if player and entity hitboxes overlap
      const entityHitbox = {
        x: this.entity.x + this.entity.hitbox.ox,
        y: this.entity.y + this.entity.hitbox.oy,
        width: this.entity.hitbox.width,
        height: this.entity.hitbox.height,
      };

      const playerHitbox = {
        x: player.x + player.hitbox.ox,
        y: player.y + player.hitbox.oy,
        width: player.hitbox.width,
        height: player.hitbox.height,
      };

      if (this.game.checkCollision(entityHitbox, playerHitbox)) {
        const damage = this.entity.damage + this.aggressionLevel * 2;
        player.hit(damage);

        // Knockback effect
        const knockbackDirection = player.x > this.entity.x ? 1 : -1;
        player.speedX = knockbackDirection * (4 + this.aggressionLevel);
      }
    }
  }

  // Common detection method
  detectPlayer() {
    const player = this.game.player;
    const dx = player.x - this.entity.x;
    const dy = player.y - this.entity.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check if player is within vision range
    if (distance > this.visionRange) {
      this.playerDetected = false;
      return false;
    }

    // Check if player is within vision angle
    const angleToPlayer = Math.atan2(dy, dx) * (180 / Math.PI);
    const entityFacingAngle = this.entity.direction > 0 ? 0 : 180;
    let angleDiff = Math.abs(angleToPlayer - entityFacingAngle);

    // Normalize angle difference
    if (angleDiff > 180) angleDiff = 360 - angleDiff;

    if (angleDiff > this.visionAngle / 2) {
      this.playerDetected = false;
      return false;
    }

    // Perform raycast to check line of sight
    const hasLineOfSight = this.raycastToPlayer(
      this.entity.x + this.entity.width / 2,
      this.entity.y + this.entity.height / 2,
      player.x + player.width / 2,
      player.y + player.height / 2
    );

    this.playerDetected = hasLineOfSight;
    return hasLineOfSight;
  }

  raycastToPlayer(startX, startY, endX, endY) {
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.ceil(distance / 16); // Check every 16 pixels

    const stepX = dx / steps;
    const stepY = dy / steps;

    for (let i = 0; i < steps; i++) {
      const rayX = startX + stepX * i;
      const rayY = startY + stepY * i;

      // Check collision with level blocks
      for (let block of this.game.level.map) {
        if (
          rayX >= block.x &&
          rayX <= block.x + block.width &&
          rayY >= block.y &&
          rayY <= block.y + block.height
        ) {
          this.lastRaycastHit = { x: rayX, y: rayY };
          return false; // Line of sight blocked
        }
      }
    }

    this.lastRaycastHit = null;
    return true; // Clear line of sight
  }

  // State management helpers
  changeState(newState) {
    if (this.currentState !== newState) {
      this.previousState = this.currentState;
      this.currentState = newState;
      this.stateTimer = 0;
      this.onStateChange(this.previousState, newState);
    }
  }

  onStateChange(oldState, newState) {
    // Handle state-specific initialization
    switch (newState) {
      case this.AIStates.ATTACK:
        this.comboAttackCount = 0;
        break;
      case this.AIStates.SEARCH:
        this.searchTimer = 0;
        break;
      case this.AIStates.STUNNED:
        this.stunTimer = 0;
        this.aggressionLevel = Math.max(this.aggressionLevel - 0.3, 1);
        break;
      case this.AIStates.PATROL:
        // Reset patrol target to closest patrol point
        const dist1 = Math.abs(this.entity.x - this.patrolPoint1);
        const dist2 = Math.abs(this.entity.x - this.patrolPoint2);
        this.patrolTarget =
          dist1 < dist2 ? this.patrolPoint2 : this.patrolPoint1;
        break;
    }
  }

  // Common movement patterns
  moveTowardsPlayer(speed = 1) {
    const player = this.game.player;
    const dx = player.x - this.entity.x;
    const direction = dx > 0 ? 1 : -1;

    this.entity.turn(direction);
    this.entity.speedX = direction * speed;
    this.entity.run();
  }

  moveTowardsPoint(targetX, targetY, speed = 1) {
    const dx = targetX - this.entity.x;
    const dy = targetY - this.entity.y;
    const direction = dx > 0 ? 1 : -1;

    this.entity.turn(direction);
    this.entity.speedX = direction * speed;

    // Jump if target is above and entity is grounded
    if (dy < -30 && this.entity.isStanding && Math.abs(dx) < 100) {
      this.entity.jump();
    } else {
      this.entity.run();
    }
  }

  // Distance calculations
  getDistanceToPlayer() {
    const player = this.game.player;
    const dx = player.x - this.entity.x;
    const dy = player.y - this.entity.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getDistanceToPoint(x, y) {
    const dx = x - this.entity.x;
    const dy = y - this.entity.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Common AI behaviors
  lookForPlayer() {
    return this.detectPlayer();
  }

  isPlayerInAttackRange() {
    return this.getDistanceToPlayer() <= this.attackRange;
  }

  shouldLosePlayer() {
    return this.getDistanceToPlayer() > this.losePlayerDistance;
  }

  // Debug visualization (common elements)
  drawDebugBase(context) {
    if (!this.game.debug) return;

    const centerX = this.entity.x + this.entity.width / 2;
    const centerY = this.entity.y + this.entity.height / 2;

    // Draw vision range
    context.strokeStyle = this.playerDetected ? "red" : "yellow";
    context.beginPath();
    context.arc(centerX, centerY, this.visionRange, 0, 2 * Math.PI);
    context.stroke();

    // Draw attack range
    context.strokeStyle = "purple";
    context.beginPath();
    context.arc(centerX, centerY, this.attackRange, 0, 2 * Math.PI);
    context.stroke();

    // Draw AI state
    context.fillStyle = "white";
    context.font = "12px Arial";
    context.fillText(
      `AI: ${this.currentState}`,
      this.entity.x,
      this.entity.y - 10
    );
  }

  // Common event handlers
  onHit() {
    // Default behavior: become stunned
    this.changeState(this.AIStates.STUNNED);
    this.aggressionLevel = Math.min(
      this.aggressionLevel + 0.5,
      this.maxAggression
    );
  }

  onPlayerDeath() {
    // React to player death
    this.changeState(this.AIStates.IDLE);
  }

  onPlayerSpawn() {
    // React to player spawn/respawn
    this.changeState(this.AIStates.PATROL);
  }
}
