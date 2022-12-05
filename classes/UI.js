class UI {
  constructor(game) {
    this.game = game
    this.width = this.game.width
    this.height = this.game.height
    this.fontSize = 25
    this.fontFamily = 'Bangers'
    this.color = 'white'
    this.fps = 0
  }
  update(deltaTime) {
    this.fps = (1000/deltaTime).toFixed(1)
  }
  draw(context) {
    context.save()
    context.fillStyle = this.color
    context.shadowOffsetX = 2
    context.shadowOffsetY = 2
    context.shadowColor = 'black'
    context.font = this.fontSize + 'px ' + this.fontFamily
    const time = (this.game.gameTime * 0.001).toFixed(1)
    context.fillText('Timer: ' + time, 20, 40)
    //life
    for(let i = 0; i < this.game.player.life; i++) {
      context.fillRect(20 + 2 * i, 50, 2, 20)
    }

    if(this.game.gameOver) {
      context.textAlign = 'center'
      let message1 = 'Congratulations!'
      const time = (this.game.gameTime * 0.001).toFixed(1)
      let message2 = 'You survived for ' + time + ' seconds'

      context.font = '70px ' + this.fontFamily
      context.fillText(message1, this.game.width * 0.5, this.game.height * 0.5 - 20)
      context.font = '25px ' + this.fontFamily
      context.fillText(message2, this.game.width * 0.5, this.game.height * 0.5 + 20)
    }
    context.restore()

    if(this.game.debug){
      context.fillStyle = 'black'
      context.font = '20px Helvetica'
      context.fillText(this.fps, this.width - 50, 40)  
    }
  }
}
