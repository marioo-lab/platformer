class UI {
  constructor(game) {
    this.game = game;
    this.width = this.game.width;
    this.height = this.game.height;
    this.fontSize = 25;
    this.fontFamily = "Bangers";
    this.color = "white";
    this.fps = 0;

    // HUD elements positioning
    this.padding = 20;
    this.healthBarWidth = 200;
    this.healthBarHeight = 20;
    this.miniMapSize = 150;

    // Animation properties
    this.scoreDisplayed = 0;
    this.scorePulse = 0;
    this.healthPulse = 0;
    this.waveTextTimer = 0;
    this.showWaveText = false;
    this.waveTextOpacity = 0;

    // Damage indicators
    this.damageIndicators = [];

    // Achievement/notification system
    this.notifications = [];
  }

  update(deltaTime) {
    this.fps = (1000 / deltaTime).toFixed(1);

    // Animate score counter
    if (this.scoreDisplayed < this.game.score) {
      const diff = this.game.score - this.scoreDisplayed;
      this.scoreDisplayed += Math.ceil(diff * 0.1);
    }

    // Update score pulse effect
    this.scorePulse += deltaTime * 0.01;

    // Update health pulse when low
    if (this.game.player.life < 30) {
      this.healthPulse += deltaTime * 0.008;
    }

    // Update wave text animation
    if (this.showWaveText) {
      this.waveTextTimer += deltaTime;

      if (this.waveTextTimer < 500) {
        this.waveTextOpacity = this.waveTextTimer / 500;
      } else if (this.waveTextTimer < 2000) {
        this.waveTextOpacity = 1;
      } else if (this.waveTextTimer < 2500) {
        this.waveTextOpacity = 1 - (this.waveTextTimer - 2000) / 500;
      } else {
        this.showWaveText = false;
        this.waveTextTimer = 0;
      }
    }

    // Update damage indicators
    this.damageIndicators = this.damageIndicators.filter((indicator) => {
      indicator.life -= deltaTime;
      indicator.y -= deltaTime * 0.05;
      indicator.opacity = Math.max(0, indicator.life / indicator.maxLife);
      return indicator.life > 0;
    });

    // Update notifications
    this.notifications = this.notifications.filter((notification) => {
      notification.life -= deltaTime;
      notification.opacity = Math.max(
        0,
        notification.life / notification.maxLife
      );
      return notification.life > 0;
    });
  }

  draw(context) {
    // Only draw UI elements when playing or paused
    if (this.game.currentState === this.game.gameStates.MENU) return;

    context.save();

    this.drawHealthBar(context);
    this.drawScore(context);
    this.drawWaveInfo(context);
    this.drawMiniMap(context);
    this.drawCompass(context);
    this.drawDamageIndicators(context);
    this.drawNotifications(context);

    if (this.showWaveText) {
      this.drawWaveTransition(context);
    }

    if (this.game.debug) {
      this.drawDebugInfo(context);
    }

    context.restore();
  }

  drawHealthBar(context) {
    const x = this.padding;
    const y = this.padding;
    const healthPercentage = this.game.player.life / 100;

    // Background
    context.fillStyle = "rgba(0, 0, 0, 0.5)";
    context.fillRect(
      x - 5,
      y - 5,
      this.healthBarWidth + 10,
      this.healthBarHeight + 10
    );

    // Health bar background
    context.fillStyle = "#333";
    context.fillRect(x, y, this.healthBarWidth, this.healthBarHeight);

    // Health bar fill
    let healthColor = "#4CAF50"; // Green
    if (healthPercentage < 0.5) healthColor = "#FF9800"; // Orange
    if (healthPercentage < 0.3) healthColor = "#F44336"; // Red

    // Add pulse effect when health is low
    if (this.game.player.life < 30) {
      const pulse = Math.sin(this.healthPulse) * 0.3 + 0.7;
      context.globalAlpha = pulse;
    }

    context.fillStyle = healthColor;
    context.fillRect(
      x,
      y,
      this.healthBarWidth * healthPercentage,
      this.healthBarHeight
    );

    context.globalAlpha = 1;

    // Health text
    context.fillStyle = "white";
    context.font = "16px " + this.fontFamily;
    context.textAlign = "left";
    context.shadowOffsetX = 1;
    context.shadowOffsetY = 1;
    context.shadowColor = "black";
    context.fillText(`HP: ${this.game.player.life}`, x, y + 35);

    // Health bar border
    context.strokeStyle = "white";
    context.lineWidth = 2;
    context.strokeRect(x, y, this.healthBarWidth, this.healthBarHeight);
  }

  drawScore(context) {
    const x = this.width - this.padding;
    const y = this.padding;

    context.textAlign = "right";
    context.fillStyle = "white";
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;
    context.shadowColor = "black";

    // Score with pulse effect
    const pulseScale = 1 + Math.sin(this.scorePulse) * 0.05;
    context.save();
    context.scale(pulseScale, pulseScale);

    context.font = "32px " + this.fontFamily;
    context.fillText(
      `SCORE: ${this.scoreDisplayed}`,
      x / pulseScale,
      y / pulseScale + 30
    );

    context.restore();

    // Timer
    context.font = "20px " + this.fontFamily;
    const time = (this.game.gameTime * 0.001).toFixed(1);
    context.fillText(`TIME: ${time}s`, x, y + 65);
  }

  drawWaveInfo(context) {
    const x = this.width / 2;
    const y = this.padding;

    context.textAlign = "center";
    context.fillStyle = "white";
    context.shadowOffsetX = 2;
    context.shadowOffsetY = 2;
    context.shadowColor = "black";
    context.font = "24px " + this.fontFamily;

    context.fillText(`WAVE ${this.game.wave}`, x, y + 25);

    // Enemy counter
    const enemiesLeft = Math.max(
      0,
      this.game.enemiesPerWave - this.game.enemiesKilled
    );
    context.font = "18px " + this.fontFamily;
    context.fillText(
      `Enemies: ${this.game.enemies.length} | Left: ${enemiesLeft}`,
      x,
      y + 50
    );
  }

  drawMiniMap(context) {
    const mapX = this.width - this.miniMapSize - this.padding;
    const mapY = this.height - this.miniMapSize - this.padding;

    // Minimap background
    context.fillStyle = "rgba(0, 0, 0, 0.7)";
    context.fillRect(mapX, mapY, this.miniMapSize, this.miniMapSize);

    context.strokeStyle = "white";
    context.lineWidth = 2;
    context.strokeRect(mapX, mapY, this.miniMapSize, this.miniMapSize);

    // Map scale (assuming world is 2000x800)
    const scaleX = this.miniMapSize / 2000;
    const scaleY = this.miniMapSize / 800;

    // Draw player
    const playerMapX = mapX + this.game.player.x * scaleX;
    const playerMapY = mapY + this.game.player.y * scaleY;

    context.fillStyle = "lime";
    context.beginPath();
    context.arc(playerMapX, playerMapY, 3, 0, Math.PI * 2);
    context.fill();

    // Draw enemies
    context.fillStyle = "red";
    this.game.enemies.forEach((enemy) => {
      const enemyMapX = mapX + enemy.x * scaleX;
      const enemyMapY = mapY + enemy.y * scaleY;

      context.beginPath();
      context.arc(enemyMapX, enemyMapY, 2, 0, Math.PI * 2);
      context.fill();
    });

    // Minimap label
    context.fillStyle = "white";
    context.font = "12px " + this.fontFamily;
    context.textAlign = "center";
    context.fillText("MAP", mapX + this.miniMapSize / 2, mapY - 5);
  }

  drawCompass(context) {
    const compassX = this.padding;
    const compassY = this.height - 80;
    const compassRadius = 25;

    // Compass background
    context.fillStyle = "rgba(0, 0, 0, 0.7)";
    context.beginPath();
    context.arc(
      compassX + compassRadius,
      compassY + compassRadius,
      compassRadius + 5,
      0,
      Math.PI * 2
    );
    context.fill();

    context.strokeStyle = "white";
    context.lineWidth = 2;
    context.stroke();

    // Compass needle pointing to nearest enemy
    let nearestEnemy = null;
    let nearestDistance = Infinity;

    this.game.enemies.forEach((enemy) => {
      const distance = this.game.getDistance(
        this.game.player.x,
        this.game.player.y,
        enemy.x,
        enemy.y
      );
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestEnemy = enemy;
      }
    });

    if (nearestEnemy) {
      const dx = nearestEnemy.x - this.game.player.x;
      const dy = nearestEnemy.y - this.game.player.y;
      const angle = Math.atan2(dy, dx);

      const needleLength = compassRadius * 0.8;
      const needleX = compassX + compassRadius + Math.cos(angle) * needleLength;
      const needleY = compassY + compassRadius + Math.sin(angle) * needleLength;

      context.strokeStyle = "red";
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(compassX + compassRadius, compassY + compassRadius);
      context.lineTo(needleX, needleY);
      context.stroke();

      // Distance text
      context.fillStyle = "white";
      context.font = "10px Arial";
      context.textAlign = "center";
      context.fillText(
        `${Math.floor(nearestDistance)}m`,
        compassX + compassRadius,
        compassY + compassRadius * 2 + 15
      );
    }
  }

  drawWaveTransition(context) {
    context.save();
    context.globalAlpha = this.waveTextOpacity;
    context.fillStyle = "yellow";
    context.textAlign = "center";
    context.font = "48px " + this.fontFamily;
    context.shadowOffsetX = 3;
    context.shadowOffsetY = 3;
    context.shadowColor = "black";

    const scale = 1 + (1 - this.waveTextOpacity) * 0.5;
    context.scale(scale, scale);

    context.fillText(
      `WAVE ${this.game.wave}!`,
      this.width / 2 / scale,
      this.height / 2 / scale
    );
    context.restore();
  }

  drawDamageIndicators(context) {
    this.damageIndicators.forEach((indicator) => {
      context.save();
      context.globalAlpha = indicator.opacity;
      context.fillStyle = indicator.color;
      context.font = "20px " + this.fontFamily;
      context.textAlign = "center";
      context.shadowOffsetX = 1;
      context.shadowOffsetY = 1;
      context.shadowColor = "black";
      context.fillText(`-${indicator.damage}`, indicator.x, indicator.y);
      context.restore();
    });
  }

  drawNotifications(context) {
    this.notifications.forEach((notification, index) => {
      const y = this.height - 150 - index * 30;

      context.save();
      context.globalAlpha = notification.opacity;
      context.fillStyle = notification.color;
      context.font = "18px " + this.fontFamily;
      context.textAlign = "right";
      context.shadowOffsetX = 1;
      context.shadowOffsetY = 1;
      context.shadowColor = "black";
      context.fillText(notification.text, this.width - this.padding, y);
      context.restore();
    });
  }

  drawDebugInfo(context) {
    context.fillStyle = "white";
    context.font = "14px Arial";
    context.textAlign = "left";

    const debugY = this.height - 120;
    context.fillText(`FPS: ${this.fps}`, this.padding, debugY);
    context.fillText(
      `Player: (${Math.floor(this.game.player.x)}, ${Math.floor(
        this.game.player.y
      )})`,
      this.padding,
      debugY + 15
    );
    context.fillText(
      `Camera: (${Math.floor(this.game.camera.x)}, ${Math.floor(
        this.game.camera.y
      )})`,
      this.padding,
      debugY + 30
    );
    context.fillText(
      `Enemies: ${this.game.enemies.length}`,
      this.padding,
      debugY + 45
    );
    context.fillText(
      `Particles: ${this.game.particleSystem.getParticleCount()}`,
      this.padding,
      debugY + 60
    );

    const audioInfo = this.game.audioManager.getDebugInfo();
    context.fillText(
      `Audio: ${audioInfo.enabled ? "ON" : "OFF"}`,
      this.padding,
      debugY + 75
    );
  }

  // Methods to trigger UI effects
  showWaveTransition(wave) {
    this.showWaveText = true;
    this.waveTextTimer = 0;
    this.waveTextOpacity = 0;
  }

  addDamageIndicator(x, y, damage, color = "red") {
    this.damageIndicators.push({
      x: x,
      y: y,
      damage: damage,
      color: color,
      life: 1500,
      maxLife: 1500,
      opacity: 1,
    });
  }

  addNotification(text, color = "yellow", duration = 3000) {
    this.notifications.push({
      text: text,
      color: color,
      life: duration,
      maxLife: duration,
      opacity: 1,
    });
  }

  // Called when player takes damage
  onPlayerDamage(damage) {
    this.addDamageIndicator(
      this.game.player.x + this.game.player.width / 2,
      this.game.player.y,
      damage,
      "red"
    );
  }

  // Called when enemy takes damage
  onEnemyDamage(enemy, damage) {
    this.addDamageIndicator(
      enemy.x + enemy.width / 2,
      enemy.y,
      damage,
      "yellow"
    );
  }

  // Called when wave changes
  onWaveChange(newWave) {
    this.showWaveTransition(newWave);
    this.addNotification(`Wave ${newWave} Started!`, "cyan");
  }

  // Called when achievement unlocked
  onAchievement(text) {
    this.addNotification(text, "gold", 5000);
  }
}
