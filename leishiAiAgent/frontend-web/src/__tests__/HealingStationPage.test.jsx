import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import HealingStationPage from '../pages/HealingStationPage';

// Mock dependencies
jest.mock('../hooks/useWebSocket', () => ({
  __esModule: true,
  default: () => ({
    connected: true,
    sendMessage: jest.fn(),
    onMessage: jest.fn(() => jest.fn()),
    joinRoom: jest.fn(),
    leaveRoom: jest.fn(),
    sendNotification: jest.fn(),
    updateStatus: jest.fn(),
  }),
}));

jest.mock('../services/apiService', () => ({
  __esModule: true,
  default: {
    analyzeEmotion: jest.fn().mockResolvedValue({ emotion: 'happy' }),
    saveMemory: jest.fn().mockResolvedValue({ success: true }),
  },
}));

describe('HealingStationPage', () => {
  beforeEach(() => {
    localStorage.getItem = jest.fn((key) => {
      if (key === 'userId') return 'test-user-123';
      if (key === 'username') return 'TestUser';
      return null;
    });
  });

  test('renders healing station page', () => {
    render(<HealingStationPage />);
    expect(screen.getByText(/疗愈站/i)).toBeInTheDocument();
  });

  test('displays mode selector buttons', () => {
    render(<HealingStationPage />);
    expect(screen.getByText(/AI聊天/i)).toBeInTheDocument();
    expect(screen.getByText(/治愈音乐/i)).toBeInTheDocument();
    expect(screen.getByText(/冥想引导/i)).toBeInTheDocument();
    expect(screen.getByText(/情绪日记/i)).toBeInTheDocument();
  });

  test('switches between modes when buttons are clicked', async () => {
    render(<HealingStationPage />);
    
    const musicBtn = screen.getByText(/治愈音乐/i);
    fireEvent.click(musicBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/治愈音乐库/i)).toBeInTheDocument();
    });
  });

  test('allows user to type and send messages', async () => {
    render(<HealingStationPage />);
    
    const input = screen.getByPlaceholderText(/分享你的想法/i);
    fireEvent.change(input, { target: { value: '我今天很开心' } });
    
    expect(input.value).toBe('我今天很开心');
  });

  test('displays emotion indicator', () => {
    render(<HealingStationPage />);
    expect(screen.getByText(/当前情绪/i)).toBeInTheDocument();
  });

  test('shows healing music list in music mode', async () => {
    render(<HealingStationPage />);
    
    const musicBtn = screen.getByText(/治愈音乐/i);
    fireEvent.click(musicBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/雨声/i)).toBeInTheDocument();
      expect(screen.getByText(/森林/i)).toBeInTheDocument();
      expect(screen.getByText(/海洋/i)).toBeInTheDocument();
    });
  });

  test('shows meditation courses in meditation mode', async () => {
    render(<HealingStationPage />);
    
    const meditationBtn = screen.getByText(/冥想引导/i);
    fireEvent.click(meditationBtn);
    
    await waitFor(() => {
      expect(screen.getByText(/放松冥想/i)).toBeInTheDocument();
      expect(screen.getByText(/深度冥想/i)).toBeInTheDocument();
    });
  });

  test('displays diary mode with textarea', async () => {
    render(<HealingStationPage />);
    
    const diaryBtn = screen.getByText(/情绪日记/i);
    fireEvent.click(diaryBtn);
    
    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/写下你今天的感受/i);
      expect(textarea).toBeInTheDocument();
    });
  });

  test('shows connection status indicator', () => {
    render(<HealingStationPage />);
    expect(screen.getByText(/已连接/i)).toBeInTheDocument();
  });
});
