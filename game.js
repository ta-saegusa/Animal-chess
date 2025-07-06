const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const playerHandEl = document.getElementById('player-hand');
const cpuHandEl = document.getElementById('cpu-hand');

const PIECE = {
  'ら': '🦁', // ライオン
  'ひ': '🐤', // ひよこ
  'に': '🐓', // にわとり
  'き': '🦒', // きりん
  'ぞ': '🐘'  // ぞう
};

let board = [
  [{ type: 'ぞ', owner: 2 }, { type: 'ら', owner: 2 }, { type: 'き', owner: 2 }],
  [null,                    { type: 'ひ', owner: 2 }, null],
  [null,                    { type: 'ひ', owner: 1 }, null],
  [{ type: 'き', owner: 1 }, { type: 'ら', owner: 1 }, { type: 'ぞ', owner: 1 }]
];

const captured = { 1: [], 2: [] };

const turn = { player: 1 };
let selected = null;
let dropPiece = null;

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
      statusEl.textContent = 'CPUの番です…';
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
      statusEl.textContent = 'CPUの番です…';
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
        statusEl.textContent = 'あなたの勝ち！（ライオンを取りました）';
      } else {
        statusEl.textContent = 'CPUの勝ち！（ライオンを取りました）';
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

  if (moves.length) {
    const m = moves[Math.floor(Math.random() * moves.length)];
    move(m.sx, m.sy, m.dx, m.dy);
    if (turn.player === 0) return;
    turn.player = 1;
    statusEl.textContent = 'あなたの番です';
  } else {
    statusEl.textContent = 'CPUは動けません。あなたの勝ち！';
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
    statusEl.textContent = 'あなたの勝ち！（ライオンを取りました）';
    turn.player = 0;
  } else if (!playerLion) {
    statusEl.textContent = 'CPUの勝ち！（ライオンを取りました）';
    turn.player = 0;
  }
}

render();
