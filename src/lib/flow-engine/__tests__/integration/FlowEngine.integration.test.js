import { FlowManager } from '../../core/FlowManager.js';
import { NodeRegistry } from '../../core/NodeRegistry.js';
import FlowHub from '../../core/FlowHub.js';

// Mock implementations for testing
const mockNodes = {
  // Data fetching nodes
  'data.fetch.api': {
    id: 'data.fetch.api',
    name: 'Fetch API Data',
    implementation: async function(params) {
      // Mock API call
      return {
        userId: params.userId || 1,
        userName: 'John Doe',
        email: 'john@example.com',
        posts: [
          { id: 1, title: 'First Post', views: 150 },
          { id: 2, title: 'Second Post', views: 250 },
          { id: 3, title: 'Third Post', views: 50 }
        ]
      };
    }
  },

  // Data transformation nodes
  'data.transform.filter': {
    id: 'data.transform.filter',
    name: 'Filter Data',
    implementation: function(params) {
      const { data, field, operator, value } = params;
      if (!Array.isArray(data)) return data;
      
      return data.filter(item => {
        switch(operator) {
          case '>': return item[field] > value;
          case '<': return item[field] < value;
          case '>=': return item[field] >= value;
          case '<=': return item[field] <= value;
          case '==': return item[field] == value;
          case '!=': return item[field] != value;
          default: return true;
        }
      });
    }
  },

  'data.transform.map': {
    id: 'data.transform.map',
    name: 'Map Data',
    implementation: function(params) {
      const { data, transform } = params;
      if (!Array.isArray(data)) return data;
      
      return data.map(item => {
        const newItem = {};
        for (const [newKey, oldKey] of Object.entries(transform)) {
          newItem[newKey] = item[oldKey];
        }
        return newItem;
      });
    }
  },

  'data.aggregate.sum': {
    id: 'data.aggregate.sum',
    name: 'Sum Values',
    implementation: function(params) {
      const { data, field } = params;
      if (!Array.isArray(data)) return 0;
      
      return data.reduce((sum, item) => sum + (item[field] || 0), 0);
    }
  },

  // Communication nodes
  'comm.email.send': {
    id: 'comm.email.send',
    name: 'Send Email',
    implementation: async function(params) {
      // Mock email sending
      return {
        success: true,
        messageId: 'mock-' + Date.now(),
        to: params.to,
        subject: params.subject,
        body: params.body
      };
    }
  },

  'comm.slack.post': {
    id: 'comm.slack.post',
    name: 'Post to Slack',
    implementation: async function(params) {
      // Mock Slack posting
      return {
        success: true,
        channel: params.channel,
        message: params.message,
        timestamp: Date.now()
      };
    }
  },

  // Decision nodes
  'logic.condition.check': {
    id: 'logic.condition.check',
    name: 'Check Condition',
    implementation: function(params) {
      const { value, operator, threshold } = params;
      let result = false;
      
      switch(operator) {
        case '>': result = value > threshold; break;
        case '<': result = value < threshold; break;
        case '>=': result = value >= threshold; break;
        case '<=': result = value <= threshold; break;
        case '==': result = value == threshold; break;
        case '!=': result = value != threshold; break;
      }
      
      return { edges: result ? ['true'] : ['false'] };
    }
  },

  // Utility nodes
  'utils.delay': {
    id: 'utils.delay',
    name: 'Delay Execution',
    implementation: async function(params) {
      await new Promise(resolve => setTimeout(resolve, params.ms || 100));
      return { delayed: true, ms: params.ms || 100 };
    }
  },

  'utils.format.template': {
    id: 'utils.format.template',
    name: 'Format Template',
    implementation: function(params) {
      let { template, data } = params;
      
      // Replace placeholders in template
      for (const [key, value] of Object.entries(data)) {
        template = template.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }
      
      return template;
    }
  }
};

describe('FlowEngine Integration Tests', () => {
  beforeEach(() => {
    // Clear FlowHub before each test
    const pauses = FlowHub.getActivePauses();
    pauses.forEach(pause => FlowHub.cancelPause(pause.pauseId));
  });

  describe('Real-World Scenario: Data Processing Pipeline', () => {
    test('should fetch, filter, transform and aggregate data', async () => {
      const workflow = {
        nodes: [
          // 1. Fetch user data from API
          { 'data.fetch.api': { userId: 123 } },
          
          // 2. Store user data in state
          function() {
            this.state.set('userData', this.input);
            this.state.set('posts', this.input.posts);
            return 'data stored';
          },
          
          // 3. Filter posts with more than 100 views
          { 'data.transform.filter': { 
            data: '${posts}', 
            field: 'views', 
            operator: '>', 
            value: 100 
          }},
          
          // 4. Transform the filtered posts
          function() {
            // Store filtered posts first
            this.state.set('filteredPosts', this.input);
            return this.input;
          },
          
          { 'data.transform.map': {
            data: '${filteredPosts}',
            transform: {
              postTitle: 'title',
              viewCount: 'views'
            }
          }},
          
          // 5. Store transformed posts
          function() {
            this.state.set('popularPosts', this.input);
            return this.input;
          },
          
          // 6. Calculate total views
          { 'data.aggregate.sum': {
            data: '${popularPosts}',
            field: 'viewCount'
          }},
          
          // 7. Create report
          function() {
            const popularPosts = this.state.get('popularPosts') || [];
            return {
              user: this.state.get('userData.userName'),
              email: this.state.get('userData.email'),
              popularPostsCount: popularPosts.length,
              totalPopularViews: this.input,
              popularPosts: popularPosts
            };
          }
        ],
        scope: mockNodes
      };

      const fm = FlowManager(workflow);
      const steps = await fm.run();

      // Verify the pipeline executed correctly
      expect(steps).toHaveLength(8); // Added one more step
      
      // Check final output
      const report = steps[7].output.results[0];
      expect(report.user).toBe('John Doe');
      expect(report.email).toBe('john@example.com');
      expect(report.popularPostsCount).toBe(2); // Posts with >100 views
      expect(report.totalPopularViews).toBe(400); // 150 + 250
      expect(report.popularPosts).toHaveLength(2);
      expect(report.popularPosts[0].postTitle).toBe('First Post');
      expect(report.popularPosts[1].postTitle).toBe('Second Post');
    });
  });

  describe('Real-World Scenario: Conditional Notification System', () => {
    test('should send different notifications based on conditions', async () => {
      const workflow = {
        nodes: [
          // 1. Simulate incoming data
          function() {
            return {
              metric: 'server_cpu_usage',
              value: 85,
              timestamp: Date.now(),
              server: 'prod-server-01'
            };
          },

          // 2. Store alert data
          function() {
            this.state.set('alert', this.input);
            return this.input.value;
          },

          // 3. Check if critical (>80%)
          function() {
            const value = this.input;
            const threshold = 80;
            
            if (value > threshold) {
              return { edges: ['true'] };
            } else {
              return { edges: ['false'] };
            }
          },

          // 4. Branch based on criticality
          {
            'true': [
              // Critical path - send email and Slack
              { 'utils.format.template': {
                template: 'CRITICAL ALERT: {{metric}} on {{server}} is at {{value}}%',
                data: '${alert}'
              }},
              
              function() {
                this.state.set('criticalMessage', this.input);
                return this.input;
              },
              
              // Send notifications sequentially to ensure predictable output
              { 'comm.email.send': {
                to: 'ops@company.com',
                subject: 'Critical Server Alert',
                body: '${criticalMessage}'
              }},
              
              function() {
                this.state.set('emailSent', this.input);
                return this.input;
              },
              
              { 'comm.slack.post': {
                channel: '#alerts-critical',
                message: '${criticalMessage}'
              }},
              
              function() {
                // Combine both notification results
                return [this.state.get('emailSent'), this.input];
              }
            ],
            'false': [
              // Non-critical path - just log
              { 'utils.format.template': {
                template: 'Info: {{metric}} on {{server}} is at {{value}}%',
                data: '${alert}'
              }},
              
              function() {
                console.log('Non-critical alert:', this.input);
                return { logged: true };
              }
            ]
          },

          // 5. Final status
          function() {
            return {
              alertProcessed: true,
              wasCritical: this.state.get('criticalMessage') !== undefined,
              notifications: this.input
            };
          }
        ],
        scope: mockNodes
      };

      const fm = FlowManager(workflow);
      const steps = await fm.run();

      // Verify execution path
      const finalStatus = steps[4].output.results[0];
      expect(finalStatus.alertProcessed).toBe(true);
      expect(finalStatus.wasCritical).toBe(true);
      
      // Check that both email and Slack were sent (parallel execution)
      expect(finalStatus.notifications).toHaveLength(2);
      expect(finalStatus.notifications[0].success).toBe(true);
      expect(finalStatus.notifications[0].to).toBe('ops@company.com');
      expect(finalStatus.notifications[1].success).toBe(true);
      expect(finalStatus.notifications[1].channel).toBe('#alerts-critical');
    });

    test('should handle non-critical alerts differently', async () => {
      const workflow = {
        nodes: [
          // 1. Simulate non-critical data
          function() {
            return {
              metric: 'server_cpu_usage',
              value: 45,
              timestamp: Date.now(),
              server: 'dev-server-01'
            };
          },

          // 2. Store alert data
          function() {
            this.state.set('alert', this.input);
            return this.input.value;
          },

          // 3. Check if critical (>80%)
          function() {
            const value = this.input;
            const threshold = 80;
            
            if (value > threshold) {
              return { edges: ['true'] };
            } else {
              return { edges: ['false'] };
            }
          },

          // 4. Same branch structure as above
          {
            'true': [
              { 'utils.format.template': {
                template: 'CRITICAL ALERT: {{metric}} on {{server}} is at {{value}}%',
                data: '${alert}'
              }},
              function() {
                this.state.set('criticalMessage', this.input);
                return this.input;
              },
              [
                { 'comm.email.send': {
                  to: 'ops@company.com',
                  subject: 'Critical Server Alert',
                  body: '${criticalMessage}'
                }},
                { 'comm.slack.post': {
                  channel: '#alerts-critical',
                  message: '${criticalMessage}'
                }}
              ]
            ],
            'false': [
              { 'utils.format.template': {
                template: 'Info: {{metric}} on {{server}} is at {{value}}%',
                data: '${alert}'
              }},
              function() {
                return { logged: true, message: this.input };
              }
            ]
          },

          // 5. Final status
          function() {
            return {
              alertProcessed: true,
              wasCritical: this.state.get('criticalMessage') !== undefined,
              result: this.input
            };
          }
        ],
        scope: mockNodes
      };

      const fm = FlowManager(workflow);
      const steps = await fm.run();

      // Verify non-critical path was taken
      const finalStatus = steps[4].output.results[0];
      expect(finalStatus.alertProcessed).toBe(true);
      expect(finalStatus.wasCritical).toBe(false);
      expect(finalStatus.result.logged).toBe(true);
      expect(finalStatus.result.message).toContain('Info: server_cpu_usage on dev-server-01 is at 45%');
    });
  });

  describe('Real-World Scenario: Batch Processing with Error Handling', () => {
    test('should process items in batches with retry logic', async () => {
      let processAttempts = {};

      const batchProcessor = {
        'batch.process.item': {
          id: 'batch.process.item',
          name: 'Process Batch Item',
          implementation: async function(params) {
            const { itemId, forceError } = params;
            const attemptKey = `item_${itemId}`;
            processAttempts[attemptKey] = (processAttempts[attemptKey] || 0) + 1;

            // Simulate random errors on first attempt for some items
            if (forceError && processAttempts[attemptKey] === 1) {
              throw new Error(`Processing failed for item ${itemId}`);
            }

            // Simulate processing
            await new Promise(resolve => setTimeout(resolve, 10));
            
            return {
              itemId,
              processed: true,
              attempts: processAttempts[attemptKey],
              result: `Item ${itemId} processed successfully`
            };
          }
        }
      };

      const workflow = {
        nodes: [
          // 1. Initialize batch data
          function() {
            const items = [
              { id: 1, data: 'Item 1', shouldFail: false },
              { id: 2, data: 'Item 2', shouldFail: true },  // Will fail first time
              { id: 3, data: 'Item 3', shouldFail: false },
              { id: 4, data: 'Item 4', shouldFail: true },  // Will fail first time
              { id: 5, data: 'Item 5', shouldFail: false }
            ];
            
            this.state.set('items', items);
            this.state.set('processed', []);
            this.state.set('failed', []);
            this.state.set('currentIndex', 0);
            
            return items;
          },

          // 2. Process items in a loop
          [[
            // Loop controller
            function() {
              const items = this.state.get('items');
              const currentIndex = this.state.get('currentIndex');
              
              if (currentIndex >= items.length) {
                return { edges: ['exit'] };
              }
              
              const currentItem = items[currentIndex];
              this.state.set('currentItem', currentItem);
              this.state.set('currentIndex', currentIndex + 1);
              
              return { 
                edges: ['continue'], 
                results: [currentItem]
              };
            },
            
            // Process current item with error handling
            async function() {
              const item = this.state.get('currentItem');
              const maxRetries = 2;
              let lastError = null;
              
              for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                  const scope = { 'batch.process.item': batchProcessor['batch.process.item'] };
                  const processFM = FlowManager({
                    nodes: [
                      { 'batch.process.item': { 
                        itemId: item.id, 
                        forceError: item.shouldFail 
                      }}
                    ],
                    scope: scope
                  });
                  
                  const result = await processFM.run();
                  const processed = result[0].output.results[0];
                  
                  // Success - add to processed list
                  const processedList = this.state.get('processed');
                  processedList.push(processed);
                  this.state.set('processed', processedList);
                  
                  return { success: true, item: processed };
                  
                } catch (error) {
                  lastError = error;
                  if (attempt < maxRetries) {
                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, 50));
                  }
                }
              }
              
              // Failed after all retries
              const failedList = this.state.get('failed');
              failedList.push({ item, error: lastError.message });
              this.state.set('failed', failedList);
              
              return { success: false, item, error: lastError.message };
            }
          ]],

          // 3. Generate summary report
          function() {
            const processed = this.state.get('processed');
            const failed = this.state.get('failed');
            
            return {
              totalItems: this.state.get('items').length,
              successCount: processed.length,
              failureCount: failed.length,
              successRate: (processed.length / this.state.get('items').length * 100).toFixed(2) + '%',
              processedItems: processed,
              failedItems: failed,
              // Items that needed retry (attempts > 1)
              retriedItems: processed.filter(p => p.attempts > 1).map(p => ({
                itemId: p.itemId,
                attempts: p.attempts
              }))
            };
          }
        ],
        scope: { ...mockNodes, ...batchProcessor }
      };

      const fm = FlowManager(workflow);
      const steps = await fm.run();

      // Verify batch processing results
      const summary = steps[2].output.results[0];
      
      expect(summary.totalItems).toBe(5);
      expect(summary.successCount).toBe(5); // All should succeed with retry
      expect(summary.failureCount).toBe(0);
      expect(summary.successRate).toBe('100.00%');
      expect(summary.retriedItems).toHaveLength(2); // Items 2 and 4 needed retry
      expect(summary.retriedItems[0].attempts).toBe(2);
      expect(summary.retriedItems[1].attempts).toBe(2);
    });
  });

  describe('Real-World Scenario: Event-Driven Workflow Coordination', () => {
    test('should coordinate multiple workflows using events', async () => {
      // Workflow 1: Data Producer
      const producerWorkflow = {
        nodes: [
          // Generate data
          function() {
            const data = [];
            for (let i = 1; i <= 5; i++) {
              data.push({
                id: i,
                value: Math.floor(Math.random() * 100),
                timestamp: Date.now() + i
              });
            }
            this.state.set('producedData', data);
            return data;
          },
          
          // Emit data ready event
          async function() {
            await this.emit('dataReady', {
              source: 'producer',
              data: this.input,
              count: this.input.length
            });
            return { emitted: true };
          }
        ],
        scope: mockNodes
      };

      // Workflow 2: Data Processor
      const processorWorkflow = {
        nodes: [
          // Listen for data
          function() {
            return new Promise((resolve) => {
              this.on('dataReady', (eventData) => {
                this.state.set('receivedData', eventData.data);
                resolve({ received: true, count: eventData.count });
              });
              
              // Timeout after 1 second
              setTimeout(() => resolve({ received: false }), 1000);
            });
          },
          
          // Process received data
          function() {
            const data = this.state.get('receivedData');
            if (!data) return { error: 'No data received' };
            
            // Calculate statistics
            const values = data.map(d => d.value);
            const sum = values.reduce((a, b) => a + b, 0);
            const avg = sum / values.length;
            const max = Math.max(...values);
            const min = Math.min(...values);
            
            return {
              stats: { sum, avg, max, min },
              processedCount: data.length
            };
          },
          
          // Emit processing complete
          async function() {
            await this.emit('processingComplete', {
              source: 'processor',
              results: this.input
            });
            return this.input;
          }
        ],
        scope: mockNodes
      };

      // Workflow 3: Result Aggregator
      const aggregatorWorkflow = {
        nodes: [
          // Listen for both events
          function() {
            const events = {
              dataReady: null,
              processingComplete: null
            };
            
            return new Promise((resolve) => {
              this.on('dataReady', (data) => {
                events.dataReady = data;
                if (events.processingComplete) resolve(events);
              });
              
              this.on('processingComplete', (data) => {
                events.processingComplete = data;
                if (events.dataReady) resolve(events);
              });
              
              // Timeout
              setTimeout(() => resolve(events), 1500);
            });
          },
          
          // Generate final report
          function() {
            const { dataReady, processingComplete } = this.input;
            
            return {
              workflow: 'aggregator',
              dataProduced: dataReady ? dataReady.count : 0,
              processingResults: processingComplete ? processingComplete.results : null,
              allWorkflowsCompleted: !!(dataReady && processingComplete)
            };
          }
        ],
        scope: mockNodes
      };

      // Run workflows in parallel
      const [producer, processor, aggregator] = await Promise.all([
        FlowManager(producerWorkflow).run(),
        FlowManager(processorWorkflow).run(),
        FlowManager(aggregatorWorkflow).run()
      ]);

      // Verify coordination
      expect(producer).toHaveLength(2);
      expect(processor).toHaveLength(3);
      expect(aggregator).toHaveLength(2);

      const aggregatorResult = aggregator[1].output.results[0];
      expect(aggregatorResult.allWorkflowsCompleted).toBe(true);
      expect(aggregatorResult.dataProduced).toBe(5);
      expect(aggregatorResult.processingResults.processedCount).toBe(5);
      expect(aggregatorResult.processingResults.stats).toBeDefined();
    });
  });
});