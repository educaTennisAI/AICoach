import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('AITools', () => {
  describe('Get Program guidelines', () => {
    it('should pull program guidelines from chromadb', async () => {
      const { AICoach } = await import('../src/agent');
      const { getLevelGuidelines } = await import('../src/tools');
      const result = await getLevelGuidelines.invoke({ level: 1 });
      expect(result.guidelines).toBeDefined();
    }, 30000);
  });
});
