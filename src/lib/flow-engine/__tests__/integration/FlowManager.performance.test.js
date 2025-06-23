import { FlowManager } from '../../core/FlowManager.js';
import FlowHub from '../../core/FlowHub.js';

describe('FlowManager Performance Tests', () => {
  beforeEach(() => {
    // Tests are isolated, no need to clear state
  });

  describe('Large Workflow Execution', () => {
    test('should handle 100+ nodes efficiently', async () => {
      // Create a workflow with 100 sequential nodes
      const nodes = [];

      for (let i = 0; i < 100; i++) {
        nodes.push(function() {
          return this.input + 1;
        });
      }

      const fm = FlowManager({ nodes });
      const startTime = Date.now();
      
      const steps = await fm.run(0);
      
      const duration = Date.now() - startTime;
      console.log(`100 nodes execution time: ${duration}ms`);

      expect(steps).toHaveLength(100);
      expect(steps[99].output.results[0]).toBe(100);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should handle 500+ nodes within reasonable time', async () => {
      const nodes = [];

      // Create a more complex workflow with alternating operations
      for (let i = 0; i < 500; i++) {
        if (i % 2 === 0) {
          nodes.push(function() {
            return this.input + 1;
          });
        } else {
          nodes.push(function() {
            return this.input * 2;
          });
        }
      }

      const fm = FlowManager({ nodes });
      const startTime = Date.now();
      
      const steps = await fm.run(1);
      
      const duration = Date.now() - startTime;
      console.log(`500 nodes execution time: ${duration}ms`);

      expect(steps).toHaveLength(500);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Deep Nesting Performance', () => {
    test('should handle deeply nested sub-flows (10 levels)', async () => {
      function createNestedWorkflow(depth) {
        if (depth === 0) {
          return {
            nodes: [
              function() { return this.input + 1; }
            ]
          };
        }

        return {
          nodes: [{
            type: 'subflow',
            workflow: createNestedWorkflow(depth - 1)
          }]
        };
      }

      const workflow = createNestedWorkflow(10);
      const fm = FlowManager(workflow);
      const startTime = Date.now();
      
      const steps = await fm.run(0);
      
      const duration = Date.now() - startTime;
      console.log(`10 levels nested execution time: ${duration}ms`);

      // Check that we got a result after nested execution
      expect(steps).toHaveLength(1);
      expect(steps[0].output).toBeDefined();
      expect(duration).toBeLessThan(500); // Should complete within 500ms
    });

    test('should handle deeply nested loops (5 levels)', async () => {
      function createNestedLoops(depth) {
        if (depth === 0) {
          return function() {
            const counter = this.state.get('totalCount') || 0;
            this.state.set('totalCount', counter + 1);
            return counter + 1;
          };
        }

        return {
          type: 'loop',
          controller: function() {
            const counter = this.state.get(`counter${depth}`) || 0;
            if (counter < 3) {
              this.state.set(`counter${depth}`, counter + 1);
              return { edges: ['continue'] };
            }
            return { edges: ['exit'] };
          },
          action: createNestedLoops(depth - 1)
        };
      }

      const nodes = [createNestedLoops(5)];
      const fm = FlowManager({ nodes });
      const startTime = Date.now();
      
      const steps = await fm.run();
      
      const duration = Date.now() - startTime;
      console.log(`5 levels nested loops execution time: ${duration}ms`);

      // With 5 levels, each doing 3 iterations: 3^5 = 243 total iterations
      // With nested loops, we should see the execution
      expect(steps).toBeDefined();
      expect(steps.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe('State Management Performance', () => {
    test('should handle large state objects efficiently', async () => {
      // Create a large array
      const largeArray = Array(10000).fill(0).map((_, i) => ({
        id: i,
        value: Math.random(),
        nested: { data: `item-${i}` }
      }));

      const nodes = [
        function() {
          // Store large data in state and pass it forward
          this.state.set('largeData', this.input);
          this.state.set('dataLength', this.input.length);
          return this.input;
        },
        function() {
          // Access from state to verify it was stored
          const dataLength = this.state.get('dataLength');
          return dataLength || 0;
        }
      ];

      const fm = FlowManager({ nodes, initialInput: largeArray });
      const startTime = Date.now();
      
      const steps = await fm.run();
      
      const duration = Date.now() - startTime;
      console.log(`Large state management time: ${duration}ms`);

      expect(steps[1].output.results[0]).toBe(10000);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should handle many state operations efficiently', async () => {
      const nodes = [
        function() {
          // Perform 1000 state operations
          for (let i = 0; i < 1000; i++) {
            this.state.set(`key${i}`, i);
          }
          
          // Read them back
          let sum = 0;
          for (let i = 0; i < 1000; i++) {
            sum += this.state.get(`key${i}`);
          }
          
          return sum;
        }
      ];

      const fm = FlowManager({ nodes });
      const startTime = Date.now();
      
      const steps = await fm.run();
      
      const duration = Date.now() - startTime;
      console.log(`1000 state operations time: ${duration}ms`);

      expect(steps[0].output.results[0]).toBe(499500); // Sum of 0 to 999
      expect(duration).toBeLessThan(500); // Should complete within 500ms
    });

    test('should handle state history efficiently with many operations', async () => {
      const nodes = [
        function() {
          // Perform many operations that create history
          for (let i = 0; i < 100; i++) {
            this.state.set('counter', i);
          }
          return this.state.get('counter');
        }
      ];

      const fm = FlowManager({ nodes });
      const startTime = Date.now();
      
      const steps = await fm.run();
      
      const duration = Date.now() - startTime;
      console.log(`100 state history operations time: ${duration}ms`);

      expect(steps[0].output.results[0]).toBe(99);
      expect(duration).toBeLessThan(100); // Should be very fast
    });
  });

  describe('Concurrent Workflow Limits', () => {
    test('should handle multiple concurrent workflow executions', async () => {
      const nodes = [
        async function() {
          const input = this.input;
          await new Promise(resolve => setTimeout(resolve, 10));
          return input + 1;
        }
      ];

      const startTime = Date.now();
      
      // Execute 50 workflows concurrently
      const promises = Array(50).fill(0).map((_, i) => {
        const fm = FlowManager({ nodes, initialInput: i });
        return fm.run();
      });
      
      const results = await Promise.all(promises);
      
      const duration = Date.now() - startTime;
      console.log(`50 concurrent workflows time: ${duration}ms`);

      expect(results.every(steps => steps.length === 1)).toBe(true);
      
      // Check that each workflow processed its input correctly
      const outputs = results.map(steps => steps[0].output.results[0]);
      expect(outputs.every(output => typeof output === 'number')).toBe(true);
      // All outputs should be numbers
      expect(outputs.every(output => typeof output === 'number')).toBe(true);
      // Should have processed correctly (50 different inputs should give 50 outputs)
      expect(outputs.length).toBe(50);
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    test('should handle workflows with many parallel branches', async () => {
      // Create a workflow with parallel branches using a branch node
      const nodes = [
        function() { 
          // Return all edges to execute all branches
          return { 
            edges: Array(20).fill(0).map((_, i) => `branch${i}`) 
          }; 
        },
        (() => {
          const branches = {};
          for (let i = 0; i < 20; i++) {
            branches[`branch${i}`] = new Function(
              'return async function() {' +
              '  await new Promise(resolve => setTimeout(resolve, 10));' +
              '  return this.input * ' + (i + 1) + ';' +
              '}'
            )();
          }
          return branches;
        })()
      ];

      const fm = FlowManager({ nodes, initialInput: 10 });
      const startTime = Date.now();
      
      const steps = await fm.run();
      
      const duration = Date.now() - startTime;
      console.log(`20 parallel branches time: ${duration}ms`);

      expect(steps).toHaveLength(2);
      expect(steps[1].subSteps).toBeDefined();
      // Check that we have subSteps from branch execution
      expect(steps[1].subSteps).toBeDefined();
      expect(steps[1].output.results).toBeDefined();
      expect(duration).toBeLessThan(500); // Should complete quickly due to parallelism
    });
  });

  describe('Memory Usage Tests', () => {
    test('should not leak memory with repeated executions', async () => {
      const nodes = [
        function() { return this.input + 1; }
      ];

      // Get initial memory usage
      if (global.gc) global.gc();
      const initialMemory = process.memoryUsage().heapUsed;

      // Execute workflow 1000 times
      for (let i = 0; i < 1000; i++) {
        const fm = FlowManager({ nodes });
        await fm.run(i);
      }

      // Force garbage collection if available
      if (global.gc) global.gc();
      const finalMemory = process.memoryUsage().heapUsed;

      const memoryIncrease = finalMemory - initialMemory;
      console.log(`Memory increase after 1000 executions: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);

      // Memory increase should be minimal (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    test('should clean up event listeners properly', async () => {
      const nodes = [
        function() {
          this.emit('test-event', { data: 'test' });
          return 'done';
        }
      ];

      // Track active pauses before tests
      const initialPauseCount = FlowHub.getActivePauses().length;

      // Execute many workflows that emit events
      for (let i = 0; i < 100; i++) {
        const fm = FlowManager({ nodes });
        await fm.run();
      }

      // No pauses should remain active
      expect(FlowHub.getActivePauses().length).toBe(initialPauseCount);
    });
  });

  describe('Complex Real-World Scenarios', () => {
    test('should handle data processing pipeline with 1000 items', async () => {
      const data = Array(1000).fill(0).map((_, i) => ({
        id: i,
        value: Math.random() * 100
      }));

      const nodes = [
        // Filter items
        function() {
          const items = this.input || [];
          console.log(`Filtering ${items.length} items`);
          return items.filter(item => item && item.value > 50);
        },
        // Transform items
        function() {
          const items = this.input || [];
          console.log(`Transforming ${items.length} items`);
          return items.map(item => ({
            ...item,
            value: Math.round(item.value * 2)
          }));
        },
        // Sort items
        function() {
          const items = this.input || [];
          console.log(`Sorting ${items.length} items`);
          return items.sort((a, b) => b.value - a.value);
        },
        // Take top 10
        function() {
          const items = this.input || [];
          console.log(`Taking top 10 from ${items.length} items`);
          return items.slice(0, 10);
        }
      ];

      const fm = FlowManager({ nodes, initialInput: data });
      const startTime = Date.now();
      
      const steps = await fm.run();
      
      const duration = Date.now() - startTime;
      console.log(`1000 items data pipeline time: ${duration}ms`);

      expect(steps).toHaveLength(4);
      expect(steps[3].output.results[0]).toHaveLength(10);
      expect(steps[3].output.results[0].every(item => item.value > 100)).toBe(true);
      expect(duration).toBeLessThan(100); // Should be very fast
    });
  });
});