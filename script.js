class InputHandler {
  constructor(game) {
    this.game = game
    window.addEventListener('keydown', e => {
      switch(e.key) {
        case ' ':
          if(!this.game.keys.space.pressed) {
            this.game.keys.space.pressed = true
            this.game.keys.space.handled = false
          }
          break;
        case 'ArrowLeft':
          this.game.keys.left.pressed = true
          break;
        case 'ArrowRight':
          this.game.keys.right.pressed = true
          break;
        case 'd':
          this.game.debug = !this.game.debug
          break;
      }
    })
    window.addEventListener('keyup', e => {
      switch(e.key) {
        case ' ':
          this.game.keys.space.pressed = false
          break;
        case 'ArrowLeft':
          this.game.keys.left.pressed = false
          break;
        case 'ArrowRight':
          this.game.keys.right.pressed = false
          break;
      }
    })
  }
}
class Block {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.width = 64
    this.height = 64
  }
  draw(context) {
    context.fillStyle = 'rgba(255, 0, 0, 0.5)'
    context.fillRect(this.x, this.y, this.width, this.height)
  }
}  
class Sprite {
  constructor() {
    this.x = 0
    this.y = 0
    this.width = 0
    this.height = 0
    this.image = null
    this.frame = 0
    this.direction = 1
    this.frameCount = 0
    this.fps = 10
    this.frameTimer = 0
    this.frameInterval = 1000/this.fps
  }
  update(deltaTime) {
    //sprite animation
    if(this.frameTimer >= this.frameInterval) {
      if(this.frame < this.frameCount - 1) this.frame++
      else                                  this.frame = 0  
      
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
}
class Player extends Sprite {
  constructor(game) {
    super()

    this.States = {
      idle: 1,
      run:  2,
      jump: 3,
      fall: 4
    }

    this.game = game
    this.x = 200
    this.y = 200
    this.width = 156
    this.height = 116
    this.speedX = 0
    this.speedY = 0
    this.weight = 0.5
    this.maxspeed = 4
    this.life = 10
    this.lifeTimer = 0
    this.lifeInterval = 1000
    this.isStanding = false
    this.hitbox = {
      ox: 40,
      oy: 40,
      width: 50,
      height: 50
    }
    this.animations = {
      idle: {
        image: document.getElementById('player-idle'),
        frameCount: 11
      },
      run: {
        image: document.getElementById('player-run'),
        frameCount: 8
      },
      jump: {
        image: document.getElementById('player-jump'),
        frameCount: 1
      },
      fall: {
        image: document.getElementById('player-fall'),
        frameCount: 1
      }
    }
    this.state = this.States.idle
    this.image = this.animations.idle.image
    this.frameCount = this.animations.idle.frameCount
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
  handleSpeed(factor = 0.2) { this.speedX = this.game.lerp(this.speedX, 0, factor) }
  update(deltaTime) { 
    super.update(deltaTime)

    if(this.game.keys.right.pressed)        this.runRight()
    else if(this.game.keys.left.pressed)    this.runLeft()
    else if(this.speedY === 0)              this.idle()
    
    if(this.game.keys.space.pressed && 
      !this.game.keys.space.handled &&  
      this.isStanding) {
      this.game.keys.space.handled = true
                                            this.jump()    
    }
    else if(this.speedY > 0)                this.fall()

    
    //horizontal movement
    this.handleSpeed()
    this.x += this.speedX
    this.handleHorizontalCollisions()

    //vertical movement
    this.speedY += this.weight
    this.y += this.speedY
    this.handleVerticalCollisions()

    if(this.lifeTimer > this.lifeInterval){
      if(this.life < 100) this.life++
      this.lifeTimer = 0
    } else {
      this.lifeTimer += deltaTime
    }
  }
  draw(context) {
    super.draw(context)
    
    if(this.game.debug) context.strokeRect(this.x + this.hitbox.ox, this.y + this.hitbox.oy, this.hitbox.width, this.hitbox.height)
  }
  idle() {
    if(this.state != this.States.idle) {
      this.state = this.States.idle
      // this.speedX = 0
      this.image = this.animations.idle.image
      this.frameCount = this.animations.idle.frameCount
      this.frame = 0  
    }
  }
  runRight() {
    if(this.direction < 0) this.hitbox.ox = this.width - (this.hitbox.ox + this.hitbox.width)

    this.direction = 1
    this.speedX = this.direction*this.maxspeed

    if(this.state != this.States.run) {
      this.state = this.States.run
      this.image = this.animations.run.image
      this.frameCount = this.animations.run.frameCount
      this.frame = 0  
    }
  }
  runLeft() {
    if(this.direction > 0) this.hitbox.ox = this.width - (this.hitbox.ox + this.hitbox.width)

    this.direction = -1
    this.speedX = this.direction*this.maxspeed

    if(this.state != this.States.run) {
      this.state = this.States.run
      this.image = this.animations.run.image
      this.frameCount = this.animations.run.frameCount
      this.frame = 0  
    }
  }
  jump() {
    if(this.state != this.States.jump) {
      this.speedY = -10
      this.state = this.States.jump
      this.image = this.animations.jump.image
      this.frameCount = this.animations.jump.frameCount
      this.frame = 0  
    }
  }
  fall() {
    if(this.state != this.States.fall) {
      this.state = this.States.fall
      this.image = this.animations.fall.image
      this.frameCount = this.animations.fall.frameCount
      this.frame = 0  
    }
  }
  hit(points) {
    if(this.game.gameOver) return
    this.life -= points
    if(this.life < 0) this.life = 0
  }
}
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
class Beast1 extends Enemy {
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
class Level {
  constructor(game) {
    this.game = game
    this.image1 = document.getElementById('level1')

    this.layer1 = new Layer(this.game, this.image1, 0.2)
    this.layers = [this.layer1]

    this.level = 1
    const map2d = maps[this.level].parse2d()
    this.map = map2d.createObjectFrom2d()
  }
  update() {
    this.layers.forEach(layer => layer.update())
  }
  draw(context) {
    this.layers.forEach(layer => layer.draw(context))
    this.map.forEach(block => block.draw(context))
  }
}
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
class Game {
  constructor(width, height) {
    this.width = width
    this.height = height
    this.enemies = []
    this.enemyTimer = 0
    this.enemyInterval = 2000
    this.gameOver = false
    this.gameTime = 0
    this.speed = 0
    this.debug = false
    this.keys = {
      space: {
        pressed: false,
        handled: false
      },
      left: {
        pressed: false,
        handled: false
      },
      right: {
        pressed: false,
        handled: false
      },
    }    
    this.level = new Level(this)
    this.player = new Player(this)
    this.input = new InputHandler(this)
    this.ui = new UI(this)
  }
  update(deltaTime) {
    if(!this.gameOver) this.gameTime += deltaTime
    
    this.level.update()
    this.player.update(deltaTime)

    this.enemies.forEach(enemy => {
      enemy.update(deltaTime)
      if(this.checkCollision(this.player, enemy)) {
        this.player.hit(enemy.damage)

        enemy.marked = true

        if(this.player.life === 0) this.gameOver = true
      }
    })
    this.enemies = this.enemies.filter(enemy => !enemy.marked)
    
    // if(this.enemyTimer > this.enemyInterval && !this.gameOver) {
    //   this.addEnemy()
    //   this.enemyTimer = 0
    // } else {
    //   this.enemyTimer += deltaTime
    // }
    this.ui.update(deltaTime)
  }
  draw(context) {
    this.level.draw(context)
    this.ui.draw(context)
    this.player.draw(context)
    this.enemies.forEach(enemy => enemy.draw(context))
  }
  addEnemy() {
    const randomize = Math.random()
    if(randomize < 0.5)      this.enemies.push(new Beast1(this))
  }
  checkCollision(rect1, rect2) {
    return (rect1.x < rect2.x + rect2.width && 
            rect1.x + rect1.width > rect2.x && 
            rect1.y < rect2.y + rect2.height && 
            rect1.y + rect1.height > rect2.y)
  }
  lerp(a, b, amount) { return (1 - amount) * a + amount * b }
}

window.addEventListener('load', function() {
  //canvas setup
  const canvas = document.getElementById('canvas1')
  const ctx = canvas.getContext('2d')
  // ctx.imageSmoothingEnabled = false
  // ctx.imageSmoothingQuality = "low"
  // ctx.translate(0.5, 0.5);

  canvas.width = 800
  canvas.height = 720

  const game = new Game(canvas.width, canvas.height)
  let lastTime = 0

  //animation loop
  function animate(timeStamp) {
    const deltaTime = timeStamp - lastTime
    lastTime = timeStamp

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    game.draw(ctx)
    game.update(deltaTime)
    requestAnimationFrame(animate)
  }
  animate(0)
});