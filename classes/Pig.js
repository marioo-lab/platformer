class Pig extends Enemy {
  constructor(game) {
    super(game)
    this.width = 68
    this.height = 56
    this.y = Math.random() * (-this.height) + this.game.height - this.height
    this.image = document.getElementById('pig-idle')
    this.frameCount = 11
    this.damage = Math.round((Math.random() * 4)) + 1
  }
}
