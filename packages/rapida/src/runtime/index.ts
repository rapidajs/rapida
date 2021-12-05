import { Logger } from 'pino';
import Stats from 'stats.js';
import logger from '../common/logger';
import { World, WorldProvider } from '../world';

/**
 * Parameters for creating a new rapida runtime
 */
type RuntimeParams = {
  maxUpdatesPerSecond?: number;
  debug?: boolean;
};

/**
 * A Runtime for rapida worlds
 */
class Runtime {
  /**
   * The current world in play
   */
  world?: World;

  /**
   * The logger for the runtime
   */
  log: Logger;

  /**
   * The world providers for the runtime
   */
  private worldProviders: { [id: string]: WorldProvider } = {};

  /**
   * Whether the runtime is in debug mode
   */
  private debug: boolean;

  /**
   * The DOM element for the renderer
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private domElement: any;

  /**
   * Whether the render loop should be interrupted
   * If set to true, the loop will be stopped on the next loop
   * Set back to false after killing the loop
   */
  private killLoop = false;

  /**
   * The time in milliseconds to wait before running another runtime update
   */
  private updateDelay: number;

  /**
   * The time of the previous animation frame
   */
  private previousGameLoopFrame: number | undefined;

  /**
   * The stats.js instance for the runtime
   */
  private stats: Stats = new Stats();

  constructor(params?: RuntimeParams) {
    // Set update delay
    this.updateDelay = 1000 / (params?.maxUpdatesPerSecond || 60);

    // init world providers map
    this.worldProviders = {};

    // set whether the runtime should be in debug mode
    this.debug = params?.debug || false;

    // setup stats if in debug mode
    if (this.debug) {
      this.stats.showPanel(0);
      document.body.appendChild(this.stats.dom);
      this.stats.dom.style.top = '0';
      this.stats.dom.style.left = 'unset';
      this.stats.dom.style.right = '0';
    }

    // store the logger
    this.log = logger;
    this.log.level = this.debug ? 'debug' : 'info';
  }

  /**
   * Registers a new world provider
   * @param worldId the world ID
   * @param worldProvider a function that returns a new World for a given worldId
   */
  registerWorld = (worldId: string, worldProvider: WorldProvider): void => {
    this.worldProviders[worldId] = worldProvider;
  };

  /**
   * Sets the world that is playing.
   * If a world is already playing, the current world is stopped and the new world is started.
   * @param worldId the new world to start
   */
  startWorld(worldId: string): Runtime {
    // clean up running world
    if (this.world !== undefined) {
      // kill the render loop
      this.killLoop = true;

      // destroy the world
      this.world.destroy();
    }

    // get the world provider
    const worldProvider = this.worldProviders[worldId];
    if (worldProvider === undefined) {
      throw new Error('there is no world provider for the given world id');
    }

    // create the world
    this.world = worldProvider({
      runtime: this,
    });
    if (this.world === undefined) {
      throw new Error('Cannot init as the newly provided world is undefined');
    }

    // set killLoop to false now in case anything went wrong
    this.killLoop = false;

    // start the world
    this.world.init();

    // start the loops
    const t = performance.now();
    this.previousGameLoopFrame = t;
    this.gameLoop();
    this.physicsLoop();
    this.renderLoop();

    return this;
  }

  /**
   * Destroys the runtime
   */
  destroy(): void {
    this.world?.destroy();
    this.stats.dom.remove();
    this.stats.end();
  }

  /**
   * Runs the render loop for the runtime
   */
  private renderLoop() {
    requestAnimationFrame((_t) => {
      if (this.killLoop === true) {
        this.killLoop = false;
        return;
      }

      this.world?.render();

      this.stats.update();

      this.renderLoop();
    });
  }

  /**
   * The game logic loop
   */
  private gameLoop() {
    if (this.killLoop === true) {
      this.killLoop = false;
      return;
    }

    const t = performance.now();
    const timeElapsed = t - (this.previousGameLoopFrame as number);
    this.world?.update(timeElapsed);

    this.previousGameLoopFrame = performance.now();

    setTimeout(() => {
      this.gameLoop();
    }, this.updateDelay);
  }

  /**
   * The physics loop
   */
  private physicsLoop() {
    if (this.killLoop === true) {
      this.killLoop = false;
      return;
    }

    this.world?.updatePhysics();

    setTimeout(() => {
      this.physicsLoop();
    }, this.updateDelay);
  }
}

export { Runtime, RuntimeParams };
