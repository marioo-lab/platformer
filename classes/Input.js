class InputHandler {
  constructor(game) {
    this.game = game
    window.addEventListener('keydown', e => {
      switch(e.key) {
        case ' ':
          if(!this.game.keys.attack.pressed) {
            this.game.keys.attack.pressed = true
            this.game.keys.attack.handled = false
          }
          break;
        case 'ArrowUp':
          if(!this.game.keys.jump.pressed) {
            this.game.keys.jump.pressed = true
            this.game.keys.jump.handled = false
          }
          break;
        case 'ArrowLeft':
          this.game.keys.left.pressed = true
          break;
        case 'ArrowRight':
          this.game.keys.right.pressed = true
          break;
        case 'ArrowDown':
          if(!this.game.keys.hit.pressed) {
            this.game.keys.hit.pressed = true
            this.game.keys.hit.handled = false
          }
          break;
        case 'd':
          this.game.debug = !this.game.debug
          break;
      }
    })
    window.addEventListener('keyup', e => {
      switch(e.key) {
        case ' ':
          this.game.keys.attack.pressed = false
          break;
        case 'ArrowUp':
          this.game.keys.jump.pressed = false
          break;
        case 'ArrowLeft':
          this.game.keys.left.pressed = false
          break;
        case 'ArrowRight':
          this.game.keys.right.pressed = false
          break;
        case 'ArrowDown':
          this.game.keys.hit.pressed = false
          break;
      }
    })
  }
}