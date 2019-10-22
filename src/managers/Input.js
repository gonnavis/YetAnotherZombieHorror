import { Elastic, clamp } from '@/utils/number';

class Input {
  constructor () {
    this._onPointerLockChange = this.onPointerLockChange.bind(this);
    this._onPointerLockError = this.onPointerLockError.bind(this);

    document.documentElement.requestPointerLock =
      document.documentElement.requestPointerLock ||
      document.documentElement.mozRequestPointerLock ||
      document.documentElement.webkitRequestPointerLock;

    this._onMouseDown = this.onMouseDown.bind(this);
    this._onMouseMove = this.onMouseMove.bind(this);
    this._onMouseUp = this.onMouseUp.bind(this);

    this._onKeyDown = this.onKeyDown.bind(this);
    this._onKeyUp = this.onKeyUp.bind(this);

    this.rotationX = new Elastic(0);
    this.rotationY = new Elastic(0);
    this.rotationX.speed = 10;

    this.moves = [0, 0, 0, 0];
    this.idleTimeout = null;
    this.keyDown = null;
    this.player = null;

    this.shift = false;
    this.move = '0000';
    this.addEvents();
  }

  requestPointerLock () {
    document.documentElement.requestPointerLock();
  }

  exitPointerLock () {
    document.exitPointerLock();
  }

  onPointerLockChange (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  onPointerLockError (event) {
    event.stopPropagation();
    event.preventDefault();
    console.error(event);
  }

  onContextMenu (event) {
    event.stopPropagation();
    event.preventDefault();
    return false;
  }

  onMouseDown (event) {
    event.stopPropagation();
    event.preventDefault();

    if (event.which === 3) {
      this.rotationX.speed = 5;
      this.player.aim(true);
    }
  }

  onMouseMove (event) {
    if (!this.pointerLocked) return;

    this.rotationY.target = this.camera.rotation.x + (event.movementY || 0) * 0.005;
    this.rotationX.target = this.player.character.rotation.y - (event.movementX || 0) * 0.005;
  }

  onMouseUp (event) {
    event.stopPropagation();
    event.preventDefault();

    if (event.which === 3) {
      this.rotationX.speed = 10;
      this.player.aim(false);
    }
  }

  onKeyDown (event) {
    // event.stopPropagation();
    // event.preventDefault();

    if (event.keyCode === 16 && this.moves[0] && !this.shift) {
      this.moves[1] = 0;
      this.moves[2] = 0;
      this.moves[3] = 0;

      this.keyDown = Date.now();
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

      default:
        return;
    }

    const move = this.moves.join('');

    if (this.move !== move) {
      this.player.move(this.moves, this.shift);
      this.keyDown = Date.now();
      this.move = move;
    }
  }

  onKeyUp (event) {
    // event.stopPropagation();
    // event.preventDefault();

    const delay = Date.now() - this.keyDown;

    if (delay < 100) {
      setTimeout(() => { this.onKeyUp(event); }, 100 - delay);
      return;
    }

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

      default:
        return;
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
      }, 100);
    }
  }

  addEvents () {
    document.addEventListener('pointerlockchange', this._onPointerLockChange, false);
    document.addEventListener('pointerlockerror', this._onPointerLockError, false);

    document.addEventListener('contextmenu', this.onContextMenu, false);
    document.addEventListener('mousedown', this._onMouseDown, false);
    document.addEventListener('mousemove', this._onMouseMove, false);
    document.addEventListener('mouseup', this._onMouseUp, false);

    document.addEventListener('keydown', this._onKeyDown, false);
    document.addEventListener('keyup', this._onKeyUp, false);
  }

  removeEvents () {
    document.removeEventListener('pointerlockchange', this._onPointerLockChange, false);
    document.removeEventListener('pointerlockerror', this._onPointerLockError, false);

    document.removeEventListener('contextmenu', this.onContextMenu, false);
    document.removeEventListener('mousedown', this._onMouseDown, false);
    document.removeEventListener('mousemove', this._onMouseMove, false);
    document.removeEventListener('mouseup', this._onMouseUp, false);

    document.removeEventListener('keydown', this._onKeyDown, false);
    document.removeEventListener('keyup', this._onKeyUp, false);
  }

  updateRotation (delta) {
    this.rotationX.update(delta);
    this.rotationY.update(delta);

    this.player.character.rotation.y = this.rotationX.value;
    this.camera.rotation.x = clamp(this.rotationY.value, -0.1, 0.1);
  }

  get camera () {
    return this.player.character.children[1];
  }

  get pointerLocked () {
    return !!document.pointerLockElement;
  }
};

export default new Input();
