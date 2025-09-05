class PigAI extends BaseAI {
  constructor(pig) {
    super(pig);
    this.pig = pig; // Reference to the pig entity

    // Pig-specific properties
    this.visionRange = 300;
    this.visionAngle = 120;
    this.attackRange = 80;
    this.losePlayerDistance = 400;

    // Patrol behavior
    this.patrolPoint1 = this.pig.x - 150;
    this.patrolPoint2 = this.pig.x + 150;
    this.patrolTarget = this.patrolPoint2;
    this.patrolSpeed = 1.5;

    // Chase behavior
    this.chaseSpeed = 3;
    this.lastKnownPlayerX = 0;
    this.lastKnownPlayerY = 0;
    this.aggressionLevel = 1; // How aggressive the pig is (affects behavior)

    // Search behavior
    this.searchTimer = 0;
    this.searchDuration = 4000; // 4 seconds of searching
    this.searchMoveTimer = 0;
    this.searchMoveInterval = 1200; // Change search direction every 1.2 seconds

    // Attack behavior
    this.attackCooldown = 0;
    this.attackCooldownTime = 1500; // 1.5 seconds between attacks
    this.comboAttackCount = 0;
    this.maxComboAttacks = 2;

    // Stun behavior
    this.stunTimer = 0;
    this.stunDuration = 800; // 0.8 seconds of being stunned

    // Start in patrol mode
    this.changeState(this.AIStates.PATROL);
  }

  updateAI(deltaTime) {
    // Update cooldowns
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }

    // Check for player detection
    const playerInSight = this.detectPlayer();

    // State machine
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

      default:
        this.changeState(this.AIStates.PATROL);
    }
  }

  handlePatrol(deltaTime, playerInSight) {
    if (playerInSight) {
      this.lastKnownPlayerX = this.game.player.x;
      this.lastKnownPlayerY = this.game.player.y;
      this.changeState(this.AIStates.CHASE);
      return;
    }

    // Simple patrol between two points
    const distanceToTarget = Math.abs(this.pig.x - this.patrolTarget);

    if (distanceToTarget < 20) {
      // Reached patrol point, switch to the other one
      this.patrolTarget =
        this.patrolTarget === this.patrolPoint1
          ? this.patrolPoint2
          : this.patrolPoint1;
    }

    // Move towards patrol target
    this.moveTowardsPoint(this.patrolTarget, this.pig.y, this.patrolSpeed);
  }

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

      // Chase the player with aggression-based speed
      const chaseSpeed = this.chaseSpeed + this.aggressionLevel * 0.5;
      this.moveTowardsPlayer(chaseSpeed);

      // Increase aggression over time when chasing
      if (this.stateTimer > 2000) {
        // After 2 seconds of chasing
        this.aggressionLevel = Math.min(this.aggressionLevel + 0.1, 3);
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

  handleAttack(deltaTime, playerInSight) {
    const player = this.game.player;
    const distanceToPlayer = this.getDistanceToPlayer();

    if (distanceToPlayer <= this.attackRange && this.attackCooldown <= 0) {
      // Face the player and attack
      const dx = player.x - this.pig.x;
      const direction = dx > 0 ? 1 : -1;
      this.pig.turn(direction);
      this.pig.attack();

      this.attackCooldown = this.attackCooldownTime;
      this.comboAttackCount++;

      // Deal damage to player if in range
      this.attemptDamagePlayer();

      // After a combo of attacks, briefly stun or retreat
      if (this.comboAttackCount >= this.maxComboAttacks) {
        this.comboAttackCount = 0;
        this.attackCooldown = this.attackCooldownTime * 1.5; // Longer cooldown
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
      this.aggressionLevel = 1; // Reset aggression
      this.changeState(this.AIStates.PATROL);
      return;
    }

    // Intelligent search movement
    if (this.searchMoveTimer >= this.searchMoveInterval) {
      this.searchMoveTimer = 0;

      // Move towards last known player position with some randomness
      const randomOffset = (Math.random() - 0.5) * 200;
      const searchTargetX = this.lastKnownPlayerX + randomOffset;

      this.moveTowardsPoint(searchTargetX, this.pig.y, this.chaseSpeed * 0.7);

      // Sometimes jump while searching to look around
      if (Math.random() > 0.8 && this.pig.isStanding) {
        this.pig.jump();
      }
    }
  }

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
    }

    // Pig is stunned, slow down gradually
    this.pig.speedX *= 0.85;
    this.pig.idle();
  }

  attemptDamagePlayer() {
    const player = this.game.player;
    const dx = player.x - this.pig.x;
    const distance = Math.abs(dx);

    if (distance < 70) {
      // Check if player and pig hitboxes overlap
      const pigHitbox = {
        x: this.pig.x + this.pig.hitbox.ox,
        y: this.pig.y + this.pig.hitbox.oy,
        width: this.pig.hitbox.width,
        height: this.pig.hitbox.height,
      };

      const playerHitbox = {
        x: player.x + player.hitbox.ox,
        y: player.y + player.hitbox.oy,
        width: player.hitbox.width,
        height: player.hitbox.height,
      };

      if (this.game.checkCollision(pigHitbox, playerHitbox)) {
        const damage = this.pig.damage + this.aggressionLevel * 2;
        player.hit(damage);

        // Knockback effect
        const knockbackDirection = player.x > this.pig.x ? 1 : -1;
        player.speedX = knockbackDirection * (4 + this.aggressionLevel);
      }
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
        // Reduce aggression when stunned
        this.aggressionLevel = Math.max(this.aggressionLevel - 0.3, 1);
        break;

      case this.AIStates.PATROL:
        // Reset patrol target to closest patrol point
        const dist1 = Math.abs(this.pig.x - this.patrolPoint1);
        const dist2 = Math.abs(this.pig.x - this.patrolPoint2);
        this.patrolTarget =
          dist1 < dist2 ? this.patrolPoint2 : this.patrolPoint1;
        break;
    }
  }

  onHit() {
    this.changeState(this.AIStates.STUNNED);

    // Increase aggression when hit
    this.aggressionLevel = Math.min(this.aggressionLevel + 0.5, 3);
  }

  drawDebug(context) {
    // Call base debug drawing
    this.drawDebugBase(context);

    if (!this.game.debug) return;

    const centerX = this.pig.x + this.pig.width / 2;
    const centerY = this.pig.y + this.pig.height / 2;

    // Draw vision cone
    const visionAngleRad = ((this.visionAngle / 2) * Math.PI) / 180;
    const pigFacingAngle = this.pig.direction > 0 ? 0 : Math.PI;

    context.strokeStyle = this.playerDetected ? "red" : "orange";
    context.beginPath();
    context.moveTo(centerX, centerY);

    const angle1 = pigFacingAngle - visionAngleRad;
    const angle2 = pigFacingAngle + visionAngleRad;

    context.lineTo(
      centerX + Math.cos(angle1) * this.visionRange,
      centerY + Math.sin(angle1) * this.visionRange
    );
    context.moveTo(centerX, centerY);
    context.lineTo(
      centerX + Math.cos(angle2) * this.visionRange,
      centerY + Math.sin(angle2) * this.visionRange
    );
    context.stroke();

    // Draw raycast to player if detected
    if (this.playerDetected && this.game.player) {
      context.strokeStyle = "green";
      context.beginPath();
      context.moveTo(centerX, centerY);
      context.lineTo(
        this.game.player.x + this.game.player.width / 2,
        this.game.player.y + this.game.player.height / 2
      );
      context.stroke();
    }

    // Draw raycast hit point if blocked
    if (this.lastRaycastHit) {
      context.fillStyle = "red";
      context.beginPath();
      context.arc(
        this.lastRaycastHit.x,
        this.lastRaycastHit.y,
        5,
        0,
        2 * Math.PI
      );
      context.fill();
    }

    // Draw patrol points
    context.fillStyle = "blue";
    context.fillRect(
      this.patrolPoint1 - 5,
      this.pig.y + this.pig.height + 10,
      10,
      10
    );
    context.fillRect(
      this.patrolPoint2 - 5,
      this.pig.y + this.pig.height + 10,
      10,
      10
    );

    // Draw current patrol target
    context.fillStyle = "cyan";
    context.fillRect(
      this.patrolTarget - 3,
      this.pig.y + this.pig.height + 12,
      6,
      6
    );

    // Draw aggression level
    context.fillStyle = "red";
    context.font = "10px Arial";
    context.fillText(
      `Aggression: ${this.aggressionLevel.toFixed(1)}`,
      this.pig.x,
      this.pig.y - 25
    );

    // Draw last known player position when searching
    if (this.currentState === this.AIStates.SEARCH) {
      context.strokeStyle = "yellow";
      context.strokeRect(
        this.lastKnownPlayerX - 10,
        this.lastKnownPlayerY - 10,
        20,
        20
      );
    }
  }
}
