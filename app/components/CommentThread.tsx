import React, { useState, KeyboardEvent } from 'react';
import { ThumbsUp, ChevronDown, ChevronUp } from 'lucide-react';
import { CommentType } from '../types';

interface CommentThreadProps {
  comment: CommentType;
  onReply: (targetId: string, replyText: string) => void;
}

const CommentThread: React.FC<CommentThreadProps> = ({ comment, onReply }) => {
  const [showReplies, setShowReplies] = useState<boolean>(false);
  const [isReplying, setIsReplying] = useState<boolean>(false);
  const [replyText, setReplyText] = useState<string>("");

  const handlePostReply = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && replyText.trim()) {
      onReply(comment.id, replyText.trim());
      setReplyText("");
      setIsReplying(false);
      setShowReplies(true);
    }
  };

  return (
    <div className="flex gap-4 mt-4 w-full">
      <img src={comment.avatar} alt={comment.author} className="w-10 h-10 rounded-full bg-zinc-800" />
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-sm text-zinc-100">{comment.author}</span>
          <span className="text-xs text-zinc-400">{comment.timestamp}</span>
        </div>
        <p className="text-sm text-zinc-100 mt-1 leading-relaxed">{comment.text}</p>
        
        <div className="flex items-center gap-4 mt-2">
          <button className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors">
            <ThumbsUp size={14} /> <span className="text-xs">{comment.likes > 0 ? comment.likes : ''}</span>
          </button>
          <button onClick={() => setIsReplying(!isReplying)} className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors">
            Reply
          </button>
        </div>

        {isReplying && (
          <div className="flex gap-3 mt-3 items-center">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=You" alt="You" className="w-6 h-6 rounded-full bg-blue-600 flex-shrink-0" />
            <input 
              type="text" autoFocus placeholder="Add a reply... (Press Enter to post)" 
              value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={handlePostReply}
              className="flex-1 bg-transparent border-b border-zinc-700 focus:border-white outline-none text-zinc-100 pb-1 text-sm transition-colors"
            />
            <button onClick={() => setIsReplying(false)} className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors">Cancel</button>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            <button onClick={() => setShowReplies(!showReplies)} className="flex items-center gap-2 text-sm font-semibold text-blue-400 hover:bg-blue-400/10 px-3 py-1.5 rounded-full transition-colors -ml-3">
              {showReplies ? <ChevronUp size={16} /> : <ChevronDown size={16} />} {comment.replies.length} replies
            </button>
            {showReplies && (
              <div className="mt-2 pl-2 border-l-2 border-zinc-800 ml-2">
                {comment.replies.map(reply => (
                  <CommentThread key={reply.id} comment={reply} onReply={onReply} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentThread;