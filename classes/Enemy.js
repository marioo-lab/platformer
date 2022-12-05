class Enemy extends Sprite {
  constructor(game) {
    super()
    this.game = game
    this.x = this.game.width
    this.speedX = Math.random() * -1.5 - 0.5
    this.marked = false
    this.damage = 0
  }
  update(deltaTime) {
    super.update(deltaTime)
    this.x += this.speedX - this.game.speed
    if(this.x + this.width < 0) this.marked = true
  }
  draw(context) {
    super.draw(context)

    if(this.game.debug){
      context.fillStyle = 'black'
      context.font = '20px Helvetica'
      context.fillText(-this.damage, this.x, this.y)  
    }
  }
}