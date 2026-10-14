import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Header from '@/app/components/Header';

describe('Header component', () => {
  it('renders YouTube branding and search input', () => {
    render(
      <Header
        sidebarOpen={true}
        setSidebarOpen={vi.fn()}
        resetView={vi.fn()}
      />
    );

    expect(screen.getByText('YouTube')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('triggers onSearch callback when search button is clicked', () => {
    const handleSearch = vi.fn();
    render(
      <Header
        sidebarOpen={true}
        setSidebarOpen={vi.fn()}
        resetView={vi.fn()}
        onSearch={handleSearch}
      />
    );

    const input = screen.getByPlaceholderText('Search');
    fireEvent.change(input, { target: { value: 'React tutorial' } });

    const searchBtn = screen.getByRole('button', { name: 'Search' });
    fireEvent.click(searchBtn);

    expect(handleSearch).toHaveBeenCalledWith('React tutorial');
  });

  it('triggers resetView when branding logo is clicked', () => {
    const handleReset = vi.fn();
    render(
      <Header
        sidebarOpen={true}
        setSidebarOpen={vi.fn()}
        resetView={handleReset}
      />
    );

    const logo = screen.getByText('YouTube');
    fireEvent.click(logo);

    expect(handleReset).toHaveBeenCalled();
  });

  it('clears input and notifies search when clear button is clicked', () => {
    const handleSearch = vi.fn();
    render(
      <Header
        sidebarOpen={true}
        setSidebarOpen={vi.fn()}
        resetView={vi.fn()}
        onSearch={handleSearch}
        searchQuery="test"
      />
    );

    const clearBtn = screen.getByRole('button', { name: 'Clear search' });
    fireEvent.click(clearBtn);

    expect(handleSearch).toHaveBeenCalledWith('');
    expect((screen.getByPlaceholderText('Search') as HTMLInputElement).value).toBe('');
  });

  it('handles speech-to-text when microphone button is clicked', () => {
    let mockOnResult: ((event: any) => void) | null = null;
    let mockOnStart: (() => void) | null = null;

    class MockSpeechRecognition {
      continuous = false;
      interimResults = false;
      lang = '';
      onstart: (() => void) | null = null;
      onresult: ((event: any) => void) | null = null;
      onerror: ((event: any) => void) | null = null;
      onend: (() => void) | null = null;

      start() {
        mockOnStart = this.onstart;
        mockOnResult = this.onresult;
        if (this.onstart) this.onstart();
      }

      stop() {
        if (this.onend) this.onend();
      }
    }

    (window as any).webkitSpeechRecognition = MockSpeechRecognition;

    const handleSearch = vi.fn();
    render(
      <Header
        sidebarOpen={true}
        setSidebarOpen={vi.fn()}
        resetView={vi.fn()}
        onSearch={handleSearch}
      />
    );

    const micBtn = screen.getByRole('button', { name: /search with your voice/i });
    expect(micBtn).toBeInTheDocument();

    act(() => {
      fireEvent.click(micBtn);
    });

    // Expect button to transition to listening mode
    expect(screen.getByRole('button', { name: /stop listening/i })).toBeInTheDocument();

    // Trigger speech recognition result
    act(() => {
      if (mockOnResult) {
        mockOnResult({
          resultIndex: 0,
          results: {
            0: [{ transcript: 'Next.js tutorials' }],
            length: 1,
          },
        });
      }
    });

    expect((screen.getByPlaceholderText('Search') as HTMLInputElement).value).toBe('Next.js tutorials');

    delete (window as any).webkitSpeechRecognition;
  });

  it('displays message if speech recognition is unsupported in browser', () => {
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;

    render(
      <Header
        sidebarOpen={true}
        setSidebarOpen={vi.fn()}
        resetView={vi.fn()}
      />
    );

    const micBtn = screen.getByRole('button', { name: /search with your voice/i });
    fireEvent.click(micBtn);

    expect(screen.getByText(/speech recognition is not supported in this browser/i)).toBeInTheDocument();
  });
});
