import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { RefreshCw, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LoopNodeData {
  label: string;
  description?: string;
  iteration?: number;
  maxIterations?: number;
}

export default function LoopNode({ data, selected }: NodeProps<LoopNodeData>) {
  return (
    <div
      className={cn(
        "relative px-4 py-3 rounded-lg border-2 shadow-lg transition-all duration-300",
        "backdrop-blur-sm bg-gradient-to-br from-amber-500/90 to-orange-600/90",
        "border-orange-600",
        selected && "ring-4 ring-orange-300 dark:ring-orange-700 ring-opacity-50 scale-105",
        "hover:shadow-xl hover:scale-105 cursor-pointer"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-orange-500 border-2 border-white shadow-md"
        style={{ top: -6 }}
      />
      
      <div className="flex items-start gap-3 min-w-[200px]">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-white animate-spin-slow" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-white flex items-center gap-1">
              <Repeat className="w-4 h-4" />
              {data.label || 'Loop'}
            </h3>
          </div>
          
          {data.description && (
            <p className="text-xs text-white/80 mt-1">
              {data.description}
            </p>
          )}
          
          {(data.iteration !== undefined || data.maxIterations !== undefined) && (
            <div className="mt-2 flex items-center gap-2">
              <div className="text-xs bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-white font-medium">
                {data.iteration !== undefined && data.maxIterations !== undefined
                  ? `${data.iteration} / ${data.maxIterations}`
                  : data.maxIterations !== undefined
                  ? `Max: ${data.maxIterations}`
                  : `Iteration: ${data.iteration}`}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-orange-500 border-2 border-white shadow-md"
        style={{ bottom: -6 }}
      />
      
      <Handle
        type="source"
        position={Position.Right}
        id="loop-back"
        className="w-3 h-3 bg-orange-500 border-2 border-white shadow-md"
        style={{ right: -6 }}
      />
    </div>
  );
}