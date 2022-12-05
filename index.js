window.addEventListener('load', function() {
  //canvas setup
  const canvas = document.getElementById('canvas1')
  const ctx = canvas.getContext('2d')
  // ctx.imageSmoothingEnabled = false
  // ctx.imageSmoothingQuality = "low"
  // ctx.translate(0.5, 0.5);

  canvas.width = 1024
  canvas.height = 640

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