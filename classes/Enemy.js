class Enemy extends Sprite {
  constructor(game) {
    super()

    this.States = {
      none: 0,      
      idle: 1,
      run:  2,
      jump: 3,
      fall: 4,
      attack: 5,
      hit: 6,
      dead: 7
    }

    this.game = game
    this.x = 0
    this.y = 0
    this.width = 0
    this.height = 0
    this.speedX = 0
    this.speedY = 0
    this.weight = 0
    this.life = 0
    this.runSpeed = 0
    this.jumpForce = 0
    this.attackTimer = 0
    this.attackInterval = 0
    this.isStanding = false
    this.damage = 0
    this.ai = null
  }
  handleHorizontalCollisions() {
    for(let i = 0; i < this.game.level.map.length; i++){
      
      const block = this.game.level.map[i]

      if (this.x + this.hitbox.ox <= block.x + block.width &&
          this.x + this.hitbox.ox + this.hitbox.width >= block.x &&
          this.y + this.hitbox.oy + this.hitbox.height >= block.y &&
          this.y + this.hitbox.oy <= block.y + block.height) {

          //collision on x axis going to the left
          if(this.speedX < 0) {
            const offset = this.hitbox.ox
            this.x = block.x + block.width - offset + 0.1
            break
          }

          //collision on x axis going to the right
          if(this.speedX > 0) {
            const offset = this.hitbox.ox + this.hitbox.width
            this.x = block.x - offset - 0.1
            break
          }
        }
    }
  }
  handleVerticalCollisions() {
    this.isStanding = false
    for(let i = 0; i < this.game.level.map.length; i++){

      const block = this.game.level.map[i]

      if (this.x + this.hitbox.ox <= block.x + block.width &&
          this.x + this.hitbox.ox + this.hitbox.width >= block.x &&
          this.y + this.hitbox.oy + this.hitbox.height >= block.y &&
          this.y + this.hitbox.oy <= block.y + block.height) {

          if(this.speedY < 0) {
            this.speedY = 0
            const offset = this.hitbox.oy
            this.y = block.y + block.height - offset + 0.1
            break
          }

          if(this.speedY > 0) {
            this.isStanding = true
            this.speedY = 0
            const offset = this.hitbox.oy + this.hitbox.height
            this.y = block.y - offset - 0.1
            break
          }
        }
    }
  }
  handleInput(deltaTime) {

    if(this.life <= 0){
      this.die()
      return
    }

    //handle hit
    if(this.game.keys.hit.pressed && !this.game.keys.hit.handled) {
      this.game.keys.hit.handled = true
      this.hit(10)
      return
    }

    //handle attack
    if(this.attackTimer >= this.attackInterval) {
      if(this.game.keys.attack.pressed && !this.game.keys.attack.handled) {
        this.game.keys.attack.handled = true
        this.attack()
        this.attackTimer = 0
        return
      }  
    }else this.attackTimer += deltaTime

    //handle jump
    if(this.game.keys.jump.pressed && !this.game.keys.jump.handled && this.isStanding) {
      this.game.keys.jump.handled = true
      this.jump()
      return
    }

    //handle movement
    if(this.game.keys.right.pressed || this.game.keys.left.pressed) {
      const dir = this.game.keys.right.pressed < this.game.keys.left.pressed ? -1 : 1
      this.turn(dir)
      this.run()
      return
    }

    if(this.isStanding && this.speedY === 0 && Math.abs(this.speedX) < 1)  this.idle()
    else if(this.speedY > 0)                                               this.fall()
  }
  handleSpeed(factor = 0.2) { this.speedX = this.game.lerp(this.speedX, 0, factor) }
  handleMovement() {
    //horizontal movement
    this.handleSpeed()
    this.x += this.speedX
    this.handleHorizontalCollisions()    
  }
  handleJump() {
    //vertical movement
    this.speedY += this.weight
    this.y += this.speedY
    this.handleVerticalCollisions()
  }
  handleAttack() {}
  update(deltaTime) { 
    super.update(deltaTime)

    // this.handleInput(deltaTime)
    if(this.ai) this.ai.update(deltaTime)

    if(this.isStanding && this.speedY === 0 && Math.abs(this.speedX) < 1)  this.idle()
    else if(this.speedY > 0)                                               this.fall()
    
    this.handleMovement()
    this.handleJump()
    this.handleAttack()
  }
  draw(context) {
    super.draw(context)
    
    if(this.game.debug) {
      context.strokeRect(this.x + this.hitbox.ox, this.y + this.hitbox.oy, this.hitbox.width, this.hitbox.height)
      context.fillStyle = 'black'
      context.font = '20px Helvetica'
      context.fillText(this.state, this.x, this.y)    
    }
  }
  idle() {
    this.state = this.States.idle
    this.animate(this.state)
  }
  turn(dir) {
    if(dir != this.direction) {
      this.direction = dir 
      const hx = this.x + this.hitbox.ox
      this.hitbox.ox = this.width - (this.hitbox.ox + this.hitbox.width)
      this.x = hx - this.hitbox.ox
    }
  }
  run() {
    this.speedX = this.direction*this.runSpeed
    this.state = this.States.run      
    this.animate(this.state)
  }
  jump() {
    if(this.isStanding) this.speedY = -this.jumpForce      
    this.state = this.States.jump      
    this.animate(this.state)
  }
  fall() {
    this.state = this.States.fall
    this.animate(this.state)
  }
  attack() {
    this.speedX = this.direction*this.runSpeed
    this.state = this.States.attack
    this.animate(this.state)
  }
  hit(points) {
    this.speedX = -this.direction*this.runSpeed
    this.life -= points
    if(this.life < 0) this.life = 0  
    this.state = this.States.hit     
    this.animate(this.state) 
  }
  die() {
    this.state = this.States.dead
    this.animate(this.state)
  }
}