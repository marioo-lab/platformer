class PigAI {
  constructor(pig) {
    this.pig = pig
  }
  update(deltaTime) {
    if(this.pig.direction > 0) {
      this.pig.turn(this.pig.direction)
    }
    // this.pig.run()
    // this.pig.attack()
  }
}