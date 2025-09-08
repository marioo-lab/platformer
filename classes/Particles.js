class Particle {
  constructor(x, y, speedX, speedY, color, size, life, gravity = 0.2) {
    this.x = x;
    this.y = y;
    this.speedX = speedX;
    this.speedY = speedY;
    this.color = color;
    this.size = size;
    this.life = life;
    this.maxLife = life;
    this.gravity = gravity;
    this.alpha = 1;
    this.decay = 1 / life; // Alpha decay rate
    this.bounceCount = 0;
    this.maxBounces = 2;
    this.bounceDamping = 0.6;
  }

  update(deltaTime) {
    // Update position
    this.x += this.speedX * deltaTime * 0.01;
    this.y += this.speedY * deltaTime * 0.01;

    // Apply gravity
    this.speedY += this.gravity * deltaTime * 0.01;

    // Simple ground bounce (for certain particle types)
    if (this.y > 600 && this.speedY > 0 && this.bounceCount < this.maxBounces) {
      this.y = 600;
      this.speedY *= -this.bounceDamping;
      this.speedX *= this.bounceDamping;
      this.bounceCount++;
    }

    // Update life and alpha
    this.life -= deltaTime;
    this.alpha = Math.max(0, this.life / this.maxLife);

    return this.life > 0;
  }

  draw(context) {
    context.save();
    context.globalAlpha = this.alpha;
    context.fillStyle = this.color;
    context.beginPath();
    context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
}

class ParticleSystem {
  constructor(game) {
    this.game = game;
    this.particles = [];
    this.maxParticles = 200; // Limit for performance
  }

  update(deltaTime) {
    // Update all particles and remove dead ones
    this.particles = this.particles.filter((particle) =>
      particle.update(deltaTime)
    );

    // Limit particle count for performance
    if (this.particles.length > this.maxParticles) {
      this.particles.splice(0, this.particles.length - this.maxParticles);
    }
  }

  draw(context) {
    this.particles.forEach((particle) => particle.draw(context));
  }

  addParticle(
    x,
    y,
    speedX,
    speedY,
    color,
    size = 3,
    life = 1000,
    gravity = 0.2
  ) {
    const particle = new Particle(
      x,
      y,
      speedX,
      speedY,
      color,
      size,
      life,
      gravity
    );
    this.particles.push(particle);
  }

  // Create explosion effect
  createExplosionParticles(x, y, color = "orange", count = 15) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 50 + Math.random() * 100;
      const speedX = Math.cos(angle) * speed;
      const speedY = Math.sin(angle) * speed;
      const size = 2 + Math.random() * 4;
      const life = 800 + Math.random() * 400;

      // Vary the color slightly
      let particleColor = color;
      if (color === "orange") {
        const colors = ["orange", "red", "yellow", "#ff6600"];
        particleColor = colors[Math.floor(Math.random() * colors.length)];
      }

      this.addParticle(x, y, speedX, speedY, particleColor, size, life, 0.1);
    }
  }

  // Create impact/hit effect
  createImpactParticles(x, y, color = "red", count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 50;
      const speedX = Math.cos(angle) * speed;
      const speedY = Math.sin(angle) * speed - 20; // Slight upward bias
      const size = 2 + Math.random() * 3;
      const life = 600 + Math.random() * 300;

      this.addParticle(x, y, speedX, speedY, color, size, life, 0.15);
    }
  }

  // Create attack slash effect
  createAttackParticles(x, y, direction, color = "white", count = 6) {
    for (let i = 0; i < count; i++) {
      const baseAngle = direction > 0 ? 0 : Math.PI;
      const angle = baseAngle + (Math.random() - 0.5) * Math.PI * 0.5;
      const speed = 40 + Math.random() * 60;
      const speedX = Math.cos(angle) * speed;
      const speedY = Math.sin(angle) * speed;
      const size = 1 + Math.random() * 2;
      const life = 400 + Math.random() * 200;

      // Add some sparkle colors
      const colors = ["white", "yellow", "cyan", "#ffff99"];
      const particleColor = colors[Math.floor(Math.random() * colors.length)];

      this.addParticle(x, y, speedX, speedY, particleColor, size, life, 0.05);
    }
  }

  // Create jump dust effect
  createJumpDust(x, y, count = 5) {
    for (let i = 0; i < count; i++) {
      const speedX = (Math.random() - 0.5) * 30;
      const speedY = -10 - Math.random() * 20;
      const size = 1 + Math.random() * 2;
      const life = 400 + Math.random() * 200;
      const color = "#8B4513"; // Brown dust color

      this.addParticle(x, y, speedX, speedY, color, size, life, 0.1);
    }
  }

  // Create landing dust effect
  createLandingDust(x, y, count = 8) {
    for (let i = 0; i < count; i++) {
      const speedX = (Math.random() - 0.5) * 60;
      const speedY = -5 - Math.random() * 15;
      const size = 1 + Math.random() * 3;
      const life = 600 + Math.random() * 300;
      const color = "#8B4513"; // Brown dust color

      this.addParticle(x, y, speedX, speedY, color, size, life, 0.08);
    }
  }

  // Create running dust trail
  createRunningDust(x, y) {
    if (Math.random() > 0.7) {
      // Don't create every frame
      const speedX = (Math.random() - 0.5) * 20;
      const speedY = -5 - Math.random() * 10;
      const size = 1 + Math.random();
      const life = 300 + Math.random() * 200;
      const color = "#8B4513";

      this.addParticle(x, y, speedX, speedY, color, size, life, 0.05);
    }
  }

  // Create celebration/power-up particles
  createCelebrationParticles(x, y, count = 20) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 20 + Math.random() * 40;
      const speedX = Math.cos(angle) * speed;
      const speedY = Math.sin(angle) * speed - 30; // Upward bias
      const size = 2 + Math.random() * 3;
      const life = 1000 + Math.random() * 500;

      // Rainbow colors
      const colors = [
        "red",
        "orange",
        "yellow",
        "green",
        "blue",
        "purple",
        "pink",
      ];
      const color = colors[Math.floor(Math.random() * colors.length)];

      this.addParticle(x, y, speedX, speedY, color, size, life, 0.05);
    }
  }

  // Create trail effect (for moving objects)
  createTrail(x, y, color = "white", intensity = 0.3) {
    if (Math.random() > intensity) return;

    const speedX = (Math.random() - 0.5) * 10;
    const speedY = (Math.random() - 0.5) * 10;
    const size = 1 + Math.random();
    const life = 200 + Math.random() * 100;

    this.addParticle(x, y, speedX, speedY, color, size, life, 0.02);
  }

  // Create blood effect (if needed)
  createBloodParticles(x, y, direction, count = 6) {
    for (let i = 0; i < count; i++) {
      const baseAngle = direction > 0 ? Math.PI : 0;
      const angle = baseAngle + (Math.random() - 0.5) * Math.PI * 0.8;
      const speed = 20 + Math.random() * 40;
      const speedX = Math.cos(angle) * speed;
      const speedY = Math.sin(angle) * speed - 10;
      const size = 1 + Math.random() * 2;
      const life = 800 + Math.random() * 400;

      const colors = ["#8B0000", "#FF0000", "#DC143C"];
      const color = colors[Math.floor(Math.random() * colors.length)];

      this.addParticle(x, y, speedX, speedY, color, size, life, 0.2);
    }
  }

  // Create enemy spawn effect
  createSpawnEffect(x, y, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = 30 + Math.random() * 20;
      const speedX = Math.cos(angle) * speed;
      const speedY = Math.sin(angle) * speed;
      const size = 2 + Math.random() * 2;
      const life = 600 + Math.random() * 300;

      const colors = ["purple", "magenta", "#8A2BE2"];
      const color = colors[Math.floor(Math.random() * colors.length)];

      this.addParticle(x, y, speedX, speedY, color, size, life, 0.1);
    }
  }

  clear() {
    this.particles = [];
  }

  getParticleCount() {
    return this.particles.length;
  }

  // Debug info
  drawDebug(context) {
    if (!this.game.debug) return;

    context.save();
    context.fillStyle = "white";
    context.font = "12px Arial";
    context.fillText(
      `Particles: ${this.particles.length}`,
      10,
      this.game.height - 15
    );
    context.restore();
  }
}
