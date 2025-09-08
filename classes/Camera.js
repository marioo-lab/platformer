class Camera {
  constructor(game) {
    this.game = game;
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;

    // Camera bounds
    this.minX = 0;
    this.maxX = 2000; // Adjust based on level width
    this.minY = -200;
    this.maxY = 200;

    // Smoothing factors
    this.smoothness = 0.1;
    this.lookAhead = 100; // How far ahead to look when player moves

    // Screen shake effects
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTimer = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;

    // Zoom effects (for future expansion)
    this.zoom = 1;
    this.targetZoom = 1;

    // Dead zone - area where player can move without camera following
    this.deadZone = {
      x: this.game.width * 0.3,
      y: this.game.height * 0.3,
      width: this.game.width * 0.4,
      height: this.game.height * 0.4,
    };
  }

  update(deltaTime) {
    this.updateTarget();
    this.updatePosition(deltaTime);
    this.updateShake(deltaTime);
  }

  updateTarget() {
    const player = this.game.player;

    // Basic following with look-ahead
    let targetX = player.x + player.width / 2 - this.game.width / 2;
    let targetY = player.y + player.height / 2 - this.game.height / 2;

    // Add look-ahead based on player movement
    if (Math.abs(player.speedX) > 1) {
      targetX += player.direction * this.lookAhead;
    }

    // Dead zone implementation
    const playerScreenX = player.x - this.x;
    const playerScreenY = player.y - this.y;

    // Only move camera if player is outside dead zone
    if (playerScreenX < this.deadZone.x) {
      targetX = player.x - this.deadZone.x;
    } else if (playerScreenX > this.deadZone.x + this.deadZone.width) {
      targetX = player.x - (this.deadZone.x + this.deadZone.width);
    } else {
      targetX = this.x; // Don't move horizontally
    }

    if (playerScreenY < this.deadZone.y) {
      targetY = player.y - this.deadZone.y;
    } else if (playerScreenY > this.deadZone.y + this.deadZone.height) {
      targetY = player.y - (this.deadZone.y + this.deadZone.height);
    } else {
      targetY = this.y; // Don't move vertically
    }

    // Apply bounds
    this.targetX = Math.max(
      this.minX,
      Math.min(this.maxX - this.game.width, targetX)
    );
    this.targetY = Math.max(this.minY, Math.min(this.maxY, targetY));
  }

  updatePosition(deltaTime) {
    // Smooth interpolation to target position
    this.x = this.game.lerp(this.x, this.targetX, this.smoothness);
    this.y = this.game.lerp(this.y, this.targetY, this.smoothness);

    // Snap to target if very close (prevents infinite micro-movements)
    if (Math.abs(this.x - this.targetX) < 0.1) this.x = this.targetX;
    if (Math.abs(this.y - this.targetY) < 0.1) this.y = this.targetY;
  }

  updateShake(deltaTime) {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= deltaTime;

      // Generate random shake offset
      const shakeAmount =
        this.shakeIntensity * (this.shakeTimer / this.shakeDuration);
      this.shakeOffsetX = (Math.random() - 0.5) * shakeAmount;
      this.shakeOffsetY = (Math.random() - 0.5) * shakeAmount;

      if (this.shakeTimer <= 0) {
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
        this.shakeIntensity = 0;
      }
    }
  }

  apply(context) {
    // Apply camera transformation with shake offset
    context.translate(-this.x + this.shakeOffsetX, -this.y + this.shakeOffsetY);

    if (this.zoom !== 1) {
      context.scale(this.zoom, this.zoom);
    }
  }

  shake(intensity, duration) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }

  // Get world coordinates from screen coordinates
  screenToWorld(screenX, screenY) {
    return {
      x: screenX + this.x,
      y: screenY + this.y,
    };
  }

  // Get screen coordinates from world coordinates
  worldToScreen(worldX, worldY) {
    return {
      x: worldX - this.x,
      y: worldY - this.y,
    };
  }

  // Check if a world position is visible on screen
  isVisible(worldX, worldY, width = 0, height = 0) {
    return (
      worldX + width >= this.x &&
      worldX <= this.x + this.game.width &&
      worldY + height >= this.y &&
      worldY <= this.y + this.game.height
    );
  }

  // Focus camera on a specific position instantly
  focusOn(x, y) {
    this.x = x - this.game.width / 2;
    this.y = y - this.game.height / 2;
    this.targetX = this.x;
    this.targetY = this.y;

    // Apply bounds
    this.x = Math.max(this.minX, Math.min(this.maxX - this.game.width, this.x));
    this.y = Math.max(this.minY, Math.min(this.maxY, this.y));
  }

  // Reset camera to default position
  reset() {
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTimer = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
    this.zoom = 1;
    this.targetZoom = 1;
  }

  // Smooth zoom (for future use)
  setZoom(targetZoom, smooth = true) {
    if (smooth) {
      this.targetZoom = targetZoom;
    } else {
      this.zoom = targetZoom;
      this.targetZoom = targetZoom;
    }
  }

  // Update camera bounds (useful for different levels)
  setBounds(minX, maxX, minY, maxY) {
    this.minX = minX;
    this.maxX = maxX;
    this.minY = minY;
    this.maxY = maxY;
  }

  // Set camera smoothness (0 = instant, 1 = very slow)
  setSmoothness(smoothness) {
    this.smoothness = Math.max(0, Math.min(1, smoothness));
  }

  // Debug visualization
  drawDebug(context) {
    if (!this.game.debug) return;

    context.save();
    context.strokeStyle = "yellow";
    context.lineWidth = 2;

    // Draw dead zone
    context.strokeRect(
      this.deadZone.x,
      this.deadZone.y,
      this.deadZone.width,
      this.deadZone.height
    );

    // Draw camera info
    context.fillStyle = "white";
    context.font = "12px Arial";
    context.fillText(
      `Camera: ${this.x.toFixed(1)}, ${this.y.toFixed(1)}`,
      10,
      this.game.height - 60
    );
    context.fillText(
      `Target: ${this.targetX.toFixed(1)}, ${this.targetY.toFixed(1)}`,
      10,
      this.game.height - 45
    );
    context.fillText(
      `Shake: ${this.shakeIntensity.toFixed(1)}`,
      10,
      this.game.height - 30
    );

    context.restore();
  }
}
