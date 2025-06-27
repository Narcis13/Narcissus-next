import { flowHub } from '../lib/flow-engine/singletons.js';

// Test script to verify human input functionality
async function testHumanInput() {
  console.log('Testing human input functionality...\n');

  // Check for active pauses
  const activePauses = flowHub.getActivePauses();
  console.log(`Active pauses: ${activePauses.length}`);
  
  if (activePauses.length > 0) {
    console.log('\nActive pause details:');
    activePauses.forEach((pause) => {
      console.log(`- Pause ID: ${pause.pauseId}`);
      console.log(`  Flow Instance: ${pause.flowInstanceId}`);
      console.log(`  Details:`, pause.details);
    });
    
    // Example: Resume the first pause with test data
    const firstPause = activePauses[0];
    console.log(`\nResuming pause ${firstPause.pauseId} with test value...`);
    
    const success = flowHub.resume(firstPause.pauseId, { value: 'Test input from script' });
    console.log(`Resume ${success ? 'successful' : 'failed'}`);
  } else {
    console.log('\nNo active pauses found.');
    console.log('Start a human-in-the-loop workflow first.');
  }
}

testHumanInput().catch(console.error);