import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { cn } from '@/lib/utils';
import { 
  Activity,
  AlertCircle,
  Bell,
  CheckCircle,
  Clock,
  Code,
  Database,
  FileText,
  Globe,
  Mail,
  MessageSquare,
  Sparkles,
  Zap,
  Settings,
  Cloud,
  Key,
  Shield,
  Brain,
  GitBranch,
  Hash,
  Package,
  Search,
  Terminal,
  Users,
  Webhook,
  Workflow,
  LucideIcon
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  'logic': GitBranch,
  'data': Database,
  'http': Globe,
  'webhook': Webhook,
  'email': Mail,
  'ai': Brain,
  'openai': Sparkles,
  'anthropic': MessageSquare,
  'google': Cloud,
  'gmail': Mail,
  'gdrive': FileText,
  'database': Database,
  'transform': Code,
  'merge': GitBranch,
  'filter': Search,
  'delay': Clock,
  'condition': GitBranch,
  'loop': Workflow,
  'debug': Terminal,
  'api': Globe,
  'auth': Key,
  'security': Shield,
  'text': FileText,
  'string': Hash,
  'analyze': Search,
  'utility': Settings,
  'integration': Package,
  'user': Users,
  'system': Settings,
  'send': Mail,
  'fetch': Globe,
  'save': Database,
  'process': Settings,
  'validate': CheckCircle,
  'error': AlertCircle,
  'log': FileText,
  'notification': Bell,
  'list': Activity,
  'switch': GitBranch,
  'response': MessageSquare,
  'format': Code,
  'wait': Clock,
  'analytics': Activity,
  'default': Zap,
};

const categoryColors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  'logic': { 
    bg: 'bg-gradient-to-br from-purple-500/20 to-purple-600/20', 
    border: 'border-purple-500',
    text: 'text-purple-700 dark:text-purple-300',
    icon: 'text-purple-600 dark:text-purple-400'
  },
  'data': { 
    bg: 'bg-gradient-to-br from-blue-500/20 to-blue-600/20', 
    border: 'border-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
    icon: 'text-blue-600 dark:text-blue-400'
  },
  'integration': { 
    bg: 'bg-gradient-to-br from-green-500/20 to-green-600/20', 
    border: 'border-green-500',
    text: 'text-green-700 dark:text-green-300',
    icon: 'text-green-600 dark:text-green-400'
  },
  'ai': { 
    bg: 'bg-gradient-to-br from-indigo-500/20 to-indigo-600/20', 
    border: 'border-indigo-500',
    text: 'text-indigo-700 dark:text-indigo-300',
    icon: 'text-indigo-600 dark:text-indigo-400'
  },
  'google': { 
    bg: 'bg-gradient-to-br from-yellow-500/20 to-orange-600/20', 
    border: 'border-orange-500',
    text: 'text-orange-700 dark:text-orange-300',
    icon: 'text-orange-600 dark:text-orange-400'
  },
  'utility': { 
    bg: 'bg-gradient-to-br from-gray-500/20 to-gray-600/20', 
    border: 'border-gray-500',
    text: 'text-gray-700 dark:text-gray-300',
    icon: 'text-gray-600 dark:text-gray-400'
  },
  'text': { 
    bg: 'bg-gradient-to-br from-teal-500/20 to-teal-600/20', 
    border: 'border-teal-500',
    text: 'text-teal-700 dark:text-teal-300',
    icon: 'text-teal-600 dark:text-teal-400'
  },
  'send': { 
    bg: 'bg-gradient-to-br from-pink-500/20 to-rose-600/20', 
    border: 'border-pink-500',
    text: 'text-pink-700 dark:text-pink-300',
    icon: 'text-pink-600 dark:text-pink-400'
  },
  'webhook': { 
    bg: 'bg-gradient-to-br from-amber-500/20 to-amber-600/20', 
    border: 'border-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    icon: 'text-amber-600 dark:text-amber-400'
  },
  'default': { 
    bg: 'bg-gradient-to-br from-slate-500/20 to-slate-600/20', 
    border: 'border-slate-500',
    text: 'text-slate-700 dark:text-slate-300',
    icon: 'text-slate-600 dark:text-slate-400'
  },
};

export interface CustomNodeData {
  label: string;
  nodeId: string;
  description?: string;
  category?: string;
  status?: 'idle' | 'running' | 'success' | 'error';
  edges?: string[];
  params?: Record<string, any>;
}

export default function CustomNode({ data, selected }: NodeProps<CustomNodeData>) {
  const category = data.category || 'default';
  const colors = categoryColors[category] || categoryColors.default;
  
  const getIcon = () => {
    // Try multiple strategies to find the best icon
    const nodeId = data.nodeId || '';
    const parts = nodeId.split('.');
    
    // Try full node ID first
    if (iconMap[nodeId]) return iconMap[nodeId];
    
    // Try last part (action)
    if (parts.length >= 3 && iconMap[parts[2]]) return iconMap[parts[2]];
    
    // Try middle part (type)
    if (parts.length >= 2 && iconMap[parts[1]]) return iconMap[parts[1]];
    
    // Try first two parts
    if (parts.length >= 2) {
      const twoPartKey = parts.slice(0, 2).join('.');
      if (iconMap[twoPartKey]) return iconMap[twoPartKey];
    }
    
    // Try category
    if (iconMap[category]) return iconMap[category];
    
    // Try first part
    if (parts.length >= 1 && iconMap[parts[0]]) return iconMap[parts[0]];
    
    // Default
    return iconMap.default;
  };
  
  const Icon = getIcon();
  
  const getStatusIcon = () => {
    switch (data.status) {
      case 'running':
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "relative px-4 py-3 rounded-lg border-2 shadow-lg transition-all duration-300",
        "backdrop-blur-sm bg-white/90 dark:bg-gray-900/90",
        colors.bg,
        colors.border,
        selected && "ring-4 ring-purple-300 dark:ring-purple-700 ring-opacity-50 scale-105",
        data.status === 'running' && "animate-pulse",
        "hover:shadow-xl hover:scale-105 cursor-pointer"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-purple-500 border-2 border-white dark:border-gray-900 shadow-md"
        style={{ top: -6 }}
      />
      
      <div className="flex items-start gap-3 min-w-[200px]">
        <div className={cn(
          "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
          "bg-white dark:bg-gray-800 shadow-inner"
        )}>
          <Icon className={cn("w-5 h-5", colors.icon)} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className={cn("font-semibold text-sm", colors.text)}>
              {data.label}
            </h3>
            {getStatusIcon()}
          </div>
          
          {data.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {data.description}
            </p>
          )}
          
          {data.params && Object.keys(data.params).length > 0 && (
            <div className="mt-2 text-xs">
              <div className="font-medium text-gray-500 dark:text-gray-500 mb-1">Parameters:</div>
              <div className="space-y-0.5">
                {Object.entries(data.params).slice(0, 3).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-1">
                    <span className="text-gray-500 dark:text-gray-500">{key}:</span>
                    <span className="text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
                      {typeof value === 'string' ? value : JSON.stringify(value)}
                    </span>
                  </div>
                ))}
                {Object.keys(data.params).length > 3 && (
                  <div className="text-gray-400 dark:text-gray-600 italic">
                    +{Object.keys(data.params).length - 3} more...
                  </div>
                )}
              </div>
            </div>
          )}
          
          {data.edges && data.edges.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {data.edges.map((edge, index) => (
                <span
                  key={index}
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    "bg-purple-100 dark:bg-purple-900/30",
                    "text-purple-700 dark:text-purple-300",
                    "border border-purple-300 dark:border-purple-700"
                  )}
                >
                  {edge}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-purple-500 border-2 border-white dark:border-gray-900 shadow-md"
        style={{ bottom: -6 }}
      />
    </div>
  );
}