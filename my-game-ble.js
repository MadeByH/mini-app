<!DOCTYPE html>
<html lang="fa">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>بازی فانتزی من</title>
  <style>
    body {
      margin: 0;
      overflow: hidden;
      background-color: #aee;
    }
    #game {
      width: 100vw;
      height: 100vh;
      position: relative;
    }
    .character {
      width: 50px;
      height: 50px;
      background: url('https://i.imgur.com/tT8tKqZ.gif') no-repeat center/contain;
      position: absolute;
      top: 100px;
      left: 100px;
      transition: all 0.1s;
    }
    .controls {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 10px;
    }
    .btn {
      width: 60px;
      height: 60px;
      background: #fff;
      border: 2px solid #333;
      border-radius: 10px;
      font-size: 24px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div id="game">
    <div id="player" class="character"></div>
  </div>
  <div class="controls">
    <button class="btn" onclick="move('left')">◀️</button>
    <button class="btn" onclick="move('up')">🔼</button>
    <button class="btn" onclick="move('down')">🔽</button>
    <button class="btn" onclick="move('right')">▶️</button>
  </div>

  <script>
    const player = document.getElementById('player');
    let x = 100, y = 100;

    function move(dir) {
      if (dir === 'left') x -= 20;
      if (dir === 'right') x += 20;
      if (dir === 'up') y -= 20;
      if (dir === 'down') y += 20;

      player.style.left = x + 'px';
      player.style.top = y + 'px';
    }
  </script>
</body>
</html>
