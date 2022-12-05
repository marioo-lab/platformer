class Block {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.width = 32
    this.height = 32
  }
  draw(context) {
    context.fillStyle = 'rgba(255, 0, 0, 0.5)'
    context.fillRect(this.x, this.y, this.width, this.height)
  }
}  