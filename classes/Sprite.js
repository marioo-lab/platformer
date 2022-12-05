class Sprite {
  constructor() {
    this.x = 0
    this.y = 0
    this.width = 0
    this.height = 0
    this.image = null
    this.animations = []
    this.frame = 0
    this.loop = false
    this.direction = 1
    this.frameCount = 0
    this.fps = 10
    this.frameTimer = 0
    this.frameInterval = 1000/this.fps
  }
  update(deltaTime) {
    //sprite animation
    if(this.frameTimer >= this.frameInterval) {
      if(this.frame < this.frameCount - 1)  this.frame++
      else if(this.loop)                    this.frame = 0  
      
      this.frameTimer = 0
    }else {
      this.frameTimer += deltaTime
    }
  }
  draw(context) {
    context.save()
    context.scale(this.direction, 1)
    if(this.image) {
      context.drawImage(this.image, 
        this.frame * this.width, 0, this.width, this.height,
        this.direction*this.x, this.y, this.direction*this.width, this.height)  
    }
    if(this.game.debug) context.strokeRect(this.direction*this.x, this.y, this.direction*this.width, this.height)
    context.restore()
  }
  animate(animation) {
    //don't interrupt a non loop animation
    if(!this.loop && this.frame < this.frameCount - 1) return

    if(this.image != this.animations[animation].image) {
      this.image = this.animations[animation].image
      this.frameCount = this.animations[animation].frameCount
      this.loop = this.animations[animation].loop
      this.frame = 0    
    }
  }
}
