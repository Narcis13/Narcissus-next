import dagre from 'dagre';
import { Node, Edge } from 'reactflow';

const nodeWidth = 250;
const nodeHeight = 100;

export function layoutNodes(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  // Handle empty or invalid inputs
  if (!nodes || nodes.length === 0) {
    return { nodes: [], edges: edges || [] };
  }

  // If layout fails, use simple fallback positioning
  const fallbackLayout = () => {
    const layoutedNodes = nodes.map((node, index) => ({
      ...node,
      position: {
        x: 100 + (index % 3) * 300,
        y: 100 + Math.floor(index / 3) * 200
      }
    }));
    return { nodes: layoutedNodes, edges };
  };

  try {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    
    // Configure the layout with more relaxed settings
    dagreGraph.setGraph({
      rankdir: 'TB',
      align: 'UL',
      nodesep: 100,
      ranksep: 150,
      marginx: 50,
      marginy: 50,
      acyclicer: 'greedy',
      ranker: 'network-simplex'
    });
    
    // First, add all nodes
    const nodeSet = new Set<string>();
    nodes.forEach((node) => {
      if (!node.id) {
        console.warn('Node without id found:', node);
        return;
      }
      
      const width = node.type === 'start' || node.type === 'end' ? 150 : nodeWidth;
      const height = node.type === 'start' || node.type === 'end' ? 60 : nodeHeight;
      
      dagreGraph.setNode(node.id, { 
        width, 
        height,
        label: node.id 
      });
      nodeSet.add(node.id);
    });
    
    // Then add edges, but only if both nodes exist
    const validEdges: Edge[] = [];
    edges.forEach((edge) => {
      if (!edge.source || !edge.target) {
        console.warn('Edge with missing source or target:', edge);
        return;
      }
      
      if (nodeSet.has(edge.source) && nodeSet.has(edge.target)) {
        // Avoid self-loops unless explicitly handling them
        if (edge.source !== edge.target || edge.sourceHandle === 'loop-back') {
          dagreGraph.setEdge(edge.source, edge.target, {
            weight: 1,
            minlen: 1
          });
          validEdges.push(edge);
        }
      } else {
        console.warn(`Edge references non-existent node: ${edge.source} -> ${edge.target}`);
      }
    });
    
    // Check if graph is valid
    if (dagreGraph.nodeCount() === 0) {
      console.warn('No nodes in graph');
      return fallbackLayout();
    }
    
    // Check if graph has any edges (isolated nodes are OK)
    if (dagreGraph.edgeCount() === 0 && nodes.length > 1) {
      console.warn('No edges in graph, using fallback layout');
      return fallbackLayout();
    }
    
    // Perform the layout
    dagre.layout(dagreGraph);
    
    // Apply the calculated positions
    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      
      if (!nodeWithPosition || typeof nodeWithPosition.x !== 'number' || typeof nodeWithPosition.y !== 'number') {
        console.warn(`Node ${node.id} was not positioned properly by dagre`);
        // Use a fallback position based on node index
        const index = nodes.findIndex(n => n.id === node.id);
        return {
          ...node,
          position: {
            x: 100 + (index % 3) * 300,
            y: 100 + Math.floor(index / 3) * 200
          }
        };
      }
      
      const width = node.type === 'start' || node.type === 'end' ? 150 : nodeWidth;
      const height = node.type === 'start' || node.type === 'end' ? 60 : nodeHeight;
      
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - width / 2,
          y: nodeWithPosition.y - height / 2,
        },
      };
    });
    
    return { nodes: layoutedNodes, edges: validEdges };
  } catch (error) {
    console.error('Error during dagre layout, using fallback:', error);
    return fallbackLayout();
  }
}

export function getLayoutedElements(nodes: Node[], edges: Edge[], direction = 'TB') {
  const isHorizontal = direction === 'LR';
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  dagreGraph.setGraph({
    rankdir: direction,
    align: 'UL',
    nodesep: 100,
    ranksep: 150,
    marginx: 50,
    marginy: 50,
  });
  
  nodes.forEach((node) => {
    const width = node.type === 'start' || node.type === 'end' ? 150 : nodeWidth;
    const height = node.type === 'start' || node.type === 'end' ? 60 : nodeHeight;
    
    dagreGraph.setNode(node.id, { width, height });
  });
  
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });
  
  dagre.layout(dagreGraph);
  
  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? 'left' : 'top';
    node.sourcePosition = isHorizontal ? 'right' : 'bottom';
    
    const width = node.type === 'start' || node.type === 'end' ? 150 : nodeWidth;
    const height = node.type === 'start' || node.type === 'end' ? 60 : nodeHeight;
    
    node.position = {
      x: nodeWithPosition.x - width / 2,
      y: nodeWithPosition.y - height / 2,
    };
  });
  
  return { nodes, edges };
}