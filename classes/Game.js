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
      jump: {
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
      attack: {
        pressed: false,
        handled: false
      },
      hit: {
        pressed: false,
        handled: false
      }
    }    
    this.level = new Level(this)
    this.player = new Player(this)
    this.enemies.push(new Pig(this))
    this.input = new InputHandler(this)
    this.ui = new UI(this)
  }
  update(deltaTime) {
    if(!this.gameOver) this.gameTime += deltaTime
    
    this.level.update()
    this.player.update(deltaTime)

    this.enemies.forEach(enemy => {
      enemy.update(deltaTime)
      // if(this.checkCollision(this.player, enemy)) {
      //   this.player.hit(enemy.damage)

      //   enemy.marked = true

      //   if(this.player.life === 0) this.gameOver = true
      // }
    })
    // this.enemies = this.enemies.filter(enemy => !enemy.marked)
    
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
