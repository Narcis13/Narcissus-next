import { NodeDefinition, NodeInput, NodeOutput } from '../../types/node';
import { DataType } from '../../types/base';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: 'error';
  code: string;
  message: string;
  field?: string;
  details?: any;
}

export interface ValidationWarning {
  type: 'warning';
  code: string;
  message: string;
  field?: string;
  details?: any;
}

export class NodeValidator {
  private static typeValidators: Map<DataType, (value: any) => boolean> = new Map([
    ['string', (v) => typeof v === 'string'],
    ['number', (v) => typeof v === 'number' && !isNaN(v)],
    ['boolean', (v) => typeof v === 'boolean'],
    ['object', (v) => v !== null && typeof v === 'object' && !Array.isArray(v)],
    ['array', (v) => Array.isArray(v)],
    ['any', () => true],
    ['file', (v) => v instanceof File || (typeof v === 'object' && v?.type === 'file')],
    ['date', (v) => v instanceof Date || !isNaN(Date.parse(v))],
    ['json', (v) => {
      try {
        if (typeof v === 'string') JSON.parse(v);
        return true;
      } catch {
        return false;
      }
    }]
  ]);
  
  static validateNode(node: NodeDefinition): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Basic validation
    if (!node.id || node.id.trim() === '') {
      errors.push({
        type: 'error',
        code: 'INVALID_ID',
        message: 'Node must have a valid id'
      });
    }
    
    if (!node.name || node.name.trim() === '') {
      errors.push({
        type: 'error',
        code: 'INVALID_NAME',
        message: 'Node must have a valid name'
      });
    }
    
    if (!node.version || !/^\d+\.\d+\.\d+$/.test(node.version)) {
      errors.push({
        type: 'error',
        code: 'INVALID_VERSION',
        message: 'Node version must follow semantic versioning (x.y.z)',
        field: 'version'
      });
    }
    
    if (!node.categories || node.categories.length === 0) {
      errors.push({
        type: 'error',
        code: 'NO_CATEGORIES',
        message: 'Node must have at least one category'
      });
    }
    
    if (!node.implementation) {
      errors.push({
        type: 'error',
        code: 'NO_IMPLEMENTATION',
        message: 'Node must have an implementation function'
      });
    }
    
    // Validate inputs
    const inputValidation = this.validateInputs(node.inputs);
    errors.push(...inputValidation.errors);
    warnings.push(...inputValidation.warnings);
    
    // Validate outputs
    const outputValidation = this.validateOutputs(node.outputs);
    errors.push(...outputValidation.errors);
    warnings.push(...outputValidation.warnings);
    
    // Validate AI hints
    if (node.aiPromptHints) {
      const aiHintsValidation = this.validateAIHints(node.aiPromptHints);
      errors.push(...aiHintsValidation.errors);
      warnings.push(...aiHintsValidation.warnings);
    } else {
      warnings.push({
        type: 'warning',
        code: 'NO_AI_HINTS',
        message: 'Node should include AI prompt hints for better discoverability'
      });
    }
    
    // Validate edges if present
    if (node.edges) {
      const edgeValidation = this.validateEdges(node.edges);
      errors.push(...edgeValidation.errors);
      warnings.push(...edgeValidation.warnings);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  private static validateInputs(inputs: NodeInput[]): { errors: ValidationError[], warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const names = new Set<string>();
    
    for (const input of inputs) {
      if (!input.name || input.name.trim() === '') {
        errors.push({
          type: 'error',
          code: 'INVALID_INPUT_NAME',
          message: 'Input must have a valid name',
          field: 'inputs'
        });
        continue;
      }
      
      if (names.has(input.name)) {
        errors.push({
          type: 'error',
          code: 'DUPLICATE_INPUT_NAME',
          message: `Duplicate input name: ${input.name}`,
          field: `inputs.${input.name}`
        });
      }
      names.add(input.name);
      
      if (!input.type) {
        errors.push({
          type: 'error',
          code: 'INVALID_INPUT_TYPE',
          message: `Input "${input.name}" must have a valid type`,
          field: `inputs.${input.name}.type`
        });
      }
      
      if (!input.description || input.description.trim() === '') {
        warnings.push({
          type: 'warning',
          code: 'MISSING_INPUT_DESCRIPTION',
          message: `Input "${input.name}" should have a description`,
          field: `inputs.${input.name}.description`
        });
      }
      
      if (!input.example) {
        warnings.push({
          type: 'warning',
          code: 'MISSING_INPUT_EXAMPLE',
          message: `Input "${input.name}" should have an example value`,
          field: `inputs.${input.name}.example`
        });
      }
    }
    
    return { errors, warnings };
  }
  
  private static validateOutputs(outputs: NodeOutput[]): { errors: ValidationError[], warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const names = new Set<string>();
    
    for (const output of outputs) {
      if (!output.name || output.name.trim() === '') {
        errors.push({
          type: 'error',
          code: 'INVALID_OUTPUT_NAME',
          message: 'Output must have a valid name',
          field: 'outputs'
        });
        continue;
      }
      
      if (names.has(output.name)) {
        errors.push({
          type: 'error',
          code: 'DUPLICATE_OUTPUT_NAME',
          message: `Duplicate output name: ${output.name}`,
          field: `outputs.${output.name}`
        });
      }
      names.add(output.name);
      
      if (!output.type) {
        errors.push({
          type: 'error',
          code: 'INVALID_OUTPUT_TYPE',
          message: `Output "${output.name}" must have a valid type`,
          field: `outputs.${output.name}.type`
        });
      }
      
      if (!output.description || output.description.trim() === '') {
        warnings.push({
          type: 'warning',
          code: 'MISSING_OUTPUT_DESCRIPTION',
          message: `Output "${output.name}" should have a description`,
          field: `outputs.${output.name}.description`
        });
      }
      
      if (!output.example) {
        warnings.push({
          type: 'warning',
          code: 'MISSING_OUTPUT_EXAMPLE',
          message: `Output "${output.name}" should have an example value`,
          field: `outputs.${output.name}.example`
        });
      }
    }
    
    return { errors, warnings };
  }
  
  private static validateAIHints(aiHints: any): { errors: ValidationError[], warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    if (!aiHints.toolName || aiHints.toolName.trim() === '') {
      errors.push({
        type: 'error',
        code: 'INVALID_AI_TOOL_NAME',
        message: 'AI hints must include a tool name',
        field: 'aiPromptHints.toolName'
      });
    }
    
    if (!aiHints.summary || aiHints.summary.trim() === '') {
      errors.push({
        type: 'error',
        code: 'INVALID_AI_SUMMARY',
        message: 'AI hints must include a summary',
        field: 'aiPromptHints.summary'
      });
    }
    
    if (!aiHints.useCase || aiHints.useCase.trim() === '') {
      warnings.push({
        type: 'warning',
        code: 'MISSING_AI_USE_CASE',
        message: 'AI hints should include a use case description',
        field: 'aiPromptHints.useCase'
      });
    }
    
    if (!aiHints.examples || aiHints.examples.length === 0) {
      warnings.push({
        type: 'warning',
        code: 'MISSING_AI_EXAMPLES',
        message: 'AI hints should include examples',
        field: 'aiPromptHints.examples'
      });
    }
    
    return { errors, warnings };
  }
  
  private static validateEdges(edges: any[]): { errors: ValidationError[], warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const names = new Set<string>();
    
    for (const edge of edges) {
      if (!edge.name || edge.name.trim() === '') {
        errors.push({
          type: 'error',
          code: 'INVALID_EDGE_NAME',
          message: 'Edge must have a valid name',
          field: 'edges'
        });
        continue;
      }
      
      if (names.has(edge.name)) {
        errors.push({
          type: 'error',
          code: 'DUPLICATE_EDGE_NAME',
          message: `Duplicate edge name: ${edge.name}`,
          field: `edges.${edge.name}`
        });
      }
      names.add(edge.name);
      
      if (!edge.outputType) {
        errors.push({
          type: 'error',
          code: 'INVALID_EDGE_TYPE',
          message: `Edge "${edge.name}" must have an output type`,
          field: `edges.${edge.name}.outputType`
        });
      }
    }
    
    return { errors, warnings };
  }
  
  static validateInputValue(input: NodeInput, value: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    if (input.required && (value === undefined || value === null)) {
      errors.push({
        type: 'error',
        code: 'REQUIRED_INPUT',
        message: `Required input "${input.name}" is missing`,
        field: input.name
      });
      return { valid: false, errors, warnings };
    }
    
    if (value === undefined || value === null) {
      return { valid: true, errors, warnings };
    }
    
    const typeValidator = this.typeValidators.get(input.type);
    if (typeValidator && !typeValidator(value)) {
      errors.push({
        type: 'error',
        code: 'INVALID_TYPE',
        message: `Input "${input.name}" expected type "${input.type}" but got "${typeof value}"`,
        field: input.name,
        details: { expected: input.type, actual: typeof value, value }
      });
    }
    
    if (input.validation) {
      const validationResult = this.validateInputConstraints(input, value);
      errors.push(...validationResult.errors);
      warnings.push(...validationResult.warnings);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  private static validateInputConstraints(input: NodeInput, value: any): { errors: ValidationError[], warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const validation = input.validation!;
    
    if (validation.min !== undefined && value < validation.min) {
      errors.push({
        type: 'error',
        code: 'MIN_CONSTRAINT',
        message: `Input "${input.name}" must be >= ${validation.min}`,
        field: input.name,
        details: { min: validation.min, value }
      });
    }
    
    if (validation.max !== undefined && value > validation.max) {
      errors.push({
        type: 'error',
        code: 'MAX_CONSTRAINT',
        message: `Input "${input.name}" must be <= ${validation.max}`,
        field: input.name,
        details: { max: validation.max, value }
      });
    }
    
    if (validation.pattern) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        errors.push({
          type: 'error',
          code: 'PATTERN_CONSTRAINT',
          message: `Input "${input.name}" does not match pattern: ${validation.pattern}`,
          field: input.name,
          details: { pattern: validation.pattern, value }
        });
      }
    }
    
    if (validation.enum && !validation.enum.includes(value)) {
      errors.push({
        type: 'error',
        code: 'ENUM_CONSTRAINT',
        message: `Input "${input.name}" must be one of: ${validation.enum.join(', ')}`,
        field: input.name,
        details: { enum: validation.enum, value }
      });
    }
    
    if (validation.custom) {
      const result = validation.custom(value);
      if (typeof result === 'string') {
        errors.push({
          type: 'error',
          code: 'CUSTOM_CONSTRAINT',
          message: result,
          field: input.name,
          details: { value }
        });
      } else if (!result) {
        errors.push({
          type: 'error',
          code: 'CUSTOM_CONSTRAINT',
          message: `Input "${input.name}" failed custom validation`,
          field: input.name,
          details: { value }
        });
      }
    }
    
    return { errors, warnings };
  }
}