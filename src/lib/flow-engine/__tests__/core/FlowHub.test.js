import FlowHub from '../../core/FlowHub.js';

describe('FlowHub', () => {
  afterEach(() => {
    // Clean up any active pauses
    const activePauses = FlowHub.getActivePauses();
    activePauses.forEach(pause => {
      FlowHub.resume(pause.pauseId, null);
    });
  });

  describe('Event System', () => {
    test('should emit and receive events', () => {
      const receivedEvents = [];
      const listener = (data) => {
        receivedEvents.push(data);
      };

      FlowHub.addEventListener('testEvent', listener);
      
      FlowHub._emitEvent('testEvent', { message: 'test1' });
      FlowHub._emitEvent('testEvent', { message: 'test2' });
      
      expect(receivedEvents).toHaveLength(2);
      expect(receivedEvents[0]).toEqual({ message: 'test1' });
      expect(receivedEvents[1]).toEqual({ message: 'test2' });
      
      FlowHub.removeEventListener('testEvent', listener);
    });

    test('should handle multiple listeners for same event', () => {
      const results = [];
      const listener1 = (data) => results.push({ listener: 1, data });
      const listener2 = (data) => results.push({ listener: 2, data });

      FlowHub.addEventListener('multiTest', listener1);
      FlowHub.addEventListener('multiTest', listener2);
      
      FlowHub._emitEvent('multiTest', { value: 42 });
      
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({ listener: 1, data: { value: 42 } });
      expect(results[1]).toEqual({ listener: 2, data: { value: 42 } });
      
      FlowHub.removeEventListener('multiTest', listener1);
      FlowHub.removeEventListener('multiTest', listener2);
    });

    test('should remove event listeners correctly', () => {
      let count = 0;
      const listener = () => count++;

      FlowHub.addEventListener('removeTest', listener);
      FlowHub._emitEvent('removeTest', {});
      expect(count).toBe(1);
      
      FlowHub.removeEventListener('removeTest', listener);
      FlowHub._emitEvent('removeTest', {});
      expect(count).toBe(1); // Should not increment
    });

    test('should handle listener errors gracefully', () => {
      const goodListener = jest.fn();
      const badListener = () => {
        throw new Error('Listener error');
      };

      FlowHub.addEventListener('errorTest', badListener);
      FlowHub.addEventListener('errorTest', goodListener);
      
      // Should not throw
      expect(() => {
        FlowHub._emitEvent('errorTest', { test: true });
      }).not.toThrow();
      
      expect(goodListener).toHaveBeenCalledWith({ test: true });
      
      FlowHub.removeEventListener('errorTest', badListener);
      FlowHub.removeEventListener('errorTest', goodListener);
    });
  });

  describe('Pause/Resume Functionality', () => {
    test('should handle basic pause and resume', async () => {
      const pausePromise = FlowHub.requestPause({
        pauseId: 'test-pause-1',
        details: { prompt: 'Enter value' },
        flowInstanceId: 'test-flow-1'
      });

      // Check pause is active
      expect(FlowHub.isPaused('test-pause-1')).toBe(true);
      
      const activePauses = FlowHub.getActivePauses();
      expect(activePauses).toHaveLength(1);
      expect(activePauses[0]).toEqual({
        pauseId: 'test-pause-1',
        details: { prompt: 'Enter value' },
        flowInstanceId: 'test-flow-1'
      });

      // Resume with data
      const resumed = FlowHub.resume('test-pause-1', { answer: 42 });
      expect(resumed).toBe(true);
      
      // Wait for promise to resolve
      const result = await pausePromise;
      expect(result).toEqual({ answer: 42 });
      
      // Check pause is no longer active
      expect(FlowHub.isPaused('test-pause-1')).toBe(false);
      expect(FlowHub.getActivePauses()).toHaveLength(0);
    });

    test('should generate unique pause ID if not provided', async () => {
      const pause1 = FlowHub.requestPause({
        details: { test: 1 },
        flowInstanceId: 'flow-1'
      });
      
      const pause2 = FlowHub.requestPause({
        details: { test: 2 },
        flowInstanceId: 'flow-2'
      });
      
      const activePauses = FlowHub.getActivePauses();
      expect(activePauses).toHaveLength(2);
      expect(activePauses[0].pauseId).not.toBe(activePauses[1].pauseId);
      
      // Clean up
      FlowHub.resume(activePauses[0].pauseId, null);
      FlowHub.resume(activePauses[1].pauseId, null);
      
      await pause1;
      await pause2;
    });

    test('should handle duplicate pause IDs', async () => {
      const pause1 = FlowHub.requestPause({
        pauseId: 'duplicate-id',
        details: { first: true },
        flowInstanceId: 'flow-1'
      });
      
      // Second pause with same ID should get a generated ID
      const pause2 = FlowHub.requestPause({
        pauseId: 'duplicate-id',
        details: { second: true },
        flowInstanceId: 'flow-2'
      });
      
      const activePauses = FlowHub.getActivePauses();
      expect(activePauses).toHaveLength(2);
      
      // First pause should have the requested ID
      const firstPause = activePauses.find(p => p.details.first);
      expect(firstPause.pauseId).toBe('duplicate-id');
      
      // Second pause should have a different ID
      const secondPause = activePauses.find(p => p.details.second);
      expect(secondPause.pauseId).not.toBe('duplicate-id');
      
      // Clean up
      FlowHub.resume(firstPause.pauseId, null);
      FlowHub.resume(secondPause.pauseId, null);
      
      await pause1;
      await pause2;
    });

    test('should emit events for pause and resume', async () => {
      const events = [];
      const pauseListener = (data) => events.push({ type: 'paused', data });
      const resumeListener = (data) => events.push({ type: 'resumed', data });
      
      FlowHub.addEventListener('flowPaused', pauseListener);
      FlowHub.addEventListener('flowResumed', resumeListener);
      
      const pausePromise = FlowHub.requestPause({
        pauseId: 'event-test',
        details: { test: true },
        flowInstanceId: 'flow-events'
      });
      
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        type: 'paused',
        data: {
          pauseId: 'event-test',
          details: { test: true },
          flowInstanceId: 'flow-events'
        }
      });
      
      FlowHub.resume('event-test', { result: 'done' });
      await pausePromise;
      
      expect(events).toHaveLength(2);
      expect(events[1]).toEqual({
        type: 'resumed',
        data: {
          pauseId: 'event-test',
          resumeData: { result: 'done' },
          details: { test: true },
          flowInstanceId: 'flow-events'
        }
      });
      
      FlowHub.removeEventListener('flowPaused', pauseListener);
      FlowHub.removeEventListener('flowResumed', resumeListener);
    });

    test('should handle resume of non-existent pause', () => {
      const events = [];
      const failListener = (data) => events.push(data);
      
      FlowHub.addEventListener('resumeFailed', failListener);
      
      const result = FlowHub.resume('non-existent', { data: 'test' });
      
      expect(result).toBe(false);
      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({
        pauseId: 'non-existent',
        reason: 'No active pause found'
      });
      
      FlowHub.removeEventListener('resumeFailed', failListener);
    });
  });

  describe('Multiple Concurrent Pauses', () => {
    test('should handle multiple pauses from different flows', async () => {
      const pause1 = FlowHub.requestPause({
        pauseId: 'flow1-pause',
        details: { flow: 1 },
        flowInstanceId: 'flow-1'
      });
      
      const pause2 = FlowHub.requestPause({
        pauseId: 'flow2-pause',
        details: { flow: 2 },
        flowInstanceId: 'flow-2'
      });
      
      const pause3 = FlowHub.requestPause({
        pauseId: 'flow3-pause',
        details: { flow: 3 },
        flowInstanceId: 'flow-3'
      });
      
      const activePauses = FlowHub.getActivePauses();
      expect(activePauses).toHaveLength(3);
      
      // Resume in different order
      FlowHub.resume('flow2-pause', 'result2');
      FlowHub.resume('flow3-pause', 'result3');
      FlowHub.resume('flow1-pause', 'result1');
      
      const results = await Promise.all([pause1, pause2, pause3]);
      expect(results).toEqual(['result1', 'result2', 'result3']);
      
      expect(FlowHub.getActivePauses()).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle invalid event listeners', () => {
      // Should not throw
      expect(() => {
        FlowHub.addEventListener('test', null);
        FlowHub.addEventListener('test', undefined);
        FlowHub.addEventListener('test', 'not a function');
        FlowHub.addEventListener('test', 123);
      }).not.toThrow();
      
      // Should work normally with valid listener
      const validListener = jest.fn();
      FlowHub.addEventListener('test', validListener);
      FlowHub._emitEvent('test', { valid: true });
      
      expect(validListener).toHaveBeenCalledWith({ valid: true });
      FlowHub.removeEventListener('test', validListener);
    });

    test('should handle events with no listeners', () => {
      // Should not throw
      expect(() => {
        FlowHub._emitEvent('no-listeners', { test: true });
      }).not.toThrow();
    });
  });
});