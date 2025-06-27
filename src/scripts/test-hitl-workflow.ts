import { initializeFlowEngine } from '../lib/flow-engine/init.js';
import { FlowManager } from '../lib/flow-engine/core/FlowManager.js';
import { nodeRegistry, flowHub } from '../lib/flow-engine/singletons.js';
import simpleFunctions from '../lib/flow-engine/utils/simple-functions.js';

async function testHITLWorkflow() {
  console.log('Testing Human-in-the-Loop workflow...\n');

  // Initialize flow engine
  await initializeFlowEngine();

  const workflow = [
    { log: { message: "Step 1: Starting human-in-the-loop workflow" } },
    { "human.input.text": { 
      prompt: "Please enter some text to convert to uppercase:",
      placeholder: "Type your text here...",
      defaultValue: ""
    } },
    {
      "submitted": [
        { "text.transform.uppercase": { text: "${state.lastHumanInput}" } },
        { log: { message: "Converted to uppercase: ${state.lastUppercaseText}" } }
      ],
      "cancelled": { log: { message: "User cancelled input" } }
    },
    { identity: { value: { 
      message: "Human-in-the-loop workflow completed!",
      userInput: "${state.lastHumanInput}",
      uppercaseResult: "${state.lastUppercaseText}"
    } } }
  ];

  // Get scope with simple functions
  const scope = nodeRegistry.getScope();
  Object.assign(scope, simpleFunctions);

  console.log('Scope has log function:', typeof scope.log);
  console.log('Scope has human.input.text:', !!scope['human.input.text']);
  console.log('Scope has text.transform.uppercase:', !!scope['text.transform.uppercase']);

  // Set up event listeners
  flowHub.addEventListener('flowPaused', (data) => {
    console.log('\n🔵 FLOW PAUSED - Human input required!');
    console.log('Pause details:', data);
    
    // Simulate user input after 2 seconds
    setTimeout(() => {
      console.log('\n✅ Simulating user input: "Hello World"');
      flowHub.resume(data.pauseId, { value: "Hello World" });
    }, 2000);
  });

  flowHub.addEventListener('flowResumed', (data) => {
    console.log('\n🟢 FLOW RESUMED');
    console.log('Resume data:', data);
  });

  try {
    const fm = FlowManager({
      nodes: workflow,
      initialState: { testData: "Hello", timestamp: new Date().toISOString() },
      instanceId: 'test-hitl-' + Date.now(),
      scope: scope
    });

    console.log('\n▶️  Starting workflow execution...\n');
    const result = await fm.run();
    console.log('\n✅ Workflow completed!');
    console.log('Final state:', fm.getStateManager().getState());
  } catch (error) {
    console.error('❌ Workflow execution failed:', error);
  }
}

testHITLWorkflow().catch(console.error);