/**
 * Planche de direction artistique (V8), `?debug=1&da` : palette, matières, végétation, un
 * bâtiment et un bout de rue, éclairés comme le monde (lumière précalculée). Sert à valider le
 * style « diorama doux » avant de construire le reste.
 */
import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Builder } from '../geometry/mesh';
import { box, cylinder, dome } from '../geometry/shapes';
import { profile } from '../geometry/buildings/profile';
import { HeightField, Light, FIELD } from '../geometry/bake';
import { SWATCHES } from '../world/palette';
import { ROAD_SINK } from '../world/plan';
import { loadKits, kitGeometry, type KitModel } from './diorama/kits';
import { setGroundLight, SUN } from './diorama/material';
import { instances, staticMesh, type Placement } from './diorama/geometry';
import { loadingDone } from '../loading';

export default function DirectionArtistique() {
  const { scene, invalidate } = useThree();
  const group = useMemo(() => new THREE.Group(), []);
  useEffect(() => {
    let live = true;
    loadKits('ville').then(() => {
      if (!live) return;
      // Sol de la planche, palette et échantillons de matières.
      const ground = new Builder();
      box(ground, 0, -0.5, 0, 90, 0.5, 70, 'herbe', { bevel: 0.2 });
      const samples = new Builder();
      SWATCHES.forEach((_, i) =>
        box(samples, -28 + (i % 32) * 1.8, 0, 22 + Math.floor(i / 32) * 1.8, 1.4, 0.6, 1.4, i, {
          bevel: 0.08,
        }),
      );
      const swatchesBy = [
        'brique',
        'pierre',
        'enduit',
        'ardoise',
        'terre-cuite',
        'bois',
        'beton',
        'zinc',
      ] as const;
      swatchesBy.forEach((name, i) => {
        box(samples, -30 + i * 3.2, 0, 15, 2.4, 2.4, 0.6, name, { bevel: 0.1 });
      });
      cylinder(samples, 24, 0, 15, 1.2, 2.2, 'eau', { segments: 24 });
      dome(samples, 28, 0, 15, 1.3, 'roche-claire', { segments: 20 });
      const house = new Builder();
      house.within({ x: 0, z: -14 }, () => profile(house));
      const houseData = house.finish();
      const groundData = ground.finish();
      const sampleData = samples.finish();
      // Placements des modèles des kits.
      const sets: Record<string, Placement[]> = {
        route: [-24, -16, 16, 24].map((x) => ({ x, y: -ROAD_SINK, z: 4, ry: Math.PI / 2 })),
        'route-passage': [{ x: -8, y: -ROAD_SINK, z: 4, ry: Math.PI / 2 }],
        'route-courbe': [{ x: 8, y: -ROAD_SINK, z: 4, ry: Math.PI / 2 }],
        dalle: [-24, -16, -8, 0, 8, 16, 24].map((x) => ({
          x,
          y: -ROAD_SINK - 0.1,
          z: -1.5,
          ry: 0,
          scale: [1, 1, 3 / 8],
        })),
        lampadaire: [-12, 12].map((x) => ({ x, y: 0.12, z: -0.6, ry: Math.PI / 2 })),
        banc: [{ x: -4, y: 0.12, z: -1.8, ry: 0 }],
        corbeille: [{ x: -2.2, y: 0.12, z: -1.6, ry: 0 }],
        pin: [
          { x: -20, y: 0, z: -12, ry: 0.4, scale: 1.5 },
          { x: -26, y: 0, z: -6, ry: 1.4, scale: 1.25 },
        ],
        sapin: [
          { x: 18, y: 0, z: -14, ry: 0.2, scale: 1.5 },
          { x: 24, y: 0, z: -8, ry: 2, scale: 1.2 },
        ],
        buisson: [-9, -8, 8, 9].map((x) => ({ x, y: 0, z: -7.5, ry: x, scale: 1 })),
        'rocher-e': [{ x: 30, y: 0, z: -2, ry: 0.5, scale: 1.6 }],
        'rocher-c': [{ x: 33, y: 0, z: 0, ry: 1.5, scale: 1.2 }],
        voiture: [{ x: -16, y: 0, z: 5.8, ry: Math.PI / 2 }],
        citadine: [{ x: 18, y: 0, z: 2.2, ry: -Math.PI / 2 }],
        'borne-incendie': [{ x: 6, y: 0.12, z: -0.9, ry: 0 }],
      };
      // Lumière précalculée : champ de hauteurs (sol, maison, volumes des modèles).
      const field = new HeightField();
      field.ground(
        () => 0,
        () => true,
      );
      field.rasterize(houseData);
      field.rasterize(sampleData);
      for (const [name, list] of Object.entries(sets)) {
        const g = kitGeometry(name as KitModel);
        g.computeBoundingBox();
        const top = g.boundingBox!.max.y;
        if (top < 0.6) continue;
        for (const p of list) {
          const k = typeof p.scale === 'number' ? p.scale : 1;
          const r = /^(pin|sapin)/.test(name) ? 1.1 * k : 0.4;
          field.disc(p.x, p.z, r, p.y + top * k * (/^(pin|sapin)/.test(name) ? 1 : 0.6));
        }
      }
      const light = new Light(field, SUN);
      setGroundLight(
        light.ground(() => 0),
        256,
        FIELD.min,
        FIELD.extent,
      );
      group.add(staticMesh(groundData, 'ground'));
      group.add(staticMesh(sampleData, 'baked', light.bake(sampleData)));
      group.add(staticMesh(houseData, 'baked', light.bake(houseData)));
      for (const [name, list] of Object.entries(sets)) {
        const flat = name.startsWith('route') || name === 'dalle';
        const lit = list.map((p) => ({
          ...p,
          light: [light.sun(p.x, p.y + 2.5, p.z, 0, 1, 0), 1] as [number, number],
        }));
        group.add(instances(kitGeometry(name as KitModel), lit, flat));
      }
      scene.add(group);
      invalidate();
      loadingDone();
    });
    return () => {
      live = false;
      scene.remove(group);
    };
  }, [group, scene, invalidate]);
  return null;
}
