import { FlowManager } from '../../core/FlowManager.js';
import FlowHub from '../../core/FlowHub.js';

describe('FlowManager - Advanced Features', () => {
  describe('Branching', () => {
    test('should handle simple two-way branch', async () => {
      const nodes = [
        function() { return { edges: ['success'] }; },
        { 
          'success': function() { return 'took success path'; },
          'failure': function() { return 'took failure path'; }
        }
      ];

      const fm = FlowManager({ nodes });
      const steps = await fm.run();

      expect(steps).toHaveLength(2);
      // Branch execution creates subSteps
      expect(steps[1].subSteps).toBeDefined();
      expect(steps[1].subSteps).toHaveLength(1);
      expect(steps[1].subSteps[0].output.results[0]).toBe('took success path');
      // The main step output is from the branch execution
      expect(steps[1].output.results[0]).toBe('took success path');
    });

    test('should handle multi-way branching', async () => {
      const nodes = [
        function() { return { edges: ['option2'] }; },
        { 
          'option1': function() { return 'path 1'; },
          'option2': function() { return 'path 2'; },
          'option3': function() { return 'path 3'; }
        }
      ];

      const fm = FlowManager({ nodes });
      const steps = await fm.run();

      expect(steps).toHaveLength(2);
      expect(steps[1].subSteps).toBeDefined();
      expect(steps[1].subSteps[0].output.results[0]).toBe('path 2');
      expect(steps[1].output.results[0]).toBe('path 2');
    });

    test('should handle branch with no matching edge', async () => {
      const nodes = [
        function() { return { edges: ['unknown'] }; },
        { 
          'success': function() { return 'success'; },
          'failure': function() { return 'failure'; }
        }
      ];

      const fm = FlowManager({ nodes });
      const steps = await fm.run();

      expect(steps[1].output.edges).toEqual(['pass']);
    });

    test('should handle nested branches', async () => {
      const nodes = [
        function() { return { edges: ['branch1'] }; },
        { 
          'branch1': [
            function() { return { edges: ['inner'] }; },
            {
              'inner': function() { return 'nested branch executed'; }
            }
          ]
        }
      ];

      const fm = FlowManager({ nodes });
      const steps = await fm.run();

      expect(steps).toHaveLength(2);
      // The branch executes a sub-flow containing 2 nodes
      expect(steps[1].subSteps).toBeDefined();
      expect(steps[1].subSteps).toHaveLength(2);
      // The second node in the sub-flow is also a branch
      expect(steps[1].subSteps[1].subSteps).toBeDefined();
      expect(steps[1].subSteps[1].subSteps[0].output.results[0]).toBe('nested branch executed');
    });
  });

  describe('Loops', () => {
    test('should execute basic loop with counter', async () => {
      const nodes = [
        [[
          function() {
            const count = this.state.get('loopCount') || 0;
            this.state.set('loopCount', count + 1);
            if (count >= 2) {  // Exit after 2 iterations
              return { edges: ['exit'] };
            }
            return { edges: ['continue'] };
          },
          function() {
            const count = this.state.get('loopCount');
            this.state.set(`item${count}`, `value${count}`);
            return 'action executed';
          }
        ]]
      ];

      const fm = FlowManager({ nodes });
      const steps = await fm.run();

      // Loop increments before checking, so count will be 3 when exiting after 2 iterations
      expect(fm.getStateManager().get('loopCount')).toBe(3);
      expect(fm.getStateManager().get('item1')).toBe('value1');
      expect(fm.getStateManager().get('item2')).toBe('value2');
      // item3 should not exist as we exit before third action
      expect(fm.getStateManager().get('item3')).toBeUndefined();
    });

    test('should handle loop with immediate exit', async () => {
      const nodes = [
        [[
          function() { 
            return { edges: ['exit'] }; 
          },
          function() { 
            return 'should not execute'; 
          }
        ]]
      ];

      const fm = FlowManager({ nodes });
      const steps = await fm.run();

      expect(steps[0].subSteps).toBeDefined();
      expect(steps[0].subSteps.length).toBeGreaterThan(0);
      
      // Check that action nodes were not executed
      const actionSteps = steps[0].subSteps.filter(s => 
        s.nodeDetail && s.nodeDetail.includes('Actions')
      );
      expect(actionSteps).toHaveLength(0);
    });

    test('should enforce max iteration limit', async () => {
      const nodes = [
        [[
          function() { return { edges: ['continue'] }; }, // Never exits
          function() { return 'action'; }
        ]]
      ];

      const fm = FlowManager({ nodes });
      const steps = await fm.run();

      // Should stop at 100 iterations
      const iterationSteps = steps[0].subSteps.filter(s => 
        s.nodeDetail && s.nodeDetail.includes('Loop Iter')
      );
      // Expect 200 iteration steps (100 controller + 100 actions)
      expect(iterationSteps.length).toBe(200);
      
      // Should have a max iterations reached step
      const maxIterStep = steps[0].subSteps.find(s => 
        s.nodeDetail && s.nodeDetail.includes('Max Iterations Reached')
      );
      expect(maxIterStep).toBeDefined();
    });
  });

  describe('Sub-flows', () => {
    test('should execute simple sub-flow', async () => {
      const nodes = [
        function() { 
          this.state.set('mainFlow', true);
          return 'main'; 
        },
        [
          function() { 
            this.state.set('subFlow', true);
            return 'sub1'; 
          },
          function() { return 'sub2'; }
        ],
        function() { 
          return {
            mainFlow: this.state.get('mainFlow'),
            subFlow: this.state.get('subFlow')
          };
        }
      ];

      const fm = FlowManager({ nodes });
      const steps = await fm.run();

      expect(steps).toHaveLength(3);
      expect(steps[1].subSteps).toHaveLength(2);
      expect(steps[2].output.results[0]).toEqual({
        mainFlow: true,
        subFlow: true
      });
    });

    test('should propagate input through sub-flows', async () => {
      const nodes = [
        function() { return { data: 'from-main' }; },
        [
          function() { return { received: this.input, modified: 'by-subflow' }; }
        ],
        function() { return { finalInput: this.input }; }
      ];

      const fm = FlowManager({ nodes });
      const steps = await fm.run();

      expect(steps[1].subSteps[0].output.results[0]).toEqual({
        received: { data: 'from-main' },
        modified: 'by-subflow'
      });
      expect(steps[2].output.results[0].finalInput).toEqual({
        received: { data: 'from-main' },
        modified: 'by-subflow'
      });
    });
  });

  describe('Parameterized Calls', () => {
    test('should execute parameterized node calls', async () => {
      const scope = {
        'math.add': {
          id: 'math.add',
          name: 'Add Numbers',
          implementation: function(params) {
            return params.a + params.b;
          }
        }
      };

      const nodes = [
        { 'math.add': { a: 5, b: 3 } }
      ];

      const fm = FlowManager({ nodes, scope });
      const steps = await fm.run();

      expect(steps[0].output.results[0]).toBe(8);
    });

    test('should resolve state placeholders in parameters', async () => {
      const scope = {
        'concat': function(params) {
          return params.str1 + ' ' + params.str2;
        }
      };

      const nodes = [
        function() {
          this.state.set('first', 'Hello');
          this.state.set('second', 'World');
          return 'set';
        },
        { 'concat': { str1: '${first}', str2: '${second}' } }
      ];

      const fm = FlowManager({ nodes, scope });
      const steps = await fm.run();

      expect(steps[1].output.results[0]).toBe('Hello World');
    });
  });

  describe('Human Input / Pause-Resume', () => {
    test('should handle humanInput pause and resume', async () => {
      const nodes = [
        async function() {
          const response = await this.humanInput({ 
            prompt: 'Enter your name',
            type: 'text'
          }, 'test-pause-1');
          return { userSaid: response };
        }
      ];

      const fm = FlowManager({ nodes });
      
      // Start the flow (it will pause)
      const runPromise = fm.run();

      // Give it a moment to register the pause
      await new Promise(resolve => setTimeout(resolve, 50));

      // Check that flow is paused
      const activePauses = FlowHub.getActivePauses();
      expect(activePauses).toHaveLength(1);
      expect(activePauses[0].pauseId).toBe('test-pause-1');

      // Resume with data
      FlowHub.resume('test-pause-1', 'John Doe');

      // Wait for flow to complete
      const steps = await runPromise;

      expect(steps[0].output.results[0]).toEqual({ userSaid: 'John Doe' });
      expect(FlowHub.getActivePauses()).toHaveLength(0);
    });
  });

  describe('Custom Events', () => {
    test('should emit and listen to custom events', async () => {
      let eventReceived = null;

      const nodes = [
        function() {
          this.on('customEvent', (data) => {
            eventReceived = data;
          });
          return 'listener registered';
        },
        async function() {
          // Small delay before emitting to ensure listener is ready
          await new Promise(resolve => setTimeout(resolve, 10));
          await this.emit('customEvent', { message: 'Hello from node 2' });
          return 'event emitted';
        },
        function() {
          // Give event time to propagate
          return new Promise(resolve => {
            setTimeout(() => resolve('done'), 100);
          });
        }
      ];

      const fm = FlowManager({ nodes });
      await fm.run();

      expect(eventReceived).toEqual({ message: 'Hello from node 2' });
    });

    test('should handle events between different flows', async () => {
      let receivedInFlow2 = null;

      const flow1 = FlowManager({
        nodes: [
          async function() {
            await this.emit('crossFlowEvent', { from: 'flow1' });
            return 'emitted';
          }
        ]
      });

      const flow2 = FlowManager({
        nodes: [
          function() {
            this.on('crossFlowEvent', (data) => {
              receivedInFlow2 = data;
            });
            return 'listening';
          }
        ]
      });

      // Run flow2 first to set up listener
      await flow2.run();
      
      // Then run flow1 to emit event
      await flow1.run();

      // Give event time to propagate
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(receivedInFlow2).toEqual({ from: 'flow1' });
    });
  });

  describe('Edge Functions', () => {
    test('should execute edge functions with correct context', async () => {
      const nodes = [
        function() {
          this.state.set('multiplier', 10);
          return {
            multiply: () => 5 * this.state.get('multiplier'),
            add: () => 5 + this.state.get('multiplier')
          };
        }
      ];

      const fm = FlowManager({ nodes });
      const steps = await fm.run();

      expect(steps[0].output.edges).toEqual(['multiply', 'add']);
      expect(steps[0].output.results).toEqual([50, 15]);
    });
  });

  describe('Complex Scenarios', () => {
    test('should handle workflow with all features combined', async () => {
      const scope = {
        'processItem': function(params) {
          return { processed: params.item.toUpperCase() };
        }
      };

      const nodes = [
        // Initialize state
        function() {
          this.state.set('items', ['apple', 'banana', 'cherry']);
          this.state.set('processed', []);
          return 'initialized';
        },
        // Loop through items
        [[
          function() {
            const items = this.state.get('items');
            const processed = this.state.get('processed');
            
            if (processed.length >= items.length) {
              return { edges: ['exit'] };
            }
            
            const currentItem = items[processed.length];
            // Store current item in state for the sub-flow to access
            this.state.set('currentItem', currentItem);
            return { edges: ['continue'], results: [currentItem] };
          },
          // Sub-flow for processing
          [
            { 'processItem': { item: '${currentItem}' } },
            function() {
              const processed = this.state.get('processed');
              const newProcessed = [...processed, this.input];
              this.state.set('processed', newProcessed);
              return 'stored';
            }
          ]
        ]],
        // Final check
        function() {
          return {
            original: this.state.get('items'),
            processed: this.state.get('processed')
          };
        }
      ];

      const fm = FlowManager({ nodes, scope });
      const steps = await fm.run();

      const finalResult = steps[2].output.results[0];
      expect(finalResult.original).toEqual(['apple', 'banana', 'cherry']);
      expect(finalResult.processed).toHaveLength(3);
      expect(finalResult.processed[0]).toEqual({ processed: 'APPLE' });
      expect(finalResult.processed[1]).toEqual({ processed: 'BANANA' });
      expect(finalResult.processed[2]).toEqual({ processed: 'CHERRY' });
    });
  });
});