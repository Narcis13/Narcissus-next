import { 
  NodeDefinition, 
  NodeInput, 
  NodeOutput, 
  NodeEdge,
  NodeExecutionParams, 
  NodeExecutionResult,
  NodeExecutionContext,
  AIPromptHints
} from '../../types/node';
import { NodeCategory } from '../../types/base';

export abstract class AbstractNode implements NodeDefinition {
  abstract id: string;
  abstract version: string;
  abstract name: string;
  abstract description: string;
  abstract categories: NodeCategory[];
  abstract tags: string[];
  abstract inputs: NodeInput[];
  abstract outputs: NodeOutput[];
  
  edges?: NodeEdge[];
  aiPromptHints?: AIPromptHints;
  
  config = {
    retryable: true,
    timeout: 30000,
    maxRetries: 3,
    retryDelay: 1000,
    requiresAuth: false,
    cacheable: false,
    cacheTime: 0
  };
  
  abstract execute(params: NodeExecutionParams): Promise<NodeExecutionResult>;
  
  get implementation() {
    return this.execute.bind(this);
  }
  
  protected validateInputs(inputs: Record<string, any>): void {
    for (const inputDef of this.inputs) {
      const value = inputs[inputDef.name];
      
      if (inputDef.required && value === undefined) {
        throw new Error(`Missing required input: ${inputDef.name}`);
      }
      
      if (value !== undefined && inputDef.validation) {
        this.validateInput(inputDef, value);
      }
    }
  }
  
  private validateInput(inputDef: NodeInput, value: any): void {
    const { validation } = inputDef;
    
    if (validation.min !== undefined && value < validation.min) {
      throw new Error(`Input ${inputDef.name} must be >= ${validation.min}`);
    }
    
    if (validation.max !== undefined && value > validation.max) {
      throw new Error(`Input ${inputDef.name} must be <= ${validation.max}`);
    }
    
    if (validation.pattern) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        throw new Error(`Input ${inputDef.name} does not match pattern: ${validation.pattern}`);
      }
    }
    
    if (validation.enum && !validation.enum.includes(value)) {
      throw new Error(`Input ${inputDef.name} must be one of: ${validation.enum.join(', ')}`);
    }
    
    if (validation.custom) {
      const result = validation.custom(value);
      if (typeof result === 'string') {
        throw new Error(`Input ${inputDef.name} validation failed: ${result}`);
      } else if (!result) {
        throw new Error(`Input ${inputDef.name} failed custom validation`);
      }
    }
  }
  
  protected createSuccessResult(outputs: Record<string, any>, metadata?: Record<string, any>): NodeExecutionResult {
    return {
      outputs,
      metadata: {
        ...metadata,
        duration: metadata?.duration || 0
      }
    };
  }
  
  protected createErrorResult(error: Error | string, code?: string): NodeExecutionResult {
    return {
      error: {
        code: code || 'EXECUTION_ERROR',
        message: typeof error === 'string' ? error : error.message,
        details: error instanceof Error ? { stack: error.stack } : undefined
      }
    };
  }
  
  protected createBranchResult(edgeName: string, outputs?: Record<string, any>): NodeExecutionResult {
    return {
      edge: edgeName,
      outputs
    };
  }
  
  protected async withTimeout<T>(
    promise: Promise<T>,
    context: NodeExecutionContext
  ): Promise<T> {
    const timeout = this.config.timeout || 30000;
    
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error('Node execution timeout')), timeout)
      )
    ]);
  }
  
  protected log(context: NodeExecutionContext, message: string, level: "info" | "warn" | "error" = "info") {
    context.log(`[${this.id}] ${message}`, level);
  }
}