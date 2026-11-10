import { vi } from 'vitest';

// `server-only` throws outside a React Server bundle; tests run plain Node
vi.mock('server-only', () => ({}));
