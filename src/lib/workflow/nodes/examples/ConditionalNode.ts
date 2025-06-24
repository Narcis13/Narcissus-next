import { AbstractNode, RegisterNode } from '../base';
import { NodeExecutionParams, NodeExecutionResult } from '../../types/node';
import { NodeCategory } from '../../types/base';

@RegisterNode
export class ConditionalNode extends AbstractNode {
  id = 'logic.condition';
  version = '1.0.0';
  name = 'Conditional Branch';
  description = 'Evaluates a condition and branches execution based on the result';
  categories: NodeCategory[] = ['logic'];
  tags = ['condition', 'if', 'branch', 'decision', 'flow-control'];
  
  inputs = [
    {
      name: 'value',
      type: 'any' as const,
      description: 'Value to evaluate',
      required: true,
      example: 10
    },
    {
      name: 'operator',
      type: 'string' as const,
      description: 'Comparison operator',
      required: true,
      example: '>',
      validation: {
        enum: ['==', '!=', '>', '<', '>=', '<=', 'contains', 'startsWith', 'endsWith']
      }
    },
    {
      name: 'compareValue',
      type: 'any' as const,
      description: 'Value to compare against',
      required: true,
      example: 5
    }
  ];
  
  outputs = [
    {
      name: 'result',
      type: 'boolean' as const,
      description: 'Result of the condition evaluation',
      example: true
    },
    {
      name: 'value',
      type: 'any' as const,
      description: 'The original value passed through',
      example: 10
    }
  ];
  
  edges = [
    {
      name: 'true',
      description: 'Branch taken when condition is true',
      outputType: 'boolean' as const
    },
    {
      name: 'false',
      description: 'Branch taken when condition is false',
      outputType: 'boolean' as const
    }
  ];
  
  aiPromptHints = {
    toolName: 'Conditional Branch',
    summary: 'Evaluates conditions and directs workflow flow based on results',
    useCase: 'Use for decision-making in workflows, like "if value > 10 then do X else do Y"',
    expectedInputFormat: 'A value, comparison operator (==, !=, >, <, etc.), and a value to compare against',
    outputDescription: 'Boolean result and branches to either "true" or "false" path',
    examples: [
      'Check if temperature > 30',
      'Verify if status == "completed"',
      'Test if name contains "admin"',
      'Branch workflow based on user role'
    ]
  };
  
  async execute(params: NodeExecutionParams): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    
    try {
      this.validateInputs(params.inputs);
      
      const { value, operator, compareValue } = params.inputs;
      let result: boolean;
      
      switch (operator) {
        case '==':
          result = value == compareValue;
          break;
        case '!=':
          result = value != compareValue;
          break;
        case '>':
          result = value > compareValue;
          break;
        case '<':
          result = value < compareValue;
          break;
        case '>=':
          result = value >= compareValue;
          break;
        case '<=':
          result = value <= compareValue;
          break;
        case 'contains':
          result = String(value).includes(String(compareValue));
          break;
        case 'startsWith':
          result = String(value).startsWith(String(compareValue));
          break;
        case 'endsWith':
          result = String(value).endsWith(String(compareValue));
          break;
        default:
          throw new Error(`Unknown operator: ${operator}`);
      }
      
      this.log(params.context, `Condition: ${value} ${operator} ${compareValue} = ${result}`);
      
      return this.createBranchResult(
        result ? 'true' : 'false',
        { result, value }
      );
    } catch (error) {
      this.log(params.context, `Error: ${error}`, 'error');
      return this.createErrorResult(error as Error);
    }
  }
}