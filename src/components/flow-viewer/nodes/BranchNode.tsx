import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { GitBranch, Route } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BranchNodeData {
  label: string;
  description?: string;
  conditions?: Array<{
    edge: string;
    description?: string;
  }>;
}

export default function BranchNode({ data, selected }: NodeProps<BranchNodeData>) {
  const conditions = data.conditions || [];
  
  return (
    <div
      className={cn(
        "relative px-4 py-3 rounded-lg border-2 shadow-lg transition-all duration-300",
        "backdrop-blur-sm bg-gradient-to-br from-violet-500/90 to-purple-600/90",
        "border-purple-600",
        selected && "ring-4 ring-purple-300 dark:ring-purple-700 ring-opacity-50 scale-105",
        "hover:shadow-xl hover:scale-105 cursor-pointer"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-purple-500 border-2 border-white shadow-md"
        style={{ top: -6 }}
      />
      
      <div className="flex items-start gap-3 min-w-[250px]">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <GitBranch className="w-5 h-5 text-white" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-white flex items-center gap-1">
              <Route className="w-4 h-4" />
              {data.label || 'Branch'}
            </h3>
          </div>
          
          {data.description && (
            <p className="text-xs text-white/80 mt-1">
              {data.description}
            </p>
          )}
          
          {conditions.length > 0 && (
            <div className="mt-3 space-y-1">
              <div className="text-xs text-white/60 font-medium">Conditions:</div>
              {conditions.map((condition, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-xs bg-white/10 backdrop-blur-sm px-2 py-1 rounded"
                >
                  <div 
                    className="w-3 h-3 rounded-full flex items-center justify-center text-white/90 font-bold"
                    style={{
                      backgroundColor: `hsl(${(360 / conditions.length) * index}, 70%, 60%)`,
                      fontSize: '9px',
                    }}
                  >
                    {index + 1}
                  </div>
                  <span className="font-medium text-white">{condition.edge}</span>
                  {condition.description && (
                    <span className="text-white/70">- {condition.description}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {conditions.map((condition, index) => {
        const handleCount = conditions.length;
        const spacing = 80 / (handleCount + 1); // Distribute handles evenly
        const leftPosition = spacing * (index + 1);
        const handleColor = `hsl(${(360 / conditions.length) * index}, 70%, 60%)`;
        
        return (
          <Handle
            key={`source-${index}`}
            type="source"
            position={Position.Bottom}
            id={`condition-${index}`}
            className="w-4 h-4 border-2 border-white shadow-md"
            style={{
              bottom: -8,
              left: `${leftPosition}%`,
              transform: 'translateX(-50%)',
              backgroundColor: handleColor,
            }}
            title={condition.edge}
          />
        );
      })}
    </div>
  );
}