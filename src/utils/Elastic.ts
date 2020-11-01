import { Vector2 as TVector2 } from '@three/math/Vector2';

export namespace Elastic
{
  export class Number {
    private current: number;
    private target: number;
    public speed = 5;

    public constructor (value: number) {
      this.target = this.current = value;
    }

    public update (delta: number = 1 / 60): void {
      const dist = this.target - this.current;
      this.current += dist * (this.speed * delta);
    }

    public set (target: number): void {
      this.target = target;
    }

    public get value (): number {
      return this.current;
    }
  }

  export class Vector2 {
    private readonly current = new TVector2();
    private readonly target = new TVector2();
    public speed = 10;

    public constructor (value: TVector2) {
      this.current.copy(value);
      this.target.copy(value);
    }

    public set (x: number, y: number): void {
      this.target.set(x, y);
    }

    public copy (target: TVector2): void {
      this.target.copy(target);
    }

    public update (delta: number = 1 / 60): void {
      const x = this.target.x - this.current.x;
      const y = this.target.y - this.current.y;

      this.current.x += x * (this.speed * delta);
      this.current.y += y * (this.speed * delta);
    }

    public get value (): TVector2 {
      return this.current;
    }

    public get x (): number {
      return this.current.x;
    }

    public get y (): number {
      return this.current.y;
    }
  }
}
