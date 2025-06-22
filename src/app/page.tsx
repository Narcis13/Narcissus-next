'use client';


import { useState } from 'react';
import { useWorkflow } from '../hooks/useWorkflow';

export default function HomePage() {
  const {
    flowInstanceId,
    flowSteps,
    flowInstances,
    isPaused,
    pauseDetails,
    runWorkflow,
    resumeWorkflow,
  } = useWorkflow();

  const [humanInputData, setHumanInputData] = useState('');

  const startGmailWorkflow = () => {
    // Same workflow definition as in the Vue component
const GMAIL_WORKFLOW_NODES = [
  { 
    "Connect to Gmail Account": {
      "email": "smupitesti2001@gmail.com",
    }
  },
  { 
    "success": {
      "List Gmail Emails": {
        "getFullDetails": true,
        "maxResults": 10  // Limit for testing
      }
    },
    "error": { 
      "utils.debug.logMessage": { 
        "message": "ERROR connecting to Gmail", 
        "level": "error" 
      } 
    }
  }
];
    runWorkflow(GMAIL_WORKFLOW_NODES, {});
  };

  const submitHumanInput = () => {
    resumeWorkflow({ userInput: humanInputData });
    setHumanInputData('');
  };

  const getStepName = (step: any): string => {
    if (typeof step.node === 'string') return step.node;
    if (typeof step.node === 'object' && step.node !== null) {
      return Object.keys(step.node)[0] || 'Object Node';
    }
    return 'Unknown Step Type';
  };

  const renderFlowStep = (step: any, index: number, isSubStep: boolean = false, depth: number = 0) => {
    const stepName = getStepName(step);
    const hasSubSteps = step.subSteps && step.subSteps.length > 0;
    const indentLevel = depth * 24; // 24px per depth level
    
    // Enhanced step type detection for FlowManager patterns
    const stepTypeIndicators = [];
    
    // Check for FlowManager-specific patterns
    if (step.branchType && step.branchType !== 'main') {
      const typeColors = {
        'success': 'bg-green-100 text-green-800',
        'error': 'bg-red-100 text-red-800',
        'loop': 'bg-purple-100 text-purple-800',
        'loop-controller': 'bg-indigo-100 text-indigo-800',
        'loop-actions': 'bg-cyan-100 text-cyan-800',
        'loop-internal': 'bg-purple-50 text-purple-700',
        'condition': 'bg-yellow-100 text-yellow-800'
      };
      
      stepTypeIndicators.push(
        <span key="branch" className={`text-xs px-2 py-1 rounded-full ${
          typeColors[step.branchType as keyof typeof typeColors] || 'bg-gray-100 text-gray-800'
        }`}>
          {step.branchType}
        </span>
      );
    }
    
    // Check for loop iteration (from FlowManager's loopManager)
    if (step.nodeDetail && typeof step.nodeDetail === 'string' && 
        step.nodeDetail.includes('Loop Iter')) {
      const iterMatch = step.nodeDetail.match(/Loop Iter (\d+)/);
      if (iterMatch) {
        stepTypeIndicators.push(
          <span key="iteration" className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
            Iteration {iterMatch[1]}
          </span>
        );
      }
    }
    
    // Check for FlowManager array nodes (loops)
    if (Array.isArray(step.node)) {
      stepTypeIndicators.push(
        <span key="array" className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
          Loop Definition
        </span>
      );
    }
    
    if (hasSubSteps) {
      // Determine if subSteps are from FlowManager's loopManager or branch execution
      const isLoopSubSteps = step.subSteps.some((sub: any) => 
        sub.nodeDetail && sub.nodeDetail.includes('Loop Iter')
      );
      
      stepTypeIndicators.push(
        <span key="substeps" className={`text-xs px-2 py-1 rounded-full ${
          isLoopSubSteps ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {step.subSteps.length} {isLoopSubSteps ? 'loop step' : 'branch'}{step.subSteps.length !== 1 ? 's' : ''}
        </span>
      );
    }
    
    // Determine border color based on step type
    const getBorderColor = () => {
      if (!isSubStep) return '';
      
      switch (step.branchType) {
        case 'success': return 'border-l-green-300';
        case 'error': return 'border-l-red-300';
        case 'loop':
        case 'loop-controller':
        case 'loop-actions':
        case 'loop-internal': return 'border-l-purple-300';
        case 'condition': return 'border-l-yellow-300';
        default: return 'border-l-blue-300';
      }
    };
    
    // Determine background color for sub-steps
    const getBackgroundColor = () => {
      if (!isSubStep) return '';
      
      switch (step.branchType) {
        case 'success': return 'bg-green-50';
        case 'error': return 'bg-red-50';
        case 'loop':
        case 'loop-controller':
        case 'loop-actions':
        case 'loop-internal': return 'bg-purple-50';
        case 'condition': return 'bg-yellow-50';
        default: return 'bg-blue-50';
      }
    };
    
    return (
      <li 
        key={`${isSubStep ? 'sub-' : ''}${index}-${depth}`} 
        className={`border border-gray-200 rounded-lg overflow-hidden ${
          isSubStep ? `ml-6 border-l-4 ${getBorderColor()}` : ''
        }`}
        style={{ marginLeft: isSubStep ? `${indentLevel}px` : '0' }}
      >
        <details className="group">
          <summary className={`cursor-pointer p-4 hover:bg-gray-50 transition-colors duration-150 ${
            isSubStep ? getBackgroundColor() : ''
          }`}>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-semibold text-gray-700">
                {isSubStep ? `Sub-Step ${index}` : `Step ${index}`}:
              </span>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-blue-600">
                {stepName}
              </code>
              <span className="text-sm">-</span>
              <span className={`font-semibold text-sm ${
                step.output?.edges?.[0]?.includes('error') 
                  ? 'text-red-600' 
                  : step.output?.edges?.[0]?.includes('success') || step.output?.edges?.[0]?.includes('valid') || step.output?.edges?.[0]?.includes('pass')
                    ? 'text-green-600'
                    : 'text-gray-600'
              }`}>
                {step.output?.edges?.join(', ') || 'processing'}
              </span>
              {stepTypeIndicators}
            </div>
          </summary>
          <div className="border-t border-gray-200 bg-gray-50">
            <pre className="p-4 text-xs overflow-x-auto whitespace-pre-wrap break-words">
              {JSON.stringify(step, null, 2)}
            </pre>
          </div>
        </details>
        
        {hasSubSteps && (
          <div className={`border-t border-gray-200 bg-gradient-to-r ${
            step.branchType === 'success' ? 'from-green-50' :
            step.branchType === 'error' ? 'from-red-50' :
            step.branchType?.includes('loop') ? 'from-purple-50' :
            'from-blue-50'
          } to-transparent`}>
            <div className="p-4">
              <h4 className={`text-sm font-semibold mb-3 ${
                step.branchType === 'success' ? 'text-green-800' :
                step.branchType === 'error' ? 'text-red-800' :
                step.branchType?.includes('loop') ? 'text-purple-800' :
                'text-blue-800'
              }`}>
                {step.branchType?.includes('loop') ? 'Loop Execution:' : 
                 step.branchType === 'condition' ? 'Conditional Execution:' :
                 'Branch Execution:'}
              </h4>
              <ul className="space-y-2">
                {step.subSteps.map((subStep: any, subIndex: number) => 
                  renderFlowStep(subStep, subIndex, true, depth + 1)
                )}
              </ul>
            </div>
          </div>
        )}
      </li>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-8 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Agentic Workflow Engine</h1>
        <button 
          onClick={startGmailWorkflow} 
          disabled={!!flowInstanceId && !isPaused}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
        >
          Run Test Workflow
        </button>
      </div>

      {flowInstanceId && (
        <div className="mt-8 border border-gray-300 p-6 rounded-lg bg-white shadow-sm">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Workflow: <span className="font-mono text-blue-600">{flowInstanceId}</span>
          </h2>

          {isPaused && pauseDetails && (
            <div className="border-2 border-orange-400 p-4 mb-6 bg-orange-50 rounded-lg">
              <h3 className="text-lg font-semibold text-orange-800 mb-3">Human Input Required</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto whitespace-pre-wrap break-words mb-4">
                {JSON.stringify(pauseDetails.details, null, 2)}
              </pre>
              <div className="flex gap-3">
                <input
                  value={humanInputData}
                  onChange={(e) => setHumanInputData(e.target.value)}
                  placeholder="Enter data to resume"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button 
                  onClick={submitHumanInput}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                >
                  Resume Workflow
                </button>
              </div>
            </div>
          )}

          <div className="steps-log">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Steps Log:</h3>
            {flowSteps.length === 0 ? (
              <pre className="bg-gray-100 p-4 rounded text-sm text-gray-600">Waiting for first step...</pre>
            ) : (
              <ul className="space-y-3">
                {flowSteps.map((step, index) => 
                  renderFlowStep(step, index, false, 0)
                )}
              </ul>
            )}
          </div>

          {/* Enhanced debug section to show FlowManager flow instances */}
          {flowInstances && flowInstances.size > 1 && (
            <div className="mt-6 border border-blue-200 p-4 rounded-lg bg-blue-50">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">FlowManager Instances ({flowInstances.size}):</h3>
              <div className="space-y-2">
                {Array.from(flowInstances.entries())
                  .sort(([, a], [, b]) => a.depth - b.depth)
                  .map(([flowId, instance]) => (
                  <div key={flowId} className="bg-white p-3 rounded border" style={{ marginLeft: `${instance.depth * 16}px` }}>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-xs">{flowId}</code>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        instance.isRunning ? 'bg-yellow-100 text-yellow-800' : 
                        instance.isCompleted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {instance.isRunning ? 'Running' : instance.isCompleted ? 'Completed' : 'Waiting'}
                      </span>
                      {instance.parentId && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Parent: {instance.parentId.split('-').slice(-2).join('-')}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded ${
                        instance.branchType === 'success' ? 'bg-green-100 text-green-800' :
                        instance.branchType === 'error' ? 'bg-red-100 text-red-800' :
                        instance.branchType?.includes('loop') ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {instance.branchType || 'main'}
                      </span>
                      <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                        Depth: {instance.depth}
                      </span>
                      {instance.metadata?.isLoop && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          Loop Flow
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      Steps: {instance.steps.length}
                      {instance.steps.some(step => step.subSteps) && (
                        <span className="ml-2 text-purple-600">
                          (contains sub-steps)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}