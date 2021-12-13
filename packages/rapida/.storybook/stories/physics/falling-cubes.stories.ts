import { BodyType, Physics, PhysicsObjectApi } from '@rapidajs/rapida-physics';
import { useEffect } from '@storybook/client-api';
import {
  AmbientLight,
  BoxGeometry,
  Color,
  DirectionalLight, Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Vector3,
  WebGLRenderer
} from 'three';
import { OrbitControls } from 'three-stdlib/controls/OrbitControls';
import {
  Component,
  Runtime,
  Scene,
  Space,
  System,
  World,
  WorldProvider
} from '../../../src';

export default {
  title: 'Physics / Falling Cubes',
};

export const FallingCubes = () => {
  const randomCubeColour = (): string => {
    const colours = ['#2F394D', '#EEE1B3', '#EA8C55', '#D68FD6', '#4C934C'];
    return colours[Math.floor(Math.random() * colours.length)];
  };

  const LIGHT_BLUE = '#89CFF0';

  class FallingCubeComponent extends Component {
    scene: Scene;
    physics: Physics;

    mesh: Mesh;
    cubeApi: PhysicsObjectApi;

    constructor({ scene, physics }: { scene: Scene; physics: Physics }) {
      super();
      this.scene = scene;
      this.physics = physics;
    }

    onInit = (): void => {
      const geometry = new BoxGeometry(3, 3, 3);
      const material = new MeshPhongMaterial({
        color: randomCubeColour(),
        specular: 0x111111,
        shininess: 30,
      });
      this.mesh = new Mesh(geometry, material);
      this.mesh.position.set(0, 0, 0);
      this.mesh.matrixAutoUpdate = false;
      this.scene.add(this.mesh);

      const [_, cubeApi] = this.physics.create.box(
        {
          type: BodyType.DYNAMIC,
          args: [3, 3, 3],
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          fixedRotation: false,
          mass: 1,
          allowSleep: false,
        },
        this.mesh
      );

      this.cubeApi = cubeApi;

      cubeApi.velocity.set(Math.random() - 0.5, 30, Math.random() - 0.5);

      cubeApi.angularVelocity.set(
        Math.random() * 5 - 2.5,
        Math.random() * 5 - 2.5,
        Math.random() * 5 - 2.5
      );

      setTimeout(() => {
        this.destroy();
      }, 30000);
    };

    destroy = (): void => {
      this.scene.remove(this.mesh);
      this.cubeApi.destroy();
    };
  }

  class CubeEmitterSystem extends System {
    space: Space;
    scene: Scene;
    physics: Physics;

    msCounter: number = 0;

    constructor({
      space,
      scene,
      physics,
    }: {
      space: Space;
      scene: Scene;
      physics: Physics;
    }) {
      super();
      this.space = space;
      this.scene = scene;
      this.physics = physics;
    }

    createFallingCube() {
      const cube = this.space.create.entity();
      cube.addComponent(
        new FallingCubeComponent({ scene: this.scene, physics: this.physics })
      );
    }

    onUpdate = (timeElapsed: number): void => {
      this.msCounter += timeElapsed;

      if (this.msCounter >= 250) {
        this.msCounter = 0;
        this.createFallingCube();
      }
    };
  }

  useEffect(() => {
    const runtime = new Runtime({
      debug: true,
    });

    const worldId = 'FallingCubes';

    const worldProvider: WorldProvider = (worldContext): World => {
      const world = new World({
        id: worldId,
        runtime: worldContext.runtime,
      });

      const renderer = world.create.renderer.webgl({
        domElementId: 'renderer-root',
        renderer: new WebGLRenderer({
          precision: 'lowp',
          powerPreference: 'high-performance',
        }),
      });

      const physics = world.create.physics({
        gravity: [0, -10, 0],
      });

      const scene = world.create.scene();
      scene.threeScene.background = new Color(LIGHT_BLUE);

      const threeCamera = new PerspectiveCamera(50, 1, 20, 1000);
      const camera = world.create.camera({ id: 'camera', camera: threeCamera });
      camera.position.set(0, 10, 70);

      const view = renderer.create.view({
        camera,
        scene,
      });

      new OrbitControls(camera.threeCamera, view.domElement);

      const directionalLight = new DirectionalLight(0xffffff, 0.75);
      directionalLight.position.set(100, 100, 100);
      directionalLight.lookAt(new Vector3(0, 0, 0));
      scene.add(directionalLight);

      const ambientLight = new AmbientLight(0xffffff, 0.75);
      ambientLight.position.set(50, 50, 50);
      ambientLight.lookAt(new Vector3(0, 0, 0));
      scene.add(ambientLight);

      const [_, plane] = physics.create.plane({
        type: BodyType.STATIC,
        position: [0, -10, 0],
        rotation: [-Math.PI / 2, 0, 0],
        mass: 0,
        material: {
          friction: 0.0,
          restitution: 0.3,
        },
      });

      const planeMesh = new Mesh(
        new PlaneGeometry(150, 150, 1, 1),
        new MeshBasicMaterial({ color: LIGHT_BLUE })
      );
      planeMesh.rotation.set(-Math.PI / 2, 0, 0);
      planeMesh.position.y = -10;
      scene.add(planeMesh);

      const space = world.create.space();

      const cubeEmitter = new CubeEmitterSystem({ space, scene, physics });
      world.addSystem(cubeEmitter);

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
};
