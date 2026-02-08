import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Cleanup is handled automatically by @testing-library/react

// Mock Chrome API
const chromeMock = {
    runtime: {
        sendMessage: vi.fn(),
        onMessage: {
            addListener: vi.fn(),
            removeListener: vi.fn(),
        },
        getURL: vi.fn((path) => `chrome-extension://mock-id/${path}`),
    },
    storage: {
        local: {
            get: vi.fn((keys, callback) => callback({})),
            set: vi.fn(),
        },
        sync: {
            get: vi.fn((keys, callback) => callback({})),
            set: vi.fn(),
        },
    },
    alarms: {
        create: vi.fn(),
        clear: vi.fn(),
        onAlarm: {
            addListener: vi.fn(),
        },
    },
    windows: {
        create: vi.fn(),
    },
    notifications: {
        create: vi.fn(),
        onClicked: {
            addListener: vi.fn(),
        },
    },
};

// Assign to global
global.chrome = chromeMock as any;

// Mock LocalStorage
const localStorageMock = (function () {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value.toString();
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

// Mock Convex - Partial mock for queries/mutations
vi.mock('convex/react', () => ({
    useQuery: vi.fn(),
    useMutation: vi.fn(() => vi.fn().mockResolvedValue(null)),
    useConvex: vi.fn(),
}));

// Mock Clerk Auth
// Mock Clerk Auth
export const useAuthMock = vi.fn(() => ({
    userId: 'test_user_id',
    sessionId: 'test_session_id',
    getToken: vi.fn(),
    isSignedIn: true,
}));

export const useUserMock = vi.fn(() => ({
    user: {
        id: 'test_user_id',
        fullName: 'Test User',
        primaryEmailAddress: { emailAddress: 'test@example.com' },
    },
    isSignedIn: true,
    isLoaded: true,
}));

vi.mock('@clerk/clerk-react', () => ({
    useAuth: useAuthMock,
    useUser: useUserMock,
    useClerk: vi.fn(() => ({
        openSignIn: vi.fn(),
        openSignUp: vi.fn(),
        signOut: vi.fn(),
    })),
}));
