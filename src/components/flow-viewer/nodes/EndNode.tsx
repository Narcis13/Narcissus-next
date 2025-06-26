import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { StopCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EndNodeData {
  label: string;
}

export default function EndNode({ data, selected }: NodeProps<EndNodeData>) {
  return (
    <div
      className={cn(
        "relative px-6 py-4 rounded-full border-2 shadow-lg transition-all duration-300",
        "bg-gradient-to-br from-red-400 to-red-600",
        "border-red-600",
        selected && "ring-4 ring-red-300 dark:ring-red-700 ring-opacity-50 scale-105",
        "hover:shadow-xl hover:scale-105 cursor-pointer"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-white border-2 border-red-600 shadow-md"
        style={{ top: -6 }}
      />
      
      <div className="flex items-center gap-2">
        <StopCircle className="w-6 h-6 text-white" />
        <span className="font-bold text-white">END</span>
      </div>
    </div>
  );
}