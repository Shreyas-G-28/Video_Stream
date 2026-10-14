"use client";

import React, { useState, useEffect, KeyboardEvent } from 'react';
import { ThumbsUp, Share2 } from 'lucide-react';
import { formatViews, parseDuration } from '../utils/helpers';
import CommentThread from './CommentThread';
import { fetchVideoComments } from '../utils/api';
import { YouTubeVideo, CommentType } from '../types';
import { useAppContext } from '../context/AppContext';

interface VideoPlayerProps {
  video: YouTubeVideo;
  onBack: (video: YouTubeVideo) => void;
  allVideos: YouTubeVideo[];
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, onBack, allVideos }) => {
  const { state, dispatch } = useAppContext();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [newComment, setNewComment] = useState<string>("");
  const [isExpandedDescription, setIsExpandedDescription] = useState<boolean>(false);
  const [prevVideoId, setPrevVideoId] = useState<string>(video.id);

  const isLiked = state.likedVideos.some(v => v.id === video.id);
  const isSubscribed = state.subscriptions.some(s => s.channelId === video.snippet.channelId);

  // Derive likeCount from statistics plus whether current user liked it
  const baseLikeCount = parseInt(video.statistics.likeCount) || 0;
  const likeCount = isLiked ? baseLikeCount + 1 : baseLikeCount;

  if (video.id !== prevVideoId) {
    setPrevVideoId(video.id);
    setIsExpandedDescription(false);
    setNewComment("");
  }

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Fetch live comments when a video loads
    const loadComments = async () => {
      const rawComments = await fetchVideoComments(video.id);
      
      const mappedComments: CommentType[] = rawComments.map((item: {
        id: string;
        snippet: {
          topLevelComment: {
            snippet: {
              authorDisplayName: string;
              authorProfileImageUrl: string;
              textOriginal?: string;
              textDisplay: string;
              likeCount: number;
              publishedAt: string;
            };
          };
        };
        replies?: {
          comments?: Array<{
            id: string;
            snippet: {
              authorDisplayName: string;
              authorProfileImageUrl: string;
              textOriginal?: string;
              textDisplay: string;
              likeCount: number;
              publishedAt: string;
            };
          }>;
        };
      }) => {
        const topLevel = item.snippet.topLevelComment.snippet;
        
        let nestedReplies: CommentType[] = [];
        if (item.replies && item.replies.comments) {
          nestedReplies = item.replies.comments.map((replyItem) => {
            const reply = replyItem.snippet;
            return {
              id: replyItem.id,
              author: reply.authorDisplayName,
              avatar: reply.authorProfileImageUrl,
              text: reply.textOriginal || reply.textDisplay,
              likes: reply.likeCount,
              timestamp: reply.publishedAt.split('T')[0],
              replies: []
            };
          });
        }

        return {
          id: item.id,
          author: topLevel.authorDisplayName,
          avatar: topLevel.authorProfileImageUrl,
          text: topLevel.textOriginal || topLevel.textDisplay,
          likes: topLevel.likeCount,
          timestamp: topLevel.publishedAt.split('T')[0],
          replies: nestedReplies
        };
      });

      setComments(mappedComments);
    };

    loadComments();
  }, [video]);

  const handlePostComment = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newComment.trim()) {
      const newCommentObj: CommentType = {
        id: `comment-new-${Date.now()}`,
        author: "You",
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=You`,
        text: newComment.trim(),
        likes: 0,
        timestamp: "Just now",
        replies: []
      };
      setComments([newCommentObj, ...comments]);
      setNewComment("");
    }
  };

  const addReplyToTree = (commentList: CommentType[], targetId: string, replyText: string): CommentType[] => {
    return commentList.map(comment => {
      if (comment.id === targetId) {
        const newReply: CommentType = {
          id: `reply-${Date.now()}`, author: "You", avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=You`,
          text: replyText, likes: 0, timestamp: "Just now", replies: []
        };
        return { ...comment, replies: [newReply, ...(comment.replies || [])] };
      }
      if (comment.replies && comment.replies.length > 0) {
        return { ...comment, replies: addReplyToTree(comment.replies, targetId, replyText) };
      }
      return comment;
    });
  };

  const handleNestedReply = (targetId: string, replyText: string) => setComments(prev => addReplyToTree(prev, targetId, replyText));

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-[1600px] mx-auto w-full pt-4 px-4 lg:px-6 pb-20">
      <div className="flex-1 lg:max-w-[70%]">
        <div className="aspect-video bg-black rounded-xl overflow-hidden relative group shadow-lg">
          <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${video.id}?autoplay=1`} title={video.snippet.title} frameBorder="0" allowFullScreen></iframe>
        </div>
        <h1 className="text-xl font-bold text-white mt-4">{video.snippet.title}</h1>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-3">
          <div className="flex items-center gap-3">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${video.snippet.channelTitle}`} className="w-10 h-10 rounded-full bg-zinc-800" alt="avatar" />
            <div>
              <h3 className="text-white font-bold text-sm">{video.snippet.channelTitle}</h3>
              <p className="text-zinc-400 text-xs">{(parseInt(video.statistics.viewCount) / 100000).toFixed(1)}M subscribers</p>
            </div>
            <button
              onClick={() => {
                const channelId = video.snippet.channelId || video.snippet.channelTitle;
                dispatch({
                  type: 'TOGGLE_SUBSCRIPTION',
                  payload: {
                    channelId,
                    channelTitle: video.snippet.channelTitle,
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(video.snippet.channelTitle)}`,
                    subscribedAt: new Date().toISOString(),
                  }
                });
              }}
              className={`ml-4 font-semibold px-4 py-2 rounded-full text-sm transition-colors ${isSubscribed ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-zinc-100 text-black hover:bg-zinc-300'}`}
            >
              {isSubscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            <div className="flex items-center bg-zinc-800 rounded-full overflow-hidden">
              <button
                onClick={() => dispatch({ type: 'TOGGLE_LIKE_VIDEO', payload: video })}
                className={`flex items-center gap-2 px-4 py-2 transition-colors text-sm font-medium border-r border-zinc-700 ${isLiked ? 'text-white bg-zinc-700' : 'text-zinc-200 hover:bg-zinc-700'}`}
              >
                <ThumbsUp size={18} className={isLiked ? 'fill-white' : ''} /> {formatViews(likeCount)}
              </button>
              <button className="px-4 py-2 hover:bg-zinc-700 transition-colors text-white"><ThumbsUp size={18} className="rotate-180" /></button>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors text-white text-sm font-medium"><Share2 size={18} /> Share</button>
          </div>
        </div>
        <div 
          onClick={() => setIsExpandedDescription(!isExpandedDescription)}
          className="bg-zinc-800/80 rounded-xl p-4 mt-4 text-sm text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <p className="font-semibold">{formatViews(video.statistics.viewCount)} views • {video.snippet.publishedAt.split('T')[0]}</p>
          <p className="mt-2 text-zinc-300 whitespace-pre-line">
            {video.snippet.description.length <= 200 || isExpandedDescription
              ? video.snippet.description
              : `${video.snippet.description.slice(0, 200)}...`}
          </p>
          {video.snippet.description.length > 200 && (
            <button
              type="button"
              className="mt-2 font-semibold text-white hover:underline focus:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpandedDescription(!isExpandedDescription);
              }}
            >
              {isExpandedDescription ? 'Show less' : '...more'}
            </button>
          )}
        </div>
        
        <div className="mt-6">
          <h2 className="text-xl font-bold text-white mb-6">{formatViews(video.statistics.commentCount || comments.length)} Comments</h2>
          <div className="flex gap-4 mb-8">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">ME</div>
            <div className="flex-1">
              <input type="text" placeholder="Add a comment... (Press Enter to post)" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={handlePostComment} className="w-full bg-transparent border-b border-zinc-700 focus:border-white outline-none text-zinc-100 pb-1 transition-colors"/>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {comments.map(comment => <CommentThread key={comment.id} comment={comment} onReply={handleNestedReply} />)}
          </div>
        </div>
      </div>
      
      <div className="flex-1 lg:max-w-[30%] flex flex-col gap-3">
        <h3 className="text-zinc-100 font-bold mb-2">Up next</h3>
        {allVideos.slice(0, 15).filter(v => v.id !== video.id).map((recVideo) => (
            <div key={recVideo.id} className="flex gap-2 cursor-pointer group" onClick={() => onBack(recVideo)}>
              <div className="w-40 flex-shrink-0 relative aspect-video rounded-lg overflow-hidden bg-zinc-800">
                <img src={recVideo.snippet.thumbnails.medium.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="" />
                <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-medium px-1 rounded">{parseDuration(recVideo.contentDetails?.duration || "PT0M0S")}</div>
              </div>
              <div className="flex flex-col py-1">
                <h4 className="text-zinc-100 text-sm font-semibold line-clamp-2 leading-tight group-hover:text-blue-400">{recVideo.snippet.title}</h4>
                <span className="text-zinc-400 text-xs mt-1">{recVideo.snippet.channelTitle}</span>
                <span className="text-zinc-400 text-xs">{formatViews(recVideo.statistics.viewCount)} views</span>
              </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default VideoPlayer;