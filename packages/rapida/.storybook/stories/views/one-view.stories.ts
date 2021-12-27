import { useEffect } from '@storybook/client-api';
import * as three from 'three';
import rapida, { World, WorldProvider } from '../../../src';

export default {
  title: 'Views / One View',
};

export const OneView = () => {
  useEffect(() => {
    const R = rapida({ debug: true });

    R.run(({ engine }): World => {
      const world = new World({
        engine,
      });

      const renderer = world.create.renderer.webgl();

      const scene = world.create.scene({ id: 'mainScene' });

      const camera = world.create.camera({ id: 'mainCamera' });
      camera.position.set(0, 0, 500);

      renderer.create.view({
        camera,
        scene,
      });

      const ambientLight = new three.AmbientLight(0xffffff, 1);
      ambientLight.position.set(0, -20, 40);
      ambientLight.lookAt(new three.Vector3(0, 0, 0));
      scene.add(ambientLight);

      const geometry = new three.BoxGeometry(50, 50, 50);
      const material = new three.MeshPhongMaterial({
        color: 'blue',
        specular: 0x111111,
        shininess: 30,
      });
      const cube = new three.Mesh(geometry, material);
      cube.position.set(0, 0, 0);

      scene.add(cube);

      world.on('ready', () => {
        document.getElementById('renderer-root').appendChild(renderer.domElement);
      });

      return world;
    });

    return () => R.destroy();
  });

  return `
  <style>
  #renderer-root {
    width: 100%;
    height: 100%;
  }
  </style>
  <div id="renderer-root"></div>
  `;
};
