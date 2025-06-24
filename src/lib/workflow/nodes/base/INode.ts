import { NodeDefinition } from '../../types/node';

export interface INode extends NodeDefinition {
  validate(): boolean;
  getMetadata(): Record<string, any>;
}