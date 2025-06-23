import { FlowManager } from '../../core/FlowManager.js';
import FlowHub from '../../core/FlowHub.js';

describe('FlowManager', () => {
  let flowManagerEventData = [];
  let flowHubListener;

  beforeEach(() => {
    flowManagerEventData = [];
    // Listen to FlowHub events for testing
    flowHubListener = (data) => {
      flowManagerEventData.push(data);
    };
    FlowHub.addEventListener('flowManagerStep', flowHubListener);
    FlowHub.addEventListener('flowManagerStart', flowHubListener);
    FlowHub.addEventListener('flowManagerEnd', flowHubListener);
  });

  afterEach(() => {
    FlowHub.removeEventListener('flowManagerStep', flowHubListener);
    FlowHub.removeEventListener('flowManagerStart', flowHubListener);
    FlowHub.removeEventListener('flowManagerEnd', flowHubListener);
  });

  describe('Basic Workflow Execution', () => {
    test('should execute a simple workflow with function nodes', async () => {
      const nodes = [
        function() { return { value: 1 }; },
        function() { return { value: 2 }; },
        function() { return { value: 3 }; }
      ];

      const fm = FlowManager({ nodes });
      const steps = await fm.run();

      expect(steps).toHaveLength(3);
      expect(steps[0].output).toEqual({ edges: ['pass'], results: [{ value: 1 }] });
      expect(steps[1].output).toEqual({ edges: ['pass'], results: [{ value: 2 }] });
      expect(steps[2].output).toEqual({ edges: ['pass'], results: [{ value: 3 }] });
    });

    test('should handle empty workflow', async () => {
      const fm = FlowManager({ nodes: [] });
      const steps = await fm.run();

      expect(steps).toHaveLength(0);
    });

    test('should execute workflow with string-referenced nodes from scope', async () => {
      const scope = {
        'myFunction': function() { return 'hello'; },
        'anotherFunction': function() { return 'world'; }
      };

      const nodes = ['myFunction', 'anotherFunction'];
      const fm = FlowManager({ nodes, scope });
      const steps = await fm.run();

      expect(steps).toHaveLength(2);
      expect(steps[0].output.results[0]).toBe('hello');
      expect(steps[1].output.results[0]).toBe('world');
    });

    test('should handle missing nodes gracefully', async () => {
      const nodes = ['nonExistentFunction'];
      const fm = FlowManager({ nodes, scope: {} });
      const steps = await fm.run();

      expect(steps).toHaveLength(1);
      expect(steps[0].output.edges).toContain('error');
      expect(steps[0].output.errorDetails).toContain('not found in scope');
    });
  });

  describe('State Management', () => {
    test('should manage state correctly', async () => {
      const nodes = [
        function() {
          this.state.set('counter', 0);
          return 'initialized';
        },
        function() {
          const current = this.state.get('counter');
          this.state.set('counter', current + 1);
          return this.state.get('counter');
        },
        function() {
          return this.state.get('counter');
        }
      ];

      const fm = FlowManager({ nodes });
      const steps = await fm.run();

      expect(steps[2].output.results[0]).toBe(1);
    });

    test('should support undo/redo operations', async () => {
      const nodes = [
        function() {
          this.state.set('value', 'initial');
          this.state.set('value', 'changed');
          this.state.undo();
          return this.state.get('value');
        }
      ];

      const fm = FlowManager({ nodes });
      const steps = await fm.run();

      expect(steps[0].output.results[0]).toBe('initial');
    });

    test('should handle nested state paths', async () => {
      const nodes = [
        function() {
          this.state.set('user.profile.name', 'John');
          this.state.set('user.profile.age', 30);
          return this.state.get('user.profile');
        }
      ];

      const fm = FlowManager({ nodes });
      const steps = await fm.run();

      expect(steps[0].output.results[0]).toEqual({ name: 'John', age: 30 });
    });
  });

  describe('Input Propagation', () => {
    test('should propagate initial input to first node', async () => {
      const nodes = [
        function() {
          return { receivedInput: this.input };
        }
      ];

      const fm = FlowManager({ 
        nodes, 
        initialInput: { message: 'Hello World' } 
      });
      const steps = await fm.run();

      expect(steps[0].output.results[0].receivedInput).toEqual({ message: 'Hello World' });
    });

    test('should propagate output as input to next node', async () => {
      const nodes = [
        function() { return { data: 'from-first' }; },
        function() { return { received: this.input }; }
      ];

      const fm = FlowManager({ nodes });
      const steps = await fm.run();

      expect(steps[1].output.results[0].received).toEqual({ data: 'from-first' });
    });

    test('should handle multiple results correctly', async () => {
      const nodes = [
        function() { 
          // When returning an object, it gets wrapped as the single result
          return { data: ['a', 'b', 'c'] }; 
        },
        function() { 
          // this.input is the single result from previous node
          return { inputWas: this.input }; 
        }
      ];

      const fm = FlowManager({ nodes });
      const steps = await fm.run();

      // The returned object is passed as a single result
      expect(steps[1].output.results[0].inputWas).toEqual({ 
        data: ['a', 'b', 'c'] 
      });
    });

    test('should handle actual multiple results from processReturnedValue', async () => {
      const nodes = [
        function() { 
          // Return edge functions that produce multiple results
          return {
            edge1: () => 'result1',
            edge2: () => 'result2',
            edge3: () => 'result3'
          };
        },
        function() { 
          // this.input should be the array of results
          return { inputWas: this.input }; 
        }
      ];

      const fm = FlowManager({ nodes });
      const steps = await fm.run();

      // Multiple edge function results are passed as array
      expect(steps[1].output.results[0].inputWas).toEqual(['result1', 'result2', 'result3']);
    });
  });

  describe('Node Execution Context', () => {
    test('should provide correct context to nodes', async () => {
      const nodes = [
        function() {
          return {
            hasState: !!this.state,
            hasSteps: Array.isArray(this.steps),
            hasNodes: Array.isArray(this.nodes),
            hasSelf: !!this.self,
            hasInput: this.input !== undefined,
            hasFlowInstanceId: !!this.flowInstanceId,
            hasHumanInput: typeof this.humanInput === 'function',
            hasEmit: typeof this.emit === 'function',
            hasOn: typeof this.on === 'function'
          };
        }
      ];

      const fm = FlowManager({ nodes });
      const steps = await fm.run();
      const context = steps[0].output.results[0];

      expect(context.hasState).toBe(true);
      expect(context.hasSteps).toBe(true);
      expect(context.hasNodes).toBe(true);
      expect(context.hasSelf).toBe(true);
      expect(context.hasInput).toBe(true);
      expect(context.hasFlowInstanceId).toBe(true);
      expect(context.hasHumanInput).toBe(true);
      expect(context.hasEmit).toBe(true);
      expect(context.hasOn).toBe(true);
    });

    test('should populate self context for function nodes', async () => {
      const nodes = [
        function testFunction() {
          return {
            selfId: this.self.id,
            selfName: this.self.name,
            selfDescription: this.self.description,
            isWorkflowFunction: this.self._isWorkflowProvidedFunction
          };
        }
      ];

      const fm = FlowManager({ nodes });
      const steps = await fm.run();
      const result = steps[0].output.results[0];

      expect(result.selfId).toContain('workflow-function-');
      expect(result.selfName).toContain('Workflow-Defined Function');
      expect(result.selfDescription).toContain('function provided directly');
      expect(result.isWorkflowFunction).toBe(true);
    });
  });

  describe('State Placeholders', () => {
    test('should resolve state placeholders in parameters', async () => {
      const scope = {
        processData: function(params) {
          return { 
            received: params.value,
            multiplied: params.value * params.multiplier 
          };
        }
      };

      const nodes = [
        function() {
          this.state.set('myValue', 42);
          this.state.set('myMultiplier', 2);
          return 'done';
        },
        { 
          'processData': { 
            value: '${myValue}',
            multiplier: '${myMultiplier}'
          } 
        }
      ];

      const fm = FlowManager({ nodes, scope });
      const steps = await fm.run();

      expect(steps[1].output.results[0]).toEqual({ 
        received: 42, 
        multiplied: 84 
      });
    });

    test('should resolve nested state placeholders', async () => {
      const scope = {
        echo: function(params) { return params; }
      };

      const nodes = [
        function() {
          this.state.set('user', { 
            profile: { 
              name: 'Alice',
              scores: [10, 20, 30]
            } 
          });
          return 'done';
        },
        { 
          'echo': { 
            userName: '${user.profile.name}',
            firstScore: '${user.profile.scores[0]}',
            complex: {
              nested: '${user.profile.name}',
              array: ['${user.profile.scores[1]}']
            }
          } 
        }
      ];

      const fm = FlowManager({ nodes, scope });
      const steps = await fm.run();

      expect(steps[1].output.results[0]).toEqual({ 
        userName: 'Alice',
        firstScore: 10,
        complex: {
          nested: 'Alice',
          array: [20]
        }
      });
    });
  });

  describe('Event System', () => {
    test('should emit flowManagerStart and flowManagerEnd events', async () => {
      let events = [];
      const startListener = (data) => {
        events.push({ type: 'start', data });
      };
      const endListener = (data) => {
        events.push({ type: 'end', data });
      };
      
      FlowHub.addEventListener('flowManagerStart', startListener);
      FlowHub.addEventListener('flowManagerEnd', endListener);
      
      const nodes = [function() { return 'test'; }];
      const fm = FlowManager({ nodes });
      
      await fm.run();
      
      // Give a moment for async events to propagate
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Clean up listeners
      FlowHub.removeEventListener('flowManagerStart', startListener);
      FlowHub.removeEventListener('flowManagerEnd', endListener);

      const startEvents = events.filter(e => 
        e.type === 'start' && 
        e.data.flowInstanceId === fm.getInstanceId()
      );
      const endEvents = events.filter(e => 
        e.type === 'end' && 
        e.data.flowInstanceId === fm.getInstanceId()
      );

      expect(startEvents).toHaveLength(1);
      expect(endEvents).toHaveLength(1);
      expect(endEvents[0].data.summary).toContain('Execution finished');
    });

    test('should emit flowManagerStep events for each step', async () => {
      const nodes = [
        function() { return 'step1'; },
        function() { return 'step2'; },
        function() { return 'step3'; }
      ];

      const fm = FlowManager({ nodes });
      await fm.run();

      const stepEvents = flowManagerEventData.filter(e => 
        e.flowInstanceId === fm.getInstanceId() && 
        e.stepIndex !== undefined
      );

      expect(stepEvents).toHaveLength(3);
      expect(stepEvents[0].stepIndex).toBe(0);
      expect(stepEvents[1].stepIndex).toBe(1);
      expect(stepEvents[2].stepIndex).toBe(2);
    });
  });

  describe('Error Handling', () => {
    test('should handle node execution errors gracefully', async () => {
      const nodes = [
        function() { 
          throw new Error('Test error'); 
        },
        function() { 
          return 'This should still execute'; 
        }
      ];

      const fm = FlowManager({ nodes });
      
      // FlowManager throws errors that occur in nodes
      await expect(fm.run()).rejects.toThrow('Test error');
    });

    test('should handle undefined/null return values', async () => {
      const nodes = [
        function() { return undefined; },
        function() { return null; },
        function() { /* no return */ }
      ];

      const fm = FlowManager({ nodes });
      const steps = await fm.run();

      expect(steps).toHaveLength(3);
      
      // Check each step individually
      // undefined returns don't have results array
      expect(steps[0].output.edges).toEqual(['pass']);
      expect(steps[0].output.results).toBeUndefined();
      
      // null returns do have results array
      expect(steps[1].output.edges).toEqual(['pass']);
      expect(steps[1].output.results).toEqual([null]);
      
      // no return (undefined) doesn't have results array
      expect(steps[2].output.edges).toEqual(['pass']);
      expect(steps[2].output.results).toBeUndefined();
    });
  });
});