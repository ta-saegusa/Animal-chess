let board, captured, turn, selected, dropPiece;
let currentDifficulty = 'easy';

const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const playerHandEl = document.getElementById('player-hand');
const cpuHandEl = document.getElementById('cpu-hand');
const levelEl = document.getElementById('current-level');

const PIECE = {
  'ら': '🦁', 'ひ': '🐤', 'に': '🐓', 'き': '🦒', 'ぞ': '🐘'
};

function startGame(difficulty) {
  currentDifficulty = difficulty;
  document.getElementById('difficulty').style.display = 'none';
  document.getElementById('reset').style.display = 'inline-block';
  document.getElementById('continue').style.display = 'none';

  const levelText = (difficulty === 'easy') ? 'かんたん' : 'むずかしい';
  levelEl.textContent = `いまのなんいど: ${levelText}`;

  initGame();
}

function continueGame() {
  document.getElementById('difficulty').style.display = 'none';
  document.getElementById('reset').style.display = 'inline-block';
  document.getElementById('continue').style.display = 'none';

  const levelText = (currentDifficulty === 'easy') ? 'かんたん' : 'むずかしい';
  levelEl.textContent = `いまのなんいど: ${levelText}`;

  initGame();
}

function resetGame() {
  document.getElementById('difficulty').style.display = 'block';
  document.getElementById('reset').style.display = 'none';
  document.getElementById('continue').style.display = 'inline-block';

  levelEl.textContent = `いまのなんいど: ${currentDifficulty === 'easy' ? 'かんたん' : 'むずかしい'}`;
  statusEl.textContent = 'なんいどをえらぶか、「つづける」をおしてね';

  boardEl.innerHTML = '';
  playerHandEl.innerHTML = '';
  cpuHandEl.innerHTML = '';

  board = null;
  captured = null;
  turn = null;
  selected = null;
  dropPiece = null;
}

function initGame() {
  board = [
    [{ type: 'ぞ', owner: 2 }, { type: 'ら', owner: 2 }, { type: 'き', owner: 2 }],
    [null,                    { type: 'ひ', owner: 2 }, null],
    [null,                    { type: 'ひ', owner: 1 }, null],
    [{ type: 'き', owner: 1 }, { type: 'ら', owner: 1 }, { type: 'ぞ', owner: 1 }]
  ];
  captured = { 1: [], 2: [] };
  turn = { player: 1 };
  selected = null;
  dropPiece = null;
  render();
  statusEl.textContent = 'あなたのばんだよ';
}

function render() {
  boardEl.innerHTML = '';
  board.forEach((row, y) => {
    row.forEach((cell, x) => {
      const div = document.createElement('div');
      div.className = 'cell';
      if (cell && cell.owner === 2) div.classList.add('cpu');
      div.textContent = cell ? PIECE[cell.type] : '';
      div.dataset.x = x;
      div.dataset.y = y;
      div.onclick = () => onClick(x, y);
      boardEl.appendChild(div);
    });
  });
  renderHands();
}

function renderHands() {
  playerHandEl.innerHTML = '';
  cpuHandEl.innerHTML = '';
  captured[1].forEach((p, i) => {
    const span = document.createElement('span');
    span.textContent = PIECE[p];
    span.onclick = () => {
      if (turn.player !== 1) return;
      dropPiece = { type: p, index: i };
      selected = null;
    };
    playerHandEl.appendChild(span);
  });
  captured[2].forEach(p => {
    const span = document.createElement('span');
    span.textContent = PIECE[p];
    cpuHandEl.appendChild(span);
  });
}

function onClick(x, y) {
  if (turn.player !== 1) return;

  if (dropPiece) {
    if (!board[y][x]) {
      board[y][x] = { type: dropPiece.type, owner: 1 };
      captured[1].splice(dropPiece.index, 1);
      dropPiece = null;
      render();
      turn.player = 2;
      statusEl.textContent = 'ＣＰＵのばんだよ…';
      setTimeout(cpuMove, 700);
    }
    return;
  }

  const cell = board[y][x];
  if (selected) {
    if (isValidMove(selected.x, selected.y, x, y, 1)) {
      move(selected.x, selected.y, x, y);
      if (turn.player === 0) return;
      turn.player = 2;
      statusEl.textContent = 'ＣＰＵのばんだよ…';
      setTimeout(cpuMove, 700);
    }
    selected = null;
  } else if (cell && cell.owner === 1) {
    selected = { x, y };
  }
}

function isValidMove(sx, sy, dx, dy, player) {
  const piece = board[sy][sx];
  if (!piece || piece.owner !== player) return false;
  const target = board[dy][dx];
  if (target && target.owner === player) return false;

  const dxRel = dx - sx;
  const dyRel = dy - sy;

  const forward = player === 1 ? -1 : 1;

  switch (piece.type) {
    case 'ら': return Math.abs(dxRel) <= 1 && Math.abs(dyRel) <= 1;
    case 'ひ': return dyRel === forward && dxRel === 0;
    case 'に': return Math.abs(dxRel) <= 1 && dyRel === forward || (dyRel === 0 && Math.abs(dxRel) === 1);
    case 'ぞ': return Math.abs(dxRel) === 1 && Math.abs(dyRel) === 1;
    case 'き': return Math.abs(dxRel) + Math.abs(dyRel) === 1;
    default: return false;
  }
}

function move(sx, sy, dx, dy) {
  let piece = board[sy][sx];
  const target = board[dy][dx];

  if (target) {
    if (target.type === 'ら') {
      if (piece.owner === 1) {
        statusEl.textContent = 'あなたのかち！（らいおんをとったよ）';
      } else {
        statusEl.textContent = 'ＣＰＵのかち！（らいおんをとられたよ）';
      }
      turn.player = 0;
      return;
    }
    captured[piece.owner].push(target.type === 'に' ? 'ひ' : target.type);
  }

  if (piece.type === 'ひ') {
    if (piece.owner === 1 && dy === 0) piece = { type: 'に', owner: 1 };
    if (piece.owner === 2 && dy === 3) piece = { type: 'に', owner: 2 };
  }

  board[dy][dx] = piece;
  board[sy][sx] = null;

  render();
  checkGameOver();
}

function cpuMove() {
  if (turn.player !== 2) return;

  const moves = [];
  board.forEach((row, y) => row.forEach((cell, x) => {
    if (cell && cell.owner === 2) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= 3 || ny < 0 || ny >= 4) continue;
          if (isValidMove(x, y, nx, ny, 2)) {
            moves.push({ sx: x, sy: y, dx: nx, dy: ny });
          }
        }
      }
    }
  }));

  let moveToPlay;

  if (currentDifficulty === 'hard') {
    let bestScore = -Infinity;

    moves.forEach(m => {
      const simulated = simulateMove(board, m);
      const score = evaluateBoard(simulated);
      if (score > bestScore) {
        bestScore = score;
        moveToPlay = m;
      }
    });

  } else {
    // easy: ランダム
    moveToPlay = moves[Math.floor(Math.random() * moves.length)];
  }

  if (moveToPlay) {
    move(moveToPlay.sx, moveToPlay.sy, moveToPlay.dx, moveToPlay.dy);
    if (turn.player === 0) return;
    turn.player = 1;
    statusEl.textContent = 'あなたのばんだよ';
  } else {
    statusEl.textContent = 'ＣＰＵはうごけないよ。あなたのかち！';
    turn.player = 0;
  }
}

function checkGameOver() {
  let playerLion = false, cpuLion = false;

  board.forEach(row => row.forEach(cell => {
    if (cell && cell.type === 'ら') {
      if (cell.owner === 1) playerLion = true;
      if (cell.owner === 2) cpuLion = true;
    }
  }));

  if (!cpuLion) {
    statusEl.textContent = 'あなたのかち！（らいおんをとったよ）';
    turn.player = 0;
  } else if (!playerLion) {
    statusEl.textContent = 'ＣＰＵのかち！（らいおんをとられたよ）';
    turn.player = 0;
  }
}

function simulateMove(originalBoard, move) {
  const newBoard = originalBoard.map(row => row.map(cell => {
    return cell ? { ...cell } : null;
  }));

  const piece = newBoard[move.sy][move.sx];
  const target = newBoard[move.dx][move.dy];

  // ひよこ成りチェック
  let newPiece = { ...piece };
  if (piece.type === 'ひ') {
    if (piece.owner === 2 && move.dy === 3) {
      newPiece.type = 'に';
    }
  }

  newBoard[move.dx][move.dy] = newPiece;
  newBoard[move.sy][move.sx] = null;

  return newBoard;
}

function evaluateBoard(b) {
  let score = 0;

  b.forEach(row => row.forEach(cell => {
    if (!cell) return;

    let value = 0;
    switch (cell.type) {
      case 'ら': value = 1000; break;
      case 'ぞ': value = 3; break;
      case 'き': value = 3; break;
      case 'に': value = 2; break;
      case 'ひ': value = 1; break;
    }

    if (cell.owner === 2) score += value;
    else score -= value;
  }));

  return score;
}

