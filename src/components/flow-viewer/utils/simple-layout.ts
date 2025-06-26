import { Node, Edge } from 'reactflow';

const nodeWidth = 250;
const nodeHeight = 100;

export function simpleLayoutNodes(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  if (!nodes || nodes.length === 0) {
    return { nodes: [], edges: edges || [] };
  }

  // Create adjacency list
  const adjacencyList: Map<string, string[]> = new Map();
  const inDegree: Map<string, number> = new Map();
  const nodeMap: Map<string, Node> = new Map();

  // Initialize structures
  nodes.forEach(node => {
    adjacencyList.set(node.id, []);
    inDegree.set(node.id, 0);
    nodeMap.set(node.id, node);
  });

  // Build adjacency list and count in-degrees
  edges.forEach(edge => {
    if (adjacencyList.has(edge.source) && nodeMap.has(edge.target)) {
      adjacencyList.get(edge.source)!.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }
  });

  // Find root nodes (nodes with no incoming edges)
  const roots: string[] = [];
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      roots.push(nodeId);
    }
  });

  // Level assignment using BFS
  const levels: Map<string, number> = new Map();
  const queue: string[] = [...roots];
  
  // Assign level 0 to all roots
  roots.forEach(root => levels.set(root, 0));

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentLevel = levels.get(current)!;
    
    const neighbors = adjacencyList.get(current) || [];
    neighbors.forEach(neighbor => {
      if (!levels.has(neighbor)) {
        levels.set(neighbor, currentLevel + 1);
        queue.push(neighbor);
      } else {
        // Update to max level if already visited
        levels.set(neighbor, Math.max(levels.get(neighbor)!, currentLevel + 1));
      }
    });
  }

  // Group nodes by level
  const levelGroups: Map<number, string[]> = new Map();
  let maxLevel = 0;
  
  nodes.forEach(node => {
    const level = levels.get(node.id) ?? 0;
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(node.id);
    maxLevel = Math.max(maxLevel, level);
  });

  // Position nodes
  const layoutedNodes = nodes.map(node => {
    const level = levels.get(node.id) ?? 0;
    const nodesInLevel = levelGroups.get(level) || [];
    const indexInLevel = nodesInLevel.indexOf(node.id);
    const levelWidth = nodesInLevel.length;
    
    const width = node.type === 'start' || node.type === 'end' ? 150 : nodeWidth;
    const height = node.type === 'start' || node.type === 'end' ? 60 : nodeHeight;
    
    // Calculate horizontal position to center the level
    const horizontalSpacing = 300;
    const totalWidth = (levelWidth - 1) * horizontalSpacing;
    const startX = -totalWidth / 2;
    const x = startX + indexInLevel * horizontalSpacing;
    
    // Calculate vertical position
    const verticalSpacing = 200;
    const y = level * verticalSpacing;
    
    return {
      ...node,
      position: { x, y }
    };
  });

  return { nodes: layoutedNodes, edges };
}