import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('AICoach', () => {
  describe('Training Session', () => {
    it('should pull exercises from chromadb', async () => {
      const { AICoach } = await import('../src/agent');
      const coach = new AICoach();
      const result = await coach.createTrainingSession('test-session-1');
      console.log(result);
    }, 30000);

  });

  describe('Chat', () => {
    it('should answer general QA', async () => {
      const { AICoach } = await import('../src/agent');
      const coach = new AICoach();
      let result = await coach.createTrainingSession('test-session-1');
      result = await coach.chat('test-session-1', "Can you modify this session so I can train with a wall today as I don't have partner");
      console.log(result);
    }, 30000);

  });

  describe('Session Management', () => {
    it('should create a new session', async () => {
      const { AICoach } = await import('../src/agent');
      const coach = new AICoach({ model: 'test-model' });
      const session = coach.createSession('test-session-1');

      expect(session.id).toBe('test-session-1');
      expect(session.history).toEqual([]);
      expect(session.createdAt).toBeInstanceOf(Date);
    });

    it('should retrieve an existing session', async () => {
      const { AICoach } = await import('../src/agent');
      const coach = new AICoach({ model: 'test-model' });
      coach.createSession('test-session-2');
      const session = coach.getSession('test-session-2');

      expect(session).toBeDefined();
      expect(session?.id).toBe('test-session-2');
    });

    it('should return undefined for non-existent session', async () => {
      const { AICoach } = await import('../src/agent');
      const coach = new AICoach({ model: 'test-model' });
      const session = coach.getSession('non-existent');

      expect(session).toBeUndefined();
    });

    it('should delete a session', async () => {
      const { AICoach } = await import('../src/agent');
      const coach = new AICoach({ model: 'test-model' });
      coach.createSession('test-session-3');
      const deleted = coach.deleteSession('test-session-3');

      expect(deleted).toBe(true);
      expect(coach.getSession('test-session-3')).toBeUndefined();
    });

    it('should return false when deleting non-existent session', async () => {
      const { AICoach } = await import('../src/agent');
      const coach = new AICoach({ model: 'test-model' });
      const deleted = coach.deleteSession('non-existent');

      expect(deleted).toBe(false);
    });
  });

  describe('Default Config', () => {
    it('should use default model when not specified', async () => {
      const { AICoach } = await import('../src/agent');
      const coach = new AICoach();
      const session = coach.createSession('default-test');

      expect(session).toBeDefined();
    });
  });
});
