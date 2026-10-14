import React from 'react';
import { MoreVertical } from 'lucide-react';
import { formatViews, parseDuration } from '../utils/helpers';
import { YouTubeVideo } from '../types';

interface VideoCardProps {
  video: YouTubeVideo;
  onClick: (video: YouTubeVideo) => void;
  isHorizontal?: boolean;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onClick, isHorizontal = false }) => {
  const duration = parseDuration(video.contentDetails.duration);
  const views = formatViews(video.statistics.viewCount);
  const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${video.snippet.channelTitle}`;

  if (isHorizontal) {
    return (
      <div className="flex gap-4 cursor-pointer group w-full mb-4" onClick={() => onClick(video)}>
        <div className="w-40 sm:w-64 flex-shrink-0 relative aspect-video rounded-xl overflow-hidden bg-zinc-800">
          <img src={video.snippet.thumbnails.medium.url} alt={video.snippet.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] sm:text-xs font-medium px-1 sm:px-1.5 py-0.5 rounded">{duration}</div>
        </div>
        <div className="flex flex-col py-1 overflow-hidden">
          <h4 className="text-zinc-100 text-sm sm:text-lg font-semibold line-clamp-2 leading-tight group-hover:text-blue-400">{video.snippet.title}</h4>
          <span className="text-zinc-400 text-xs sm:text-sm mt-1 sm:mt-2 line-clamp-1">{video.snippet.channelTitle}</span>
          <span className="text-zinc-400 text-xs sm:text-sm mt-1">{views} views</span>
          <p className="text-zinc-500 text-xs mt-2 hidden sm:line-clamp-2">{video.snippet.description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 cursor-pointer group" onClick={() => onClick(video)}>
      <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-800">
        <img src={video.snippet.thumbnails.medium.url} alt={video.snippet.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded">{duration}</div>
      </div>
      <div className="flex gap-3 pr-6">
        <img src={avatar} alt={video.snippet.channelTitle} className="w-9 h-9 rounded-full bg-zinc-800 flex-shrink-0" />
        <div className="flex flex-col">
          <h3 className="text-zinc-100 font-semibold text-sm line-clamp-2 leading-tight group-hover:text-blue-400 transition-colors">{video.snippet.title}</h3>
          <span className="text-zinc-400 text-sm mt-1 hover:text-zinc-300">{video.snippet.channelTitle}</span>
          <div className="text-zinc-400 text-sm flex items-center gap-1">
            <span>{views} views</span>
            <span className="text-[10px]">•</span>
            <span>{video.snippet.publishedAt.split('T')[0]}</span>
          </div>
        </div>
        <button className="opacity-0 group-hover:opacity-100 ml-auto self-start p-1 text-zinc-100 hover:bg-zinc-800 rounded-full transition-all" onClick={(e) => e.stopPropagation()}><MoreVertical size={18} /></button>
      </div>
    </div>
  );
};

export default VideoCard;