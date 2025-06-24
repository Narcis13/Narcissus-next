import { nodeRegistry } from './NodeRegistry';
import { AbstractNode } from './AbstractNode';

export function RegisterNode(target: new () => AbstractNode) {
  const instance = new target();
  nodeRegistry.register(instance);
  return target;
}