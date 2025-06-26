import { Node, Edge } from 'reactflow';
import { CustomNodeData } from '../nodes/CustomNode';
import { FlowManagerWorkflow } from '@/lib/workflow/types/flowmanager-workflow';

interface ParsedFlow {
  nodes: Node[];
  edges: Edge[];
}

let nodeIdCounter = 0;
let edgeIdCounter = 0;

function resetCounters() {
  nodeIdCounter = 0;
  edgeIdCounter = 0;
}

function generateNodeId(): string {
  return `node-${nodeIdCounter++}`;
}

function generateEdgeId(): string {
  return `edge-${edgeIdCounter++}`;
}

function extractNodeInfo(node: any): { nodeId: string; params?: Record<string, any> } {
  if (typeof node === 'string') {
    return { nodeId: node };
  }
  
  if (typeof node === 'object' && !Array.isArray(node)) {
    const keys = Object.keys(node);
    if (keys.length === 1) {
      return { nodeId: keys[0], params: node[keys[0]] };
    }
  }
  
  return { nodeId: 'unknown' };
}

function getNodeCategory(nodeId: string): string {
  const parts = nodeId.split('.');
  return parts[0] || 'default';
}

function getNodeLabel(nodeId: string): string {
  // Special cases for common nodes
  const labelMap: Record<string, string> = {
    'data.fetch.http': 'HTTP Request',
    'data.fetch.list': 'Fetch List',
    'logic.condition.if': 'If Condition',
    'logic.loop.controller': 'Loop Controller',
    'data.transform.process': 'Process Data',
    'data.save.database': 'Save to Database',
    'send.email.notification': 'Send Email',
    'send.email.summary': 'Email Summary',
    'utility.debug.log': 'Debug Log',
    'webhook.trigger.receive': 'Webhook Trigger',
    'data.validate.schema': 'Validate Schema',
    'ai.openai.completion': 'OpenAI Completion',
    'ai.anthropic.claude': 'Claude AI',
    'ai.response.parser': 'Parse AI Response',
    'logic.condition.switch': 'Switch Condition',
    'data.transform.format': 'Format Data',
    'send.webhook.response': 'Webhook Response',
    'send.error.notification': 'Error Notification',
    'logic.delay.wait': 'Delay',
    'utility.log.analytics': 'Log Analytics',
    'data.transform.uppercase': 'Uppercase Transform',
  };
  
  if (labelMap[nodeId]) {
    return labelMap[nodeId];
  }
  
  // Default parsing
  const parts = nodeId.split('.');
  if (parts.length >= 3) {
    return parts[2].split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  } else if (parts.length === 2) {
    return parts[1].split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
  return nodeId;
}

function parseNode(
  node: any,
  index: number,
  parentId?: string,
  position?: { x: number; y: number }
): { nodes: Node[]; edges: Edge[]; lastNodeId: string } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let lastNodeId = '';
  
  const pos = position || { x: 0, y: index * 100 };
  
  if (Array.isArray(node)) {
    // Check if this is a loop (double array: [[controller, action1, action2]])
    if (node.length > 0 && Array.isArray(node[0]) && node.every(n => Array.isArray(n))) {
      // This is a loop structure - we should only have one inner array
      const loopNodes = node[0]; // Get the first (and should be only) inner array
      
      if (!loopNodes || loopNodes.length === 0) {
        console.warn('Empty loop structure');
        return { nodes, edges, lastNodeId: parentId || '' };
      }
      
      const loopNodeId = generateNodeId();
      const loopNode: Node = {
        id: loopNodeId,
        type: 'loop',
        position: pos,
        data: {
          label: 'Loop Controller',
          description: 'Executes nodes in a loop until exit condition',
        },
      };
      nodes.push(loopNode);
      
      if (parentId) {
        edges.push({
          id: generateEdgeId(),
          source: parentId,
          target: loopNodeId,
        });
      }
      
      let lastLoopNodeId = loopNodeId;
      
      // Parse each node in the loop
      loopNodes.forEach((loopItem, loopIndex) => {
        const result = parseNode(
          loopItem,
          loopIndex,
          lastLoopNodeId,
          { x: pos.x + (loopIndex + 1) * 150, y: pos.y }
        );
        nodes.push(...result.nodes);
        edges.push(...result.edges);
        if (result.lastNodeId) {
          lastLoopNodeId = result.lastNodeId;
        }
      });
      
      // Add loop-back edge if we have nodes in the loop
      if (lastLoopNodeId && lastLoopNodeId !== loopNodeId) {
        edges.push({
          id: generateEdgeId(),
          source: lastLoopNodeId,
          target: loopNodeId,
          targetHandle: 'loop-return',
          type: 'smoothstep',
          animated: true,
          style: { 
            stroke: '#f59e0b',
            strokeWidth: 2,
          },
          markerEnd: {
            type: 'arrowclosed',
            width: 20,
            height: 20,
            color: '#f59e0b',
          },
        });
      }
      
      lastNodeId = loopNodeId;
    } else {
      const subflowNodeId = generateNodeId();
      const subflowNode: Node = {
        id: subflowNodeId,
        type: 'subflow',
        position: pos,
        data: {
          label: 'Subflow',
          description: 'Contains nested workflow nodes',
          nodeCount: node.length,
        },
      };
      nodes.push(subflowNode);
      
      if (parentId) {
        edges.push({
          id: generateEdgeId(),
          source: parentId,
          target: subflowNodeId,
        });
      }
      
      lastNodeId = subflowNodeId;
    }
  } else if (typeof node === 'object' && !Array.isArray(node)) {
    const keys = Object.keys(node);
    
    if (keys.length === 1 && typeof node[keys[0]] === 'object' && !Array.isArray(node[keys[0]])) {
      const { nodeId, params } = extractNodeInfo(node);
      const customNodeId = generateNodeId();
      const customNode: Node<CustomNodeData> = {
        id: customNodeId,
        type: 'custom',
        position: pos,
        data: {
          label: getNodeLabel(nodeId),
          nodeId,
          category: getNodeCategory(nodeId),
          params,
        },
      };
      nodes.push(customNode);
      
      if (parentId) {
        edges.push({
          id: generateEdgeId(),
          source: parentId,
          target: customNodeId,
        });
      }
      
      lastNodeId = customNodeId;
    } else {
      // This is a branch node (object with multiple keys that aren't node parameters)
      const branchNodeId = generateNodeId();
      const conditions = keys.map(key => ({
        edge: key,
        description: `When result is "${key}"`,
      }));
      
      const branchNode: Node = {
        id: branchNodeId,
        type: 'branch',
        position: pos,
        data: {
          label: 'Conditional Branch',
          conditions,
        },
      };
      nodes.push(branchNode);
      
      if (parentId) {
        edges.push({
          id: generateEdgeId(),
          source: parentId,
          target: branchNodeId,
        });
      }
      
      // Track which branches have been processed
      const branchLastNodes: string[] = [];
      
      keys.forEach((key, branchIndex) => {
        const branchPos = {
          x: pos.x + (branchIndex - Math.floor(keys.length / 2)) * 200,
          y: pos.y + 150,
        };
        
        // Create a special edge from branch node with the correct handle
        const branchEdgeId = generateEdgeId();
        
        // Parse the branch target
        const result = parseNode(node[key], 0, undefined, branchPos);
        nodes.push(...result.nodes);
        
        // Connect branch to first node in the branch
        if (result.nodes.length > 0) {
          edges.push({
            id: branchEdgeId,
            source: branchNodeId,
            target: result.nodes[0].id,
            sourceHandle: `condition-${branchIndex}`,
          });
        }
        
        // Add other edges from the branch
        edges.push(...result.edges);
        
        if (result.lastNodeId) {
          branchLastNodes.push(result.lastNodeId);
        }
      });
      
      // Don't set lastNodeId to branch node - branches don't have a single exit
      lastNodeId = branchNodeId;
    }
  } else {
    const { nodeId, params } = extractNodeInfo(node);
    const customNodeId = generateNodeId();
    const customNode: Node<CustomNodeData> = {
      id: customNodeId,
      type: 'custom',
      position: pos,
      data: {
        label: getNodeLabel(nodeId),
        nodeId,
        category: getNodeCategory(nodeId),
        params,
      },
    };
    nodes.push(customNode);
    
    if (parentId) {
      edges.push({
        id: generateEdgeId(),
        source: parentId,
        target: customNodeId,
      });
    }
    
    lastNodeId = customNodeId;
  }
  
  return { nodes, edges, lastNodeId };
}

export function parseFlowToReactFlow(workflow: FlowManagerWorkflow): ParsedFlow {
  resetCounters();
  
  const allNodes: Node[] = [];
  const allEdges: Edge[] = [];
  
  // Handle empty or invalid workflow
  if (!workflow || !workflow.nodes || !Array.isArray(workflow.nodes)) {
    console.warn('Invalid workflow structure:', workflow);
    return { nodes: [], edges: [] };
  }
  
  const startNode: Node = {
    id: 'start',
    type: 'start',
    position: { x: 0, y: 0 },
    data: { label: 'Start' },
  };
  allNodes.push(startNode);
  
  let lastNodeId = 'start';
  
  // Parse each workflow node
  workflow.nodes.forEach((node, index) => {
    if (node === null || node === undefined) {
      console.warn(`Skipping null/undefined node at index ${index}`);
      return;
    }
    
    try {
      const result = parseNode(node, index, lastNodeId, { x: 0, y: (index + 1) * 150 });
      allNodes.push(...result.nodes);
      allEdges.push(...result.edges);
      if (result.lastNodeId) {
        lastNodeId = result.lastNodeId;
      }
    } catch (error) {
      console.error(`Error parsing node at index ${index}:`, error, node);
    }
  });
  
  const endNode: Node = {
    id: 'end',
    type: 'end',
    position: { x: 0, y: (workflow.nodes.length + 1) * 150 },
    data: { label: 'End' },
  };
  allNodes.push(endNode);
  
  if (lastNodeId && lastNodeId !== 'start') {
    allEdges.push({
      id: generateEdgeId(),
      source: lastNodeId,
      target: 'end',
    });
  }
  
  console.log('Parsed flow:', { 
    nodeCount: allNodes.length, 
    edgeCount: allEdges.length,
    nodes: allNodes.map(n => ({ id: n.id, type: n.type })),
    edges: allEdges.map(e => ({ source: e.source, target: e.target }))
  });
  
  return { nodes: allNodes, edges: allEdges };
}