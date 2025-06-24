import { Workflow, NodeDefinition } from "@/lib/workflow/types";
import { WorkflowComplexity } from "./types";

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

  static analyze(
    workflow: Workflow,
    nodeDefinitions: Map<string, NodeDefinition>
  ): WorkflowComplexity {
    const nodeCount = workflow.nodes.length;
    let hasExternalCalls = false;
    let hasLoops = false;
    let hasParallelExecution = false;
    let requiresHumanInput = false;
    let estimatedDuration = 0;

    // Analyze nodes
    for (const node of workflow.nodes) {
      const nodeId = node.nodeId;
      
      // Check for external calls
      if (this.isExternalNode(nodeId)) {
        hasExternalCalls = true;
      }

      // Check for loops
      if (this.isLoopNode(nodeId)) {
        hasLoops = true;
      }

      // Check for human input
      if (this.isHumanInputNode(nodeId)) {
        requiresHumanInput = true;
      }

      // Estimate execution time
      estimatedDuration += this.getNodeExecutionTime(nodeId);
    }

    // Check for parallel execution by analyzing connections
    hasParallelExecution = this.hasParallelPaths(workflow);

    // Adjust duration for loops and parallel execution
    if (hasLoops) {
      estimatedDuration *= 3; // Assume average 3 iterations
    }
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

  private static hasParallelPaths(workflow: Workflow): boolean {
    // Build adjacency list
    const graph = new Map<string, Set<string>>();
    
    for (const connection of workflow.connections) {
      const source = connection.source.nodeId;
      const target = connection.target.nodeId;
      
      if (!graph.has(source)) {
        graph.set(source, new Set());
      }
      graph.get(source)!.add(target);
    }

    // Check if any node has multiple outgoing connections
    for (const [_, targets] of graph) {
      if (targets.size > 1) {
        return true;
      }
    }

    return false;
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