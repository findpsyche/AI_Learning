import apiService from '../services/apiService';

describe('apiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  describe('analyzeEmotion', () => {
    test('should call emotion analysis endpoint', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ emotion: 'happy', confidence: 0.95 }),
      };
      global.fetch.mockResolvedValueOnce(mockResponse);

      const result = await apiService.analyzeEmotion('这是一个快乐的文本');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/emotion/analyze'),
        expect.any(Object)
      );
      expect(result).toEqual({ emotion: 'happy', confidence: 0.95 });
    });

    test('should handle emotion analysis errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiService.analyzeEmotion('test')).rejects.toThrow('Network error');
    });
  });

  describe('saveMemory', () => {
    test('should save memory successfully', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ id: 'mem_123', success: true }),
      };
      global.fetch.mockResolvedValueOnce(mockResponse);

      const memoryData = {
        userId: 'user_123',
        type: 'diary',
        content: 'Today was great',
        emotion: 'happy',
      };

      const result = await apiService.saveMemory(memoryData);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/memory/save'),
        expect.any(Object)
      );
      expect(result).toEqual({ id: 'mem_123', success: true });
    });

    test('should handle memory save errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Server error'));

      await expect(
        apiService.saveMemory({ userId: 'user_123' })
      ).rejects.toThrow('Server error');
    });
  });

  describe('getRecommendations', () => {
    test('should fetch recommendations by emotion', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ([
          { id: 1, name: 'App 1', emotion: 'happy' },
          { id: 2, name: 'App 2', emotion: 'happy' },
        ]),
      };
      global.fetch.mockResolvedValueOnce(mockResponse);

      const result = await apiService.getRecommendations('happy');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/recommendation'),
        expect.any(Object)
      );
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getMusicByEmotion', () => {
    test('should fetch music recommendations', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ([
          { id: 1, name: 'Rain', emotion: 'calm' },
        ]),
      };
      global.fetch.mockResolvedValueOnce(mockResponse);

      const result = await apiService.getMusicByEmotion('calm');

      expect(global.fetch).toHaveBeenCalled();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('generateContent', () => {
    test('should generate content via API', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ content: 'Generated content', type: 'story' }),
      };
      global.fetch.mockResolvedValueOnce(mockResponse);

      const result = await apiService.generateContent({
        type: 'story',
        emotion: 'happy',
        length: 'short',
      });

      expect(global.fetch).toHaveBeenCalled();
      expect(result.content).toBe('Generated content');
    });
  });
});
