import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CommentThread from '@/app/components/CommentThread';
import { CommentType } from '@/app/types';

const mockComment: CommentType = {
  id: 'c-1',
  author: 'Alice',
  avatar: 'https://example.com/alice.png',
  text: 'This video was really helpful!',
  likes: 12,
  timestamp: '2 days ago',
  replies: [
    {
      id: 'c-1-r1',
      author: 'Bob',
      avatar: 'https://example.com/bob.png',
      text: 'Totally agree with you!',
      likes: 3,
      timestamp: '1 day ago',
      replies: [],
    },
  ],
};

describe('CommentThread component', () => {
  it('renders author, comment text, and like counts', () => {
    render(<CommentThread comment={mockComment} onReply={vi.fn()} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('This video was really helpful!')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('toggles reply input box and calls onReply on Enter', () => {
    const handleReply = vi.fn();
    render(<CommentThread comment={mockComment} onReply={handleReply} />);

    const replyButton = screen.getByRole('button', { name: 'Reply' });
    fireEvent.click(replyButton);

    const input = screen.getByPlaceholderText(/Add a reply\.\.\./i);
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'Awesome work!' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(handleReply).toHaveBeenCalledWith('c-1', 'Awesome work!');
  });

  it('toggles nested replies visibility', () => {
    render(<CommentThread comment={mockComment} onReply={vi.fn()} />);

    // Initially replies are hidden
    expect(screen.queryByText('Totally agree with you!')).not.toBeInTheDocument();

    const repliesToggle = screen.getByText(/1 replies/i);
    fireEvent.click(repliesToggle);

    // Now reply is visible
    expect(screen.getByText('Totally agree with you!')).toBeInTheDocument();
  });
});
