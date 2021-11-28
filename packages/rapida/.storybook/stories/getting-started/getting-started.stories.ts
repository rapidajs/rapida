import * as three from 'three';
import {
  Component,
  View,
  Entity,
  Scene,
  Runtime,
  World,
  WorldContext,
  WorldProvider,
  OrbitControls,
} from '../../../src';
import { useEffect } from '@storybook/client-api'

export default {
  title: 'Getting Started/"Hello World"',
}

export const Cube = () => {
  class SpinningCubeComponent extends Component {
    cube: three.Mesh;
    scene: Scene;

    constructor(scene: Scene) {
      super();
      this.scene = scene;
    }
  
    onInit = (): void => {
      const geometry = new three.BoxGeometry(50, 50, 50);
      const material = new three.MeshPhongMaterial({
        color: 'blue',
        specular: 0x111111,
        shininess: 30,
      });
      this.cube = new three.Mesh(geometry, material);
      this.cube.position.set(0, 0, 0);
  
      this.scene.add(this.cube);
    };
  
    onUpdate = (timeElapsed: number): void => {
      this.cube.rotation.x += timeElapsed * 0.0001;
      this.cube.rotation.y += timeElapsed * 0.0001;
    };
  
    onDestroy = (): void => {
      this.scene.remove(this.cube);
    };
  }
  
  class LightComponent extends Component {
    lights: three.Group;
    scene: Scene;

    constructor(scene: Scene) {
      super();
      this.scene = scene;
    }
  
    onInit = (): void => {
      this.lights = new three.Group();
  
      const directionalLight = new three.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(300, 0, 300);
      directionalLight.lookAt(new three.Vector3(0, 0, 0));
      this.lights.add(directionalLight);
  
      const ambientLight = new three.AmbientLight(0xffffff, 0.5);
      ambientLight.position.set(0, -200, 400);
      ambientLight.lookAt(new three.Vector3(0, 0, 0));
      this.lights.add(ambientLight);
  
      this.scene.add(this.lights);
    };
  
    onDestroy = (): void => {
      this.scene.remove(this.lights);
    };
  }
  
  useEffect(() => {
    const runtime = new Runtime({
      domId: 'renderer-root',
      debug: true,
    });

    const worldId = 'SpinningCube';

    const worldProvider: WorldProvider = (worldContext: WorldContext): World => {
      const world = new World({
        id: worldId,
        runtime: worldContext.runtime,
      });

      const scene = world.create.scene({ id: 'mainScene' });

      const camera = world.create.camera({ id: 'mainCamera' });
      camera.position.set(0, 0, 500);
      camera.setControls(new OrbitControls({ target: [0, 0, 0] }));

      world.create.view({
        camera,
        scene,
      });

      const space = world.create.space();

      const light = space.create.entity();
      light.addComponent(new LightComponent(scene));

      const cube = space.create.entity();
      cube.addComponent(new SpinningCubeComponent(scene));

      return world;
    };

    runtime.registerWorld(worldId, worldProvider);

    runtime.startWorld(worldId);

    return () => runtime.destroy();
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
}