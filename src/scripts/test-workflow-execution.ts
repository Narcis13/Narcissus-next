import { FlowManager } from '../lib/flow-engine/core/FlowManager.js';
import { nodeRegistry } from '../lib/flow-engine/singletons.js';
import simpleFunctions from '../lib/flow-engine/utils/simple-functions.js';

async function testWorkflow() {
  console.log('Testing workflow execution...\n');

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
  console.log('Scope has human.input.text:', !!scope['human.input.text:Human Text Input']);
  console.log('Scope has text.transform.uppercase:', !!scope['text.transform.uppercase:Text to Uppercase']);

  try {
    const fm = FlowManager({
      nodes: workflow,
      initialState: { testData: "Hello", timestamp: new Date().toISOString() },
      instanceId: 'test-' + Date.now(),
      scope: scope
    });

    console.log('\nStarting workflow execution...');
    const result = await fm.run();
    console.log('\nWorkflow completed!');
    console.log('Result:', result);
    console.log('Final state:', fm.getStateManager().getState());
  } catch (error) {
    console.error('Workflow execution failed:', error);
  }
}

testWorkflow().catch(console.error);