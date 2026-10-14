import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '@/app/components/Sidebar';

describe('Sidebar component', () => {
  it('renders all main navigation labels when expanded', () => {
    render(
      <Sidebar
        sidebarOpen={true}
        currentView="home"
        navigateTo={vi.fn()}
      />
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Shorts')).toBeInTheDocument();
    expect(screen.getByText('Subscriptions')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Liked videos')).toBeInTheDocument();
  });

  it('calls navigateTo when clicking a navigation item', () => {
    const handleNavigate = vi.fn();
    render(
      <Sidebar
        sidebarOpen={true}
        currentView="home"
        navigateTo={handleNavigate}
      />
    );

    fireEvent.click(screen.getByText('History'));
    expect(handleNavigate).toHaveBeenCalledWith('history');
  });

  it('renders collapsed sidebar when sidebarOpen is false', () => {
    render(
      <Sidebar
        sidebarOpen={false}
        currentView="home"
        navigateTo={vi.fn()}
      />
    );

    // Collapsed view renders top 2 items
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Shorts')).toBeInTheDocument();
    expect(screen.queryByText('Liked videos')).not.toBeInTheDocument();
  });
});
