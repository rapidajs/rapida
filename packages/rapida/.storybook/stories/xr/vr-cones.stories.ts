import { useEffect } from '@storybook/client-api';
import {
  AmbientLight,
  CylinderGeometry,
  DirectionalLight,
  Mesh,
  MeshPhongMaterial,
  Vector3,
} from 'three';
import {
  Engine,
  World,
  WorldContext,
  WorldProvider,
  XRRendererMode,
} from '../../../src';

export default {
  title: 'XR / VR Cones',
};

export const VRCones = () => {
  useEffect(() => {
    const engine = new Engine({
      debug: true,
    });

    const worldProvider: WorldProvider = (
      worldContext: WorldContext
    ): World => {
      const world = new World({
        engine: worldContext.engine,
      });

      const scene = world.create.scene();

      const camera = world.create.camera();
      camera.position.set(0, 0, 500);

      const renderer = world.create.renderer.xr({
        domElementId: 'renderer-root',
        mode: XRRendererMode.VR,
        camera,
        scene,
        appendButton: true,
      });

      const directionalLight = new DirectionalLight(0xffffff, 1);
      directionalLight.position.set(300, 0, 300);
      directionalLight.lookAt(new Vector3(0, 0, 0));
      scene.add(directionalLight);

      const ambientLight = new AmbientLight(0xffffff, 0.5);
      ambientLight.position.set(0, -200, 400);
      ambientLight.lookAt(new Vector3(0, 0, 0));
      scene.add(ambientLight);

      // todo - handle both controllers
      // todo - display the controllers
      const controller = renderer.three.xr.getController(0);

      const coneGeometry = new CylinderGeometry(0, 0.05, 0.2, 32).rotateX(
        Math.PI / 2
      );

      controller.addEventListener('selectstart', (e) => {
        const coneMaterial = new MeshPhongMaterial({
          color: 0xffffff * Math.random(),
        });
        const mesh = new Mesh(coneGeometry, coneMaterial);

        mesh.position.set(0, 0, -0.3).applyMatrix4(controller.matrixWorld);
        mesh.quaternion.setFromRotationMatrix(controller.matrixWorld);
        scene.add(mesh);
      });

      scene.add(controller);

      return world;
    };

    engine.run(worldProvider);

    return () => engine.destroy();
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