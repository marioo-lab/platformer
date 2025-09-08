class InputHandler {
  constructor(game) {
    this.game = game;
    this.touchControls = {
      enabled: false,
      buttons: {},
    };

    this.setupKeyboardControls();
    this.setupTouchControls();
    this.setupGamepadSupport();
  }

  setupKeyboardControls() {
    window.addEventListener("keydown", (e) => {
      this.handleKeyDown(e);
    });

    window.addEventListener("keyup", (e) => {
      this.handleKeyUp(e);
    });

    // Prevent context menu on right click for better gameplay
    window.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
  }

  handleKeyDown(e) {
    // Prevent default browser behavior for game keys
    if (
      ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
        e.code
      )
    ) {
      e.preventDefault();
    }

    switch (e.code) {
      case "Space":
        if (!this.game.keys.attack.pressed) {
          this.game.keys.attack.pressed = true;
          this.game.keys.attack.handled = false;
        }
        break;

      case "ArrowUp":
      case "KeyW":
        if (!this.game.keys.jump.pressed) {
          this.game.keys.jump.pressed = true;
          this.game.keys.jump.handled = false;
        }
        // Menu navigation
        if (!this.game.keys.up.pressed) {
          this.game.keys.up.pressed = true;
          this.game.keys.up.handled = false;
        }
        break;

      case "ArrowDown":
      case "KeyS":
        if (!this.game.keys.hit.pressed) {
          this.game.keys.hit.pressed = true;
          this.game.keys.hit.handled = false;
        }
        // Menu navigation
        if (!this.game.keys.down.pressed) {
          this.game.keys.down.pressed = true;
          this.game.keys.down.handled = false;
        }
        break;

      case "ArrowLeft":
      case "KeyA":
        this.game.keys.left.pressed = true;
        break;

      case "ArrowRight":
      case "KeyD":
        this.game.keys.right.pressed = true;
        break;

      case "Enter":
        if (!this.game.keys.enter.pressed) {
          this.game.keys.enter.pressed = true;
          this.game.keys.enter.handled = false;
        }
        break;

      case "KeyP":
      case "Escape":
        if (!this.game.keys.pause.pressed) {
          this.game.keys.pause.pressed = true;
          this.game.keys.pause.handled = false;
        }
        break;

      case "KeyG":
        this.game.debug = !this.game.debug;
        break;

      case "KeyM":
        // Toggle audio
        const enabled = this.game.audioManager.toggle();
        this.game.ui.addNotification(
          `Audio: ${enabled ? "ON" : "OFF"}`,
          "cyan"
        );
        break;

      case "KeyR":
        // Quick restart (only in game over state)
        if (this.game.currentState === this.game.gameStates.GAME_OVER) {
          this.game.resetGame();
        }
        break;

      case "F11":
        // Toggle fullscreen
        this.toggleFullscreen();
        break;

      // Number keys for quick actions (debug/testing)
      case "Digit1":
        if (this.game.debug) {
          this.game.player.life = Math.min(100, this.game.player.life + 20);
        }
        break;

      case "Digit2":
        if (this.game.debug) {
          this.game.score += 1000;
        }
        break;

      case "Digit3":
        if (this.game.debug) {
          this.game.addEnemy();
        }
        break;
    }
  }

  handleKeyUp(e) {
    switch (e.code) {
      case "Space":
        this.game.keys.attack.pressed = false;
        break;

      case "ArrowUp":
      case "KeyW":
        this.game.keys.jump.pressed = false;
        this.game.keys.up.pressed = false;
        break;

      case "ArrowDown":
      case "KeyS":
        this.game.keys.hit.pressed = false;
        this.game.keys.down.pressed = false;
        break;

      case "ArrowLeft":
      case "KeyA":
        this.game.keys.left.pressed = false;
        break;

      case "ArrowRight":
      case "KeyD":
        this.game.keys.right.pressed = false;
        break;

      case "Enter":
        this.game.keys.enter.pressed = false;
        break;

      case "KeyP":
      case "Escape":
        this.game.keys.pause.pressed = false;
        break;
    }
  }

  setupTouchControls() {
    // Create touch control buttons for mobile
    this.createTouchButtons();

    // Touch event handlers
    window.addEventListener("touchstart", (e) => {
      e.preventDefault();
      this.handleTouchStart(e);
    });

    window.addEventListener("touchmove", (e) => {
      e.preventDefault();
      this.handleTouchMove(e);
    });

    window.addEventListener("touchend", (e) => {
      e.preventDefault();
      this.handleTouchEnd(e);
    });
  }

  createTouchButtons() {
    if (!("ontouchstart" in window)) return;

    this.touchControls.enabled = true;

    // Create virtual buttons for mobile
    const buttonSize = 60;
    const padding = 20;

    this.touchControls.buttons = {
      left: {
        x: padding,
        y: this.game.height - buttonSize - padding,
        width: buttonSize,
        height: buttonSize,
        pressed: false,
      },
      right: {
        x: padding + buttonSize + 10,
        y: this.game.height - buttonSize - padding,
        width: buttonSize,
        height: buttonSize,
        pressed: false,
      },
      jump: {
        x: this.game.width - buttonSize * 2 - padding - 10,
        y: this.game.height - buttonSize - padding,
        width: buttonSize,
        height: buttonSize,
        pressed: false,
      },
      attack: {
        x: this.game.width - buttonSize - padding,
        y: this.game.height - buttonSize - padding,
        width: buttonSize,
        height: buttonSize,
        pressed: false,
      },
    };
  }

  handleTouchStart(e) {
    if (!this.touchControls.enabled) return;

    Array.from(e.touches).forEach((touch) => {
      const rect = this.game.canvas?.getBoundingClientRect() || {
        left: 0,
        top: 0,
      };
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      // Check which button was touched
      Object.keys(this.touchControls.buttons).forEach((buttonName) => {
        const button = this.touchControls.buttons[buttonName];

        if (
          x >= button.x &&
          x <= button.x + button.width &&
          y >= button.y &&
          y <= button.y + button.height
        ) {
          button.pressed = true;
          this.handleVirtualButtonPress(buttonName, true);
        }
      });
    });
  }

  handleTouchMove(e) {
    // Handle touch drag if needed
  }

  handleTouchEnd(e) {
    if (!this.touchControls.enabled) return;

    // Reset all touch buttons
    Object.keys(this.touchControls.buttons).forEach((buttonName) => {
      const button = this.touchControls.buttons[buttonName];
      if (button.pressed) {
        button.pressed = false;
        this.handleVirtualButtonPress(buttonName, false);
      }
    });
  }

  handleVirtualButtonPress(buttonName, pressed) {
    switch (buttonName) {
      case "left":
        this.game.keys.left.pressed = pressed;
        break;
      case "right":
        this.game.keys.right.pressed = pressed;
        break;
      case "jump":
        if (pressed && !this.game.keys.jump.pressed) {
          this.game.keys.jump.pressed = true;
          this.game.keys.jump.handled = false;
        } else if (!pressed) {
          this.game.keys.jump.pressed = false;
        }
        break;
      case "attack":
        if (pressed && !this.game.keys.attack.pressed) {
          this.game.keys.attack.pressed = true;
          this.game.keys.attack.handled = false;
        } else if (!pressed) {
          this.game.keys.attack.pressed = false;
        }
        break;
    }
  }

  setupGamepadSupport() {
    // Basic gamepad support
    window.addEventListener("gamepadconnected", (e) => {
      console.log("Gamepad connected:", e.gamepad);
      this.game.ui.addNotification("Gamepad Connected!", "green");
    });

    window.addEventListener("gamepaddisconnected", (e) => {
      console.log("Gamepad disconnected");
      this.game.ui.addNotification("Gamepad Disconnected", "red");
    });
  }

  updateGamepad() {
    const gamepads = navigator.getGamepads();

    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i];
      if (!gamepad) continue;

      // D-pad or left stick for movement
      const leftStickX = gamepad.axes[0];
      const leftStickY = gamepad.axes[1];

      // Handle horizontal movement
      if (leftStickX < -0.3 || gamepad.buttons[14]?.pressed) {
        this.game.keys.left.pressed = true;
      } else {
        this.game.keys.left.pressed = false;
      }

      if (leftStickX > 0.3 || gamepad.buttons[15]?.pressed) {
        this.game.keys.right.pressed = true;
      } else {
        this.game.keys.right.pressed = false;
      }

      // Jump (A button or up on d-pad)
      if (gamepad.buttons[0]?.pressed || gamepad.buttons[12]?.pressed) {
        if (!this.game.keys.jump.pressed) {
          this.game.keys.jump.pressed = true;
          this.game.keys.jump.handled = false;
        }
      } else {
        this.game.keys.jump.pressed = false;
      }

      // Attack (X button)
      if (gamepad.buttons[2]?.pressed) {
        if (!this.game.keys.attack.pressed) {
          this.game.keys.attack.pressed = true;
          this.game.keys.attack.handled = false;
        }
      } else {
        this.game.keys.attack.pressed = false;
      }

      // Pause (Start button)
      if (gamepad.buttons[9]?.pressed) {
        if (!this.game.keys.pause.pressed) {
          this.game.keys.pause.pressed = true;
          this.game.keys.pause.handled = false;
        }
      } else {
        this.game.keys.pause.pressed = false;
      }

      break; // Only handle first connected gamepad
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }

  // Draw touch controls
  drawTouchControls(context) {
    if (!this.touchControls.enabled) return;

    context.save();

    Object.keys(this.touchControls.buttons).forEach((buttonName) => {
      const button = this.touchControls.buttons[buttonName];

      // Button background
      context.fillStyle = button.pressed
        ? "rgba(255, 255, 255, 0.5)"
        : "rgba(255, 255, 255, 0.3)";
      context.strokeStyle = "white";
      context.lineWidth = 2;

      context.fillRect(button.x, button.y, button.width, button.height);
      context.strokeRect(button.x, button.y, button.width, button.height);

      // Button label
      context.fillStyle = "white";
      context.font = "14px Arial";
      context.textAlign = "center";
      context.fillText(
        buttonName.toUpperCase(),
        button.x + button.width / 2,
        button.y + button.height / 2 + 5
      );
    });

    context.restore();
  }

  // Update method called from game loop
  update(deltaTime) {
    this.updateGamepad();
  }

  // Get input summary for debugging
  getInputState() {
    return {
      keyboard: {
        left: this.game.keys.left.pressed,
        right: this.game.keys.right.pressed,
        jump: this.game.keys.jump.pressed,
        attack: this.game.keys.attack.pressed,
        pause: this.game.keys.pause.pressed,
      },
      touch: this.touchControls.enabled,
      gamepad: navigator.getGamepads()[0] ? "connected" : "none",
    };
  }
}
