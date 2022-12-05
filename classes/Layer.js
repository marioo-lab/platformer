class Layer {
  constructor(game, image, speedMod) {
    this.game = game
    this.image = image
    this.speedMod = speedMod
    this.width = 1768
    this.height = 500
    this.x = 0
    this.y = 0
  }
  update() {
    if(this.x <= -this.width) this.x = 0
    this.x -= this.game.speed * this.speedMod
  }
  draw(context) {
    context.drawImage(this.image, this.x, this.y)
    context.drawImage(this.image, this.x + this.width, this.y)
  }
}