import { Body, Quaternion as CQuaternion, Vec3 } from 'cannon-es';
import cannonDebugger from 'cannon-es-debugger';
import { Color, Quaternion, Scene, Vector3 } from 'three';
import paramsToBody from './params-to-body';
import { Physics } from './physics';
import { BodyParams, BodyShapeType } from './types';

/**
 * The API for a debugger implementation
 */
type DebugApi = {
  update: () => void;
};

/**
 * Debugging information available to a debugger
 */
type PhysicsDebugInfo = { bodies: Body[]; refs: { [uuid: string]: Body } };

/**
 * Color for the physics debugger to use
 */
type PhysicsDebuggerColor = string | number | Color;

/**
 * Params for creating a PhysicsDebugger instance
 */
interface PhysicsDebuggerParams {
  scene?: Scene;
  color?: PhysicsDebuggerColor;
  scale?: number;
}

const v = new Vector3();
const s = new Vector3(1, 1, 1);
const q = new Quaternion();

/**
 * Debugger for Physics that adds physics object representations to a three scene
 */
class PhysicsDebugger {
  /**
   * The physics world for the debugger
   */
  physics: Physics;

  /**
   * The scene that the debugger is adding and removing from
   */
  scene: Scene;

  /**
   * The color for debug three objects to be displayed as
   */
  color: PhysicsDebuggerColor;

  /**
   * The scale of the debugger
   */
  scale: number;

  /**
   * The cannon debugger
   */
  debugger: DebugApi;

  /**
   * Physics world debug information
   */
  debugInfo: PhysicsDebugInfo = { bodies: [], refs: {} };

  constructor(physics: Physics, params?: PhysicsDebuggerParams) {
    this.physics = physics;

    this.scene = params?.scene ? params.scene : new Scene();
    this.color = params?.color ? params.color : 'black';
    this.scale = params?.scale ? params.scale : 1;

    this.debugger = cannonDebugger(this.scene, this.debugInfo.bodies, {
      color: this.color,
      scale: this.scale,
      autoUpdate: false,
    });
  }

  /**
   * Updates the debugger
   */
  update(): void {
    Object.keys(this.debugInfo.refs).forEach((uuid) => {
      this.physics.refs[uuid].matrix.decompose(v, q, s);
      this.debugInfo.refs[uuid].position.copy(v as unknown as Vec3);
      this.debugInfo.refs[uuid].quaternion.copy(q as unknown as CQuaternion);
    });

    this.debugger.update();
  }

  /**
   * Adds a body to the debugger
   * @param id the id of the body
   * @param params params for the body
   * @param type the body shape type
   */
  add(id: string, params: BodyParams, type: BodyShapeType): void {
    const body = paramsToBody(id, params, type);
    this.debugInfo.bodies.push(body);
    this.debugInfo.refs[id] = body;
  }

  /**
   * Removes a body from the debugger
   * @param id the id of the body
   */
  remove(id: string): void {
    const debugBodyIndex = this.debugInfo.bodies.indexOf(this.debugInfo.refs[id]);
    if (debugBodyIndex > -1) this.debugInfo.bodies.splice(debugBodyIndex, 1);
    delete this.debugInfo.refs[id];
  }
}

export { PhysicsDebugger, PhysicsDebuggerParams, PhysicsDebuggerColor, PhysicsDebugInfo };