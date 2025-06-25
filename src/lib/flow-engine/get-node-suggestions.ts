// Helper to get node suggestions for Monaco editor
// This dynamically fetches nodes from the node registry

import { nodeRegistry } from '@/lib/flow-engine/singletons';

export interface NodeSuggestion {
  label: string;
  insertText: string;
  detail: string;
  nodeId: string;
  sortOrder: number;
}

export function getNodeSuggestions(): NodeSuggestion[] {
  const nodes = nodeRegistry.getAll();
  const suggestions: NodeSuggestion[] = [];
  
  // Create suggestions with human-readable names first
  nodes.forEach((node, index) => {
    // Primary suggestion: Human-readable name
    if (node.name) {
      suggestions.push({
        label: node.name,
        insertText: `"${node.name}"`,
        detail: `${node.description || ''} (ID: ${node.id})`,
        nodeId: node.id,
        sortOrder: index * 2 // Even numbers for names
      });
    }
    
    // Secondary suggestion: Node ID (for advanced users)
    suggestions.push({
      label: node.id,
      insertText: `"${node.id}"`,
      detail: node.description || node.name || '',
      nodeId: node.id,
      sortOrder: index * 2 + 1 // Odd numbers for IDs
    });
  });
  
  // Sort by category and name for better organization
  suggestions.sort((a, b) => {
    // Prioritize human-readable names over IDs
    if (a.sortOrder % 2 === 0 && b.sortOrder % 2 === 1) return -1;
    if (a.sortOrder % 2 === 1 && b.sortOrder % 2 === 0) return 1;
    
    // Then sort alphabetically
    return a.label.localeCompare(b.label);
  });
  
  return suggestions;
}

// Get categorized suggestions for better UX
export function getCategorizedNodeSuggestions() {
  const nodes = nodeRegistry.getAll();
  const categorized: Record<string, NodeSuggestion[]> = {};
  
  nodes.forEach((node) => {
    const categories = node.categories || ['Uncategorized'];
    
    categories.forEach(category => {
      if (!categorized[category]) {
        categorized[category] = [];
      }
      
      // Only add human-readable names to categorized view
      if (node.name) {
        categorized[category].push({
          label: node.name,
          insertText: `"${node.name}"`,
          detail: node.description || '',
          nodeId: node.id,
          sortOrder: 0
        });
      }
    });
  });
  
  return categorized;
}