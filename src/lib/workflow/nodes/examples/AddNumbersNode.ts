import { AbstractNode, RegisterNode } from '../base';
import { NodeExecutionParams, NodeExecutionResult } from '../../types/node';
import { NodeCategory } from '../../types/base';

@RegisterNode
export class AddNumbersNode extends AbstractNode {
  id = 'math.add';
  version = '1.0.0';
  name = 'Add Numbers';
  description = 'Adds two numbers together';
  categories: NodeCategory[] = ['data', 'utility'];
  tags = ['math', 'arithmetic', 'addition', 'sum'];
  
  inputs = [
    {
      name: 'a',
      type: 'number' as const,
      description: 'First number to add',
      required: true,
      example: 5,
      validation: {
        min: Number.MIN_SAFE_INTEGER,
        max: Number.MAX_SAFE_INTEGER
      }
    },
    {
      name: 'b',
      type: 'number' as const,
      description: 'Second number to add',
      required: true,
      example: 3,
      validation: {
        min: Number.MIN_SAFE_INTEGER,
        max: Number.MAX_SAFE_INTEGER
      }
    }
  ];
  
  outputs = [
    {
      name: 'result',
      type: 'number' as const,
      description: 'Sum of the two numbers',
      example: 8
    }
  ];
  
  aiPromptHints = {
    toolName: 'Add Numbers',
    summary: 'Performs addition of two numbers',
    useCase: 'Use when you need to add two numeric values together',
    expectedInputFormat: 'Two numbers (a and b)',
    outputDescription: 'The sum of a and b',
    examples: [
      'Add 5 and 3 to get 8',
      'Calculate the sum of two values',
      'Combine two numeric amounts'
    ]
  };
  
  async execute(params: NodeExecutionParams): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    
    try {
      this.validateInputs(params.inputs);
      
      const { a, b } = params.inputs;
      const result = a + b;
      
      this.log(params.context, `Adding ${a} + ${b} = ${result}`);
      
      return this.createSuccessResult(
        { result },
        { duration: Date.now() - startTime }
      );
    } catch (error) {
      this.log(params.context, `Error: ${error}`, 'error');
      return this.createErrorResult(error as Error);
    }
  }
}