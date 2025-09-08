// Global game variables
let game = null;
let canvas = null;
let ctx = null;

// Feature detection and initialization
window.addEventListener("load", function () {
  // Initialize canvas
  canvas = document.getElementById("canvas1");
  ctx = canvas.getContext("2d");

  // Set canvas size
  canvas.width = 1024;
  canvas.height = 640;

  // Store reference for input handler
  window.gameCanvas = canvas;

  // Feature detection
  const features = {
    webAudio: !!(window.AudioContext || window.webkitAudioContext),
    webGL: !!canvas.getContext("webgl"),
    touch: "ontouchstart" in window,
    gamepad: !!navigator.getGamepads,
    fullscreen: !!(
      document.fullscreenEnabled || document.webkitFullscreenEnabled
    ),
  };

  console.log("Device features:", features);

  // Show mobile controls on touch devices
  if (features.touch) {
    document.getElementById("mobile-controls").style.display = "block";
  }

  // Initialize game
  try {
    game = new Game(canvas.width, canvas.height);

    // Store game reference globally for debugging
    window.game = game;

    // Hide loading screen
    setTimeout(() => {
      const loadingScreen = document.getElementById("loading-screen");
      loadingScreen.style.opacity = "0";
      loadingScreen.style.transition = "opacity 0.5s ease-out";
      setTimeout(() => {
        loadingScreen.remove();
      }, 500);
    }, 1000);

    console.log("Game initialized successfully!");
    console.log("Available debug commands:");
    console.log("- Press G to toggle debug mode");
    console.log("- Press M to toggle audio");
    console.log('- Type "game.debug = true" in console for debug mode');
    console.log('- Type "game.addEnemy()" to spawn enemy');
  } catch (error) {
    console.error("Failed to initialize game:", error);
    alert("Failed to load game. Please refresh the page.");
    return;
  }

  // Start game loop
  let lastTime = 0;

  function animate(timeStamp) {
    try {
      const deltaTime = timeStamp - lastTime;
      lastTime = timeStamp;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw game
      game.update(deltaTime);
      game.draw(ctx);

      // Draw touch controls if mobile
      if (features.touch && game.input) {
        game.input.drawTouchControls(ctx);
      }

      // Continue animation loop
      requestAnimationFrame(animate);
    } catch (error) {
      console.error("Game loop error:", error);
      // Try to continue despite errors
      requestAnimationFrame(animate);
    }
  }

  // Start the animation loop
  animate(0);
});

// Error handling
window.addEventListener("error", function (event) {
  console.error("Game error:", event.error);
});

// Handle page visibility changes (pause when tab inactive)
document.addEventListener("visibilitychange", function () {
  if (game && game.currentState === game.gameStates.PLAYING) {
    if (document.hidden) {
      // Page is hidden, pause game
      game.currentState = game.gameStates.PAUSED;
      if (game.audioManager) {
        game.audioManager.pauseMusic();
      }
    }
    // Note: We don't auto-resume when page becomes visible
    // to avoid disrupting player who might be doing something else
  }
});

// Handle window resize
window.addEventListener("resize", function () {
  if (canvas) {
    // Keep canvas size fixed for consistent gameplay
    // But could add responsive scaling here if needed
  }
});

// Prevent context menu on canvas (better for gameplay)
document.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("canvas1");
  if (canvas) {
    canvas.addEventListener("contextmenu", function (e) {
      e.preventDefault();
    });
  }
});

// Help function for debugging
window.debugGame = function () {
  if (game) {
    console.log("Game State:", {
      currentState: game.currentState,
      score: game.score,
      wave: game.wave,
      enemies: game.enemies.length,
      playerHealth: game.player.life,
      playerPosition: { x: game.player.x, y: game.player.y },
      cameraPosition: { x: game.camera.x, y: game.camera.y },
      particles: game.particleSystem.getParticleCount(),
    });
  }
};

// Additional debugging utilities
window.gameUtils = {
  // Spawn enemy at specific position
  spawnEnemyAt: function (x, y) {
    if (game) {
      const newPig = new Pig(game);
      newPig.x = x || 500;
      newPig.y = y || 300;
      game.enemies.push(newPig);
      console.log(`Spawned enemy at ${newPig.x}, ${newPig.y}`);
    }
  },

  // Set player health
  setPlayerHealth: function (health) {
    if (game && game.player) {
      game.player.life = Math.max(0, Math.min(100, health));
      console.log(`Player health set to ${game.player.life}`);
    }
  },

  // Set game speed (for testing)
  setGameSpeed: function (speed) {
    if (game) {
      game.speed = speed;
      console.log(`Game speed set to ${speed}`);
    }
  },

  // Toggle AI debug mode
  toggleAIDebug: function () {
    if (game) {
      game.debug = !game.debug;
      console.log(`AI Debug mode: ${game.debug ? "ON" : "OFF"}`);
    }
  },

  // Clear all enemies
  clearEnemies: function () {
    if (game) {
      game.enemies = [];
      console.log("All enemies cleared");
    }
  },

  // Add score
  addScore: function (points) {
    if (game) {
      game.score += points;
      console.log(`Added ${points} points. Total: ${game.score}`);
    }
  },

  // Trigger camera shake
  shakeCamera: function (intensity = 10, duration = 500) {
    if (game && game.camera) {
      game.camera.shake(intensity, duration);
      console.log(
        `Camera shake: intensity ${intensity}, duration ${duration}ms`
      );
    }
  },

  // Get game statistics
  getStats: function () {
    if (game) {
      return {
        gameTime: (game.gameTime * 0.001).toFixed(1) + "s",
        score: game.score,
        wave: game.wave,
        enemies: game.enemies.length,
        particles: game.particleSystem.getParticleCount(),
        playerHealth: game.player.life,
        playerPosition: {
          x: Math.floor(game.player.x),
          y: Math.floor(game.player.y),
        },
        cameraPosition: {
          x: Math.floor(game.camera.x),
          y: Math.floor(game.camera.y),
        },
        audioEnabled: game.audioManager.enabled,
      };
    }
    return null;
  },
};

// Console help
window.help = function () {
  console.log("=== ENHANCED PLATFORMER DEBUG COMMANDS ===");
  console.log("");
  console.log("Keyboard Shortcuts:");
  console.log("  G - Toggle debug mode");
  console.log("  M - Toggle audio");
  console.log("  P/ESC - Pause game");
  console.log("  F11 - Toggle fullscreen");
  console.log("  1/2/3 - Debug shortcuts (when debug mode on)");
  console.log("");
  console.log("Console Commands:");
  console.log("  debugGame() - Show current game state");
  console.log("  gameUtils.getStats() - Get detailed statistics");
  console.log("  gameUtils.spawnEnemyAt(x, y) - Spawn enemy at position");
  console.log(
    "  gameUtils.setPlayerHealth(health) - Set player health (0-100)"
  );
  console.log("  gameUtils.addScore(points) - Add score points");
  console.log(
    "  gameUtils.shakeCamera(intensity, duration) - Trigger camera shake"
  );
  console.log("  gameUtils.clearEnemies() - Remove all enemies");
  console.log("  gameUtils.toggleAIDebug() - Toggle AI debug visualization");
  console.log("");
  console.log("Examples:");
  console.log("  gameUtils.spawnEnemyAt(400, 300)");
  console.log("  gameUtils.setPlayerHealth(50)");
  console.log("  gameUtils.addScore(1000)");
  console.log("  gameUtils.shakeCamera(15, 1000)");
  console.log("");
  console.log("Global Variables:");
  console.log("  game - Main game instance");
  console.log("  canvas - Game canvas element");
  console.log("  ctx - Canvas 2D context");
};

// Show help on first load
setTimeout(() => {
  if (game) {
    console.log("🎮 Enhanced Platformer loaded successfully!");
    console.log("Type help() for debug commands or press G for debug mode");
  }
}, 2000);
