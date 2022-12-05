const maps = {
  1: [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 292, 292, 292, 292, 292, 292, 292, 292, 292, 292, 292, 292, 292, 292, 0,
    0, 292, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 292, 0,
    0, 292, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 292, 0,
    0, 292, 292, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 292, 0,
    0, 292, 292, 292, 292, 292, 292, 292, 292, 292, 292, 292, 292, 292, 292, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
  ]}

  Array.prototype.parse2d = function() {
    const rows = []  
    for (let i = 0; i < this.length; i += 16) {
      rows.push(this.slice(i, i + 16))
    }
    return rows
  }
  
  Array.prototype.createObjectFrom2d = function () {
    const blocks = []
    
    this.forEach((row, y) => {
      row.forEach((symbol, x) => {
        if (symbol === 292) {
          //push a new collision into blocks array
          blocks.push(new Block(x * 64, y * 64))
        }
      })
    });
  
    return blocks
  }