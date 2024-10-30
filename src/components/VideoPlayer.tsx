import React, { useEffect, useRef, useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { Video } from '../types';
import { supabase } from '../config';
import { getBunnyStreamUrls } from '../utils/bunnyStream';

interface VideoPlayerProps {
  video: Video;
  onClose: () => void;
  embedded?: boolean;
  courseId?: string | null;
}

export default function VideoPlayer({ video, onClose, embedded = false, courseId = null }: VideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [progress, setProgress] = useState<number>(0);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) return;

        const { data } = await supabase
          .from('video_progress')
          .select('completed')
          .eq('user_id', user.id)
          .eq('video_id', video.id)
          .eq('course_id', courseId)
          .single();

        if (data) {
          setCompleted(data.completed);
        }
      } catch (error) {
        console.error('Error fetching progress:', error);
      }
    };

    fetchProgress();
  }, [video.id, courseId]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'playerProgress') {
        const currentTime = event.data.currentTime;
        const duration = event.data.duration;
        const progressPercentage = (currentTime / duration) * 100;
        setProgress(progressPercentage);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleComplete = async () => {
    try {
      setLoading(true);
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const now = new Date().toISOString();

      const { error } = await supabase
        .from('video_progress')
        .upsert({
          user_id: user.id,
          video_id: video.id,
          course_id: courseId,
          progress_percentage: progress,
          completed: true,
          completed_at: now,
          last_position: progress,
          updated_at: now
        }, {
          onConflict: 'user_id,video_id,course_id'
        });

      if (error) throw error;

      setCompleted(true);

      if (courseId) {
        await checkCourseCompletion(user.id, courseId);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCourseCompletion = async (userId: string, courseId: string) => {
    try {
      const { data: courseVideos, error: videosError } = await supabase
        .from('course_videos')
        .select('video_id')
        .eq('course_id', courseId);

      if (videosError) throw videosError;

      const { data: videoProgress, error: progressError } = await supabase
        .from('video_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('completed', true);

      if (progressError) throw progressError;

      const totalVideos = courseVideos?.length || 0;
      const completedVideos = videoProgress?.length || 0;
      const isCompleted = completedVideos === totalVideos;
      const now = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('course_progress')
        .upsert({
          user_id: userId,
          course_id: courseId,
          completed: isCompleted,
          completed_at: isCompleted ? now : null,
          total_videos: totalVideos,
          completed_videos: completedVideos,
          updated_at: now
        }, {
          onConflict: 'user_id,course_id'
        });

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error checking course completion:', error);
    }
  };

  if (video.youtube_url === '-----') {
    return null;
  }

  const { embedUrl } = getBunnyStreamUrls(video.storage_url, video.youtube_url, video.library_id);

  const playerContent = (
    <div className="relative w-full h-full" style={{ aspectRatio: '16/9' }}>
      <iframe
        ref={iframeRef}
        src={`${embedUrl}?autoplay=true&loop=false&muted=false&preload=true&responsive=true`}
        className="absolute top-0 left-0 w-full h-full"
        allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
        allowFullScreen
        loading="lazy"
      />
      {progress > 0 && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      <div className="absolute bottom-4 right-4">
        {completed ? (
          <div className="bg-green-500 text-white px-3 py-1.5 rounded-full flex items-center">
            <CheckCircle className="w-4 h-4 mr-1.5" />
            Completed
          </div>
        ) : (
          <button
            onClick={handleComplete}
            disabled={loading}
  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-full flex items-center shadow-lg transition-colors"
  style={{ marginBottom: '15px', marginRight: '15px' }}
          >
            <CheckCircle className="w-4 h-4 mr-1.5" />
            {loading ? 'Marking...' : 'Mark as Complete'}
          </button>
        )}
      </div>
    </div>
  );

  if (embedded) {
    return playerContent;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl">
        <div className="flex justify-between items-center p-4">
          <h2 className="text-2xl font-bold text-gray-800">{video.title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        {playerContent}
        {video.description && (
          <div className="p-4">
            <p className="text-gray-600 whitespace-pre-wrap">{video.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}