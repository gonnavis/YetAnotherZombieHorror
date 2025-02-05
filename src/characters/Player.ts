type AnimationAction = import('three/src/animation/AnimationAction').AnimationAction;
import type { Location, PlayerAnimations, CharacterAnimation } from '@/types.d';

type Movement = { directions: Directions, running: boolean };
type Object3D = import('three/src/core/Object3D').Object3D;

import { Direction, Directions } from '@/managers/Input';
import { MathUtils } from 'three/src/math/MathUtils';
import { GameEvents } from '@/managers/GameEvents';

import { LoopOnce } from 'three/src/constants';
import { Camera } from '@/managers/GameCamera';
import Character from '@/characters/Character';

import type Pistol from '@/weapons/Pistol';
import type Rifle from '@/weapons/Rifle';

import { Vector } from '@/utils/Vector';
import { Config } from '@/config';

export default class Player extends Character
{
  private currentAnimation!: AnimationAction;
  private lastAnimation = 'pistolIdle';
  private weapon!: Pistol | Rifle;

  private reloadTimeout?: number;
  private aimTimeout?: number;

  private equipRifle = false;
  private hasRifle = false;

  private reloading = false;
  private shooting = false;
  private aiming = false;

  private hand?: Object3D;
  private pistol?: Pistol;
  private rifle?: Rifle;

  private shootTime = 0;
  private moveTime = 0;
  private idleTime = 0;
  private aimTime = 0;

  public constructor () {
    super(Config.Player);
  }

  private getMovementAnimation (directions: Directions): PlayerAnimations {
    let direction = directions[Direction.UP] ? 'Forward' : directions[Direction.DOWN] ? 'Backward' : '';

    if (!this.equipRifle && !direction) {
      direction = directions[Direction.LEFT] ? 'Left' : directions[Direction.RIGHT] ? 'Right' : direction;
    } else if (this.equipRifle) {
      direction += directions[Direction.LEFT] ? 'Left' : directions[Direction.RIGHT] ? 'Right' : '';
    }

    return direction as PlayerAnimations || 'Idle';
  }

  private getWeaponAnimation (movement: string): string {
    return `${this.equipRifle ? 'rifle' : 'pistol'}${movement}`;
  }

  private getPlayerAnimation (): PlayerAnimations {
    const weapon = this.equipRifle ? 'rifle' : 'pistol';
    return this.lastAnimation.replace(weapon, '') as PlayerAnimations;
  }

  private setWeapon (rifle: boolean): void {
    let animation = rifle ?
      this.lastAnimation.replace('pistol', 'rifle') :
      this.lastAnimation.replace('rifle', 'pistol');

    GameEvents.dispatch('weapon:change', rifle);
    this.hand?.remove(this.weapon?.model);

    if (!rifle && !this.animations[animation]) {
      animation = animation.replace(/BackwardLeft|BackwardRight/gm, 'Backward');
      animation = animation.replace(/ForwardLeft|ForwardRight/gm, 'Forward');
    }

    this.lastAnimation !== animation && this.updateAnimation(
      this.getPlayerAnimation(), animation
    );

    this.hasRifle = this.equipRifle || rifle;
    this.equipRifle = rifle;
  }

  private blockingAnimation (): boolean {
    return this.aiming || this.hitting || this.reloading;
  }

  public rotate (x: number, y: number, maxTilt: number): void {
    const lookDown = y > 0;
    const fps = +Camera.isFPS;
    const tilt = this.rotation.y;
    const model = this.getModel();

    const minTilt = fps * -0.2 - 0.2;
    maxTilt = Math.min(maxTilt + fps * maxTilt, 0.25);

    model.rotateOnWorldAxis(Vector.UP, x);

    if ((lookDown && tilt >= minTilt) || (!lookDown && tilt <= maxTilt)) {
      model.rotateOnAxis(Vector.RIGHT, y);
    }
  }

  public idle (): void {
    const now = Date.now();

    if (this.blockingAnimation()) return;
    if (now - this.idleTime < 350) return;
    const idle = this.getWeaponAnimation('Idle');

    GameEvents.dispatch('player:run', false);
    Camera.runAnimation(() => false, false);

    this.running = this.moving = false;
    this.idleTime = now;

    setTimeout(
      this.updateAnimation.bind(this, 'Idle', idle),
      ~~(this.lastAnimation === idle) * 100
    );
  }

  public move (directions: Directions): void {
    const now = Date.now();

    if (this.blockingAnimation()) return;
    if (now - this.moveTime < 350) return;

    const direction = this.getMovementAnimation(directions);
    const animation = this.getWeaponAnimation(direction);

    if (this.lastAnimation === animation) return;
    this.updateAnimation(direction, animation);

    GameEvents.dispatch('player:run', false);
    Camera.runAnimation(() => false, false);

    this.running = false;
    this.moveTime = now;
    this.moving = true;
  }

  public run (directions: Directions, running: boolean): void {
    if (this.running === running) return;
    if (this.blockingAnimation()) return;

    const run = this.getWeaponAnimation('Run');

    if (!running || this.lastAnimation === run) {
      this.running = false;

      return !(directions as unknown as Array<number>).includes(1)
        ? setTimeout(this.idle.bind(this), 150) as unknown as void
        : this.move(directions);
    }

    if (directions[Direction.UP]) {
      Camera.runAnimation(() => this.running, true);
      GameEvents.dispatch('player:run', true);
      this.updateAnimation('Run', run);

      this.running = true;
      this.moving = true;
    }
  }

  public startAiming (): void {
    if (this.blockingAnimation()) return;

    GameEvents.dispatch('player:run', false);
    this.weapon.aim = this.aiming = true;

    Camera.runAnimation(() => false, false);
    Camera.aimAnimation(true, this.equipRifle);
    Camera.updateNearPlane(true, this.equipRifle);

    this.aimTime = this.equipRifle ? Date.now() : 0;
    const next = this.equipRifle ? 'rifleAim' : 'pistolIdle';

    this.weapon.setAim();

    if (this.lastAnimation !== next) {
      this.aimTimeout = this.updateAnimation('Idle', next);
      this.running = false;
      this.moving = false;
    }

    Camera.isFPS && setTimeout(() =>
      GameEvents.dispatch('player:aim', true)
    , 300 + +this.equipRifle * 300);

    !this.equipRifle && setTimeout(() => {
      this.currentAnimation.paused = true;
      this.setMixerTime(0.5);
    }, 400);
  }

  public stopAiming (): void {
    const duration = Math.min(Date.now() - this.aimTime, 400);
    Camera.aimAnimation(false, this.equipRifle, duration);
    Camera.updateNearPlane(false, this.equipRifle);

    GameEvents.dispatch('player:aim', false);
    this.weapon.aim = this.aiming = false;
    this.currentAnimation.paused = false;

    this.weapon.cancelAim(duration);
    clearTimeout(this.aimTimeout);
  }

  public startShooting (): void {
    this.shooting = true;
    const now = Date.now();

    if (this.running || this.hitting || this.reloading) return;
    if (now - this.aimTime < 500 || now - this.shootTime < 150) return;

    if (this.weapon.shoot(this.position)) {
      const { x, y } = this.weapon.recoil;
      this.rotate(x, y, 0.25);
    }

    this.shootTime = now;
    !this.equipRifle && this.stopShooting();
  }

  public stopShooting (): void {
    this.shooting = false;
  }

  public reload (getMovement: () => Movement): void {
    if (this.blockingAnimation()) return;
    if (this.weapon.full || !this.weapon.inStock) return;

    this.updateAnimation('Idle', 'rifleReload');
    GameEvents.dispatch('player:run', false);

    Camera.runAnimation(() => false, false);
    Camera.setNearPlane(0.15, 400);
    this.weapon.startReloading();

    this.reloading = true;
    this.running = false;
    this.moving = false;

    this.reloadTimeout = setTimeout(
      this.weapon.addAmmo.bind(this.weapon, 0), 2000
    ) as unknown as number;

    setTimeout(() => {
      if (this.dead) return;
      this.reloading = false;
      Camera.setNearPlane(0.5, 100);

      const { directions, running } = getMovement();
      running ? this.run(directions, running) : this.move(directions);
    }, 2500);
  }

  public die (): void {
    this.updateAnimation('Idle', 'death', 0.5);
    GameEvents.dispatch('player:death');
    clearTimeout(this.reloadTimeout);

    this.weapon.stopReloading();
    this.setAnimation('Idle');
    Camera.deathAnimation();

    this.reloading = false;
    this.shooting = false;
    this.aiming = false;

    this.death();
  }

  private updateAnimation (animation: CharacterAnimation, action: string, duration = 0.1): number {
    this.currentAnimation.crossFadeTo(this.animations[action], duration, true);
    this.animations[action].play();

    return setTimeout(() => {
      this.setAnimation(animation);
      this.lastAnimation = action;

      this.currentAnimation.stop();
      this.currentAnimation = this.animations[action];
    }, duration * 1000) as unknown as number;
  }

  public async loadCharacter (): Promise<Object3D> {
    const model = (await this.load()).scene;

    this.hand = model.getObjectByName('swatRightHand');
    this.currentAnimation = this.animations.pistolIdle;

    this.animations.rifleReload.clampWhenFinished = true;
    this.animations.rifleAim.clampWhenFinished = true;
    this.animations.death.clampWhenFinished = true;

    this.animations.rifleReload.setLoop(LoopOnce, 1);
    this.animations.rifleAim.setLoop(LoopOnce, 1);
    this.animations.death.setLoop(LoopOnce, 1);

    !Config.freeCamera && Camera.setTo(model);
    this.currentAnimation.play();
    return this.object;
  }

  public setPistol (targets: Array<Object3D>, pistol: Pistol): void {
    this.setWeapon(false);
    this.weapon = pistol;
    this.pistol = pistol;

    pistol.targets = targets;
    this.hand?.add(pistol.model);
  }

  private setRifle (targets: Array<Object3D>, rifle: Rifle): void {
    this.setWeapon(true);
    this.weapon = rifle;
    this.rifle = rifle;

    rifle.targets = targets;
    this.hand?.add(rifle.model);
  }

  public changeCamera (view: boolean): void {
    if (!view) Camera.changeShoulder();

    else {
      Camera.changeView(this.running, this.aiming, this.equipRifle);
      const aiming = Camera.isFPS && this.aiming;
      !Camera.isFPS && this.resetRotation();

      setTimeout(() =>
        GameEvents.dispatch('player:aim', aiming)
      , +aiming * 300);
    }
  }

  public changeWeapon (): void {
    if (this.hasRifle && !this.aiming && !this.reloading) {
      const targets = this.weapon.targets;

      !this.equipRifle
        ? this.setRifle(targets, this.rifle as Rifle)
        : this.setPistol(targets, this.pistol as Pistol);

      Camera.updateNearPlane(this.aiming, this.equipRifle, this.running);
    }
  }

  private resetRotation (): void {
    if (this.rotation.y < -0.2) {
      const y = this.rotation.y + 0.2;
      this.getModel().rotateOnAxis(Vector.RIGHT, y);
    }
  }

  public pickRifle (rifle: Rifle): void {
    this.rifle = rifle;
    this.hasRifle = true;
    this.rifle.addAmmo();
  }

  public update (delta: number): void {
    super.update(delta);
    this.shooting && this.startShooting();
  }

  public dispose (): void {
    clearTimeout(this.reloadTimeout);
    clearTimeout(this.aimTimeout);

    delete this.reloadTimeout;
    delete this.aimTimeout;

    delete this.pistol;
    delete this.rifle;
    delete this.hand;

    super.dispose();
  }

  public get location (): Location {
    return {
      position: this.position,
      rotation: MathUtils.radToDeg(
        Math.atan2(-this.rotation.x, this.rotation.z)
      )
    };
  }

  public get uuid (): string {
    return this.object.uuid;
  }
}
