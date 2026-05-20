// vitest.setup.ts
import { vi } from 'vitest';

// Mock TextEncoder/TextDecoder for jsdom
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

// Mock next/server
vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: any) => ({
      status: init?.status || 200,
      json: async () => body,
      ...init
    })
  }
}));
