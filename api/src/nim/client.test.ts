/*
===============================================
  _____ _   ___ _____ ___ ___  ___  _____   __
 |_   _/_\ / __|_   _|_ _/ __|   \| __\ \ / /
   | |/ _ \ (__  | |  | | (__| |) | _| \ V /
   |_/_/ \_\___| |_| |___\___|___/|___| \_/
                                    v2.14.7-hpc
===============================================
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeVideo } from './client.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('analyzeVideo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NVIDIA_API_KEY = 'test-key';
  });

  it('calls NIM endpoint with correct video_url payload', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: '<think>Vehicle A was traveling at high speed.</think>{"events":[]}'
        }
      }]
    };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await analyzeVideo('https://example.com/clip.mp4');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://integrate.api.nvidia.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-key',
          'Content-Type': 'application/json'
        })
      })
    );

    const body = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.model).toBe('nvidia/cosmos-reason2-8b');
    expect(body.messages[0].content[0].type).toBe('video_url');
    expect(body.messages[0].content[0].video_url.url).toBe('https://example.com/clip.mp4');
    expect(result).toBe(mockResponse.choices[0].message.content);
  });

  it('throws on non-ok response', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized'
    });

    await expect(analyzeVideo('https://example.com/clip.mp4')).rejects.toThrow('NIM API error 401');
  });
});
