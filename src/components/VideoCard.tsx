import React from 'react';
import { Play } from 'lucide-react';
import { Video } from '../types';
import { getBunnyStreamUrls } from '../utils/bunnyStream';

interface VideoCardProps {
  video: Video;
  onClick: (video: Video) => void;
}

export default function VideoCard({ video, onClick }: VideoCardProps) {
  // Check if this is a section break
  if (video.youtube_url === '-----') {
    return (
      <div className="bg-gray-100 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800">{video.title}</h3>
      </div>
    );
  }

  const { thumbnailUrl, previewAnimationUrl } = getBunnyStreamUrls(video.storage_url, video.youtube_url, video.library_id);

  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-transform hover:scale-105"
      onClick={() => onClick(video)}
    >
      <div className="relative group">
        <img 
          src={thumbnailUrl}
          alt={video.title}
          className="w-full h-48 object-cover transition-opacity duration-300 group-hover:opacity-0"
        />
        <img
          src={previewAnimationUrl}
          alt={`${video.title} preview`}
          className="absolute inset-0 w-full h-48 object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        />
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="w-12 h-12 text-white" />
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{video.title}</h3>
        {video.description && (
          <p className="text-gray-600 text-sm line-clamp-2">{video.description}</p>
        )}
      </div>
    </div>
  );
}