import { initializeFlowEngine } from '../lib/flow-engine/init.js';
import { nodeRegistry } from '../lib/flow-engine/singletons.js';

async function checkNodes() {
  console.log('Initializing flow engine...');
  await initializeFlowEngine();
  
  const scope = nodeRegistry.getScope();
  console.log('Total nodes in scope:', Object.keys(scope).length);
  
  const humanNodes = Object.keys(scope).filter(k => k.includes('human'));
  const uppercaseNodes = Object.keys(scope).filter(k => k.includes('uppercase'));
  
  console.log('\nHuman nodes:', humanNodes);
  console.log('\nUppercase nodes:', uppercaseNodes);
  
  // Check if nodes exist by ID
  const allNodes = nodeRegistry.getAll();
  console.log('\nTotal nodes in registry:', allNodes.length);
  
  const humanInputNode = allNodes.find(n => n.id === 'human.input.text');
  const uppercaseNode = allNodes.find(n => n.id === 'text.transform.uppercase');
  
  console.log('\nHuman input node found:', !!humanInputNode);
  console.log('Uppercase node found:', !!uppercaseNode);
  
  if (humanInputNode) {
    console.log('Human input node ID:', humanInputNode.id);
    console.log('Human input node name:', humanInputNode.name);
  }
  
  if (uppercaseNode) {
    console.log('Uppercase node ID:', uppercaseNode.id);
    console.log('Uppercase node name:', uppercaseNode.name);
  }
}

checkNodes().catch(console.error);