class PigAI extends BaseAI {
  constructor(pig) {
    super(pig);
    this.pig = pig; // Reference to the pig entity

    // Pig-specific properties (override base values)
    this.visionRange = 300;
    this.visionAngle = 120;
    this.attackRange = 80;
    this.losePlayerDistance = 400;

    this.patrolSpeed = 1.5;
    this.chaseSpeed = 3;
    this.attackCooldownTime = 1500;
    this.maxComboAttacks = 2;

    this.stunDuration = 800;
    this.searchDuration = 4000;

    // Pig-specific behavior modifiers
    this.hearingRange = 200; // Pigs can hear player footsteps
    this.maxAggression = 3;

    // Start in patrol mode
    this.changeState(this.AIStates.PATROL);
  }

  // Override detection to add hearing
  detectPlayer() {
    // First check vision (from base class)
    const visualDetection = super.detectPlayer();

    if (visualDetection) {
      return true;
    }

    // If no visual detection, check hearing
    return this.hearPlayer();
  }

  // Pig-specific hearing ability
  hearPlayer() {
    const player = this.game.player;
    const distance = this.getDistanceToPlayer();

    if (distance > this.hearingRange) return false;

    // Player makes noise when running, jumping, or attacking
    const isNoisy =
      Math.abs(player.speedX) > 2 ||
      player.state === player.States.jump ||
      player.state === player.States.attack ||
      player.state === player.States.run;

    if (isNoisy) {
      this.lastKnownPlayerX = player.x;
      this.lastKnownPlayerY = player.y;
      return true;
    }

    return false;
  }

  // Override chase behavior for pig-specific tactics
  handleChase(deltaTime, playerInSight) {
    // Call base chase behavior first
    super.handleChase(deltaTime, playerInSight);

    // Add pig-specific chase enhancements
    if (playerInSight && this.stateTimer > 3000) {
      // After 3 seconds of chasing, pigs get more aggressive
      this.chaseSpeed = Math.min(this.chaseSpeed + 0.1, 4);
    }
  }

  // Override attack behavior for pig-specific combat
  handleAttack(deltaTime, playerInSight) {
    // Call base attack behavior
    super.handleAttack(deltaTime, playerInSight);

    // Add pig-specific attack effects
    if (this.pig.state === this.pig.States.attack) {
      // Create attack particles for visual feedback
      if (this.game.particleSystem && Math.random() > 0.7) {
        this.game.particleSystem.createAttackParticles(
          this.pig.x + this.pig.width / 2,
          this.pig.y + this.pig.height / 2,
          this.pig.direction,
          "red",
          3
        );
      }
    }
  }

  // Override damage dealing for pig-specific damage calculation
  attemptDamagePlayer() {
    const player = this.game.player;
    const dx = player.x - this.pig.x;
    const distance = Math.abs(dx);

    if (distance < 70) {
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
        // Pig-specific damage calculation
        const baseDamage = this.pig.damage;
        const aggressionBonus = this.aggressionLevel * 2;
        const damage = baseDamage + aggressionBonus;

        player.hit(damage);

        // Pig-specific knockback
        const knockbackDirection = player.x > this.pig.x ? 1 : -1;
        const knockbackForce = 4 + this.aggressionLevel;
        player.speedX = knockbackDirection * knockbackForce;

        // Pig attack sound
        if (this.game.audioManager) {
          this.game.audioManager.playSound("enemyAttack", 0.8);
        }
      }
    }
  }

  // Override state change for pig-specific state handling
  onStateChange(oldState, newState) {
    // Call base state change
    super.onStateChange(oldState, newState);

    // Pig-specific state change behaviors
    switch (newState) {
      case this.AIStates.ATTACK:
        // Pigs snort when attacking (could add sound here)
        break;

      case this.AIStates.CHASE:
        // Reset chase speed when starting new chase
        this.chaseSpeed = 3;
        break;

      case this.AIStates.STUNNED:
        // Pigs make pain sound when stunned
        if (this.game.audioManager) {
          this.game.audioManager.playSound("enemyHit", 0.6);
        }
        break;
    }
  }

  // Override hit response for pig-specific reaction
  onHit() {
    // Call base hit response
    super.onHit();

    // Pig-specific hit effects
    if (this.game.particleSystem) {
      this.game.particleSystem.createBloodParticles(
        this.pig.x + this.pig.width / 2,
        this.pig.y + this.pig.height / 2,
        -this.pig.direction,
        5
      );
    }

    // Increase pig aggression more than base amount
    this.aggressionLevel = Math.min(
      this.aggressionLevel + 0.7,
      this.maxAggression
    );
  }

  // Pig-specific debug visualization
  drawDebug(context) {
    // Call base debug drawing
    this.drawDebugBase(context);

    if (!this.game.debug) return;

    const centerX = this.pig.x + this.pig.width / 2;
    const centerY = this.pig.y + this.pig.height / 2;

    // Draw pig-specific vision cone
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

    // Draw hearing range (pig-specific)
    context.strokeStyle = "purple";
    context.setLineDash([5, 5]);
    context.beginPath();
    context.arc(centerX, centerY, this.hearingRange, 0, 2 * Math.PI);
    context.stroke();
    context.setLineDash([]);

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

    // Draw pig-specific info
    context.fillStyle = "white";
    context.font = "10px Arial";
    context.fillText(
      `Aggression: ${this.aggressionLevel.toFixed(1)}`,
      this.pig.x,
      this.pig.y - 25
    );
    context.fillText(
      `Chase Speed: ${this.chaseSpeed.toFixed(1)}`,
      this.pig.x,
      this.pig.y - 40
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

  // Pig-specific utility methods
  makeNoise() {
    // Could be used for pig sounds/grunts
    if (this.game.audioManager && Math.random() > 0.95) {
      // Occasional pig grunt sounds (very rare)
      this.game.audioManager.playSound("pickup", 0.3);
    }
  }

  // Get pig-specific status
  getPigStatus() {
    return {
      ...this.getBaseStatus(),
      hearingRange: this.hearingRange,
      chaseSpeed: this.chaseSpeed,
      maxAggression: this.maxAggression,
      canHearPlayer: this.hearPlayer(),
    };
  }

  getBaseStatus() {
    return {
      state: this.currentState,
      aggressionLevel: this.aggressionLevel,
      playerDetected: this.playerDetected,
      distanceToPlayer: this.getDistanceToPlayer(),
      health: this.pig.life,
      position: { x: this.pig.x, y: this.pig.y },
    };
  }
}
