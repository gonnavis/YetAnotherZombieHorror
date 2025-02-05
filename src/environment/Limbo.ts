type OrbitControls = import('three/examples/jsm/controls/OrbitControls').OrbitControls;
type Object3D = import('three/src/core/Object3D').Object3D;
type Vector3 = import('three/src/math/Vector3').Vector3;
import type { Coords, Bounds } from '@/types.d';

import { AmbientLight } from 'three/src/lights/AmbientLight';
import { FogExp2 } from 'three/src/scenes/FogExp2';
import GameLevel from '@/environment/GameLevel';

import { min, max } from '@/utils/Array';
import Physics from '@/managers/physics';

import { Color } from '@/utils/Color';
import Music from '@/managers/Music';
import { Config } from '@/config';

export default class Limbo extends GameLevel
{
  private readonly music = new Music(Config.Limbo.music);
  private controls?: OrbitControls;

  public constructor () {
    super();

    if (Config.freeCamera) {
      import(/* webpackChunkName: "orbit-controls" */ 'three/examples/jsm/controls/OrbitControls').then(Controls => {
        this.controls = new Controls.OrbitControls(this.camera, this.canvas);

        this.camera.position.set(0, 10, -50);
        this.controls.target.set(0, 0, 25);

        this.camera.lookAt(0, 0, 0);
        this.controls.update();
      });
    }

    this.camera.far = Config.Limbo.depth;
    this.createEnvironment();
    this.createLights();
  }

  private createEnvironment (): void {
    this.createSkybox(Config.Limbo.skybox);
    this.scene.fog = new FogExp2(Color.GREY, 0.1);

    this.loadLevel(Config.Limbo.model).then(level => {
      level.position.copy(Config.Limbo.position as Vector3);
      level.scale.copy(Config.Limbo.scale as Vector3);
    });
  }

  private createLights (): void {
    this.scene.add(new AmbientLight(Color.WHITE));
  }

  public createColliders (): void {
    const { position, height, sidewalkHeight } = Config.Limbo;
    Physics.createGround(Limbo.minCoords, Limbo.maxCoords);

    Physics.createBounds({
      borders: Limbo.bounds, y: position.y, height
    }, {
      borders: Config.Limbo.sidewalk as Bounds,
      height: sidewalkHeight,
      y: sidewalkHeight / 2
    });
  }

  public removeObject (model: Object3D): void {
    this.scene.remove(model);
  }

  public addObject (model: Object3D): void {
    this.scene.add(model);
  }

  public render (): void {
    this.controls?.update();
    super.render();
  }

  public destroy (): void {
    this.music.destroy();
    super.destroy();

    if (Config.DEBUG) {
      this.controls?.dispose();
      delete this.controls;
    }
  }

  public static get minCoords (): Coords {
    return [
      min(Limbo.bounds.map(coords => coords[0])),
      min(Limbo.bounds.map(coords => coords[1]))
    ];
  }

  public static get maxCoords (): Coords {
    return [
      max(Limbo.bounds.map(coords => coords[0])),
      max(Limbo.bounds.map(coords => coords[1]))
    ];
  }

  public static get portals (): Bounds {
    return Config.Limbo.portals as Bounds;
  }

  public static get bounds (): Bounds {
    return Config.Limbo.bounds as Bounds;
  }
}
