// File: /Users/narcisbrindusescu/cod/Narcissus/agent/flow-engine/core/FlowManager.js

import FlowHub from './FlowHub.js';

/**
 * Helper function to emit events to both FlowHub and global event emitter
 * @param {string} eventName - The name of the event
 * @param {any} data - The event data
 */
function emitToAllChannels(eventName, data) {
  // Emit to FlowHub as usual
  FlowHub._emitEvent(eventName, data);
  
  // Also emit to global event emitter for cross-context communication
  try {
    if (typeof global !== 'undefined' && global.__flowEngineGlobalEmitter) {
      global.__flowEngineGlobalEmitter.emit(eventName, data);
    }
  } catch (error) {
    // Silently handle errors
  }
}

/**
 * FlowManager: A powerful and flexible engine for orchestrating complex workflows,
 * particularly well-suited for AI agentic systems. It allows workflows to be defined
 * as serializable JSON-like structures, enabling dynamic generation, persistence,
 * and execution of directed graphs of tasks and decisions.
 *
 * Each node's execution context (`this`) provides:
 * - `state`: Access to the FlowManager's StateManager (get, set, undo, redo, etc.).
 * - `steps`: An array of previously executed steps in the current flow (providing history).
 * - `nodes`: The full list of node definitions for the current FlowManager instance.
 * - `self`: The definition or structure of the current node being executed.
 *           - For nodes specified as strings (resolved via scope):
 *             - If resolved to a full NodeDefinition (e.g., from NodeRegistry), `self` is that NodeDefinition.
 *             - If resolved to a simple function in scope, `self` is a synthetic descriptor for that function.
 *             - If unresolved, `self` is a minimal object with the identifier.
 *           - For functions directly in the workflow array, `self` is a synthetic descriptor object.
 *           - For structural nodes (arrays for sub-flows/loops, objects for branches/parameterized calls), `self` is the structure itself.
 * - `input`: The output data from the previously executed node in the current sequence.
 *            This is typically derived from the `results` array of the previous node's processed output.
 *            - If `results` had one item, `input` is that item.
 *            - If `results` had multiple items, `input` is the array of items.
 *            - For the first node in a sequence, or if the previous node had no `results`, `input` is `null`.
 * - `flowInstanceId`: The unique ID of the current FlowManager instance.
 * - `humanInput(details, customPauseId)`: Function to request human input, pausing the flow.
 * - `emit(customEventName, data)`: Function to emit a custom event via FlowHub.
 * - `on(customEventName, nodeCallback)`: Function to listen for custom events on FlowHub.
 *
 * Emits a 'flowManagerStep' event via FlowHub after each step is executed.
 *
 * @param {object} config - Configuration for the FlowManager.
 * @param {object} [config.initialState={}] - The initial state for the workflow.
 * @param {Array} [config.nodes=[]] - An array defining the workflow's structure.
 * @param {string} [config.instanceId] - An optional ID for this FlowManager instance.
 * @param {object} [config.scope={}] - The scope object containing node implementations (functions or NodeDefinition objects).
 * @param {any} [config.initialInput=null] - The initial input for the first node in the flow.
 * @returns {object} An API to run and interact with the flow.
 */
export function FlowManager({
    initialState,
    nodes,
    instanceId,
    scope: providedScope,
    initialInput = null // <<< ADDED initialInput parameter
} = {
    initialState: {},
    nodes: [],
    instanceId: undefined,
    scope: {}, // This default applies if the whole config object is missing
    initialInput: null // <<< ADDED default for destructuring
}) {
  const steps = [];
  let currentNode = null; // Represents the node definition *currently being executed or focused on* by the engine. Used by emit/on.
  let currentIndex = 0; // Index for iterating through the `nodes` array of this FlowManager instance.
  const flowInstanceId = instanceId || `fm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const fmState = StateManager(initialState);
  let _resolveRunPromise = null;
  let _rejectRunPromise = null;
  
  const scope = providedScope || {}; // <<< MODIFIED: Ensure scope is always an object
  const _initialInput = initialInput; // <<< ADDED: Store initialInput for use later

  const _registeredHubListeners = [];

    /**
   * Recursively traverses an object or array, resolving string placeholders
   * of the format '${path.to.state}' with values from the state.
   * Supports array access like '${myArray[0].name}'.
   * @param {any} value - The value (object, array, string, etc.) to process.
   * @param {object} state - The StateManager instance.
   * @returns {any} The processed value with placeholders replaced.
   */
  function resolveStatePlaceholders(value, state) {
    // If it's a string, check if it's a state placeholder
    if (typeof value === 'string') {
        const match = value.match(/^\${([a-zA-Z0-9_.\[\]]+)}$/);
        if (match) {
            const path = match[1];

            // Helper to get value from a path with array access notation (e.g., 'items[0].name')
            const getValueFromPath = (obj, pathString) => {
                // Converts 'array[0].name' to 'array.0.name' then splits into parts
                const pathParts = pathString.replace(/\[(\d+)\]/g, '.$1').split('.');
                let current = obj;
                for (const part of pathParts) {
                    if (current === null || typeof current === 'undefined') {
                        return undefined;
                    }
                    current = current[part];
                }
                return current;
            };

            // Use the helper to get the value from the current state
            return getValueFromPath(state.getState(), path);
        }
        return value; // Return original string if it's not a placeholder
    }

    // If it's an array, process each item recursively
    if (Array.isArray(value)) {
        return value.map(item => resolveStatePlaceholders(item, state));
    }

    // If it's an object, process each value recursively
    if (typeof value === 'object' && value !== null) {
        const newObj = {};
        for (const key in value) {
            if (Object.prototype.hasOwnProperty.call(value, key)) {
                newObj[key] = resolveStatePlaceholders(value[key], state);
            }
        }
        return newObj;
    }

    // For other types (number, boolean, null, etc.), return as is
    return value;
  }

  /**
   * Manages the state of the FlowManager instance, including history for undo/redo.
   * @param {object} [_initialState={}] - The initial state for the StateManager.
   * @returns {object} An API to interact with the state.
   */
  function StateManager(_initialState = {}) {
    const _currentState = JSON.parse(JSON.stringify(_initialState));
    const _history = [JSON.parse(JSON.stringify(_initialState))];
    let _historyCurrentIndex = 0;

    return {
      get(path) {
        if (!path) return undefined; // MODIFIED: Or perhaps return undefined/null for consistency if path is empty
        const keys = path.split('.');
        let result = _currentState;
        for (const key of keys) {
          if (result === undefined || result === null || !Object.prototype.hasOwnProperty.call(result, key)) {
            return undefined; // <<< MODIFIED: Return undefined if path not fully resolved
          }
          result = result[key];
        }
        return result; // <<< MODIFIED: Return the actual stored value (could be null, undefined, '', etc.)
      },
      set(path, value) {
        let targetObjectForReturn; // What the 'set' operation effectively targeted
    
        if (path === null || path === '') {
            // The intention is to replace the entire state.
            // _currentState should become a deep copy of 'value'.
            const newFullState = JSON.parse(JSON.stringify(value));
            
            // Clear out the old _currentState properties
            Object.keys(_currentState).forEach(key => delete _currentState[key]);
            // Assign new properties from newFullState to _currentState
            Object.assign(_currentState, newFullState);
            targetObjectForReturn = _currentState;
        } else {
            // Setting a specific path
            const keys = path.split('.');
            let current = _currentState; // Work directly on _currentState for path setting
    
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (!current[key] || typeof current[key] !== 'object') {
                    current[key] = {}; // Create structure if it doesn't exist
                }
                current = current[key];
            }
            const lastKey = keys[keys.length - 1];
            current[lastKey] = JSON.parse(JSON.stringify(value)); // Ensure deep copy of value being set
            targetObjectForReturn = current[lastKey];
        }
    
        // FIXED: Remove any future history entries and add the new state
        _history.splice(_historyCurrentIndex + 1); // Remove future entries
        _history.push(JSON.parse(JSON.stringify(_currentState))); // Add current modified state
        _historyCurrentIndex = _history.length - 1; // Update index to point to the new entry
    
        return JSON.parse(JSON.stringify(targetObjectForReturn)); // Return a deep copy of what was set
    },

      getState() { return JSON.parse(JSON.stringify(_currentState)); },
      canUndo() { return _historyCurrentIndex > 0; },
      canRedo() { return _historyCurrentIndex < _history.length - 1; },
      undo() {
        if (this.canUndo()) {
          _historyCurrentIndex--;
          // Clear current state
          Object.keys(_currentState).forEach(key => delete _currentState[key]);
          // Assign the historical state
          Object.assign(_currentState, JSON.parse(JSON.stringify(_history[_historyCurrentIndex])));
      }
      return this.getState();
      },
      redo() {
        if (this.canRedo()) {
          _historyCurrentIndex++;
          // Clear current state
          Object.keys(_currentState).forEach(key => delete _currentState[key]);
          // Assign the historical state
          Object.assign(_currentState, JSON.parse(JSON.stringify(_history[_historyCurrentIndex])));
      }
      return this.getState();
      },
      goToState(index) {
        if (index >= 0 && index < _history.length) {
          _historyCurrentIndex = index;
          // Clear current state
          Object.keys(_currentState).forEach(key => delete _currentState[key]);
          // Assign the historical state
          Object.assign(_currentState, JSON.parse(JSON.stringify(_history[_historyCurrentIndex])));
      }
      return this.getState();
      },
      getHistory() { return _history.map(s => JSON.parse(JSON.stringify(s))); },
      getCurrentIndex() { return _historyCurrentIndex; }
    };
  }

  /**
   * The execution context provided to each node's implementation function (`this` context).
   * `self`, `input`, and `flowInstanceId` are dynamically set or are instance-specific.
   * `steps` and `nodes` provide broader flow context.
   * `state` provides state management capabilities.
   * `emit`/`on`/`humanInput` provide interaction capabilities.
   */
  const baseExecutionContext = {
      state: fmState,
      steps,
      nodes,
      self: null, // Dynamically set in _nextStepInternal before each node execution
      input: null, // Dynamically set in _nextStepInternal before each node execution
      flowInstanceId: flowInstanceId, // Set once for the FlowManager instance
      /**
       * Requests human input, pausing the flow execution until input is provided via FlowHub.
       * Uses `currentNode` and `currentIndex` from FlowManager's lexical scope to identify the calling node.
       * @param {object} details - Details about the required input (passed to UI/responder).
       * @param {string} [customPauseId] - A custom ID for this pause request.
       * @returns {Promise<any>} A promise that resolves with the human-provided data.
       */
      humanInput: async function(details, customPauseId) {
          const resumeData = await FlowHub.requestPause({
              pauseId: customPauseId,
              details,
              flowInstanceId: this.flowInstanceId
          });
          return resumeData;
      },
      /**
       * Emits a custom event globally via FlowHub.
       * Uses `currentNode` and `currentIndex` from FlowManager's lexical scope to identify the emitting node.
       * @param {string} customEventName - The custom name of the event.
       * @param {any} data - The payload for the event.
       */
      emit: async function(customEventName, data) {
          const emittingNodeMeta = {
              index: currentIndex - 1,
              definition: currentNode
          };
          
          // Handle case where definition is a function or can't be serialized
          let serializedDefinition;
          try {
              if (typeof emittingNodeMeta.definition === 'function') {
                  serializedDefinition = {
                      type: 'function',
                      name: emittingNodeMeta.definition.name || 'anonymous',
                      toString: emittingNodeMeta.definition.toString()
                  };
              } else {
                  serializedDefinition = JSON.parse(JSON.stringify(emittingNodeMeta.definition));
              }
          } catch (e) {
              serializedDefinition = { type: 'unserializable', error: e.message };
          }
          
          emitToAllChannels('flowManagerNodeEvent', {
              flowInstanceId: this.flowInstanceId,
              emittingNode: {
                  index: emittingNodeMeta.index,
                  definition: serializedDefinition
              },
              customEventName: customEventName,
              eventData: data,
              timestamp: Date.now()
          });
      },
      /**
       * Registers a listener on FlowHub for a custom node event.
       * Uses `currentNode` and `currentIndex` from FlowManager's lexical scope to identify the listening node.
       * The listener will be automatically cleaned up when this FlowManager instance is re-run.
       * @param {string} customEventName - The custom name of the event to listen for.
       * @param {Function} nodeCallback - The function to call when the event occurs.
       *                              It receives (data, meta) arguments.
       *                              'this' inside the callback is the `baseExecutionContext` of the listening node,
       *                              with 'self' and 'input' captured at the time of listener registration.
       */
      on: function(customEventName, nodeCallback) {
        if (typeof nodeCallback !== 'function') {
            return;
        }
    
        // Capture critical parts of the context AT THE TIME OF LISTENER REGISTRATION
        const capturedSelf = JSON.parse(JSON.stringify(this.self));
        const capturedInput = (typeof this.input === 'object' && this.input !== null)
                              ? JSON.parse(JSON.stringify(this.input))
                              : this.input;
        const flowInstanceId = this.flowInstanceId;
        const state = this.state;
        const emit = this.emit.bind(this);
        const humanInput = this.humanInput.bind(this);
        const steps = this.steps;
        const nodes = this.nodes;
    
        const listeningNodeMeta = {
            index: currentIndex - 1,
            definition: capturedSelf,
            flowInstanceId: flowInstanceId
        };
    
        const effectiveHubCallback = (flowHubEventData) => {
            if (flowHubEventData.customEventName === customEventName) {
                const meta = {
                    eventName: flowHubEventData.customEventName,
                    emittingNodeMeta: {
                        index: flowHubEventData.emittingNode.index,
                        definition: flowHubEventData.emittingNode.definition,
                        flowInstanceId: flowHubEventData.flowInstanceId
                    },
                    listeningNodeMeta: listeningNodeMeta
                };
    
                // Create a fresh context object with captured values
                const callbackThisContext = {
                    self: capturedSelf,
                    input: capturedInput,
                    flowInstanceId: flowInstanceId,
                    state: state,
                    emit: emit,
                    humanInput: humanInput,
                    steps: steps,
                    nodes: nodes,
                    on: function() {
                        // Cannot register new listeners from within an event callback
                    }
                };
    
                try {
                    nodeCallback.call(callbackThisContext, flowHubEventData.eventData, meta);
                } catch (e) {
                    // Silently handle errors in event listener callbacks
                }
            }
        };
    
        FlowHub.addEventListener('flowManagerNodeEvent', effectiveHubCallback);
        _registeredHubListeners.push({
            hubEventName: 'flowManagerNodeEvent',
            effectiveHubCallback: effectiveHubCallback
        });
    }
  };

  /**
   * Finds a full NodeDefinition object or a synthetic definition from the scope.
   * This is primarily used to populate `this.self` in the node execution context.
   * It prioritizes finding full NodeDefinitions (objects with an `id`, `name`, `implementation`, etc.).
   * If the identifier points to a simple function in scope, a synthetic definition is returned.
   * @param {string} nodeIdentifier - The string identifier for the node.
   * @returns {object | null} The NodeDefinition object, a synthetic definition, or null if not suitably found.
   */
  function findNodeDefinitionInScope(nodeIdentifier) {
    if (!scope || typeof nodeIdentifier !== 'string') {
      return null;
    }

    const directMatch = scope[nodeIdentifier];

    // Case 1: Direct match is a full NodeDefinition (e.g., "id:name" key from NodeRegistry.getScope())
    if (directMatch && typeof directMatch === 'object' && directMatch !== null && typeof directMatch.implementation === 'function') {
      return directMatch;
    }

    // Case 2: Resolve by ID from "id:name" keys (e.g., "text.analysis.sentiment")
    for (const key in scope) {
      if (Object.prototype.hasOwnProperty.call(scope, key) && key.startsWith(nodeIdentifier + ":")) {
        const entry = scope[key];
        // Check if it's a valid NodeDefinition structure
        if (entry && typeof entry === 'object' && typeof entry.implementation === 'function') {
          return entry;
        }
      }
    }

    // Case 3: Resolve by Name from "id:name" keys (e.g., "Sentiment Analyzer")
    for (const key in scope) {
      if (Object.prototype.hasOwnProperty.call(scope, key) && key.endsWith(":" + nodeIdentifier)) {
        const entry = scope[key];
        // Check if it's a valid NodeDefinition structure
        if (entry && typeof entry === 'object' && typeof entry.implementation === 'function') {
          return entry;
        }
      }
    }

    // Case 4: Direct match was a simple function (user-added function to scope)
    // Create a synthetic definition for `this.self`.
    if (directMatch && typeof directMatch === 'function') {
        return {
            id: nodeIdentifier, // The key used to find it in scope
            name: nodeIdentifier, // Use identifier as name
            description: 'A custom function provided directly in the FlowManager scope.',
            // The actual implementation is resolved separately by `resolveNodeFromScope`.
            // `self` is primarily metadata.
            _isScopeProvidedFunction: true
        };
    }

    // If not found as a full NodeDefinition or a direct function in scope
    return null;
  }

  /**
   * Resolves a node identifier string to its executable implementation function
   * using the FlowManager's 'scope' object.
   * (Original logic for resolving implementation remains unchanged)
   * @param {string} nodeIdentifier - The string identifier for the node.
   * @returns {Function | null} The executable function or null if not found.
   */
  function resolveNodeFromScope(nodeIdentifier) {
    if (!scope || typeof nodeIdentifier !== 'string') {
      return null;
    }
    const directMatch = scope[nodeIdentifier];
    if (directMatch) {
      if (typeof directMatch === 'function') {
        return directMatch;
      }
      if (typeof directMatch.implementation === 'function') {
        return directMatch.implementation;
      }
    }
    for (const key in scope) {
      if (Object.prototype.hasOwnProperty.call(scope, key) && key.startsWith(nodeIdentifier + ":")) {
        const entry = scope[key];
        if (entry && typeof entry.implementation === 'function') {
          return entry.implementation;
        }
      }
    }
    for (const key in scope) {
      if (Object.prototype.hasOwnProperty.call(scope, key) && key.endsWith(":" + nodeIdentifier)) {
        const entry = scope[key];
        if (entry && typeof entry.implementation === 'function') {
          return entry.implementation;
        }
      }
    }
    return null;
  }

  /**
   * Processes the value returned by a node's implementation into a standard output format.
   * (Original logic remains unchanged)
   * @param {any} returnedValue - The value returned by the node's implementation.
   * @param {object} context - The execution context (`baseExecutionContext`), enabling edge functions to use `this`.
   * @returns {Promise<object>} A promise that resolves to the standard output object {edges: string[], results?: any[]}.
   */
  async function processReturnedValue(returnedValue, context) {
    let output = null;
    if (Array.isArray(returnedValue)) {
      if (returnedValue.every(item => typeof item === 'string') && returnedValue.length > 0) {
        output = { edges: returnedValue };
      } else {
        output = { edges: ['pass'], results: [returnedValue] };
      }
    } else if (typeof returnedValue === 'object' && returnedValue !== null) {
      const edgeFunctions = {};
      const edgeNames = [];
      Object.keys(returnedValue).forEach(key => {
        if (typeof returnedValue[key] === 'function') {
          edgeNames.push(key);
          edgeFunctions[key] = returnedValue[key];
        }
      });

      if (edgeNames.length > 0) {
        const results = [];
        for (const k of edgeNames) {
          try {
            const edgeFn = edgeFunctions[k];
            // Pass the full context to edge functions, allowing them to use this.state, this.input etc.
            let result = await Promise.resolve(edgeFn.apply(context, []));
            results.push(result);
          } catch (e) {
            // Silently handle edge function execution errors
            results.push({ error: e.message });
          }
        }
        output = {
          edges: edgeNames,
          results: results
        };
      } else {
        output = { edges: ['pass'], results: [returnedValue] };
      }
    } else if (typeof returnedValue === 'string') {
      output = { edges: [returnedValue], results: [returnedValue] }; // <<< MODIFIED to include results
    } else {
      output = { edges: ['pass'], results: [returnedValue] };
    }

    if (!output.edges || output.edges.length === 0) {
        output.edges = ['pass'];
    }
    return output;
  }

  /**
   * Manages the execution of a loop construct within the flow.
   * @param {Array} loopNodesConfig - The array defining the loop's controller and actions.
   * @param {any} loopInitialInput - The input to the loop construct for the first iteration.
   * @returns {Promise<object>} A promise resolving to { internalSteps: Array, finalOutput: object }.
   */
  async function loopManager(loopNodesConfig, loopInitialInput) { // <<< ADDED loopInitialInput
    const loopInternalSteps = [];
    if (!loopNodesConfig || loopNodesConfig.length === 0) {
      const passOutput = { edges: ['pass'] };
      return { internalSteps: [{ nodeDetail: "Empty Loop Body", output: passOutput }], finalOutput: passOutput };
    }
    const controllerNode = loopNodesConfig[0];
    const actionNodes = loopNodesConfig.slice(1);
    let maxIterations = 100;
    let iterationCount = 0;
    let lastLoopIterationOutput = { edges: ['pass'] };

    while (iterationCount < maxIterations) {
      iterationCount++;
      const loopIterationInstanceId = `${flowInstanceId}-loop${iterationCount}`;

      const controllerFM = FlowManager({
        initialState: fmState.getState(),
        nodes: [controllerNode],
        instanceId: `${loopIterationInstanceId}-ctrl`,
        scope: scope,
        initialInput: (iterationCount === 1) ? loopInitialInput : (lastLoopIterationOutput?.results ? lastLoopIterationOutput.results[0] : null) // <<< MODIFIED to use loopInitialInput
      });

      const controllerRunResult = await controllerFM.run();
      let controllerOutput;

      if (controllerRunResult && controllerRunResult.length > 0) {
        controllerOutput = controllerRunResult.at(-1).output;
        fmState.set(null, controllerFM.getStateManager().getState());
        loopInternalSteps.push({
          nodeDetail: `Loop Iter ${iterationCount}: Controller ${typeof controllerNode === 'string' ? controllerNode : 'Complex Controller'}`,
          outputFromController: controllerOutput,
          controllerSubSteps: controllerRunResult
        });
      } else {
        console.warn(`[FlowManager:${flowInstanceId}] Loop controller (iter ${iterationCount}) did not produce output. Defaulting to 'exit'.`);
        controllerOutput = { edges: ['exit'] };
        loopInternalSteps.push({
          nodeDetail: `Loop Iter ${iterationCount}: Controller Error or No Output`, outputFromController: controllerOutput,
        });
      }

      lastLoopIterationOutput = controllerOutput;

      if (controllerOutput.edges.includes('exit') || controllerOutput.edges.includes('exit_forced')) {
        break;
      }

      if (actionNodes.length > 0) {
        const actionsFM = FlowManager({
          initialState: fmState.getState(),
          nodes: actionNodes,
          instanceId: `${loopIterationInstanceId}-actions`,
          scope: scope,
          initialInput: (controllerOutput?.results && controllerOutput.results.length > 0) ? controllerOutput.results[0] : null // <<< ADDED initialInput for actions
        });

        const actionsRunResult = await actionsFM.run();
        fmState.set(null, actionsFM.getStateManager().getState());

        if (actionsRunResult && actionsRunResult.length > 0) {
          lastLoopIterationOutput = actionsRunResult.at(-1).output;
          loopInternalSteps.push({
            nodeDetail: `Loop Iter ${iterationCount}: Actions`, outputFromActions: lastLoopIterationOutput, actionSubSteps: actionsRunResult
          });
        } else {
           loopInternalSteps.push({ nodeDetail: `Loop Iter ${iterationCount}: Actions (no output/steps)`, actionSubSteps: actionsRunResult || [] });
        }
      }

      if (iterationCount >= maxIterations) {
        console.warn(`[FlowManager:${flowInstanceId}] Loop reached max iterations (${maxIterations}). Forcing exit.`);
        lastLoopIterationOutput = { edges: ['exit_forced'] };
        loopInternalSteps.push({ nodeDetail: "Loop Max Iterations Reached", output: lastLoopIterationOutput });
        break;
      }
    }
    return { internalSteps: loopInternalSteps, finalOutput: lastLoopIterationOutput };
  }

  /**
   * Evaluates a single node in the workflow.
   * This function determines the node type and executes it accordingly.
   * It relies on `baseExecutionContext` (accessible via `this` in node implementations and edge functions)
   * having been pre-populated with `self` and `input` by `_nextStepInternal`.
   * @param {any} nodeDefinitionFromWorkflow - The node definition from the `nodes` array to evaluate.
   * @returns {Promise<void>}
   */
  async function evaluateNode(nodeDefinitionFromWorkflow) {
    let output = null;
    let returnedValue;
    const nodeToRecord = nodeDefinitionFromWorkflow;
    let subStepsToRecord = null;

    // Helper to execute a node's implementation function with the correct context and arguments.
    // `baseExecutionContext` is used as `this`, so it has `self`, `input`, `state`, etc.
    async function executeFunc(fn, context, ...args) {
        return await Promise.resolve(fn.apply(context, args));
    }

    if (typeof nodeDefinitionFromWorkflow === 'function') {
      returnedValue = await executeFunc(nodeDefinitionFromWorkflow, baseExecutionContext);
    } else if (typeof nodeDefinitionFromWorkflow === 'string') {
      const implementation = resolveNodeFromScope(nodeDefinitionFromWorkflow);
      if (implementation) {
        returnedValue = await executeFunc(implementation, baseExecutionContext);
      } else {
        console.error(`[FlowManager:${flowInstanceId}] Node/Function '${nodeDefinitionFromWorkflow}' not found in scope. Treating as error.`);
        output = { edges: ['error'], errorDetails: `Node/Function '${nodeDefinitionFromWorkflow}' not found in scope` };
      }
    } else if (Array.isArray(nodeDefinitionFromWorkflow)) {
      if (nodeDefinitionFromWorkflow.length === 1 && Array.isArray(nodeDefinitionFromWorkflow[0]) && nodeDefinitionFromWorkflow[0].length > 0) {
        // Loop construct: [[controller, ...actions]]
        const loopRun = await loopManager(nodeDefinitionFromWorkflow[0], baseExecutionContext.input); // <<< PASSED input to loopManager
        output = loopRun.finalOutput;
        subStepsToRecord = loopRun.internalSteps;
      } else if (nodeDefinitionFromWorkflow.length > 0) {
        // Sub-flow construct: [node1, node2, ...]
        // Each sub-FlowManager will manage its own `input` and `self` context for its nodes.
        const subflowFM = FlowManager({
          initialState: fmState.getState(),
          nodes: nodeDefinitionFromWorkflow,
          instanceId: `${flowInstanceId}-subflow-idx${currentIndex-1}`,
          scope: scope,
          initialInput: baseExecutionContext.input // <<< ADDED: Pass current input as initial for sub-flow
        });
        const subflowResultSteps = await subflowFM.run();
        fmState.set(null, subflowFM.getStateManager().getState());
        output = subflowResultSteps?.at(-1)?.output || { edges: ['pass'] };
        subStepsToRecord = subflowResultSteps;
      } else {
        // Empty array as a node: considered a pass-through
        output = {edges: ['pass']};
      }
    } else if (typeof nodeDefinitionFromWorkflow === 'object' && nodeDefinitionFromWorkflow !== null) {
      if (Object.keys(nodeDefinitionFromWorkflow).length === 0) {
        // Empty object as a node: considered a pass-through
        output = { edges: ['pass'] };
      } else {
        const nodeKey = Object.keys(nodeDefinitionFromWorkflow)[0];
        const nodeValue = nodeDefinitionFromWorkflow[nodeKey];

        const implementation = resolveNodeFromScope(nodeKey);

        if (implementation && Object.keys(nodeDefinitionFromWorkflow).length === 1 && ( (typeof nodeValue === 'object' && !Array.isArray(nodeValue)) || nodeValue === undefined) ) {
          // Case 1: Parameterized function call: { "nodeNameOrId": {param1: value1, ...} }
             const resolvedParams = resolveStatePlaceholders(nodeValue || {}, baseExecutionContext.state);
             returnedValue = await executeFunc(implementation, baseExecutionContext, resolvedParams);
        } else {
          // Case 2: Branching construct: { "edgeName1": nodeA, "edgeName2": nodeB, ... }
          const prevStepOutput = steps.at(-1)?.output; // Output of the node *before this branch object* in the current flow
          const prevEdges = (prevStepOutput && prevStepOutput.edges) ? prevStepOutput.edges : [];
          let branchTaken = false;

          for (const edgeKey of Object.keys(nodeDefinitionFromWorkflow)) {
            if (prevEdges.includes(edgeKey)) {
              const branchNodeDefinition = nodeDefinitionFromWorkflow[edgeKey];
              const branchFM = FlowManager({
                initialState: fmState.getState(),
                nodes: Array.isArray(branchNodeDefinition) ? branchNodeDefinition : [branchNodeDefinition],
                instanceId: `${flowInstanceId}-branch-${edgeKey}-idx${currentIndex-1}`,
                scope: scope,
                initialInput: baseExecutionContext.input // <<< ADDED: Pass current input (from node before branch)
              });
              const branchResultSteps = await branchFM.run();
              fmState.set(null, branchFM.getStateManager().getState());
              output = branchResultSteps?.at(-1)?.output || { edges: ['pass'] };
              subStepsToRecord = branchResultSteps;
              branchTaken = true;
              break;
            }
          }
          if (!branchTaken) {
            output = { edges: ['pass'] };
          }
        }
      }
    } else {
      console.warn(`[FlowManager:${flowInstanceId}] Unknown node type or unhandled case:`, nodeDefinitionFromWorkflow);
      output = { edges: ['error', 'pass'], errorDetails: 'Unknown node type' };
    }

    if (returnedValue !== undefined && output === null) {
      output = await processReturnedValue(returnedValue, baseExecutionContext);
    }

    if (!output || typeof output.edges === 'undefined' || !Array.isArray(output.edges) || output.edges.length === 0) {
      output = { ...(output || {}), edges: ['pass'] };
    }

    steps.push({ node: nodeToRecord, output, ...(subStepsToRecord && { subSteps: subStepsToRecord }) });

    emitToAllChannels('flowManagerStep', {
      flowInstanceId: flowInstanceId,
      stepIndex: currentIndex - 1, // 0-based index of the node just processed (currentIndex was already incremented for the next step)
      stepData: JSON.parse(JSON.stringify(steps.at(-1))),
      currentState: fmState.getState()
    });
    console.log(`[FlowManager:${flowInstanceId}] *** EMITTED flowManagerStep EVENT *** Step ${currentIndex - 1}`);
  }

  /**
   * Internal recursive function to process the next node in the `nodes` array.
   * Crucially, it sets up `baseExecutionContext.input` and `baseExecutionContext.self`
   * before each call to `evaluateNode`.
   * @returns {Promise<void>}
   */
  async function _nextStepInternal() {
    if (currentIndex < nodes.length) {
      // `currentNode` (lexical scope) is set to the node definition that is *about to be processed*.
      // This is used by `emit`, `on`, `humanInput` in `baseExecutionContext` to identify their source.
      currentNode = nodes[currentIndex];
      const nodeToEvaluate = nodes[currentIndex]; // The actual node definition from the workflow `nodes` array.

      // 1. Set `baseExecutionContext.input` from the output of the previous step in *this* FlowManager instance
      //    OR from _initialInput if this is the first step.
      if (currentIndex === 0 && _initialInput !== null) { // <<< MODIFIED: Check _initialInput for the very first node
          baseExecutionContext.input = _initialInput;
      } else {
          const previousStep = steps.at(-1);
          if (previousStep && previousStep.output && Array.isArray(previousStep.output.results)) {
              if (previousStep.output.results.length === 1) {
                  baseExecutionContext.input = previousStep.output.results[0];
              } else if (previousStep.output.results.length > 0) {
                  baseExecutionContext.input = previousStep.output.results; // Pass array if multiple results
              } else {
                  baseExecutionContext.input = null; // Empty results array
              }
          } else {
              // No previous step, or previous step had no `results` array (e.g. only edges).
              baseExecutionContext.input = null;
          }
      }


      // 2. Set `baseExecutionContext.self` with the definition/structure of the current node.
      let nodeDefinitionForSelfContext;
      if (typeof nodeToEvaluate === 'string') {
        nodeDefinitionForSelfContext = findNodeDefinitionInScope(nodeToEvaluate);
        if (!nodeDefinitionForSelfContext) {
          // If string identifier isn't a known NodeDefinition or scoped function,
          // `self` becomes a minimal object representing this unresolved identifier.
          nodeDefinitionForSelfContext = {
            id: nodeToEvaluate,
            name: nodeToEvaluate,
            description: "An identifier for a node or function that could not be fully resolved from scope for the 'self' context.",
            source:scope[nodeToEvaluate] ? scope[nodeToEvaluate].toString() : '',
            _unresolvedIdentifier: true
          }
        } else if (scope[nodeToEvaluate] && typeof scope[nodeToEvaluate] === 'function' && !nodeDefinitionForSelfContext._isScopeProvidedFunction) {
             // This case handles if findNodeDefinitionInScope returns a full NodeDef, but the original string
             // was actually a direct function key in scope (e.g. "myDirectScopeFunc" instead of "myDirectScopeFunc:My Custom Function")
             // We still want `self` to reflect the direct function call in this case if findNodeDefinitionInScope didn't already mark it.
             nodeDefinitionForSelfContext = { // Overwrite/refine if necessary
                id: nodeToEvaluate,
                name: nodeToEvaluate,
                description: 'A custom function provided directly in the FlowManager scope.',
                source: scope[nodeToEvaluate].toString(),
                _isScopeProvidedFunction: true
            };
        } else if (nodeDefinitionForSelfContext && nodeDefinitionForSelfContext.implementation) {
            // Ensure source is correctly captured for resolved NodeDefinitions too.
            nodeDefinitionForSelfContext = {
                ...nodeDefinitionForSelfContext,
                source: nodeDefinitionForSelfContext.implementation.toString()
            };
        }

      } else if (typeof nodeToEvaluate === 'function') {
        // For a direct function in the nodes array, `self` is a synthetic definition.
        nodeDefinitionForSelfContext = {
          id: `workflow-function-${currentIndex}`,
          name: `Workflow-Defined Function @ index ${currentIndex}`,
          description: 'A function provided directly within the workflow nodes definition.',
          source: nodeToEvaluate.toString(), // Store the function source code for reference
          _isWorkflowProvidedFunction: true
        };
      } else if (typeof nodeToEvaluate === 'object' && nodeToEvaluate !== null && !Array.isArray(nodeToEvaluate)) {
        // OBJECT CASE: Could be a parameterized call, a branch structure, or an empty object.
        const keys = Object.keys(nodeToEvaluate);

        if (keys.length === 1) {
          const nodeIdentifier = keys[0];
          const nodeParams = nodeToEvaluate[nodeIdentifier];

          // Attempt to resolve the key as a function to see if it's a callable node.
          const implementation = resolveNodeFromScope(nodeIdentifier);

          // Check if the structure matches a parameterized call:
          // - An implementation function must exist for the identifier.
          // - The value associated with the identifier (nodeParams) must be an object (but not an array) or undefined.
          const isParameterizedCallStructure = implementation &&
                                               ((typeof nodeParams === 'object' && !Array.isArray(nodeParams) && nodeParams !== null) || nodeParams === undefined);

          if (isParameterizedCallStructure) {
            // This node is a parameterized function call.
            // Construct 'self' with details about the function being called.
            const selfDefCandidate = findNodeDefinitionInScope(nodeIdentifier);

            if (selfDefCandidate && typeof selfDefCandidate === 'object' && !selfDefCandidate._unresolvedIdentifier) {
                // A definition (full NodeDefinition or synthetic for a scope function) was found.
                // Use it as the base for 'self'.
                nodeDefinitionForSelfContext = {
                    ...selfDefCandidate, // Spread the properties of the found definition
                    description: selfDefCandidate.description || `A parameterized call to '${nodeIdentifier}'.`, // Ensure description exists
                    source: implementation.toString(), // Actual source code of the implementation
                    parametersProvided: nodeParams,    // Parameters passed in the workflow
                    _isParameterizedCall: true         // Flag indicating this type of 'self'
                    // _isScopeProvidedFunction will be preserved if selfDefCandidate had it.
                };
            } else {
                 // Fallback: Implementation was found, but findNodeDefinitionInScope didn't return a rich/resolved object.
                 // Create a more basic synthetic 'self'.
                 nodeDefinitionForSelfContext = {
                    id: nodeIdentifier,
                    name: nodeIdentifier, // Default name to the identifier
                    description: `A parameterized call to the function '${nodeIdentifier}'.`,
                    source: implementation.toString(),
                    parametersProvided: nodeParams,
                    _isParameterizedCall: true
                };
            }
          } else {
            // Not a parameterized call (e.g., implementation not found for the key,
            // or the value 'nodeParams' is an array, suggesting a branch).
            // 'self' is the object structure itself (e.g., for a branch).
            nodeDefinitionForSelfContext = nodeToEvaluate;
          }
        } else {
          // Object with multiple keys (likely a branch) or an empty object (pass-through).
          // 'self' is the object structure itself.
          nodeDefinitionForSelfContext = nodeToEvaluate;
        }
      } else if (Array.isArray(nodeToEvaluate)) {
        // ARRAY CASE: This is a sub-flow or a loop construct.
        // 'self' is the array structure itself as defined in the workflow.
        nodeDefinitionForSelfContext = nodeToEvaluate;
      } else {
        // FALLBACK: For any other unexpected node types.
        console.warn(`[FlowManager:${flowInstanceId}] Unhandled node type for 'self' context construction:`, nodeToEvaluate);
        // Default to setting 'self' as the node itself, though its handling might be undefined.
        nodeDefinitionForSelfContext = nodeToEvaluate;
      }

      baseExecutionContext.self = nodeDefinitionForSelfContext;

      // Increment `currentIndex` *before* calling `evaluateNode` for the current node.
      // This means `currentIndex` in the lexical scope (used by emit/on) will point to the *next* node's slot,
      // so `currentIndex - 1` correctly refers to the 0-based index of the node currently being evaluated.
      currentIndex++;

      await evaluateNode(nodeToEvaluate); // Pass the original node definition from the `nodes` array

      await _nextStepInternal(); // Recurse for the next step
    } else {
      // All nodes in this FlowManager instance processed
      if (_resolveRunPromise) {
        _resolveRunPromise(JSON.parse(JSON.stringify(steps)));
        _resolveRunPromise = null; _rejectRunPromise = null;
      }
    }
  }

  // Public API for the FlowManager instance
  return {
    /**
     * Starts or re-runs the flow execution from the beginning.
     * @returns {Promise<Array>} A promise that resolves with an array of all executed steps.
     */
    async run() {
      currentIndex = 0;
      steps.length = 0;

      _registeredHubListeners.forEach(listenerRegistration => {
          FlowHub.removeEventListener(listenerRegistration.hubEventName, listenerRegistration.effectiveHubCallback);
      });
      _registeredHubListeners.length = 0;

      return new Promise(async (resolve, reject) => {
        _resolveRunPromise = resolve;
        _rejectRunPromise = reject;

        if (!nodes || nodes.length === 0) {
        //  console.log(`[FlowManager:${flowInstanceId}] No nodes to execute.`);
          resolve([]);
          _resolveRunPromise = null; _rejectRunPromise = null;
          return;
        }
        emitToAllChannels('flowManagerStart', {
          flowInstanceId: flowInstanceId,
          currentState: fmState.getState()
        });
        console.log(`[FlowManager:${flowInstanceId}] *** EMITTED flowManagerStart EVENT ***`);
        try {
          console.log(`[FlowManager:${flowInstanceId}] Starting execution. Total nodes: ${nodes.length}. Scope keys: ${Object.keys(scope).length}`);
          await _nextStepInternal();
          emitToAllChannels('flowManagerEnd', {
            flowInstanceId: flowInstanceId,
            summary:`[FlowManager:${flowInstanceId}] Execution finished. Total steps executed: ${steps.length}.`,
            currentState: fmState.getState()
          });
          console.log(`[FlowManager:${flowInstanceId}] *** EMITTED flowManagerEnd EVENT ***`);
          console.log(`[FlowManager:${flowInstanceId}] Execution finished. Total steps executed: ${steps.length}.`);
        } catch (error) {
          console.error(`[FlowManager:${flowInstanceId}] Error during flow execution:`, error);
          if(_rejectRunPromise) _rejectRunPromise(error);
          _resolveRunPromise = null; _rejectRunPromise = null;
        }
      });
    },
    /**
     * Retrieves a deep copy of all steps executed so far in the current or last run.
     * @returns {Array} An array of step objects.
     */
    getSteps: () => JSON.parse(JSON.stringify(steps)),
    /**
     * Retrieves the StateManager instance for this FlowManager.
     * @returns {object} The StateManager instance.
     */
    getStateManager: () => fmState,
    /**
     * Retrieves the unique instance ID of this FlowManager.
     * @returns {string} The instance ID.
     */
    getInstanceId: () => flowInstanceId
  };
}