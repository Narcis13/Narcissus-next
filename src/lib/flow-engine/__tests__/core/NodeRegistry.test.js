import { NodeRegistry } from '../../core/NodeRegistry.js';

describe('NodeRegistry', () => {
  beforeEach(() => {
    // Clear registry before each test
    NodeRegistry.getAll().forEach(node => {
      // NodeRegistry doesn't have a clear method, so we'll work with what we have
    });
  });

  describe('Node Registration', () => {
    test('should register a valid node definition', () => {
      const nodeDefinition = {
        id: 'test.node',
        name: 'Test Node',
        description: 'A test node for unit testing',
        implementation: function() { return 'test'; },
        categories: ['test'],
        tags: ['unit-test']
      };

      const result = NodeRegistry.register(nodeDefinition);
      
      expect(result).toBe(true);
      expect(NodeRegistry.get('test.node')).toEqual(nodeDefinition);
    });

    test('should reject invalid node definitions', () => {
      // Missing required fields
      expect(NodeRegistry.register({})).toBe(false);
      expect(NodeRegistry.register({ id: 'test' })).toBe(false);
      expect(NodeRegistry.register({ id: 'test', implementation: 'not a function' })).toBe(false);
      expect(NodeRegistry.register({ id: 'test', implementation: () => {}, description: null })).toBe(false);
    });

    test('should handle duplicate registrations', () => {
      const node1 = {
        id: 'duplicate.test',
        name: 'Original',
        description: 'Original node',
        implementation: function() { return 'original'; }
      };

      const node2 = {
        id: 'duplicate.test',
        name: 'Replacement',
        description: 'Replacement node',
        implementation: function() { return 'replacement'; }
      };

      NodeRegistry.register(node1);
      NodeRegistry.register(node2);

      const retrieved = NodeRegistry.get('duplicate.test');
      expect(retrieved.name).toBe('Replacement');
    });
  });

  describe('Node Retrieval', () => {
    test('should retrieve node by ID', () => {
      const node = {
        id: 'retrieve.test',
        name: 'Retrieve Test',
        description: 'Test retrieval',
        implementation: function() { return 'retrieved'; }
      };

      NodeRegistry.register(node);
      
      expect(NodeRegistry.get('retrieve.test')).toEqual(node);
      expect(NodeRegistry.get('non.existent')).toBeUndefined();
    });
  });

  describe('Node Discovery', () => {
    beforeEach(() => {
      // Register test nodes
      NodeRegistry.register({
        id: 'text.uppercase',
        name: 'Uppercase Text',
        description: 'Converts text to uppercase',
        implementation: function() { return 'UPPER'; },
        categories: ['text', 'transform'],
        tags: ['string', 'case', 'transformation'],
        inputs: [{ description: 'Text to convert' }],
        outputs: [{ description: 'Uppercased text' }]
      });

      NodeRegistry.register({
        id: 'text.lowercase',
        name: 'Lowercase Text',
        description: 'Converts text to lowercase',
        implementation: function() { return 'lower'; },
        categories: ['text', 'transform'],
        tags: ['string', 'case'],
        inputs: [{ description: 'Text to convert' }],
        outputs: [{ description: 'Lowercased text' }]
      });

      NodeRegistry.register({
        id: 'math.add',
        name: 'Add Numbers',
        description: 'Adds two numbers together',
        implementation: function() { return 'sum'; },
        categories: ['math', 'arithmetic'],
        tags: ['number', 'addition'],
        inputs: [{ description: 'First number' }, { description: 'Second number' }],
        outputs: [{ description: 'Sum of numbers' }]
      });
    });

    test('should find nodes by text search', () => {
      const results = NodeRegistry.find({ text: 'uppercase' });
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('text.uppercase');
    });

    test('should find nodes by categories', () => {
      const textNodes = NodeRegistry.find({ categories: ['text'] });
      expect(textNodes).toHaveLength(2);
      
      const transformNodes = NodeRegistry.find({ categories: ['transform'] });
      expect(transformNodes).toHaveLength(2);
      
      const mathNodes = NodeRegistry.find({ categories: ['math'] });
      expect(mathNodes).toHaveLength(1);
    });

    test('should find nodes by tags', () => {
      const caseNodes = NodeRegistry.find({ tags: ['case'] });
      expect(caseNodes).toHaveLength(2);
      
      const stringTransformNodes = NodeRegistry.find({ tags: ['string', 'case'] });
      expect(stringTransformNodes).toHaveLength(2);
    });

    test('should find nodes by input needs', () => {
      const textInputNodes = NodeRegistry.find({ inputNeeds: 'text to convert' });
      expect(textInputNodes).toHaveLength(2);
      
      const numberInputNodes = NodeRegistry.find({ inputNeeds: 'number' });
      expect(numberInputNodes).toHaveLength(1);
    });

    test('should find nodes by output provides', () => {
      const uppercaseOutputNodes = NodeRegistry.find({ outputProvides: 'uppercased' });
      expect(uppercaseOutputNodes).toHaveLength(1);
      
      const sumOutputNodes = NodeRegistry.find({ outputProvides: 'sum' });
      expect(sumOutputNodes).toHaveLength(1);
    });

    test('should support combined search criteria', () => {
      const results = NodeRegistry.find({
        categories: ['text'],
        tags: ['case'],
        text: 'lower'
      });
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('text.lowercase');
    });
  });

  describe('Scope Generation', () => {
    test('should generate scope object with id:name keys', () => {
      const node1 = {
        id: 'scope.test1',
        name: 'Scope Test 1',
        description: 'Test scope generation',
        implementation: function() { return 'test1'; }
      };

      const node2 = {
        id: 'scope.test2',
        name: 'Scope Test 2',
        description: 'Test scope generation 2',
        implementation: function() { return 'test2'; }
      };

      NodeRegistry.register(node1);
      NodeRegistry.register(node2);

      const scope = NodeRegistry.getScope();
      
      expect(scope['scope.test1:Scope Test 1']).toBeDefined();
      expect(scope['scope.test1:Scope Test 1'].id).toBe('scope.test1');
      expect(scope['scope.test2:Scope Test 2']).toBeDefined();
      expect(scope['scope.test2:Scope Test 2'].implementation()).toBe('test2');
    });

    test('should handle nodes with missing required fields in scope', () => {
      // This shouldn't happen if register() works correctly, but let's be defensive
      const invalidNode = {
        id: 'invalid.node',
        // Missing name and implementation
        description: 'Invalid node'
      };

      // Force registration by directly manipulating if needed
      // Since we can't directly access _nodes, we'll just verify the scope handles it gracefully
      
      const scope = NodeRegistry.getScope();
      // Should not have invalid entries
      Object.keys(scope).forEach(key => {
        const node = scope[key];
        expect(node.id).toBeDefined();
        expect(node.name).toBeDefined();
        expect(typeof node.implementation).toBe('function');
      });
    });
  });

  describe('AI-friendly features', () => {
    test('should support AI prompt hints in node definitions', () => {
      const aiNode = {
        id: 'ai.test',
        name: 'AI Test Node',
        description: 'Node with AI hints',
        implementation: function() { return 'ai'; },
        aiPromptHints: {
          toolName: 'ai_test_tool',
          summary: 'Tests AI functionality',
          useCase: 'Use when testing AI features',
          expectedInputFormat: 'Any test input',
          outputDescription: 'Test output'
        }
      };

      NodeRegistry.register(aiNode);
      
      const results = NodeRegistry.find({ text: 'ai functionality' });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('ai.test');
    });
  });
});