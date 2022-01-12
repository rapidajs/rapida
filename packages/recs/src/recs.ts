import { uuid } from '@rapidajs/rapida-common';
import { System } from './system';
import { Space, SpaceParams } from './space';
import { SystemManager } from './system-manager';
import { QueryManager } from './query-manager';
import { EntityManager } from './entity-manager';

/**
 * RECS Entity Component System that contains systems and spaces
 */
export class RECS {
  /**
   * A unique id for the RECS instance
   */
  id = uuid();

  /**
   * Spaces in the RECS instance
   */
  spaces: Map<string, Space> = new Map();

  /**
   * The EntityManager for the RECS instance that manages entities and their components
   */
  entityManager: EntityManager;

  /**
   * The system manager for the RECS instance
   */
  systemManager: SystemManager;

  /**
   * The query manager for the RECS instance
   */
  queryManager: QueryManager;

  /**
   * Whether the RECS instance has been initialised
   */
  initialised = false;

  /**
   * A map of ids to update functions for all systems in the RECS instance
   */
  _systemsUpdatePool: Map<string, (timeElapsed: number) => void> = new Map();

  /**
   * Constructor for a RECS instance
   */
  constructor() {
    this.entityManager = new EntityManager(this);
    this.queryManager = new QueryManager(this);
    this.systemManager = new SystemManager(this);
  }

  /**
   * Retrieves RECS factories
   */
  public get create(): {
    /**
     * Creates a space in the RECS
     * @param params the params for the space
     * @returns the new space
     */
    space: (params?: SpaceParams) => Space;
  } {
    return {
      space: (params?: SpaceParams): Space => {
        const space = new Space(this, params);
        this.spaces.set(space.id, space);

        if (this.initialised) {
          space._init();
        }

        return space;
      },
    };
  }

  /**
   * Retrieves RECS add methods
   */
  public get add(): {
    /**
     * Adds a system to the RECS
     * @param system the system to add to the RECS
     */
    system: (system: System) => System;
  } {
    return {
      system: (system: System): System => {
        this.systemManager.addSystem(system);
        return system;
      },
    };
  }

  /**
   * Initialises the RECS instance
   */
  init(): void {
    // Set the RECS to be initialised
    this.initialised = true;

    // Initialise systems
    this.systemManager.init();

    // Initialise spaces
    this.spaces.forEach((s) => {
      s._init();
    });
  }

  /**
   * Removes from the RECS instance
   * @param value the value to remove
   */
  remove(value: System | Space): void {
    if (value instanceof System) {
      this.systemManager.removeSystem(value);
    } else if (value instanceof Space) {
      this.spaces.delete(value.id);
      value._destroy();
    }
  }

  /**
   * Updates the RECS instance
   * @param timeElapsed the time elapsed in seconds
   */
  update(timeElapsed: number): void {
    // update components - runs update methods for all components that have them
    this.entityManager.updateComponents(timeElapsed);

    // update entities - steps entity event system
    this.entityManager.updateEntities();

    // update spaces - steps space event system
    this.spaces.forEach((s) => s._updateEvents());

    // update queries
    this.queryManager.update();

    // recycle destroyed entities and components after queries have been updated
    this.entityManager.recycle();

    // update entities in spaces - checks if entities are alive and releases them if they are dead
    this.spaces.forEach((s) => s._updateEntities());

    // update systems
    this.systemManager.update(timeElapsed);
  }

  /**
   * Destroys the RECS instance
   */
  destroy(): void {
    this.systemManager.destroy();
    this.spaces.forEach((s) => s._destroy());
  }
}

export const recs = (): RECS => new RECS();
