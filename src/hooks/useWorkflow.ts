// src/hooks/useWorkflow.ts
'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// Define types for clarity
interface FlowStep {
  node: any;
  output: {
    edges: string[];
    [key: string]: any;
  };
  subSteps?: FlowStep[];
  iteration?: number; // For loop tracking
  depth?: number; // For nested flow depth
  branchType?: string; // success, error, condition, etc.
  parentStepId?: string; // For tracking step relationships
  [key: string]: any;
}

interface FlowInstance {
  id: string;
  parentId?: string;
  steps: FlowStep[];
  isRunning: boolean;
  isCompleted: boolean;
  result?: any;
  depth: number; // Nesting level
  branchType?: string; // Type of branch (success, error, loop, etc.)
  metadata?: any; // Additional flow metadata
}

interface PauseDetails {
  pauseId: string;
  details: any;
  flowInstanceId: string;
}

export function useWorkflow() {
  const [mainFlowId, setMainFlowId] = useState<string | null>(null);
  const [flowInstances, setFlowInstances] = useState<Map<string, FlowInstance>>(new Map());
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [pauseDetails, setPauseDetails] = useState<PauseDetails | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const ws = useRef<WebSocket | null>(null);

  // Helper function to extract parent flow ID from branch flow ID
  const extractParentFlowId = (flowId: string): string => {
    const branchIndex = flowId.indexOf('-branch-');
    return branchIndex > 0 ? flowId.substring(0, branchIndex) : flowId;
  };

  // Helper function to determine flow depth and branch type based on FlowManager patterns
  const analyzeFlowId = (flowId: string) => {
    const parts = flowId.split('-');
    let depth = 0;
    let branchType = 'main';
    let isLoop = false;
    
    // Analyze FlowManager naming patterns
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === 'branch') {
        depth++;
        // Extract branch type (success, error, etc.) - next part after 'branch'
        if (parts[i + 1]) {
          branchType = parts[i + 1];
        }
      } else if (parts[i] === 'loop' || parts[i].startsWith('loop')) {
        depth++;
        isLoop = true;
        branchType = 'loop';
        // Check for iteration number
        if (parts[i + 1] && /^\d+$/.test(parts[i + 1])) {
          // This might be a loop iteration
        }
      } else if (parts[i] === 'ctrl' || parts[i] === 'actions') {
        // Loop controller or actions - maintain same depth but different type
        branchType = parts[i] === 'ctrl' ? 'loop-controller' : 'loop-actions';
      }
    }
    
    return { depth, branchType, isLoop };
  };

  // Enhanced hierarchical step builder matching FlowManager's patterns
  const buildHierarchicalSteps = useMemo((): FlowStep[] => {
    if (!mainFlowId) return [];
    
    const mainInstance = flowInstances.get(mainFlowId);
    if (!mainInstance) return [];
    
    // Get all instances sorted by depth for proper nesting
    const allInstances = Array.from(flowInstances.values())
      .sort((a, b) => a.depth - b.depth);
    
    // Build a tree structure matching FlowManager's step recording
    const buildStepTree = (parentId: string, currentDepth: number): FlowStep[] => {
      const parentInstance = flowInstances.get(parentId);
      if (!parentInstance) return [];
      
      // Remove duplicate steps based on node content
      const uniqueSteps = parentInstance.steps.filter((step, index, array) => {
        const stepNodeKey = JSON.stringify(step.node);
        const firstIndex = array.findIndex(s => JSON.stringify(s.node) === stepNodeKey);
        return firstIndex === index;
      });
      
      return uniqueSteps.map((step, stepIndex) => {
        // Check if this step already has subSteps recorded by FlowManager (for loops)
        if (step.subSteps && Array.isArray(step.subSteps)) {
          // FlowManager already recorded subSteps (likely from loopManager)
          return {
            ...step,
            depth: currentDepth,
            parentStepId: `${parentId}-step-${stepIndex}`,
            subSteps: step.subSteps.map((subStep: any, subIndex: number) => ({
              ...subStep,
              depth: currentDepth + 1,
              branchType: 'loop-internal',
              parentStepId: `${parentId}-step-${stepIndex}-sub-${subIndex}`
            }))
          };
        }
        
        // Find child flows that belong to this step (branches)
        const childFlows = allInstances.filter(instance => 
          instance.parentId === parentId && instance.depth === currentDepth + 1
        );
        
        // Enhanced conditional step detection based on FlowManager patterns
        const isConditionalStep = step.node && typeof step.node === 'object' && (
          step.node.success || step.node.error || step.node.condition ||
          step.node.loop || step.node.forEach || step.node.while ||
          Array.isArray(step.node) // Arrays indicate loops in FlowManager
        );
        
        // Build the enhanced step
        const enhancedStep: FlowStep = {
          ...step,
          depth: currentDepth,
          parentStepId: `${parentId}-step-${stepIndex}`
        };
        
        // Add sub-steps recursively if this step has child flows
        if (childFlows.length > 0) {
          enhancedStep.subSteps = childFlows.flatMap(childFlow => {
            const subSteps = buildStepTree(childFlow.id, currentDepth + 1);
            // Add branch type metadata to sub-steps
            return subSteps.map(subStep => ({
              ...subStep,
              branchType: childFlow.branchType || 'unknown',
              depth: currentDepth + 1
            }));
          });
        }
        
        return enhancedStep;
      });
    };
    
    return buildStepTree(mainFlowId, 0);
  }, [mainFlowId, flowInstances]);

  useEffect(() => {
    // Initialize WebSocket connection
    ws.current = new WebSocket('ws://localhost:8089');

    ws.current.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'flowStart') {
        const flowId = data.payload.flowInstanceId;
        const isMainFlow = !flowId.includes('-branch-');
        
        if (isMainFlow) {
          console.log(`🚀 Main flow started: ${flowId}`);
          setMainFlowId(flowId);
          setIsRunning(true);
          setFlowInstances(new Map());
        } else {
          console.log(`🌿 Branch flow started: ${flowId}`);
        }
        
        setFlowInstances((prev) => {
          const newMap = new Map(prev);
          const parentId = isMainFlow ? undefined : extractParentFlowId(flowId);
          const { depth, branchType, isLoop } = analyzeFlowId(flowId);
          
          newMap.set(flowId, {
            id: flowId,
            parentId,
            steps: [],
            isRunning: true,
            isCompleted: false,
            depth,
            branchType: isMainFlow ? 'main' : branchType,
            metadata: {
              ...(data.payload.metadata || {}),
              isLoop,
              originalFlowId: flowId
            }
          });
          return newMap;
        });
        
      } else if (data.type === 'flowStep') {
        const stepData = data.payload.stepData;
        const flowId = data.payload.flowInstanceId || mainFlowId;
        
        setFlowInstances((prev) => {
          const newMap = new Map(prev);
          const instance = newMap.get(flowId);
          if (instance) {
            instance.steps = [...instance.steps, stepData];
            newMap.set(flowId, instance);
          }
          return newMap;
        });
      } else if (data.type === 'flowPaused') {
        setIsPaused(true);
        setPauseDetails(data.payload);
      } else if (data.type === 'flowResumed') {
        setIsPaused(false);
        setPauseDetails(null);
      } else if (data.type === 'flowEnd') {
        const flowId = data.payload.flowInstanceId || mainFlowId;
        
        setFlowInstances((prev) => {
          const newMap = new Map(prev);
          const instance = newMap.get(flowId);
          if (instance) {
            instance.isRunning = false;
            instance.isCompleted = true;
            instance.result = data.payload.result;
            newMap.set(flowId, instance);
          }
          return newMap;
        });
        
        // If this is the main flow ending, set isRunning to false
        if (flowId === mainFlowId) {
          console.log(`✅ Workflow completed: ${flowId}`);
          setIsRunning(false);
          setIsPaused(false);
          setPauseDetails(null);
        } else {
          console.log(`🏁 Branch completed: ${flowId}`);
        }
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
    };

    // Cleanup on component unmount
    return () => {
      ws.current?.close();
    };
  }, []);

  const runWorkflow = useCallback(async (nodes: any[], initialState: object) => {
    setFlowInstances(new Map());
    setMainFlowId(null);
    setIsPaused(false);
    setPauseDetails(null);
    setIsRunning(false);

    const response = await fetch('/api/workflow/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodes, initialState }),
    });
    const data = await response.json();
    if (response.ok) {
      setMainFlowId(data.flowInstanceId);
      // isRunning will be set to true when we receive the 'flowStart' WebSocket event
    } else {
      console.error('Failed to start workflow:', data.message);
    }
  }, []);

  const resumeWorkflow = useCallback(async (resumeData: object) => {
    if (!pauseDetails) return;

    await fetch('/api/workflow/resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pauseId: pauseDetails.pauseId,
        resumeData,
      }),
    });
    // The 'flowResumed' WebSocket event will handle state changes
  }, [pauseDetails]);

  return {
    flowInstanceId: mainFlowId,
    flowSteps: buildHierarchicalSteps,
    flowInstances,
    isPaused,
    pauseDetails,
    isRunning,
    flowResult: mainFlowId ? flowInstances.get(mainFlowId)?.result : null,
    runWorkflow,
    resumeWorkflow,
  };
}