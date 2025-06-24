import { nodeRegistry, NodeValidator, TypeSystem } from './base';
import './examples/AddNumbersNode';
import './examples/ConditionalNode';

export function testNodeSystem() {
  console.log('Testing Node System...\n');
  
  // Test 1: Registry
  console.log('1. Node Registry:');
  const allNodes = nodeRegistry.getAll();
  console.log(`Total registered nodes: ${allNodes.length}`);
  allNodes.forEach(node => {
    console.log(`  - ${node.id}: ${node.name}`);
  });
  
  // Test 2: Search
  console.log('\n2. Search functionality:');
  const mathNodes = nodeRegistry.search('math');
  console.log(`Found ${mathNodes.length} math nodes`);
  
  const logicNodes = nodeRegistry.getByCategory('logic');
  console.log(`Found ${logicNodes.length} logic nodes`);
  
  // Test 3: Validation
  console.log('\n3. Node validation:');
  allNodes.forEach(node => {
    const validation = NodeValidator.validateNode(node);
    console.log(`  ${node.id}: ${validation.valid ? '✓' : '✗'}`);
    if (!validation.valid) {
      validation.errors.forEach(error => {
        console.log(`    Error: ${error.message}`);
      });
    }
    if (validation.warnings.length > 0) {
      validation.warnings.forEach(warning => {
        console.log(`    Warning: ${warning.message}`);
      });
    }
  });
  
  // Test 4: Type System
  console.log('\n4. Type System:');
  console.log(`Can convert string to number: ${TypeSystem.canConvert('string', 'number')}`);
  console.log(`Convert "123" to number: ${TypeSystem.convert("123", 'string', 'number')}`);
  
  const schema = TypeSystem.createSchema('number', {
    constraints: { min: 0, max: 100 }
  });
  const validationResult = TypeSystem.validateConstraints(50, schema);
  console.log(`Validate 50 with constraints [0-100]: ${validationResult.valid}`);
  
  // Test 5: AI Hints
  console.log('\n5. AI Hints search:');
  const aiSearchResults = nodeRegistry.searchByAIHints('add');
  console.log(`Found ${aiSearchResults.length} nodes matching "add" in AI hints`);
  aiSearchResults.forEach(node => {
    console.log(`  - ${node.id}: ${node.aiPromptHints?.summary}`);
  });
  
  console.log('\nNode system test complete!');
}

// Run the test
if (require.main === module) {
  testNodeSystem();
}