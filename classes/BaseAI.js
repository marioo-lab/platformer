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

    // Common timers
    this.reactionTime = 100; // Delay before reacting to player
    this.reactionTimer = 0;

    // Debug properties
    this.playerDetected = false;
    this.lastRaycastHit = null;
  }

  update(deltaTime) {
    this.stateTimer += deltaTime;

    // Override in child classes
    this.updateAI(deltaTime);
  }

  updateAI(deltaTime) {
    // To be implemented by child classes
    console.warn("BaseAI.updateAI() should be overridden in child class");
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
    // Override in child classes for state-specific logic
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
