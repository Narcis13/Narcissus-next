import FlowManager from '../core/FlowManager.js';
import StateManager from '../core/StateManager.js';
import '../nodes/utility/index.js'; // Import utility nodes to register them

console.log('🧪 Testing Utility Nodes\n');

// Test Email Send Node
async function testEmailSend() {
    console.log('📧 Testing Email Send Node...\n');
    
    const stateManager = new StateManager();
    stateManager.set('resend_api_key', 'test_api_key_12345');
    
    const emailWorkflow = [
        // Set up email data
        function() {
            console.log('Setting up email data...');
            this.state.set('emailData', {
                to: ['user@example.com', 'admin@example.com'],
                subject: 'Test Email from Flow Engine',
                html: '<h1>Hello!</h1><p>This is a test email from the flow engine.</p>',
                text: 'Hello! This is a test email from the flow engine.'
            });
            return this.state.get('emailData');
        },
        
        // Send email (will fail with test API key, but demonstrates usage)
        { "utility.email.send": {
            apiKey: "${resend_api_key}",
            from: "noreply@flowengine.com",
            to: "${emailData.to}",
            subject: "${emailData.subject}",
            html: "${emailData.html}",
            text: "${emailData.text}",
            tags: { workflow: "test", environment: "development" }
        }},
        
        // Handle result
        {
            "sent": function() {
                console.log('✅ Email sent successfully!');
                console.log('Email ID:', this.input.id);
                console.log('Recipients:', this.input.to);
                return this.input;
            },
            "error": function() {
                console.log('❌ Email failed to send (expected with test API key)');
                console.log('Error:', this.input.error);
                return this.input;
            }
        }
    ];
    
    const flowManager = new FlowManager();
    await flowManager.executeWorkflow(emailWorkflow, null, stateManager);
    console.log('\n' + '─'.repeat(50) + '\n');
}

// Test Database Query Node
async function testDatabaseQuery() {
    console.log('🗄️  Testing Database Query Node...\n');
    
    const stateManager = new StateManager();
    // Using a test connection string (will fail but demonstrates usage)
    stateManager.set('database_url', 'postgresql://user:pass@localhost:5432/testdb');
    
    const dbWorkflow = [
        // Test SELECT query
        { "utility.database.query": {
            connectionString: "${database_url}",
            query: "SELECT id, name, email FROM users WHERE status = $1 LIMIT $2",
            params: ["active", 10],
            queryType: "select"
        }},
        
        {
            "success": function() {
                console.log('✅ Query executed successfully!');
                console.log('Rows returned:', this.input.rowCount);
                console.log('Execution time:', this.input.executionTime + 'ms');
                return this.input;
            },
            "error": function() {
                console.log('❌ Query failed (expected without real database)');
                console.log('Error:', this.input.error);
                console.log('Error code:', this.input.code);
                return this.input;
            }
        },
        
        // Test INSERT with transaction
        { "utility.database.query": {
            connectionString: "${database_url}",
            query: "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id",
            params: ["John Doe", "john@example.com"],
            queryType: "insert",
            transaction: true
        }},
        
        {
            "success": function() {
                console.log('\n✅ Insert executed successfully!');
                console.log('Inserted ID:', this.input.insertedId);
                return this.input;
            },
            "error": function() {
                console.log('\n❌ Insert failed (expected without real database)');
                console.log('Error:', this.input.error);
                return this.input;
            }
        }
    ];
    
    const flowManager = new FlowManager();
    await flowManager.executeWorkflow(dbWorkflow, null, stateManager);
    console.log('\n' + '─'.repeat(50) + '\n');
}

// Test Enhanced Debug Node
async function testEnhancedDebug() {
    console.log('🐛 Testing Enhanced Debug Node...\n');
    
    const stateManager = new StateManager();
    stateManager.set('user', { id: 123, name: 'John Doe', role: 'admin' });
    stateManager.set('order', { id: 456, total: 99.99, items: 3 });
    
    const debugWorkflow = [
        // Basic debug log
        { "utility.debug.enhanced": {
            data: { message: "Starting workflow", timestamp: Date.now() },
            label: "Workflow Start",
            level: "info",
            mode: "log"
        }},
        
        // Inspect complex data
        function() {
            const complexData = {
                users: [
                    { id: 1, name: 'Alice', permissions: ['read', 'write'] },
                    { id: 2, name: 'Bob', permissions: ['read'] }
                ],
                settings: {
                    theme: 'dark',
                    notifications: { email: true, push: false }
                }
            };
            
            this.state.set('complexData', complexData);
            return complexData;
        },
        
        { "utility.debug.enhanced": {
            data: "${complexData}",
            label: "Complex Data Inspection",
            level: "debug",
            mode: "inspect",
            inspectDepth: 5,
            format: "pretty"
        }},
        
        // Conditional debug (only logs for admin users)
        { "utility.debug.enhanced": {
            data: "${user}",
            label: "Admin User Check",
            level: "warn",
            mode: "log",
            conditions: { path: "user.role", operator: "==", value: "admin" }
        }},
        
        // Capture specific state values
        { "utility.debug.enhanced": {
            label: "State Snapshot",
            level: "info",
            mode: "log",
            capture: ["user.id", "order.total", "complexData.settings.theme"],
            includeContext: true
        }},
        
        // Performance tracking
        { "utility.debug.enhanced": {
            label: "Performance Check",
            mode: "performance",
            includeState: false
        }},
        
        // Memory usage
        { "utility.debug.enhanced": {
            label: "Memory Usage",
            mode: "memory",
            format: "json"
        }},
        
        // Simulate a breakpoint
        { "utility.debug.enhanced": {
            data: { criticalValue: 42, status: "processing" },
            label: "Critical Section",
            mode: "breakpoint",
            level: "error"
        }},
        
        {
            "continue": function() {
                console.log('Debug continued normally');
                return this.input;
            },
            "break": function() {
                console.log('🔴 Breakpoint was hit!');
                console.log('Debug info:', JSON.stringify(this.input, null, 2));
                return this.input;
            }
        }
    ];
    
    const flowManager = new FlowManager();
    await flowManager.executeWorkflow(debugWorkflow, null, stateManager);
    console.log('\n' + '─'.repeat(50) + '\n');
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting Utility Node Tests\n');
    console.log('=' .repeat(50) + '\n');
    
    try {
        await testEmailSend();
        await testDatabaseQuery();
        await testEnhancedDebug();
        
        console.log('✅ All utility node tests completed!\n');
    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

// Run tests
runAllTests();