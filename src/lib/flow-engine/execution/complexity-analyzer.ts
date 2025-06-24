import { WorkflowComplexity } from "./types";
import { 
  isParameterizedNode,
  isSubFlow,
  isLoop,
  isBranchNode,
  isStringNode
} from "@/lib/workflow/types/flowmanager-workflow";

export class ComplexityAnalyzer {
  private static readonly EXTERNAL_NODE_PATTERNS = [
    "integration.http",
    "integration.database",
    "integration.email",
    "ai.",
    "external.",
  ];

  private static readonly LOOP_NODE_PATTERNS = [
    "logic.loop",
    "logic.foreach",
    "flow.loop",
  ];

  private static readonly HUMAN_INPUT_PATTERNS = [
    "human.",
    "approval.",
    "manual.",
  ];

  private static readonly NODE_EXECUTION_TIMES: Record<string, number> = {
    "logic.condition": 10,
    "data.transform": 50,
    "integration.http": 2000,
    "integration.database": 1000,
    "ai.completion": 5000,
    "human.approval": 60000, // 1 minute minimum
    default: 100,
  };

  static analyze(workflow: any): WorkflowComplexity {
    let nodeCount = 0;
    let hasExternalCalls = false;
    let hasLoops = false;
    let hasParallelExecution = false;
    let requiresHumanInput = false;
    let estimatedDuration = 0;

    // Analyze nodes recursively
    const analyzeNode = (node: any) => {
      nodeCount++;
      
      if (isStringNode(node)) {
        // String node reference
        if (this.isExternalNode(node)) {
          hasExternalCalls = true;
        }
        if (this.isLoopNode(node)) {
          hasLoops = true;
        }
        if (this.isHumanInputNode(node)) {
          requiresHumanInput = true;
        }
        estimatedDuration += this.getNodeExecutionTime(node);
      } else if (isParameterizedNode(node)) {
        // Parameterized node
        const nodeId = Object.keys(node)[0];
        if (this.isExternalNode(nodeId)) {
          hasExternalCalls = true;
        }
        if (this.isLoopNode(nodeId)) {
          hasLoops = true;
        }
        if (this.isHumanInputNode(nodeId)) {
          requiresHumanInput = true;
        }
        estimatedDuration += this.getNodeExecutionTime(nodeId);
      } else if (isSubFlow(node)) {
        // Sub-flow
        hasParallelExecution = true; // Sub-flows can run in parallel
        node.forEach(analyzeNode);
      } else if (isLoop(node)) {
        // Loop structure
        hasLoops = true;
        node[0].forEach(analyzeNode);
        estimatedDuration *= 3; // Assume average 3 iterations
      } else if (isBranchNode(node)) {
        // Branch node
        Object.values(node).forEach(analyzeNode);
      }
    };

    // Analyze all nodes
    if (workflow.nodes && Array.isArray(workflow.nodes)) {
      workflow.nodes.forEach(analyzeNode);
    }

    // Adjust duration for parallel execution
    if (hasParallelExecution) {
      estimatedDuration *= 0.7; // Parallel execution reduces total time
    }

    return {
      nodeCount,
      hasExternalCalls,
      hasLoops,
      hasParallelExecution,
      estimatedDuration,
      requiresHumanInput,
    };
  }

  private static isExternalNode(nodeId: string): boolean {
    return this.EXTERNAL_NODE_PATTERNS.some(pattern => 
      nodeId.toLowerCase().includes(pattern)
    );
  }

  private static isLoopNode(nodeId: string): boolean {
    return this.LOOP_NODE_PATTERNS.some(pattern => 
      nodeId.toLowerCase().includes(pattern)
    );
  }

  private static isHumanInputNode(nodeId: string): boolean {
    return this.HUMAN_INPUT_PATTERNS.some(pattern => 
      nodeId.toLowerCase().includes(pattern)
    );
  }

  private static getNodeExecutionTime(nodeId: string): number {
    for (const [pattern, time] of Object.entries(this.NODE_EXECUTION_TIMES)) {
      if (nodeId.includes(pattern)) {
        return time;
      }
    }
    return this.NODE_EXECUTION_TIMES.default;
  }


  static shouldUseQueue(complexity: WorkflowComplexity): boolean {
    // Use queue if:
    // 1. Workflow has more than 10 nodes
    // 2. Estimated duration > 30 seconds
    // 3. Requires human input
    // 4. Has external calls and loops
    
    if (complexity.nodeCount > 10) return true;
    if (complexity.estimatedDuration > 30000) return true;
    if (complexity.requiresHumanInput) return true;
    if (complexity.hasExternalCalls && complexity.hasLoops) return true;
    
    return false;
  }
}