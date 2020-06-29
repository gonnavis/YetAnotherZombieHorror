import { LoadingManager } from '@three/loaders/LoadingManager';
import { AnimationClip } from '@three/animation/AnimationClip';

import { GLTFLoader } from '@loaders/GLTFLoader';
import { Group } from '@three/objects/Group';

type GLTFModel = { scene: Group, animations?: Array<AnimationClip> };
type LoadCallback = (asset: GLTFModel) => unknown

export default class AssetsLoader extends LoadingManager {
  private readonly gltf = new GLTFLoader(this);
  private loading = false;

  public async loadGLTF (file: string, callback?: LoadCallback): Promise<GLTFModel> {
    const gltf = await this.load(file);
    if (callback) callback(gltf);
    return gltf;
  }

  private load (model: string): Promise<GLTFModel> {
    return new Promise((resolve, reject) => {
      const onError = (error: ErrorEvent) => reject(error);
      const onLoad = (result: GLTFModel) => resolve(result);

      const onProgress = (event: ProgressEvent<EventTarget>) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.onProgress((event.target as any).responseURL, event.loaded, event.total);
      };

      this.gltf.load(model, onLoad, onProgress, onError);
    });
  }

  public onProgress = (url: string, loaded: number, total: number): void => {
    const progress = (loaded * 100 / total).toFixed();
    console.info(`Loading... ${progress}%`);
  }

  public onError = (url: string): void => {
    console.info(`Error occurred loading ${url}.`);
    this.loading = false;
  }

  public onStart = (): void => {
    console.info('Loading... 0%');
    this.loading = true;
  }

  public isLoading (): boolean {
    return this.loading;
  }

  public onLoad = (): void => {
    console.info('Loaded!');
    this.loading = false;
  }
}
