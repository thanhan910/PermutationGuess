/* Classic ES5 script. No modules, framework, polyfills, storage or network API. */
(function () {
  'use strict';
  var api = window.PermutationGame;
  var game = new api.Game(Number(document.querySelector('.game').getAttribute('data-size')));
  var board = document.querySelector('.game-list');
  var submit = document.getElementById('submitGuess');
  var reset = document.getElementById('resetButton');
  var drag = null;
  var ignoreMouseUntil = 0;

  function boxes() { return board.querySelectorAll('.game-box'); }
  function labelPositions() {
    var nodes = boxes();
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].setAttribute('aria-label', game.items[i] + ', position ' + (i + 1) + ' of ' + game.size);
    }
  }
  function resize() {
    // Same sizing as the old UI, without CSS clamp(), custom properties or calc division.
    var fontSize = Math.max(9, Math.min(14, (window.innerWidth - 60) / (game.size * 5)));
    var nodes = boxes();
    for (var i = 0; i < nodes.length; i++) nodes[i].style.fontSize = fontSize + 'px';
  }
  function renderBoard() {
    while (board.firstChild) board.removeChild(board.firstChild);
    for (var i = 0; i < game.items.length; i++) {
      var box = document.createElement('div');
      box.className = 'game-box';
      box.textContent = game.items[i];
      box.style.backgroundColor = api.COLORS[api.ITEMS.indexOf(game.items[i])];
      box.setAttribute('tabindex', '0');
      box.setAttribute('aria-describedby', 'reorderHelp');
      board.appendChild(box);
    }
    labelPositions();
    resize();
  }
  function renderFeedback() {
    var log = document.getElementById('guessLog');
    while (log.firstChild) log.removeChild(log.firstChild);
    for (var i = 0; i < game.guesses.length; i++) {
      var line = document.createElement('div');
      line.textContent = game.guesses[i];
      log.appendChild(line);
    }
    var finished = game.won || game.lost;
    submit.hidden = finished;
    document.getElementById('instructions').hidden = game.won;
    document.getElementById('feedback').hidden = finished;
    var correct = document.getElementById('correctFeedback');
    correct.hidden = game.guesses.length === 0;
    correct.textContent = 'There ' + (game.correctCount === 1 ? 'is ' : 'are ') + game.correctCount +
      ' item' + (game.correctCount === 1 ? '' : 's') + ' in the correct position.';
    var left = game.maxGuesses - game.guesses.length;
    document.getElementById('remaining').textContent = 'You have ' + left + ' guess' + (left === 1 ? '' : 'es') + ' left.';
    var result = document.getElementById('result');
    result.hidden = !finished;
    result.style.color = game.won ? 'green' : 'red';
    document.getElementById('resultText').textContent = finished ?
      (game.won ? 'You guessed correctly! The correct order was ' : 'Game over! The correct order was ') + game.answer.join(', ') + '.' : '';
  }
  function announce(item, index) {
    document.getElementById('reorderStatus').textContent = item + ' moved to position ' + (index + 1) + ' of ' + game.size + '.';
  }
  function boxFrom(target) {
    return target && target.parentNode === board && target.classList.contains('game-box') ? target : null;
  }
  function start(target, x, y, touchId) {
    var box = boxFrom(target);
    if (!box || drag) return;
    drag = { box: box, x: x, y: y, touchId: touchId, original: game.items.slice(), preview: null };
  }
  function move(x, y) {
    if (!drag) return;
    if (!drag.preview) {
      if (Math.abs(x - drag.x) + Math.abs(y - drag.y) < 5) return;
      var rect = drag.box.getBoundingClientRect();
      drag.offsetX = drag.x - rect.left;
      drag.offsetY = drag.y - rect.top;
      drag.preview = drag.box.cloneNode(true);
      drag.preview.className = 'game-box drag-preview';
      drag.preview.removeAttribute('tabindex');
      drag.preview.setAttribute('aria-hidden', 'true');
      drag.preview.style.width = rect.width + 'px';
      drag.preview.style.height = rect.height + 'px';
      document.body.appendChild(drag.preview);
      drag.box.classList.add('is-dragging');
    }
    drag.preview.style.left = (x - drag.offsetX) + 'px';
    drag.preview.style.top = (y - drag.offsetY) + 'px';
    var bounds = board.getBoundingClientRect();
    if (x < bounds.left + 25) board.scrollLeft -= 20;
    if (x > bounds.right - 25) board.scrollLeft += 20;
    var nodes = boxes();
    var from = game.items.indexOf(drag.box.textContent);
    var to = from;
    for (var i = 0; i < nodes.length; i++) {
      var position = nodes[i].getBoundingClientRect();
      if (i < from && x < position.left + position.width / 2) { to = i; break; }
      if (i > from && x > position.left + position.width / 2) to = i;
    }
    if (to !== from) {
      game.move(from, to);
      board.insertBefore(drag.box, to > from ? nodes[to].nextSibling : nodes[to]);
      labelPositions();
    }
  }
  function finish(cancelled) {
    if (!drag) return;
    var item = drag.box.textContent;
    if (drag.preview) document.body.removeChild(drag.preview);
    drag.box.classList.remove('is-dragging');
    if (cancelled) {
      game.items = drag.original;
      renderBoard();
    } else if (drag.preview) announce(item, game.items.indexOf(item));
    drag = null;
  }
  board.addEventListener('mousedown', function (event) {
    if (event.button !== 0 || Date.now() < ignoreMouseUntil) return;
    start(event.target, event.clientX, event.clientY, null);
    if (drag) event.preventDefault();
  });
  document.addEventListener('mousemove', function (event) {
    if (drag && drag.touchId === null) { event.preventDefault(); move(event.clientX, event.clientY); }
  });
  document.addEventListener('mouseup', function () {
    if (drag && drag.touchId === null) finish(false);
  });
  // Separate mouse/touch paths avoid dependence on early Safari pointer capture.
  board.addEventListener('touchstart', function (event) {
    ignoreMouseUntil = Date.now() + 800;
    if (event.touches.length !== 1) { finish(true); return; }
    var touch = event.touches[0];
    start(event.target, touch.clientX, touch.clientY, touch.identifier);
    if (drag) event.preventDefault();
  }, { passive: false });
  document.addEventListener('touchmove', function (event) {
    if (!drag || drag.touchId === null) return;
    for (var i = 0; i < event.touches.length; i++) {
      if (event.touches[i].identifier === drag.touchId) {
        event.preventDefault();
        move(event.touches[i].clientX, event.touches[i].clientY);
        return;
      }
    }
  }, { passive: false });
  document.addEventListener('touchend', function (event) {
    if (!drag || drag.touchId === null) return;
    for (var i = 0; i < event.changedTouches.length; i++) {
      if (event.changedTouches[i].identifier === drag.touchId) { finish(false); break; }
    }
    ignoreMouseUntil = Date.now() + 800;
  });
  document.addEventListener('touchcancel', function () { finish(true); });
  window.addEventListener('blur', function () { finish(true); });
  window.addEventListener('resize', function () { finish(true); resize(); });
  board.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') { finish(true); return; }
    var box = boxFrom(event.target);
    if (!box || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    event.preventDefault();
    var from = game.items.indexOf(box.textContent);
    var to = Math.max(0, Math.min(game.size - 1, from + (event.key === 'ArrowLeft' ? -1 : 1)));
    game.move(from, to);
    renderBoard();
    boxes()[to].focus();
    announce(game.items[to], to);
  });
  submit.addEventListener('click', function () {
    finish(false);
    game.submit();
    renderFeedback();
    if (game.won || game.lost) reset.focus();
  });
  reset.addEventListener('click', function () {
    finish(true);
    game.reset();
    renderBoard();
    renderFeedback();
    document.getElementById('reorderStatus').textContent = '';
  });
  labelPositions();
  resize();
}());
