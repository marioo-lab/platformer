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
    this.life = 10;
    this.attackTimer = 500;
    this.attackInterval = 500;
    this.isStanding = false;
    this.damage = 10; // Changed to positive value for damage dealt
    this.direction = -1;
    this.hitbox = {
      ox: 20,
      oy: 20,
      width: 38,
      height: 36,
    };
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
  }

  // Override the hit method to notify AI
  hit(points) {
    super.hit(points); // Call parent hit method

    // Notify AI that pig was hit
    if (this.ai && this.ai.onHit) {
      this.ai.onHit();
    }
  }

  // Override draw to include AI debug visualization
  draw(context) {
    super.draw(context);

    // Draw AI debug information
    if (this.ai && this.ai.drawDebug) {
      this.ai.drawDebug(context);
    }
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
}
