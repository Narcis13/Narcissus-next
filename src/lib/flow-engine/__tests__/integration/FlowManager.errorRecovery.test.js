import { FlowManager } from '../../core/FlowManager.js';
import FlowHub from '../../core/FlowHub.js';

describe('FlowManager Error Recovery Tests', () => {
  describe('Error Behavior Documentation', () => {
    test('workflow stops on synchronous error', async () => {
      const executionOrder = [];
      const nodes = [
        function() { 
          executionOrder.push('node1');
          return { value: 'start' }; 
        },
        function() { 
          executionOrder.push('node2');
          throw new Error('Node execution failed');
        },
        function() { 
          executionOrder.push('node3');
          return { value: 'should not reach here' }; 
        }
      ];

      const fm = FlowManager({ nodes });
      
      try {
        await fm.run();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toBe('Node execution failed');
        expect(executionOrder).toEqual(['node1', 'node2']);
        // node3 should not have executed
      }
    });

    test('workflow stops on async error', async () => {
      const executionOrder = [];
      const nodes = [
        async function() { 
          executionOrder.push('async1');
          await new Promise(resolve => setTimeout(resolve, 10));
          return { value: 'async start' }; 
        },
        async function() { 
          executionOrder.push('async2');
          await new Promise(resolve => setTimeout(resolve, 10));
          throw new Error('Async operation failed');
        },
        function() { 
          executionOrder.push('async3');
          return { value: 'unreachable' }; 
        }
      ];

      const fm = FlowManager({ nodes });
      
      try {
        await fm.run();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toBe('Async operation failed');
        expect(executionOrder).toEqual(['async1', 'async2']);
      }
    });

    test('can recover using try-catch within node', async () => {
      const nodes = [
        function() {
          try {
            throw new Error('Internal error');
          } catch (error) {
            return { recovered: true, errorMessage: error.message };
          }
        },
        function() {
          return { nextNodeExecuted: true };
        }
      ];

      const fm = FlowManager({ nodes });
      const steps = await fm.run();

      expect(steps).toHaveLength(2);
      expect(steps[0].output.results[0]).toEqual({ 
        recovered: true, 
        errorMessage: 'Internal error' 
      });
      expect(steps[1].output.results[0]).toEqual({ nextNodeExecuted: true });
    });

    test('branch errors are isolated', async () => {
      const branchResults = [];
      const nodes = [
        function() { return { edges: ['path1', 'path2', 'path3'] }; },
        {
          'path1': function() { 
            branchResults.push('path1');
            throw new Error('Branch 1 failed');
          },
          'path2': function() {
            branchResults.push('path2');
            return { success: 'Branch 2 succeeded' };
          },
          'path3': function() { 
            branchResults.push('path3');
            return { success: 'Branch 3 succeeded' };
          }
        }
      ];

      const fm = FlowManager({ nodes });
      
      try {
        await fm.run();
        fail('Should have thrown an error from branch');
      } catch (error) {
        expect(error.message).toBe('Branch 1 failed');
        // Due to parallel execution, we might see different branches execute
        expect(branchResults).toContain('path1');
      }
    });

    test('handles null/undefined nodes gracefully', async () => {
      const nodes = [
        function() { return 'first'; },
        null,
        undefined,
        function() { return 'last'; }
      ];

      const fm = FlowManager({ nodes });
      const steps = await fm.run();

      // Should process all non-null nodes
      expect(steps).toHaveLength(4);
      expect(steps[0].output.results[0]).toBe('first');
      expect(steps[1].output.edges).toContain('error'); // null node creates error
      expect(steps[2].output.edges).toContain('error'); // undefined node creates error
      expect(steps[3].output.results[0]).toBe('last');
    });
  });

  describe('State Preservation', () => {
    test('state is preserved until error occurs', async () => {
      const stateSnapshots = [];
      const nodes = [
        function() {
          this.state.set('step1', 'completed');
          // Capture the entire state object
          stateSnapshots.push({
            step1: this.state.get('step1')
          });
          return 'step1';
        },
        function() {
          this.state.set('step2', 'completed');
          stateSnapshots.push({
            step1: this.state.get('step1'),
            step2: this.state.get('step2')
          });
          return 'step2';
        },
        function() {
          this.state.set('step3', 'started');
          stateSnapshots.push({
            step1: this.state.get('step1'),
            step2: this.state.get('step2'),
            step3: this.state.get('step3')
          });
          throw new Error('Step 3 failed');
        },
        function() {
          this.state.set('step4', 'completed');
          stateSnapshots.push({
            step1: this.state.get('step1'),
            step2: this.state.get('step2'),
            step3: this.state.get('step3'),
            step4: this.state.get('step4')
          });
          return 'step4';
        }
      ];

      const fm = FlowManager({ nodes });
      
      try {
        await fm.run();
      } catch (error) {
        expect(error.message).toBe('Step 3 failed');
        expect(stateSnapshots).toHaveLength(3);
        expect(stateSnapshots[0]).toEqual({ step1: 'completed' });
        expect(stateSnapshots[1]).toEqual({ step1: 'completed', step2: 'completed' });
        expect(stateSnapshots[2]).toEqual({ 
          step1: 'completed', 
          step2: 'completed', 
          step3: 'started' 
        });
      }
    });

    test('can implement manual state rollback', async () => {
      const nodes = [
        function() {
          this.state.set('counter', 0);
          this.state.set('values', []);
          return 'initialized';
        },
        function() {
          const counter = this.state.get('counter');
          const values = this.state.get('values');
          
          this.state.set('counter', counter + 1);
          this.state.set('values', [...values, 'value1']);
          return 'step1';
        },
        function() {
          const counter = this.state.get('counter');
          const values = this.state.get('values');
          
          // Create a savepoint before risky operation
          this.state.set('savepoint', {
            counter: counter,
            values: [...values]
          });
          
          try {
            // Risky operation
            this.state.set('counter', counter + 1);
            this.state.set('values', [...values, 'value2']);
            
            // Simulate validation failure
            throw new Error('Operation failed');
          } catch (error) {
            // Rollback to savepoint
            const savepoint = this.state.get('savepoint');
            if (savepoint) {
              this.state.set('counter', savepoint.counter);
              this.state.set('values', savepoint.values);
              this.state.set('rollback', true);
            }
            return { recovered: true, error: error.message };
          }
        },
        function() {
          return { 
            finalCounter: this.state.get('counter'),
            finalValues: this.state.get('values')
          };
        }
      ];

      const fm = FlowManager({ nodes });
      const steps = await fm.run();

      expect(steps).toHaveLength(4);
      expect(steps[3].output.results[0]).toEqual({
        finalCounter: 1,
        finalValues: ['value1']
      });
      // Check rollback was performed
      expect(steps[2].output.results[0].recovered).toBe(true);
      expect(steps[3].output.results[0].finalCounter).toBe(1);
      expect(steps[3].output.results[0].finalValues).toEqual(['value1']);
    });
  });

  describe('Error Recovery Patterns', () => {
    test('retry pattern with exponential backoff', async () => {
      let attemptCount = 0;
      const attemptTimes = [];

      const nodes = [
        async function() {
          const maxRetries = 3;
          let lastError;
          
          for (let i = 0; i <= maxRetries; i++) {
            attemptCount++;
            attemptTimes.push(Date.now());
            
            try {
              // Simulate operation that fails first 2 times
              if (attemptCount <= 2) {
                throw new Error(`Attempt ${attemptCount} failed`);
              }
              
              return { success: true, attempts: attemptCount };
            } catch (error) {
              lastError = error;
              
              if (i < maxRetries) {
                // Exponential backoff: 2^i * 10ms
                const delay = Math.pow(2, i) * 10;
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }
          }
          
          throw lastError;
        }
      ];

      const fm = FlowManager({ nodes });
      const steps = await fm.run();

      expect(steps).toHaveLength(1);
      expect(attemptCount).toBe(3);
      expect(steps[0].output.results[0]).toEqual({ 
        success: true, 
        attempts: 3 
      });
      
      // Verify exponential backoff timing
      if (attemptTimes.length >= 3) {
        const delay1 = attemptTimes[1] - attemptTimes[0];
        const delay2 = attemptTimes[2] - attemptTimes[1];
        
        expect(delay1).toBeGreaterThanOrEqual(9); // ~10ms
        expect(delay2).toBeGreaterThanOrEqual(19); // ~20ms
      }
    });

    test('circuit breaker pattern', async () => {
      const nodes = [
        function() {
          // Initialize circuit breaker state
          this.state.set('circuitBreaker', {
            failures: 0,
            threshold: 3,
            isOpen: false,
            attemptCount: 0,
            results: []
          });
          return 'init';
        },
        function() {
          const breaker = this.state.get('circuitBreaker');
          
          // Simulate multiple attempts
          for (let i = 0; i < 5; i++) {
            breaker.attemptCount++;
            
            if (breaker.isOpen) {
              breaker.results.push({ 
                attempt: breaker.attemptCount, 
                status: 'circuit_open' 
              });
              continue;
            }
            
            try {
              // Simulate failing service (first 3 attempts fail)
              if (i < 3) {
                throw new Error('Service unavailable');
              }
              
              // Success - reset circuit
              breaker.failures = 0;
              breaker.results.push({ 
                attempt: breaker.attemptCount, 
                status: 'success' 
              });
              
            } catch (error) {
              breaker.failures++;
              breaker.results.push({ 
                attempt: breaker.attemptCount, 
                status: 'failed',
                error: error.message 
              });
              
              // Open circuit if threshold reached
              if (breaker.failures >= breaker.threshold) {
                breaker.isOpen = true;
              }
            }
          }
          
          this.state.set('circuitBreaker', breaker);
          return breaker;
        }
      ];

      const fm = FlowManager({ nodes });
      const steps = await fm.run();

      expect(steps).toHaveLength(2);
      const breaker = steps[1].output.results[0];
      
      expect(breaker.attemptCount).toBe(5);
      expect(breaker.isOpen).toBe(true);
      expect(breaker.failures).toBe(3);
      
      // First 3 attempts should fail
      expect(breaker.results[0].status).toBe('failed');
      expect(breaker.results[1].status).toBe('failed');
      expect(breaker.results[2].status).toBe('failed');
      
      // Remaining attempts should be blocked by circuit
      expect(breaker.results[3].status).toBe('circuit_open');
      expect(breaker.results[4].status).toBe('circuit_open');
    });

    test('compensation pattern for rollback', async () => {
      const operations = [];
      
      const nodes = [
        function() {
          // Track operations for potential compensation
          this.state.set('operations', []);
          this.state.set('account', { balance: 100 });
          return 'init';
        },
        function() {
          // Operation 1: Debit
          const account = this.state.get('account');
          const ops = this.state.get('operations');
          
          const debitAmount = 30;
          account.balance -= debitAmount;
          
          ops.push({
            type: 'debit',
            amount: debitAmount,
            // Store compensation data instead of function
            compensationAmount: debitAmount
          });
          
          this.state.set('account', account);
          this.state.set('operations', ops);
          operations.push('debit');
          
          return { debited: debitAmount };
        },
        function() {
          // Operation 2: Transfer (will fail)
          const account = this.state.get('account');
          const ops = this.state.get('operations');
          
          try {
            const transferAmount = 80; // Will exceed balance
            
            if (account.balance < transferAmount) {
              throw new Error('Insufficient funds');
            }
            
            account.balance -= transferAmount;
            ops.push({
              type: 'transfer',
              amount: transferAmount,
              compensate: () => { account.balance += transferAmount; }
            });
            
            operations.push('transfer');
            return { transferred: transferAmount };
            
          } catch (error) {
            // Compensate all operations in reverse order
            operations.push('compensating');
            
            for (let i = ops.length - 1; i >= 0; i--) {
              // Apply compensation
              if (ops[i].type === 'debit') {
                account.balance += ops[i].compensationAmount;
              }
              operations.push(`compensated-${ops[i].type}`);
            }
            
            this.state.set('compensated', true);
            this.state.set('error', error.message);
            
            return { 
              error: error.message, 
              compensated: true,
              finalBalance: account.balance
            };
          }
        }
      ];

      const fm = FlowManager({ nodes });
      const steps = await fm.run();

      expect(steps).toHaveLength(3);
      expect(operations).toEqual(['debit', 'compensating', 'compensated-debit']);
      
      const result = steps[2].output.results[0];
      expect(result.error).toBe('Insufficient funds');
      expect(result.compensated).toBe(true);
      expect(result.finalBalance).toBe(100); // Original balance restored
    });

    test('can handle errors in loops with continuation', async () => {
      const results = [];
      
      const nodes = [
        function() {
          this.state.set('items', ['a', 'b', 'error', 'c', 'd']);
          this.state.set('processed', []);
          this.state.set('errors', []);
          return 'init';
        },
        function() {
          const items = this.state.get('items');
          const processed = this.state.get('processed');
          const errors = this.state.get('errors');
          
          // Process each item with error handling
          for (const item of items) {
            try {
              if (item === 'error') {
                throw new Error(`Failed to process ${item}`);
              }
              
              const result = item.toUpperCase();
              processed.push(result);
              results.push({ item, status: 'success', result });
              
            } catch (error) {
              errors.push({ item, error: error.message });
              results.push({ item, status: 'error', error: error.message });
              // Continue processing remaining items
            }
          }
          
          this.state.set('processed', processed);
          this.state.set('errors', errors);
          
          return {
            totalItems: items.length,
            successCount: processed.length,
            errorCount: errors.length
          };
        }
      ];

      const fm = FlowManager({ nodes });
      const steps = await fm.run();

      expect(steps).toHaveLength(2);
      
      const summary = steps[1].output.results[0];
      expect(summary.totalItems).toBe(5);
      expect(summary.successCount).toBe(4);
      expect(summary.errorCount).toBe(1);
      
      expect(results).toHaveLength(5);
      expect(results[2]).toEqual({
        item: 'error',
        status: 'error',
        error: 'Failed to process error'
      });
    });

    test('graceful degradation pattern', async () => {
      const nodes = [
        async function() {
          const services = {
            primary: async () => {
              throw new Error('Primary service down');
            },
            secondary: async () => {
              throw new Error('Secondary service down');
            },
            fallback: async () => {
              return { data: 'fallback data', degraded: true };
            }
          };
          
          // Try services in order of preference
          for (const [name, service] of Object.entries(services)) {
            try {
              const result = await service();
              return { ...result, service: name };
            } catch (error) {
              this.state.set(`${name}Error`, error.message);
              
              // Continue to next service
              if (name === 'fallback') {
                // Last resort failed
                throw new Error('All services failed');
              }
            }
          }
        }
      ];

      const fm = FlowManager({ nodes });
      const steps = await fm.run();

      expect(steps).toHaveLength(1);
      expect(steps[0].output.results[0]).toEqual({
        data: 'fallback data',
        degraded: true,
        service: 'fallback'
      });
      
      // Check that errors were recorded
      // Verify service tried fallback and succeeded
      expect(steps[0].output.results[0].service).toBe('fallback');
      expect(steps[0].output.results[0].degraded).toBe(true);
    });
  });
});