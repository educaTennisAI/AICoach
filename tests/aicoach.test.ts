import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('AICoach', () => {

  const user = { 
    level: "Improvement",
    language: "es",
  }

  describe('Training Session', () => {
    it('should pull exercises from chromadb', async () => {
      const { AICoach } = await import('../src/agent');
      const coach = new AICoach();
      const result = await coach.createTrainingSession('test-session-1', user);
      console.log(result);
    }, 30000);

  });

  describe('Chat', () => {
    it('should answer general QA', async () => {
      const { AICoach } = await import('../src/agent');
      const coach = new AICoach();
      //const result = await coach.chat('test-session-1', "Can you modify this session so I can train with a wall today as I don't have partner", user);
      //console.log(result);
    }, 30000);
  });

});
