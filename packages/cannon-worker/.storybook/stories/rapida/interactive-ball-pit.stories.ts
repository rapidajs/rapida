import CannonWorker, { BodyApi, BodyType } from '@rapidajs/cannon-worker';
import World, { Component } from '@rapidajs/recs';
import { Effects, View, WebGLRenderer, WebGLView } from '@rapidajs/three';
import { useEffect } from '@storybook/client-api';
import {
  AmbientLight,
  Color,
  DirectionalLight,
  Fog,
  InstancedMesh,
  Mesh,
  MeshLambertMaterial,
  Object3D,
  PerspectiveCamera,
  Scene,
  SphereBufferGeometry,
} from 'three';
// @ts-expect-error webpack image import
import cursorImage from '../../resources/cursor.png';
import { CannonSystem } from './cannon-system';

export default {
  title: 'Rapida / Interactive Ball Pit',
};

class BallPitContainer extends Component {
  physics!: CannonWorker;

  view!: WebGLView;

  planeApis!: BodyApi[];

  construct({ physics, view }: { physics: CannonWorker; view: WebGLView }) {
    this.planeApis = undefined;
    this.physics = physics;
    this.view = view;
  }

  onInit(): void {
    const width = this.view.worldViewport.width * 0.6;
    const height = this.view.worldViewport.height * 0.6;

    const planes: {
      position: [number, number, number];
      rotation: [number, number, number];
    }[] = [
      {
        position: [0, -height / 2, 0],
        rotation: [-Math.PI / 2, 0, 0],
      },
      {
        position: [-width / 2 - 1, 0, 0],
        rotation: [0, Math.PI / 2, 0],
      },
      {
        position: [width / 2 + 1, 0, 0],
        rotation: [0, -Math.PI / 2, 0],
      },
      {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
      },
      {
        position: [0, 0, 12],
        rotation: [0, -Math.PI, 0],
      },
    ];

    planes.forEach((p) => {
      this.physics.create.plane(() => ({
        type: BodyType.STATIC,
        position: p.position,
        rotation: p.rotation,
        mass: 0,
        material: {
          friction: 0.0,
          restitution: 0.3,
        },
      }));
    });
  }
}

class Cursor extends Component {
  physics!: CannonWorker;

  camera!: PerspectiveCamera;

  view!: WebGLView;

  mesh!: Mesh;

  sphereApi!: BodyApi;

  construct(params: { physics: CannonWorker; camera: PerspectiveCamera; view: WebGLView }) {
    this.physics = params.physics;
    this.camera = params.camera;
    this.view = params.view;
    this.sphereApi = undefined;
  }

  onInit(): void {
    const radius = 6;

    const { api: sphereApi } = this.physics.create.sphere(() => ({
      type: BodyType.STATIC,
      args: radius,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      fixedRotation: false,
      allowSleep: false,
    }));

    this.sphereApi = sphereApi;

    this.view.on('mousemove', (event) => {
      this.updateCursorPosition(event.data.relativeX, event.data.relativeY);
    });

    this.view.on('touchmove', (event) => {
      this.updateCursorPosition(
        event.data.changedTouches[0].relativeX,
        event.data.changedTouches[0].relativeY,
      );
    });
  }

  onDestroy(): void {
    this.sphereApi.destroy();
  }

  updateCursorPosition(x: number, y: number): void {
    this.sphereApi.position.set(
      (x * this.view.worldViewport.width) / 2,
      (y * this.view.worldViewport.height) / 2,
      7,
    );
  }
}

class Spheres extends Component {
  physics!: CannonWorker;

  scene!: Scene;

  view!: View;

  mesh!: InstancedMesh;

  sphereApi!: BodyApi;

  count: number;

  static radius = 1.1;

  construct(params: { view: View; scene: Scene; physics: CannonWorker; count: number }) {
    this.count = params.count;

    this.sphereApi = undefined;

    this.view = params.view;
    this.scene = params.scene;
    this.physics = params.physics;

    const geometry = new SphereBufferGeometry(Spheres.radius, 32, 32);
    const material = new MeshLambertMaterial({
      color: '#ff7b00',
    });

    this.mesh = new InstancedMesh(geometry, material, this.count);

    this.mesh.position.set(0, 0, 0);
    this.mesh.matrixAutoUpdate = false;
    (this.mesh as Object3D).castShadow = true;
    (this.mesh as Object3D).receiveShadow = true;
  }

  onInit(): void {
    this.scene.add(this.mesh);

    const { api: sphereApi } = this.physics.create.sphere(
      () => ({
        type: BodyType.DYNAMIC,
        args: Spheres.radius,
        position: [4 - Math.random() * 8, this.view.viewportSizePx.height, 0],
        rotation: [0, 0, 0],
        fixedRotation: false,
        mass: 200,
        allowSleep: false,
      }),
      this.mesh,
    );

    this.sphereApi = sphereApi;

    for (let i = 0; i < this.count; i++) {
      sphereApi.at(i).position.set(2 - Math.random() * 4, 0, 0);
    }
  }

  onDestroy(): void {
    this.scene.remove(this.mesh);
    this.sphereApi.destroy();
  }
}

export const InteractiveBallPit = ({ count }) => {
  useEffect(() => {
    const world = new World();

    const renderer = new WebGLRenderer();
    document.getElementById('renderer-root').appendChild(renderer.domElement);

    const scene = new Scene();
    const BACKGROUND = '#ffdd41'; //'#89CFF0';
    scene.background = new Color(BACKGROUND);

    const camera = new PerspectiveCamera(50, 1, 17, 40);
    camera.position.set(0, 0, 40);
    scene.add(camera);

    const view = renderer.create.view({
      id: 'ball-pit-view',
      camera,
      scene,
      useEffectComposer: true,
    });

    view.composer.add.effects(
      Effects.bloom({
        intensity: 1.25,
        kernelSize: 2,
        luminanceThreshold: 0.8,
        luminanceSmoothing: 0,
      }),
    );

    scene.fog = new Fog('red', 30, 80);

    const physics = new CannonWorker({
      gravity: [0, -10, 0],
      defaultContactMaterial: {
        restitution: 0.5,
      },
    });

    world.addSystem(new CannonSystem(physics));

    const directionalLightOne = new DirectionalLight(0xffffff, 1);
    directionalLightOne.position.set(50, 50, 25);
    directionalLightOne.castShadow = true;
    directionalLightOne.shadow.mapSize.width = 64;
    directionalLightOne.shadow.camera.left = -10;
    directionalLightOne.shadow.camera.right = 10;
    directionalLightOne.shadow.camera.top = 10;
    directionalLightOne.shadow.camera.bottom = -10;
    directionalLightOne.shadow.mapSize.width = 64;
    directionalLightOne.lookAt(0, 0, 0);
    scene.add(directionalLightOne);

    const directionalLightTwo = new DirectionalLight(0xffffff, 0.5);
    directionalLightTwo.position.set(-10, -10, -5);
    directionalLightTwo.castShadow = true;
    directionalLightTwo.shadow.mapSize.width = 64;
    directionalLightTwo.shadow.camera.left = -10;
    directionalLightTwo.shadow.camera.right = 10;
    directionalLightTwo.shadow.camera.top = 10;
    directionalLightTwo.shadow.camera.bottom = -10;
    directionalLightTwo.shadow.mapSize.width = 64;
    directionalLightTwo.lookAt(0, 0, 0);
    scene.add(directionalLightTwo);

    const ambientLight = new AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    const space = world.create.space();

    space.create.entity().addComponent(BallPitContainer, { physics, view });
    space.create.entity().addComponent(Spheres, { physics, scene, view, count });
    space.create.entity().addComponent(Cursor, { physics, camera, view });

    // simple loop
    world.init();

    let lastCallTime = 0;
    const loop = (now: number) => {
      const nowSeconds = now / 1000;
      const elapsed = nowSeconds - lastCallTime;

      world.update(elapsed);
      renderer.render(elapsed);
      lastCallTime = nowSeconds;

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);

    return () => world.destroy();
  });

  return `
  <style>
  #renderer-root {
    width: 100%;
    height: 100%;
  }

  #renderer-root #ball-pit-view {
    cursor: url("${cursorImage}")
      39 39,
    auto;
  }
  </style>
  <div id="renderer-root"></div>
  `;
};

InteractiveBallPit.args = { count: 200 };
