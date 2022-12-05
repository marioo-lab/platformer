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

    if(this.game.debug) {
      this.map.forEach(block => block.draw(context))
    }
  }
}
