import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Layers, Workflow } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SubflowNodeData {
  label: string;
  description?: string;
  nodeCount?: number;
  collapsed?: boolean;
}

export default function SubflowNode({ data, selected }: NodeProps<SubflowNodeData>) {
  return (
    <div
      className={cn(
        "relative px-4 py-3 rounded-lg border-2 shadow-lg transition-all duration-300",
        "backdrop-blur-sm bg-gradient-to-br from-blue-500/90 to-cyan-600/90",
        "border-cyan-600",
        selected && "ring-4 ring-cyan-300 dark:ring-cyan-700 ring-opacity-50 scale-105",
        "hover:shadow-xl hover:scale-105 cursor-pointer"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-cyan-500 border-2 border-white shadow-md"
        style={{ top: -6 }}
      />
      
      <div className="flex items-start gap-3 min-w-[220px]">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center relative">
          <Layers className="w-5 h-5 text-white" />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Workflow className="w-2.5 h-2.5 text-white" />
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-white">
              {data.label || 'Subflow'}
            </h3>
            {data.collapsed && (
              <span className="text-xs bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-white/80">
                Collapsed
              </span>
            )}
          </div>
          
          {data.description && (
            <p className="text-xs text-white/80 mt-1">
              {data.description}
            </p>
          )}
          
          {data.nodeCount !== undefined && (
            <div className="mt-2">
              <div className="text-xs bg-white/20 backdrop-blur-sm px-2 py-1 rounded inline-flex items-center gap-1">
                <Workflow className="w-3 h-3 text-white/80" />
                <span className="text-white font-medium">{data.nodeCount} nodes</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-cyan-500 border-2 border-white shadow-md"
        style={{ bottom: -6 }}
      />
    </div>
  );
}