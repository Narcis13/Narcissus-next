"use client";

import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  ConnectionMode,
  ReactFlowProvider,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './flow-viewer.css';

import { FlowManagerWorkflow } from '@/lib/workflow/types/flowmanager-workflow';
import { parseFlowToReactFlow } from './utils/parser';
import { layoutNodes } from './utils/layout';
import { simpleLayoutNodes } from './utils/simple-layout';
import CustomNode from './nodes/CustomNode';
import StartNode from './nodes/StartNode';
import EndNode from './nodes/EndNode';
import LoopNode from './nodes/LoopNode';
import BranchNode from './nodes/BranchNode';
import SubflowNode from './nodes/SubflowNode';
import { cn } from '@/lib/utils';

const nodeTypes = {
  custom: CustomNode,
  start: StartNode,
  end: EndNode,
  loop: LoopNode,
  branch: BranchNode,
  subflow: SubflowNode,
};

const edgeOptions = {
  type: 'smoothstep',
  animated: true,
  style: {
    stroke: '#7c3aed',
    strokeWidth: 2,
  },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: '#7c3aed',
  },
  pathOptions: {
    offset: 0,
    borderRadius: 10,
  },
};

interface FlowViewerProps {
  workflow: FlowManagerWorkflow;
  className?: string;
  showMiniMap?: boolean;
  showControls?: boolean;
  interactive?: boolean;
}

function FlowViewerInner({
  workflow,
  className,
  showMiniMap = true,
  showControls = true,
  interactive = false,
}: FlowViewerProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    try {
      console.log('Parsing workflow:', workflow);
      const parsed = parseFlowToReactFlow(workflow);
      console.log('Parsed result:', { nodeCount: parsed.nodes.length, edgeCount: parsed.edges.length });
      
      // Try simple layout first, fall back to dagre if needed
      let layouted;
      try {
        layouted = layoutNodes(parsed.nodes, parsed.edges);
        console.log('Dagre layout complete');
      } catch (layoutError) {
        console.warn('Dagre layout failed, using simple layout:', layoutError);
        layouted = simpleLayoutNodes(parsed.nodes, parsed.edges);
        console.log('Simple layout complete');
      }
      
      return {
        nodes: layouted.nodes,
        edges: layouted.edges.map(edge => ({
          ...edge,
          ...edgeOptions,
        })),
      };
    } catch (error) {
      console.error('Error in FlowViewer:', error);
      // Return empty flow as fallback
      return { nodes: [], edges: [] };
    }
  }, [workflow]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('Node clicked:', node);
  }, []);

  return (
    <div className={cn("w-full h-full bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950 rounded-lg shadow-2xl overflow-hidden", className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={interactive ? onNodesChange : undefined}
        onEdgesChange={interactive ? onEdgesChange : undefined}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
        }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={edgeOptions}
        className="react-flow-subflows-example"
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color="#e0e7ff"
          className="opacity-50"
        />
        
        {showControls && (
          <Controls
            className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-lg border border-purple-200 dark:border-purple-800"
            showInteractive={interactive}
          />
        )}
        
        {showMiniMap && (
          <MiniMap
            className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-lg border border-purple-200 dark:border-purple-800"
            nodeColor={(node) => {
              switch (node.type) {
                case 'start': return '#10b981';
                case 'end': return '#ef4444';
                case 'loop': return '#f59e0b';
                case 'branch': return '#8b5cf6';
                case 'subflow': return '#3b82f6';
                default: return '#7c3aed';
              }
            }}
            nodeStrokeWidth={3}
            pannable
            zoomable
          />
        )}
      </ReactFlow>
    </div>
  );
}

export default function FlowViewer(props: FlowViewerProps) {
  return (
    <ReactFlowProvider>
      <FlowViewerInner {...props} />
    </ReactFlowProvider>
  );
}