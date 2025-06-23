import { TriggerManager } from '../../core/TriggerManager.js';
import { FlowManager } from '../../core/FlowManager.js';
import { NodeRegistry } from '../../core/NodeRegistry.js';
import FlowHub from '../../core/FlowHub.js';
import emailTriggerHandler from '../../triggers/types/emailTriggerHandler.js';
import eventTriggerHandler from '../../triggers/types/eventTriggerHandler.js';
import timeTriggerHandler from '../../triggers/types/timeTriggerHandler.js';

// Mock implementations for automation nodes
const automationNodes = {
    // Email processing nodes
    'email.parse': {
        id: 'email.parse',
        name: 'Parse Email',
        implementation: function(params) {
            const { email } = params;
            
            // Extract important parts
            const subjectMatch = email.subject.match(/Order #(\d+)/);
            const priorityMatch = email.subject.match(/\[(HIGH|URGENT|LOW)\]/);
            
            return {
                orderId: subjectMatch ? subjectMatch[1] : null,
                priority: priorityMatch ? priorityMatch[1] : 'NORMAL',
                from: email.from,
                subject: email.subject,
                body: email.body,
                hasAttachments: email.attachments?.length > 0
            };
        }
    },

    'email.reply': {
        id: 'email.reply',
        name: 'Send Email Reply',
        implementation: async function(params) {
            const { to, subject, body, inReplyTo } = params;
            
            // Simulate email sending
            await new Promise(resolve => setTimeout(resolve, 50));
            
            return {
                success: true,
                messageId: `reply-${Date.now()}`,
                to,
                subject,
                body,
                inReplyTo,
                sentAt: new Date().toISOString()
            };
        }
    },

    // Database/Storage nodes
    'db.query': {
        id: 'db.query',
        name: 'Database Query',
        implementation: async function(params) {
            const { query, parameters } = params;
            
            // Mock database queries
            if (query === 'SELECT * FROM orders WHERE id = ?') {
                return {
                    rows: [{
                        id: parameters[0],
                        customer: 'John Doe',
                        status: 'processing',
                        total: 299.99,
                        items: 3
                    }]
                };
            } else if (query === 'SELECT * FROM workflow_state WHERE workflow_id = ?') {
                // Return stored state from global mock storage
                const stateKey = `workflow_state_${parameters[0]}`;
                const state = globalThis.mockDbStorage?.[stateKey] || null;
                return { rows: state ? [state] : [] };
            }
            
            return { rows: [] };
        }
    },

    'db.update': {
        id: 'db.update',
        name: 'Database Update',
        implementation: async function(params) {
            const { table, data, where } = params;
            
            // Mock state persistence in global storage
            if (table === 'workflow_state') {
                if (!globalThis.mockDbStorage) {
                    globalThis.mockDbStorage = {};
                }
                const stateKey = `workflow_state_${where.workflow_id}`;
                globalThis.mockDbStorage[stateKey] = data;
            }
            
            return {
                success: true,
                rowsAffected: 1,
                table,
                timestamp: new Date().toISOString()
            };
        }
    },

    // Notification nodes
    'notify.slack': {
        id: 'notify.slack',
        name: 'Send Slack Notification',
        implementation: async function(params) {
            const { channel, message, mentions } = params;
            
            return {
                success: true,
                channel,
                message,
                mentions,
                messageId: `slack-${Date.now()}`,
                timestamp: new Date().toISOString()
            };
        }
    },

    'notify.webhook': {
        id: 'notify.webhook',
        name: 'Call Webhook',
        implementation: async function(params) {
            const { url, method, payload, headers } = params;
            
            // Simulate webhook call
            await new Promise(resolve => setTimeout(resolve, 100));
            
            return {
                success: true,
                statusCode: 200,
                response: { received: true, processed: payload },
                timestamp: new Date().toISOString()
            };
        }
    },

    // Data sync nodes
    'sync.fetch': {
        id: 'sync.fetch',
        name: 'Fetch Data for Sync',
        implementation: async function(params) {
            const { source, lastSync } = params;
            
            // Simulate fetching changed data
            const changes = [];
            const numChanges = Math.floor(Math.random() * 5) + 1;
            
            for (let i = 0; i < numChanges; i++) {
                changes.push({
                    id: `item-${Date.now()}-${i}`,
                    type: ['create', 'update', 'delete'][Math.floor(Math.random() * 3)],
                    data: { value: Math.random() * 100 },
                    timestamp: new Date().toISOString()
                });
            }
            
            return {
                source,
                changes,
                count: changes.length,
                fetchedAt: new Date().toISOString()
            };
        }
    },

    'sync.apply': {
        id: 'sync.apply',
        name: 'Apply Sync Changes',
        implementation: async function(params) {
            const { target, changes } = params;
            
            // Simulate applying changes
            const results = changes.map(change => ({
                id: change.id,
                type: change.type,
                success: Math.random() > 0.1, // 90% success rate
                target
            }));
            
            return {
                target,
                applied: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                results,
                appliedAt: new Date().toISOString()
            };
        }
    }
};

// Create a mock NodeRegistry-like object for testing
function createMockNodeRegistry() {
    const nodes = new Map();
    
    return {
        register(nodeDefinition) {
            if (!nodeDefinition || !nodeDefinition.id || typeof nodeDefinition.implementation !== 'function') {
                return false;
            }
            nodes.set(nodeDefinition.id, nodeDefinition);
            return true;
        },
        
        get(nodeId) {
            return nodes.get(nodeId);
        },
        
        getScope() {
            const scope = {};
            for (const [nodeId, node] of nodes) {
                scope[nodeId] = node.implementation;
            }
            return scope;
        },
        
        getAll() {
            return Array.from(nodes.values());
        }
    };
}

describe('Trigger-Based Automation Integration Tests', () => {
    let nodeRegistry;
    let triggerManager;
    let activeFlows = [];

    beforeEach(() => {
        // Initialize components
        nodeRegistry = createMockNodeRegistry();
        
        // Clear mock database storage
        globalThis.mockDbStorage = {};
        
        // Register all automation nodes with proper structure
        Object.values(automationNodes).forEach(node => {
            nodeRegistry.register({
                id: node.id,
                name: node.name,
                implementation: node.implementation,
                description: `Test node: ${node.name}`
            });
        });

        // Create TriggerManager with the registry
        triggerManager = TriggerManager({ nodeRegistry });

        // Register trigger handlers
        triggerManager.addTriggerTypeHandler('email', emailTriggerHandler);
        triggerManager.addTriggerTypeHandler('event', eventTriggerHandler);
        triggerManager.addTriggerTypeHandler('time', timeTriggerHandler);

        // Track active flows for cleanup
        activeFlows = [];
        
        // Clear any pauses
        const pauses = FlowHub.getActivePauses();
        pauses.forEach(pause => FlowHub.cancelPause(pause.pauseId));
    });

    afterEach(async () => {
        // Deactivate all triggers
        if (triggerManager) {
            const activeTriggers = triggerManager.getActiveTriggerIds();
            for (const triggerId of activeTriggers) {
                await triggerManager.deactivate(triggerId);
            }
        }
    });

    describe('Email-Triggered Workflows', () => {
        test('should process customer support emails and auto-respond based on priority', async () => {
            const processedEmails = [];
            const sentReplies = [];

            // Define email processing workflow
            const emailWorkflow = {
                triggerId: 'customer-support-email',
                type: 'email',
                config: {
                    account: 'support@company.com',
                    folder: 'INBOX',
                    checkIntervalSeconds: 0.3 // Check every 300ms for testing
                },
                workflowNodes: [
                    // 1. Parse incoming email
                    { 'email.parse': { email: '${triggerEvent}' }},
                    
                    // 2. Store parsed data
                    function() {
                        this.state.set('emailData', this.input);
                        this.state.set('originalEmail', this.state.get('triggerEvent'));
                        processedEmails.push(this.input);
                        return this.input;
                    },
                    
                    // 3. Check priority and route
                    function() {
                        const { priority, orderId } = this.input;
                        
                        if (priority === 'URGENT' || priority === 'HIGH') {
                            return { edges: ['high-priority'] };
                        } else if (orderId) {
                            return { edges: ['order-related'] };
                        } else {
                            return { edges: ['standard'] };
                        }
                    },
                    
                    // 4. Handle different paths
                    {
                        'high-priority': [
                            // Notify team immediately
                            { 'notify.slack': {
                                channel: '#urgent-support',
                                message: 'High priority support email: ${emailData.subject}',
                                mentions: ['@support-team']
                            }},
                            
                            // Send immediate acknowledgment
                            { 'email.reply': {
                                to: '${originalEmail.from}',
                                subject: 'Re: ${originalEmail.subject}',
                                body: 'Thank you for contacting us. This is a high-priority issue and our team has been notified. We will respond within 1 hour.',
                                inReplyTo: '${originalEmail.id}'
                            }},
                            
                            function() {
                                sentReplies.push(this.input);
                                return { handled: 'high-priority', reply: this.input };
                            }
                        ],
                        
                        'order-related': [
                            // Look up order details
                            { 'db.query': {
                                query: 'SELECT * FROM orders WHERE id = ?',
                                parameters: ['${emailData.orderId}']
                            }},
                            
                            // Generate order-specific response
                            function() {
                                const orderData = this.input.rows[0];
                                const response = orderData ? 
                                    `Thank you for contacting us about Order #${orderData.id}. Current status: ${orderData.status}. Total: $${orderData.total}.` :
                                    'We could not find the order mentioned in your email.';
                                
                                this.state.set('orderResponse', response);
                                return response;
                            },
                            
                            // Send order status reply
                            { 'email.reply': {
                                to: '${originalEmail.from}',
                                subject: 'Re: ${originalEmail.subject}',
                                body: '${orderResponse}',
                                inReplyTo: '${originalEmail.id}'
                            }},
                            
                            function() {
                                sentReplies.push(this.input);
                                return { handled: 'order-related', reply: this.input };
                            }
                        ],
                        
                        'standard': [
                            // Send standard acknowledgment
                            { 'email.reply': {
                                to: '${originalEmail.from}',
                                subject: 'Re: ${originalEmail.subject}',
                                body: 'Thank you for contacting our support team. We have received your message and will respond within 24 hours.',
                                inReplyTo: '${originalEmail.id}'
                            }},
                            
                            function() {
                                sentReplies.push(this.input);
                                return { handled: 'standard', reply: this.input };
                            }
                        ]
                    }
                ],
                initialStateFunction: (emailEvent) => ({
                    triggerEvent: emailEvent,
                    processedAt: new Date().toISOString()
                })
            };

            // Register and activate the trigger
            expect(triggerManager.register(emailWorkflow)).toBe(true);
            expect(await triggerManager.activate(emailWorkflow.triggerId)).toBe(true);

            // Wait for emails to be processed
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Verify emails were processed
            expect(processedEmails.length).toBeGreaterThan(0);
            expect(sentReplies.length).toBe(processedEmails.length);

            // Check that different priority levels were handled
            const priorities = processedEmails.map(e => e.priority);
            expect(priorities).toContain('NORMAL');
            
            // Verify replies match the emails
            sentReplies.forEach((reply, index) => {
                expect(reply.success).toBe(true);
                expect(reply.to).toBe('sender@example.com');
                expect(reply.subject).toContain('Re:');
            });
        });
    });

    describe('Time-Based Scheduled Workflows', () => {
        test('should run data synchronization on a schedule with state persistence', async () => {
            const syncResults = [];
            let runCount = 0;

            // Define scheduled sync workflow
            const syncWorkflow = {
                triggerId: 'data-sync-schedule',
                type: 'time',
                config: {
                    intervalMs: 300, // Run every 300ms for testing
                    maxRuns: 3 // Run 3 times then stop
                },
                workflowNodes: [
                    // 1. Load previous sync state
                    { 'db.query': {
                        query: 'SELECT * FROM workflow_state WHERE workflow_id = ?',
                        parameters: ['data-sync-schedule']
                    }},
                    
                    // 2. Process state
                    function() {
                        const previousState = this.input.rows[0] || { runCount: 0, lastRun: null };
                        const currentRunCount = previousState.runCount + 1;
                        
                        this.state.set('previousState', previousState);
                        this.state.set('currentRun', currentRunCount);
                        
                        return {
                            runNumber: currentRunCount,
                            lastSync: previousState.lastRun
                        };
                    },
                    
                    // 3. Fetch data changes since last sync
                    { 'sync.fetch': {
                        source: 'primary-database',
                        lastSync: '${previousState.lastRun}'
                    }},
                    
                    // 4. Store fetch results
                    function() {
                        this.state.set('fetchResults', this.input);
                        return this.input;
                    },
                    
                    // 5. Apply changes to target
                    { 'sync.apply': {
                        target: 'secondary-database',
                        changes: '${fetchResults.changes}'
                    }},
                    
                    // 6. Update sync state
                    function() {
                        const syncResult = this.input;
                        const currentTime = new Date().toISOString();
                        const currentRun = this.state.get('currentRun');
                        const fetchResults = this.state.get('fetchResults');
                        
                        // Persist state
                        const newState = {
                            runCount: currentRun,
                            lastRun: currentTime,
                            lastSyncResult: {
                                fetched: fetchResults ? fetchResults.count : 0,
                                applied: syncResult.applied,
                                failed: syncResult.failed
                            }
                        };
                        
                        this.state.set(`workflow_state_data-sync-schedule`, newState);
                        this.state.set('persistedState', newState);
                        
                        return newState;
                    },
                    
                    // 7. Update database with new state
                    { 'db.update': {
                        table: 'workflow_state',
                        data: '${workflow_state_data-sync-schedule}',
                        where: { workflow_id: 'data-sync-schedule' }
                    }},
                    
                    // 8. Generate sync report
                    function() {
                        const persistedState = this.state.get('persistedState');
                        const report = {
                            runNumber: persistedState ? persistedState.runCount : this.state.get('currentRun'),
                            timestamp: new Date().toISOString(),
                            fetched: this.state.get('fetchResults'),
                            applied: this.input,  // The db.update result from previous step
                            stateUpdated: true
                        };
                        
                        syncResults.push(report);
                        return report;
                    }
                ]
            };

            // Register and activate
            expect(triggerManager.register(syncWorkflow)).toBe(true);
            expect(await triggerManager.activate(syncWorkflow.triggerId)).toBe(true);

            // Wait for scheduled runs
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Verify scheduled execution
            expect(syncResults.length).toBe(3); // Should run exactly 3 times
            
            // Verify state persistence between runs
            if (syncResults.length === 3) {
                // Check that run numbers are incremental
                expect(syncResults[0].runNumber).toBe(1);
                expect(syncResults[1].runNumber).toBe(2);
                expect(syncResults[2].runNumber).toBe(3);
                
                // Check all runs updated state
                syncResults.forEach(result => {
                    expect(result.stateUpdated).toBe(true);
                    expect(result.fetched.count).toBeGreaterThan(0);
                });
            }
        });

        test('should execute one-time scheduled tasks', async () => {
            const executionResults = [];
            
            // Schedule a task to run in 200ms
            const futureTime = new Date(Date.now() + 200);
            
            const scheduledWorkflow = {
                triggerId: 'one-time-task',
                type: 'time',
                config: {
                    runAt: futureTime
                },
                workflowNodes: [
                    // Generate report
                    function() {
                        const report = {
                            taskName: 'Daily Report Generation',
                            scheduledFor: this.state.get('triggerEvent.scheduledTime'),
                            executedAt: this.state.get('triggerEvent.executedAt'),
                            data: {
                                totalUsers: 1523,
                                activeToday: 234,
                                revenue: 45632.50
                            }
                        };
                        
                        executionResults.push(report);
                        return report;
                    },
                    
                    // Send report
                    { 'notify.webhook': {
                        url: 'https://api.company.com/reports',
                        method: 'POST',
                        payload: '${lastOutput}',
                        headers: { 'Content-Type': 'application/json' }
                    }}
                ]
            };

            // Register and activate
            expect(triggerManager.register(scheduledWorkflow)).toBe(true);
            expect(await triggerManager.activate(scheduledWorkflow.triggerId)).toBe(true);

            // Wait for scheduled execution
            await new Promise(resolve => setTimeout(resolve, 400));

            // Verify one-time execution
            expect(executionResults.length).toBe(1);
            expect(executionResults[0].taskName).toBe('Daily Report Generation');
            expect(new Date(executionResults[0].executedAt).getTime()).toBeGreaterThanOrEqual(futureTime.getTime());
        });
    });

    describe('Event-Based Triggers', () => {
        test('should respond to system events and trigger appropriate workflows', async () => {
            const eventResponses = [];

            // Define event-driven workflow
            const eventWorkflow = {
                triggerId: 'system-event-handler',
                type: 'event',
                config: {
                    eventName: 'start_the_flow'
                },
                workflowNodes: [
                    // Process event data
                    function() {
                        const eventData = this.state.get('triggerEvent');
                        this.state.set('eventType', eventData.type);
                        this.state.set('eventPayload', eventData.payload);
                        
                        return {
                            type: eventData.type,
                            payload: eventData.payload
                        };
                    },
                    
                    // Route based on event type
                    function() {
                        const eventType = this.state.get('eventType');
                        
                        switch(eventType) {
                            case 'user.signup':
                                return { edges: ['new-user'] };
                            case 'order.completed':
                                return { edges: ['order-complete'] };
                            case 'error.critical':
                                return { edges: ['critical-error'] };
                            default:
                                return { edges: ['unknown'] };
                        }
                    },
                    
                    // Handle different event types
                    {
                        'new-user': [
                            function() {
                                const userData = this.state.get('eventPayload');
                                eventResponses.push({
                                    type: 'new-user',
                                    action: 'welcome-email',
                                    user: userData
                                });
                                
                                return {
                                    action: 'send-welcome-email',
                                    to: userData.email,
                                    name: userData.name
                                };
                            }
                        ],
                        
                        'order-complete': [
                            function() {
                                const orderData = this.state.get('eventPayload');
                                eventResponses.push({
                                    type: 'order-complete',
                                    action: 'process-fulfillment',
                                    order: orderData
                                });
                                
                                return {
                                    action: 'initiate-shipping',
                                    orderId: orderData.id,
                                    items: orderData.items
                                };
                            }
                        ],
                        
                        'critical-error': [
                            { 'notify.slack': {
                                channel: '#alerts',
                                message: 'CRITICAL ERROR: ${eventPayload.message}',
                                mentions: ['@oncall']
                            }},
                            
                            function() {
                                eventResponses.push({
                                    type: 'critical-error',
                                    action: 'alert-sent',
                                    error: this.state.get('eventPayload')
                                });
                                return this.input;
                            }
                        ],
                        
                        'unknown': [
                            function() {
                                eventResponses.push({
                                    type: 'unknown',
                                    action: 'logged',
                                    event: this.state.get('triggerEvent')
                                });
                                return { logged: true };
                            }
                        ]
                    }
                ]
            };

            // Register and activate
            expect(triggerManager.register(eventWorkflow)).toBe(true);
            expect(await triggerManager.activate(eventWorkflow.triggerId)).toBe(true);

            // Emit different types of events
            FlowHub._emitEvent('start_the_flow', {
                type: 'user.signup',
                payload: { email: 'newuser@example.com', name: 'Jane Doe' }
            });

            FlowHub._emitEvent('start_the_flow', {
                type: 'order.completed',
                payload: { id: 'ORD-123', items: 3, total: 150.00 }
            });

            FlowHub._emitEvent('start_the_flow', {
                type: 'error.critical',
                payload: { message: 'Database connection lost', severity: 'critical' }
            });

            // Wait for event processing
            await new Promise(resolve => setTimeout(resolve, 500));

            // Verify all events were processed
            expect(eventResponses.length).toBe(3);
            
            // Check each event type was handled correctly
            const responseTypes = eventResponses.map(r => r.type);
            expect(responseTypes).toContain('new-user');
            expect(responseTypes).toContain('order-complete');
            expect(responseTypes).toContain('critical-error');
            
            // Verify appropriate actions were taken
            const newUserResponse = eventResponses.find(r => r.type === 'new-user');
            expect(newUserResponse.action).toBe('welcome-email');
            expect(newUserResponse.user.email).toBe('newuser@example.com');
        });
    });

    describe('Multiple Concurrent Automations', () => {
        test('should handle multiple triggers running simultaneously without conflicts', async () => {
            const results = {
                emailProcessed: [],
                syncCompleted: [],
                eventsHandled: []
            };

            // Email trigger
            const emailTrigger = {
                triggerId: 'concurrent-email',
                type: 'email',
                config: {
                    account: 'concurrent@test.com',
                    folder: 'INBOX',
                    checkIntervalSeconds: 0.3
                },
                workflowNodes: [
                    function() {
                        const email = this.state.get('triggerEvent');
                        results.emailProcessed.push({
                            id: email.id,
                            timestamp: Date.now()
                        });
                        return { processed: email.id };
                    }
                ]
            };

            // Time-based sync trigger
            const syncTrigger = {
                triggerId: 'concurrent-sync',
                type: 'time',
                config: {
                    intervalMs: 250,
                    maxRuns: 4
                },
                workflowNodes: [
                    function() {
                        const runInfo = this.state.get('triggerEvent');
                        results.syncCompleted.push({
                            run: runInfo.runNumber,
                            timestamp: Date.now()
                        });
                        return { synced: runInfo.runNumber };
                    }
                ]
            };

            // Event trigger
            const eventTrigger = {
                triggerId: 'concurrent-event',
                type: 'event',
                config: {
                    eventName: 'start_the_flow'
                },
                workflowNodes: [
                    function() {
                        const event = this.state.get('triggerEvent');
                        results.eventsHandled.push({
                            data: event.data,
                            timestamp: Date.now()
                        });
                        return { handled: event.data };
                    }
                ]
            };

            // Register and activate all triggers
            [emailTrigger, syncTrigger, eventTrigger].forEach(trigger => {
                expect(triggerManager.register(trigger)).toBe(true);
            });

            await Promise.all([
                triggerManager.activate(emailTrigger.triggerId),
                triggerManager.activate(syncTrigger.triggerId),
                triggerManager.activate(eventTrigger.triggerId)
            ]);

            // Generate events while other triggers are running
            setTimeout(() => FlowHub._emitEvent('start_the_flow', { data: 'event-1' }), 100);
            setTimeout(() => FlowHub._emitEvent('start_the_flow', { data: 'event-2' }), 300);
            setTimeout(() => FlowHub._emitEvent('start_the_flow', { data: 'event-3' }), 500);

            // Let all triggers run
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Verify all triggers executed independently
            expect(results.emailProcessed.length).toBeGreaterThan(0);
            expect(results.syncCompleted.length).toBe(4); // Exactly 4 runs
            expect(results.eventsHandled.length).toBe(3); // 3 events emitted

            // Verify no timing conflicts (all should have unique timestamps)
            const allTimestamps = [
                ...results.emailProcessed.map(r => r.timestamp),
                ...results.syncCompleted.map(r => r.timestamp),
                ...results.eventsHandled.map(r => r.timestamp)
            ];
            
            // Check that workflows didn't block each other
            const syncTimes = results.syncCompleted.map(r => r.timestamp);
            for (let i = 1; i < syncTimes.length; i++) {
                const interval = syncTimes[i] - syncTimes[i-1];
                // Should be approximately 250ms apart (allowing some variance)
                expect(interval).toBeGreaterThan(200);
                expect(interval).toBeLessThan(350);
            }
        });
    });

    describe('Event-Driven Workflow Coordination', () => {
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
                scope: automationNodes
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
                scope: automationNodes
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
                scope: automationNodes
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

    describe('Workflow Chains and Dependencies', () => {
        test('should trigger dependent workflows upon completion of primary workflows', async () => {
            const workflowExecutions = [];

            // Primary workflow - data processing
            const primaryWorkflow = {
                triggerId: 'primary-processor',
                type: 'time',
                config: {
                    intervalMs: 500,
                    maxRuns: 1
                },
                workflowNodes: [
                    // Process data
                    function() {
                        const data = {
                            batchId: `batch-${Date.now()}`,
                            items: [1, 2, 3, 4, 5].map(i => ({
                                id: i,
                                value: Math.random() * 100
                            }))
                        };
                        
                        this.state.set('processedData', data);
                        workflowExecutions.push({
                            workflow: 'primary',
                            batchId: data.batchId,
                            itemCount: data.items.length
                        });
                        
                        return data;
                    },
                    
                    // Emit completion event
                    async function() {
                        const data = this.input;
                        
                        // Trigger dependent workflows via FlowHub
                        FlowHub._emitEvent('workflow:completed', {
                            workflowId: 'primary-processor',
                            result: data,
                            nextWorkflows: ['secondary-analyzer', 'report-generator']
                        });
                        
                        // Also emit via FlowManager context for coordination test
                        await this.emit('workflow:completed', {
                            workflowId: 'primary-processor',
                            result: data,
                            nextWorkflows: ['secondary-analyzer', 'report-generator']
                        });
                        
                        return { emitted: true, batchId: data.batchId };
                    }
                ]
            };

            // Secondary workflow - triggered by primary completion
            const secondaryWorkflow = {
                triggerId: 'secondary-analyzer',
                type: 'event',
                config: {
                    eventName: 'workflow:completed'
                },
                workflowNodes: [
                    // Check if this workflow should run
                    function() {
                        const event = this.state.get('triggerEvent');
                        
                        if (event.nextWorkflows?.includes('secondary-analyzer')) {
                            this.state.set('primaryResult', event.result);
                            return { shouldProcess: true };
                        }
                        
                        return { edges: ['skip'] };
                    },
                    
                    // Analyze data from primary workflow
                    function() {
                        const data = this.state.get('primaryResult');
                        const analysis = {
                            batchId: data.batchId,
                            average: data.items.reduce((sum, item) => sum + item.value, 0) / data.items.length,
                            max: Math.max(...data.items.map(i => i.value)),
                            min: Math.min(...data.items.map(i => i.value))
                        };
                        
                        workflowExecutions.push({
                            workflow: 'secondary',
                            batchId: data.batchId,
                            analysis
                        });
                        
                        return analysis;
                    },
                    
                    // Trigger final workflow if threshold met
                    async function() {
                        const analysis = this.input;
                        
                        if (analysis.average > 50) {
                            FlowHub._emitEvent('workflow:threshold-exceeded', {
                                source: 'secondary-analyzer',
                                analysis,
                                action: 'notify-stakeholders'
                            });
                        }
                        
                        return { completed: true, analysis };
                    }
                ]
            };

            // Report generator - also triggered by primary
            const reportWorkflow = {
                triggerId: 'report-generator',
                type: 'event',
                config: {
                    eventName: 'workflow:completed'
                },
                workflowNodes: [
                    // Check if this workflow should run
                    function() {
                        const event = this.state.get('triggerEvent');
                        
                        if (event.nextWorkflows?.includes('report-generator')) {
                            this.state.set('dataToReport', event.result);
                            return { shouldGenerate: true };
                        }
                        
                        return { edges: ['skip'] };
                    },
                    
                    // Generate report
                    function() {
                        const data = this.state.get('dataToReport');
                        const report = {
                            title: `Processing Report - ${data.batchId}`,
                            timestamp: new Date().toISOString(),
                            summary: {
                                totalItems: data.items.length,
                                batchId: data.batchId
                            }
                        };
                        
                        workflowExecutions.push({
                            workflow: 'report',
                            batchId: data.batchId,
                            report
                        });
                        
                        return report;
                    }
                ]
            };

            // Notification workflow - triggered by threshold
            const notificationWorkflow = {
                triggerId: 'threshold-notifier',
                type: 'event',
                config: {
                    eventName: 'workflow:threshold-exceeded'
                },
                workflowNodes: [
                    function() {
                        const event = this.state.get('triggerEvent');
                        
                        workflowExecutions.push({
                            workflow: 'notification',
                            source: event.source,
                            action: event.action,
                            analysis: event.analysis
                        });
                        
                        return {
                            notified: true,
                            stakeholders: ['ops-team', 'management'],
                            reason: 'threshold-exceeded'
                        };
                    }
                ]
            };

            // Register all workflows
            const workflows = [primaryWorkflow, secondaryWorkflow, reportWorkflow, notificationWorkflow];
            workflows.forEach(wf => {
                expect(triggerManager.register(wf)).toBe(true);
            });

            // Activate all triggers
            await Promise.all(workflows.map(wf => 
                triggerManager.activate(wf.triggerId)
            ));

            // Wait for workflow chain to complete
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Verify workflow chain execution
            expect(workflowExecutions.length).toBeGreaterThanOrEqual(3); // Primary + Secondary + Report
            
            // Verify execution order
            const primary = workflowExecutions.find(e => e.workflow === 'primary');
            const secondary = workflowExecutions.find(e => e.workflow === 'secondary');
            const report = workflowExecutions.find(e => e.workflow === 'report');
            
            expect(primary).toBeDefined();
            expect(secondary).toBeDefined();
            expect(report).toBeDefined();
            
            // Verify they processed the same batch
            expect(secondary.batchId).toBe(primary.batchId);
            expect(report.batchId).toBe(primary.batchId);
            
            // Check if threshold notification was triggered
            const notification = workflowExecutions.find(e => e.workflow === 'notification');
            if (notification) {
                expect(notification.source).toBe('secondary-analyzer');
                expect(notification.action).toBe('notify-stakeholders');
            }
        });
    });

    describe('State Persistence and Recovery', () => {
        test('should maintain state across trigger deactivation and reactivation', async () => {
            // Use global to track states across workflow executions
            globalThis.testStates = {
                stateBeforeDeactivation: null,
                stateAfterReactivation: null
            };

            // Stateful workflow with counter
            const statefulWorkflow = {
                triggerId: 'stateful-counter',
                type: 'time',
                config: {
                    intervalMs: 200,
                    maxRuns: 5
                },
                workflowNodes: [
                    // Load or initialize counter
                    { 'db.query': {
                        query: 'SELECT * FROM workflow_state WHERE workflow_id = ?',
                        parameters: ['stateful-counter']
                    }},
                    
                    // Increment counter
                    function() {
                        const state = this.input.rows[0] || { counter: 0, history: [] };
                        const newCounter = state.counter + 1;
                        const timestamp = new Date().toISOString();
                        
                        const newState = {
                            counter: newCounter,
                            history: [...(state.history || []), { value: newCounter, timestamp }],
                            lastUpdate: timestamp
                        };
                        
                        this.state.set('currentState', newState);
                        
                        if (newCounter === 2) {
                            globalThis.testStates.stateBeforeDeactivation = { ...newState };
                        }
                        
                        return newState;
                    },
                    
                    // Persist state
                    { 'db.update': {
                        table: 'workflow_state',
                        data: '${currentState}',
                        where: { workflow_id: 'stateful-counter' }
                    }},
                    
                    // Check if we should deactivate
                    async function() {
                        const state = this.state.get('currentState');
                        
                        if (state.counter === 2) {
                            // Schedule reactivation
                            setTimeout(async () => {
                                // Reactivate the same trigger
                                await triggerManager.activate('stateful-counter');
                            }, 500);
                            
                            // Deactivate current trigger
                            await triggerManager.deactivate('stateful-counter');
                            
                            return { deactivated: true, at: state.counter };
                        }
                        
                        if (state.counter >= 4) {
                            globalThis.testStates.stateAfterReactivation = { ...state };
                        }
                        
                        return { continuing: true, counter: state.counter };
                    }
                ]
            };

            // Register and activate
            expect(triggerManager.register(statefulWorkflow)).toBe(true);
            expect(await triggerManager.activate(statefulWorkflow.triggerId)).toBe(true);

            // Wait for deactivation, reactivation, and completion
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Verify state persistence
            expect(globalThis.testStates.stateBeforeDeactivation).toBeDefined();
            expect(globalThis.testStates.stateAfterReactivation).toBeDefined();
            
            // Counter should continue from where it left off
            expect(globalThis.testStates.stateBeforeDeactivation.counter).toBe(2);
            expect(globalThis.testStates.stateAfterReactivation.counter).toBeGreaterThanOrEqual(4);
            
            // History should be preserved
            expect(globalThis.testStates.stateAfterReactivation.history.length).toBeGreaterThanOrEqual(4);
            expect(globalThis.testStates.stateAfterReactivation.history[0].value).toBe(1);
            expect(globalThis.testStates.stateAfterReactivation.history[1].value).toBe(2);
        });
    });
});