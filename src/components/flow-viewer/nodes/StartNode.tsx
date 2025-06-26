import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StartNodeData {
  label: string;
}

export default function StartNode({ data, selected }: NodeProps<StartNodeData>) {
  return (
    <div
      className={cn(
        "relative px-6 py-4 rounded-full border-2 shadow-lg transition-all duration-300",
        "bg-gradient-to-br from-green-400 to-green-600",
        "border-green-600",
        selected && "ring-4 ring-green-300 dark:ring-green-700 ring-opacity-50 scale-105",
        "hover:shadow-xl hover:scale-105 cursor-pointer"
      )}
    >
      <div className="flex items-center gap-2">
        <PlayCircle className="w-6 h-6 text-white" />
        <span className="font-bold text-white">START</span>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-white border-2 border-green-600 shadow-md"
        style={{ bottom: -6 }}
      />
    </div>
  );
}