import { FlowManager } from '../core/FlowManager.js';
import { NodeRegistry } from '../core/NodeRegistry.js';
import allNodes from '../nodes/index.js';

// Register all nodes
allNodes.forEach(node => NodeRegistry.register(node));

// Get the scope for FlowManager
const scope = NodeRegistry.getScope();

async function testConditionalNode() {
    console.log('\n=== Testing Conditional Node ===');
    
    const workflow = [
        // Set initial value
        function() {
            this.state.set('temperature', 35);
            return { temperature: 35 };
        },
        // Use conditional node via parameterized call
        { "logic.condition.if": { 
            value: "${temperature}", 
            operator: ">", 
            compareValue: 30 
        }},
        // Branch based on result
        {
            "true": function() {
                console.log("Temperature is high! Turning on cooling.");
                return "cooling_on";
            },
            "false": function() {
                console.log("Temperature is normal.");
                return "cooling_off";
            }
        }
    ];
    
    const fm = FlowManager({ nodes: workflow, scope });
    const result = await fm.run();
    console.log('Final state:', fm.getStateManager().getState());
}

async function testLoopNode() {
    console.log('\n=== Testing Loop Node ===');
    
    const workflow = [
        // Loop that counts to 5
        [[
            { "logic.control.loop": { mode: "count", maxIterations: 5 }},
            function() {
                const index = this.input.index;
                console.log(`Loop iteration ${index + 1}`);
                this.state.set(`item_${index}`, `processed_${index}`);
                return { index };
            }
        ]]
    ];
    
    const fm = FlowManager({ nodes: workflow, scope });
    const result = await fm.run();
    console.log('Final state:', fm.getStateManager().getState());
}

async function testDataTransform() {
    console.log('\n=== Testing Data Transform ===');
    
    const workflow = [
        // Create initial data
        function() {
            const data = {
                users: [
                    { name: "Alice", age: 30, email: "alice@example.com" },
                    { name: "Bob", age: 25, email: "bob@example.com" },
                    { name: "Charlie", age: 35, email: "charlie@example.com" }
                ]
            };
            this.state.set('userData', data);
            return data;
        },
        // Extract user names
        { "data.transform.mapper": {
            data: "${userData.users}",
            operation: "map",
            config: { path: "name" }
        }},
        // Log the result
        function() {
            console.log("Extracted names:", this.input.result);
            return this.input;
        }
    ];
    
    const fm = FlowManager({ nodes: workflow, scope });
    const result = await fm.run();
}

async function testMergeNode() {
    console.log('\n=== Testing Merge Node ===');
    
    const workflow = [
        // Create data sources
        function() {
            const profile = { name: "John", age: 30 };
            const contact = { email: "john@example.com", phone: "123-456-7890" };
            const preferences = { theme: "dark", notifications: true };
            
            this.state.set('profile', profile);
            this.state.set('contact', contact);
            this.state.set('preferences', preferences);
            
            return { profile, contact, preferences };
        },
        // Merge data
        { "data.combine.merge": {
            source1: "${profile}",
            source2: "${contact}",
            additionalSources: ["${preferences}"],
            strategy: "deep"
        }},
        // Log merged result
        function() {
            console.log("Merged user data:", this.input.merged);
            return this.input;
        }
    ];
    
    const fm = FlowManager({ nodes: workflow, scope });
    const result = await fm.run();
}

async function testDelayNode() {
    console.log('\n=== Testing Delay Node ===');
    
    const workflow = [
        function() {
            console.log("Starting process...");
            return { startTime: Date.now() };
        },
        { "logic.control.delay": { 
            duration: 1000, 
            passThrough: { message: "After 1 second delay" }
        }},
        function() {
            console.log("Delay completed!", this.input.passThrough.message);
            console.log("Actual duration:", this.input.duration, "ms");
            return "done";
        }
    ];
    
    const fm = FlowManager({ nodes: workflow, scope });
    const result = await fm.run();
}

// Run all tests
async function runTests() {
    await testConditionalNode();
    await testLoopNode();
    await testDataTransform();
    await testMergeNode();
    await testDelayNode();
    
    console.log('\n=== All tests completed ===');
}

// Execute tests
runTests().catch(console.error);