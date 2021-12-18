import { PhysicsEventTopic } from '../physics-event-topic';
import { State } from '../../state';

export type EnableConstraintMotorEvent = {
  topic: PhysicsEventTopic.ENABLE_CONSTRAINT_MOTOR;
  uuid: string;
};

export const handleEnableConstraintMotor = (e: EnableConstraintMotorEvent, state: State): void => {
  const { uuid } = e;
  // @ts-expect-error extra untyped uuid property
  state.world.constraints.filter(({ uuid: thisId }) => thisId === uuid).map((c) => c.enableMotor());
};