import '../globals';
import { Coords } from '@/types.d';
import Limbo from '@/environment/Limbo';
import { getScaledCoords, pointInCircle, getAngleToRifle } from '@/components/utils';

describe('ComponentUtils', () => {
  test('getScaledCoords', () => {
    expect(getScaledCoords([0, 0], Limbo.minCoords, 1)).toStrictEqual(Limbo.minCoords);

    expect(getScaledCoords([50.0, 50.0], [0, 0], 5)).toStrictEqual([250.0, 250.0]);

    expect(getScaledCoords([1, 1], Limbo.minCoords, 2)).toStrictEqual([
      Limbo.minCoords[0] * 2 + 2, Limbo.minCoords[1] * 2 + 2
    ]);
  });

  test('pointInCircle', () => {
    const pCoords = [Math.random(), Math.random()] as Coords;
    const cCoords = [Math.random(), Math.random()] as Coords;

    expect(pointInCircle([1.25, 1.25], [0.5, 0.5], 1)).toStrictEqual(false);
    expect(pointInCircle([0, 0], [0.5, 0.5], 0.75)).toStrictEqual(true);
    expect(pointInCircle(pCoords, cCoords, 0)).toStrictEqual(false);
  });

  test('getAngleToRifle', () => {
    expect(getAngleToRifle([0, 0], [0, 10])).toStrictEqual(0);
    expect(getAngleToRifle([0, 0], [-10, 0])).toStrictEqual(90);
    expect(getAngleToRifle([0, 0], [0, -10])).toStrictEqual(180);
    expect(getAngleToRifle([0, 0], [10, 0])).toStrictEqual(270);
  });
});
