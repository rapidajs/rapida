import { useEffect } from '@storybook/client-api';
import {
  AmbientLight,
  Color,
  Fog,
  Mesh,
  MeshLambertMaterial,
  PerspectiveCamera,
  SphereBufferGeometry,
  Vector3,
  WebGLRenderer
} from 'three';
import { OrbitControls } from 'three-stdlib/controls/OrbitControls';
import {
  Component,
  Entity,
  Engine,
  Scene,
  System,
  World,
  WorldProvider
} from '../../../src';

export default {
  title: 'ECS / Random Walkers',
};

const DARK_BLUE = '#003366';
const ORANGE = '#ff7b00';
const LIGHT_BLUE = '#89CFF0';

class FireflyObject3DComponent extends Component {
  scene: Scene;
  mesh: Mesh;

  constructor({ scene }: { scene: Scene }) {
    super();
    this.scene = scene;

    const geometry = new SphereBufferGeometry(0.2, 32, 32);
    const material = new MeshLambertMaterial({
      color: ORANGE,
    });

    this.mesh = new Mesh(geometry, material);
  }

  onInit = () => {
    this.scene.add(this.mesh);
  };

  onDestroy = () => {
    this.scene.remove(this.mesh);
  };

  setResting(): void {
    (this.mesh.material as MeshLambertMaterial).color.set(
      new Color(LIGHT_BLUE)
    );
  }

  setWalking(): void {
    (this.mesh.material as MeshLambertMaterial).color.set(new Color(ORANGE));
  }
}

class WalkingComponent extends Component {
  target?: Vector3;
  newTargetCountdown = WalkingComponent.initialNewTargetCountdown;

  static initialNewTargetCountdown = 100;
}

class EnergyComponent extends Component {
  energy = 1;
}

class RandomWalkSystem extends System {
  queries = {
    walking: {
      all: [FireflyObject3DComponent, EnergyComponent, WalkingComponent],
    },
  };

  onUpdate = (timeElapsed: number) => {
    this.results.walking.entities.forEach((entity: Entity) => {
      const object = entity.get(FireflyObject3DComponent);
      const walk = entity.get(WalkingComponent);
      const energy = entity.get(EnergyComponent);

      const random = () => Math.random() * 10 - 5;

      walk.newTargetCountdown -= timeElapsed * (Math.random() + 0.001);
      if (!walk.target || walk.newTargetCountdown <= 0) {
        energy.energy -= (Math.random() + 0.01) * 0.1;

        if (energy.energy <= 0) {
          entity.removeComponent(WalkingComponent);
          object.setResting();
          return;
        }

        walk.target = new Vector3(
          object.mesh.position.x + random(),
          object.mesh.position.y + random(),
          object.mesh.position.z + random()
        );

        walk.newTargetCountdown = WalkingComponent.initialNewTargetCountdown;
      }

      const t = 1.0 - Math.pow(0.001, timeElapsed);
      object.mesh.position.lerp(walk.target, 0.01 * t);
    });
  };
}

class RestingSystem extends System {
  private static energyTimeThreshold = 200;
  private energyCounter = 0;

  queries = {
    resting: {
      all: [FireflyObject3DComponent, EnergyComponent],
      not: [WalkingComponent],
    },
  }

  onUpdate = (timeElapsed: number) => {
    this.energyCounter += timeElapsed;

    if (this.energyCounter > RestingSystem.energyTimeThreshold) {
      this.energyCounter = 0;

      this.results.resting.entities.forEach((entity: Entity) => {
        const energy = entity.get(EnergyComponent);
        energy.energy += (Math.random() + 0.001) * 0.3;

        if (energy.energy >= 1) {
          entity.addComponent(WalkingComponent);
          entity.get(FireflyObject3DComponent).setWalking();
        }
      });
    }
  };
}

export const RandomWalkers = () => {
  useEffect(() => {
    const engine = new Engine({
      debug: true,
    });

    const worldProvider: WorldProvider = (worldContext): World => {
      const world = new World({
        engine: worldContext.engine,
      });

      const renderer = world.create.renderer.webgl({
        domElementId: 'renderer-root',
        renderer: new WebGLRenderer({
          precision: 'lowp',
          powerPreference: 'high-performance',
        }),
      });

      const scene = world.create.scene();
      scene.threeScene.fog = new Fog('red', 40, 110);
      
      scene.threeScene.background = new Color(DARK_BLUE);

      scene.add(new AmbientLight(0xffffff, 1.5));

      const camera = world.create.camera({
        camera: new PerspectiveCamera(50, 1, 20, 1000),
      });
      camera.position.set(0, 10, 60);

      const view = renderer.create.view({
        camera,
        scene,
      });

      new OrbitControls(camera.three, view.domElement);

      const space = world.create.space();

      const fireflies = 500;

      const randomFireflyPos = () => Math.random() * 24 - 12;
      for (let i = 0; i < fireflies; i++) {
        const entity = space.create.entity();

        const object = new FireflyObject3DComponent({ scene });
        object.mesh.position.set(
          randomFireflyPos(),
          randomFireflyPos(),
          randomFireflyPos()
        );
        entity.addComponent(object);
        entity.addComponent(EnergyComponent);
        entity.addComponent(WalkingComponent);
      }

      world.add.system(new RandomWalkSystem());
      world.add.system(new RestingSystem());

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
