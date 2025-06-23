// StateManager is a private function inside FlowManager, so we'll test it through FlowManager
import { FlowManager } from '../../core/FlowManager.js';

describe('StateManager (via FlowManager)', () => {
  let stateManager;

  beforeEach(() => {
    // Create a FlowManager instance to access its StateManager
    const fm = FlowManager({ 
      initialState: { 
        user: { name: 'John', age: 30 },
        items: ['apple', 'banana'],
        count: 0 
      },
      nodes: [] 
    });
    stateManager = fm.getStateManager();
  });

  describe('Basic State Operations', () => {
    test('should get values from state', () => {
      expect(stateManager.get('user.name')).toBe('John');
      expect(stateManager.get('user.age')).toBe(30);
      expect(stateManager.get('items')).toEqual(['apple', 'banana']);
      expect(stateManager.get('count')).toBe(0);
    });

    test('should handle undefined paths', () => {
      expect(stateManager.get('nonexistent')).toBeUndefined();
      expect(stateManager.get('user.nonexistent')).toBeUndefined();
      expect(stateManager.get('')).toBeUndefined();
      expect(stateManager.get()).toBeUndefined();
    });

    test('should set values in state', () => {
      stateManager.set('newValue', 42);
      expect(stateManager.get('newValue')).toBe(42);

      stateManager.set('user.email', 'john@example.com');
      expect(stateManager.get('user.email')).toBe('john@example.com');
      
      // Original values should remain
      expect(stateManager.get('user.name')).toBe('John');
    });

    test('should create nested paths when setting', () => {
      stateManager.set('deeply.nested.path.value', 'test');
      expect(stateManager.get('deeply.nested.path.value')).toBe('test');
      expect(stateManager.get('deeply.nested.path')).toEqual({ value: 'test' });
    });

    test('should replace entire state when path is null or empty', () => {
      const newState = { completely: 'different', state: true };
      
      stateManager.set(null, newState);
      expect(stateManager.getState()).toEqual(newState);
      expect(stateManager.get('user')).toBeUndefined();
      expect(stateManager.get('completely')).toBe('different');
      
      stateManager.set('', { another: 'state' });
      expect(stateManager.getState()).toEqual({ another: 'state' });
    });

    test('should handle array values', () => {
      stateManager.set('myArray', [1, 2, 3]);
      expect(stateManager.get('myArray')).toEqual([1, 2, 3]);
      
      stateManager.set('myArray.3', 4);
      expect(stateManager.get('myArray')).toEqual([1, 2, 3, 4]);
    });

    test('should deep copy values to prevent mutations', () => {
      const obj = { mutable: true };
      stateManager.set('testObj', obj);
      
      obj.mutable = false;
      obj.newProp = 'added';
      
      expect(stateManager.get('testObj')).toEqual({ mutable: true });
      expect(stateManager.get('testObj').newProp).toBeUndefined();
    });
  });

  describe('History and Undo/Redo', () => {
    test('should track state history', () => {
      const history = stateManager.getHistory();
      expect(history).toHaveLength(1); // Initial state
      
      stateManager.set('count', 1);
      expect(stateManager.getHistory()).toHaveLength(2);
      
      stateManager.set('count', 2);
      expect(stateManager.getHistory()).toHaveLength(3);
    });

    test('should support undo operations', () => {
      stateManager.set('count', 1);
      stateManager.set('count', 2);
      stateManager.set('count', 3);
      
      expect(stateManager.get('count')).toBe(3);
      expect(stateManager.canUndo()).toBe(true);
      
      stateManager.undo();
      expect(stateManager.get('count')).toBe(2);
      
      stateManager.undo();
      expect(stateManager.get('count')).toBe(1);
      
      stateManager.undo();
      expect(stateManager.get('count')).toBe(0); // Back to initial
      
      expect(stateManager.canUndo()).toBe(false);
    });

    test('should support redo operations', () => {
      stateManager.set('count', 1);
      stateManager.set('count', 2);
      
      expect(stateManager.canRedo()).toBe(false);
      
      stateManager.undo();
      expect(stateManager.get('count')).toBe(1);
      expect(stateManager.canRedo()).toBe(true);
      
      stateManager.redo();
      expect(stateManager.get('count')).toBe(2);
      expect(stateManager.canRedo()).toBe(false);
    });

    test('should clear redo history when setting new value', () => {
      stateManager.set('count', 1);
      stateManager.set('count', 2);
      stateManager.undo(); // count = 1
      
      expect(stateManager.canRedo()).toBe(true);
      
      stateManager.set('count', 99); // New value
      
      expect(stateManager.canRedo()).toBe(false);
      expect(stateManager.getHistory()).toHaveLength(3); // Initial, 1, 99
    });

    test('should navigate to specific history state', () => {
      stateManager.set('count', 1);
      stateManager.set('count', 2);
      stateManager.set('count', 3);
      
      const history = stateManager.getHistory();
      expect(history).toHaveLength(4);
      
      stateManager.goToState(1); // Go to state after first set
      expect(stateManager.get('count')).toBe(1);
      expect(stateManager.getCurrentIndex()).toBe(1);
      
      stateManager.goToState(0); // Go to initial state
      expect(stateManager.get('count')).toBe(0);
      
      stateManager.goToState(3); // Go to latest
      expect(stateManager.get('count')).toBe(3);
    });

    test('should handle invalid history navigation', () => {
      const initialState = stateManager.getState();
      
      stateManager.goToState(-1); // Invalid index
      expect(stateManager.getState()).toEqual(initialState);
      
      stateManager.goToState(999); // Out of bounds
      expect(stateManager.getState()).toEqual(initialState);
    });
  });

  describe('State Placeholders', () => {
    test('should resolve simple state placeholders', async () => {
      const nodes = [
        function() {
          this.state.set('message', 'Hello');
          this.state.set('name', 'World');
          return 'set';
        },
        {
          'echo': {
            greeting: '${message}',
            target: '${name}'
          }
        }
      ];

      const scope = {
        echo: function(params) {
          return `${params.greeting} ${params.target}!`;
        }
      };

      const fm = FlowManager({ nodes, scope });
      const steps = await fm.run();

      expect(steps[1].output.results[0]).toBe('Hello World!');
    });

    test('should resolve nested state placeholders', async () => {
      const nodes = [
        function() {
          this.state.set('config', {
            api: {
              endpoint: 'https://api.example.com',
              version: 'v2'
            },
            auth: {
              token: 'secret123'
            }
          });
          return 'configured';
        },
        {
          'makeRequest': {
            url: '${config.api.endpoint}',
            version: '${config.api.version}',
            auth: '${config.auth.token}'
          }
        }
      ];

      const scope = {
        makeRequest: function(params) {
          return params;
        }
      };

      const fm = FlowManager({ nodes, scope });
      const steps = await fm.run();

      expect(steps[1].output.results[0]).toEqual({
        url: 'https://api.example.com',
        version: 'v2',
        auth: 'secret123'
      });
    });

    test('should resolve array access in placeholders', async () => {
      const nodes = [
        function() {
          this.state.set('users', [
            { name: 'Alice', id: 1 },
            { name: 'Bob', id: 2 },
            { name: 'Charlie', id: 3 }
          ]);
          this.state.set('selectedIndex', 1);
          return 'set';
        },
        {
          'getUser': {
            firstUser: '${users[0].name}',
            secondUser: '${users[1].name}',
            lastUserId: '${users[2].id}'
          }
        }
      ];

      const scope = {
        getUser: function(params) {
          return params;
        }
      };

      const fm = FlowManager({ nodes, scope });
      const steps = await fm.run();

      expect(steps[1].output.results[0]).toEqual({
        firstUser: 'Alice',
        secondUser: 'Bob',
        lastUserId: 3
      });
    });

    test('should handle undefined placeholders gracefully', async () => {
      const nodes = [
        function() {
          this.state.set('existing', 'value');
          return 'set';
        },
        {
          'test': {
            exists: '${existing}',
            notExists: '${nonexistent}',
            nested: '${deep.path.missing}'
          }
        }
      ];

      const scope = {
        test: function(params) {
          return params;
        }
      };

      const fm = FlowManager({ nodes, scope });
      const steps = await fm.run();

      expect(steps[1].output.results[0]).toEqual({
        exists: 'value',
        notExists: undefined,
        nested: undefined
      });
    });

    test('should preserve non-placeholder strings', async () => {
      const nodes = [
        function() {
          this.state.set('value', 'replaced');
          return 'set';
        },
        {
          'test': {
            placeholder: '${value}',
            literal: 'not a placeholder',
            partial: 'prefix ${value} suffix', // Not a pure placeholder
            malformed: '${value', // Missing closing brace
            empty: '${}'  // Empty placeholder
          }
        }
      ];

      const scope = {
        test: function(params) {
          return params;
        }
      };

      const fm = FlowManager({ nodes, scope });
      const steps = await fm.run();

      expect(steps[1].output.results[0]).toEqual({
        placeholder: 'replaced',
        literal: 'not a placeholder',
        partial: 'prefix ${value} suffix', // Unchanged
        malformed: '${value', // Unchanged
        empty: '${}'  // Unchanged
      });
    });
  });
});