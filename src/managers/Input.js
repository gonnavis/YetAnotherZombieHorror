class Input {
  constructor () {
    this._onMouseDown = this.onMouseDown.bind(this);
    this._onMouseUp = this.onMouseUp.bind(this);

    this._onKeyDown = this.onKeyDown.bind(this);
    this._onKeyUp = this.onKeyUp.bind(this);

    this.moves = [0, 0, 0, 0];
    this.idleTimeout = null;
    this.move = '0000';

    this.player = null;
    this.shift = false;
    this._addEvents();
  }

  onMouseDown (event) {
    if (event.which === 3) {
      this.player.aim();
    }
  }

  onMouseUp (event) {
    if (event.which === 3) {
      this.player.idle();
    }
  }

  onKeyDown (event) {
    if (event.keyCode === 16 && this.moves[0] && !this.shift) {
      this.moves[1] = 0;
      this.moves[2] = 0;
      this.moves[3] = 0;

      this.player.run(true);
      this.shift = true;
      return;
    }

    switch (event.keyCode) {
      case 87:
        this.moves[0] = 1;
        this.moves[2] = 0;
        break;

      case 65:
        this.moves[1] = 1;
        this.moves[3] = 0;
        break;

      case 83:
        this.moves[2] = 1;
        this.moves[0] = 0;
        break;

      case 68:
        this.moves[3] = 1;
        this.moves[1] = 0;
        break;
    }

    const move = this.moves.join('');

    if (this.move !== move) {
      this.player.move(this.moves, this.shift);
      this.move = move;
    }
  }

  onKeyUp (event) {
    if (event.keyCode === 16 && this.shift) {
      this.player.run(false);
      this.shift = false;
    }

    switch (event.keyCode) {
      case 87:
        this.moves[0] = 0;
        break;

      case 65:
        this.moves[1] = 0;
        break;

      case 83:
        this.moves[2] = 0;
        break;

      case 68:
        this.moves[3] = 0;
        break;
    }

    const move = this.moves.join('');

    if (move === '0000') {
      clearTimeout(this.idleTimeout);
      this.player.idle();
      this.move = move;
      return;
    }

    if (this.move !== move) {
      this.idleTimeout = setTimeout(() => {
        this.player.move(this.moves, this.shift);
        this.move = move;
      }, 300);
    }
  }

  _addEvents () {
    document.addEventListener('mousedown', this._onMouseDown, false);
    document.addEventListener('mouseup', this._onMouseUp, false);
    document.addEventListener('keydown', this._onKeyDown, false);
    document.addEventListener('keyup', this._onKeyUp, false);
  }

  removeEvents () {
    document.removeEventListener('mousedown', this._onMouseDown, false);
    document.removeEventListener('mouseup', this._onMouseUp, false);
    document.removeEventListener('keydown', this._onKeyDown, false);
    document.removeEventListener('keyup', this._onKeyUp, false);
  }
};

export default new Input();
