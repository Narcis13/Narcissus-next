import { NodeDefinition, NodeCategory } from '../../types';
import { AbstractNode } from './AbstractNode';

export class NodeRegistry {
  private static instance: NodeRegistry;
  private nodes: Map<string, NodeDefinition> = new Map();
  private nodesByCategory: Map<NodeCategory, Set<string>> = new Map();
  private nodesByTag: Map<string, Set<string>> = new Map();
  
  private constructor() {}
  
  static getInstance(): NodeRegistry {
    if (!NodeRegistry.instance) {
      NodeRegistry.instance = new NodeRegistry();
    }
    return NodeRegistry.instance;
  }
  
  register(nodeOrDefinition: AbstractNode | NodeDefinition): void {
    const definition = 'implementation' in nodeOrDefinition 
      ? nodeOrDefinition 
      : nodeOrDefinition as NodeDefinition;
    
    if (this.nodes.has(definition.id)) {
      throw new Error(`Node with id "${definition.id}" is already registered`);
    }
    
    this.nodes.set(definition.id, definition);
    
    for (const category of definition.categories) {
      if (!this.nodesByCategory.has(category)) {
        this.nodesByCategory.set(category, new Set());
      }
      this.nodesByCategory.get(category)!.add(definition.id);
    }
    
    for (const tag of definition.tags) {
      if (!this.nodesByTag.has(tag)) {
        this.nodesByTag.set(tag, new Set());
      }
      this.nodesByTag.get(tag)!.add(definition.id);
    }
  }
  
  unregister(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;
    
    for (const category of node.categories) {
      this.nodesByCategory.get(category)?.delete(nodeId);
    }
    
    for (const tag of node.tags) {
      this.nodesByTag.get(tag)?.delete(nodeId);
    }
    
    this.nodes.delete(nodeId);
  }
  
  get(nodeId: string): NodeDefinition | undefined {
    return this.nodes.get(nodeId);
  }
  
  getAll(): NodeDefinition[] {
    return Array.from(this.nodes.values());
  }
  
  getByCategory(category: NodeCategory): NodeDefinition[] {
    const nodeIds = this.nodesByCategory.get(category);
    if (!nodeIds) return [];
    
    return Array.from(nodeIds)
      .map(id => this.nodes.get(id))
      .filter((node): node is NodeDefinition => node !== undefined);
  }
  
  getByTag(tag: string): NodeDefinition[] {
    const nodeIds = this.nodesByTag.get(tag);
    if (!nodeIds) return [];
    
    return Array.from(nodeIds)
      .map(id => this.nodes.get(id))
      .filter((node): node is NodeDefinition => node !== undefined);
  }
  
  search(query: string): NodeDefinition[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(node => 
      node.id.toLowerCase().includes(lowerQuery) ||
      node.name.toLowerCase().includes(lowerQuery) ||
      node.description.toLowerCase().includes(lowerQuery) ||
      node.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      node.aiPromptHints?.toolName.toLowerCase().includes(lowerQuery) ||
      node.aiPromptHints?.summary.toLowerCase().includes(lowerQuery)
    );
  }
  
  searchByAIHints(query: string): NodeDefinition[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(node => {
      if (!node.aiPromptHints) return false;
      
      return (
        node.aiPromptHints.toolName.toLowerCase().includes(lowerQuery) ||
        node.aiPromptHints.summary.toLowerCase().includes(lowerQuery) ||
        node.aiPromptHints.useCase.toLowerCase().includes(lowerQuery) ||
        node.aiPromptHints.expectedInputFormat.toLowerCase().includes(lowerQuery) ||
        node.aiPromptHints.outputDescription.toLowerCase().includes(lowerQuery) ||
        (node.aiPromptHints.examples?.some(ex => ex.toLowerCase().includes(lowerQuery)) ?? false)
      );
    });
  }
  
  validate(nodeId: string): { valid: boolean; errors: string[] } {
    const node = this.nodes.get(nodeId);
    if (!node) {
      return { valid: false, errors: [`Node with id "${nodeId}" not found`] };
    }
    
    const errors: string[] = [];
    
    if (!node.id || node.id.trim() === '') {
      errors.push('Node must have a valid id');
    }
    
    if (!node.name || node.name.trim() === '') {
      errors.push('Node must have a valid name');
    }
    
    if (!node.description || node.description.trim() === '') {
      errors.push('Node must have a description');
    }
    
    if (!node.categories || node.categories.length === 0) {
      errors.push('Node must have at least one category');
    }
    
    if (!node.implementation) {
      errors.push('Node must have an implementation function');
    }
    
    if (node.inputs.length === 0 && node.outputs.length === 0) {
      errors.push('Node must have at least one input or output');
    }
    
    const inputNames = new Set<string>();
    for (const input of node.inputs) {
      if (!input.name || input.name.trim() === '') {
        errors.push('All inputs must have a valid name');
      }
      if (inputNames.has(input.name)) {
        errors.push(`Duplicate input name: ${input.name}`);
      }
      inputNames.add(input.name);
    }
    
    const outputNames = new Set<string>();
    for (const output of node.outputs) {
      if (!output.name || output.name.trim() === '') {
        errors.push('All outputs must have a valid name');
      }
      if (outputNames.has(output.name)) {
        errors.push(`Duplicate output name: ${output.name}`);
      }
      outputNames.add(output.name);
    }
    
    if (node.edges) {
      const edgeNames = new Set<string>();
      for (const edge of node.edges) {
        if (!edge.name || edge.name.trim() === '') {
          errors.push('All edges must have a valid name');
        }
        if (edgeNames.has(edge.name)) {
          errors.push(`Duplicate edge name: ${edge.name}`);
        }
        edgeNames.add(edge.name);
      }
    }
    
    return { valid: errors.length === 0, errors };
  }
  
  clear(): void {
    this.nodes.clear();
    this.nodesByCategory.clear();
    this.nodesByTag.clear();
  }
  
  toJSON(): Record<string, NodeDefinition> {
    const result: Record<string, NodeDefinition> = {};
    for (const [id, node] of this.nodes) {
      result[id] = node;
    }
    return result;
  }
  
  fromJSON(data: Record<string, NodeDefinition>): void {
    this.clear();
    for (const [id, node] of Object.entries(data)) {
      if (node.id !== id) {
        throw new Error(`Node id mismatch: "${id}" !== "${node.id}"`);
      }
      this.register(node);
    }
  }
}

export const nodeRegistry = NodeRegistry.getInstance();