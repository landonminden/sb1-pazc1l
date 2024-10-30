import React, { useEffect, useState } from 'react';
import { Play, BookOpen, CheckCircle, Clock, Edit } from 'lucide-react';
import { Course } from '../types';
import { supabase } from '../config';

interface CourseCardProps {
  course: Course;
  onClick: (course: Course) => void;
  onEdit?: (course: Course) => void;
}

export default function CourseCard({ course, onClick, onEdit }: CourseCardProps) {
  const [progress, setProgress] = useState<{
    completed: boolean;
    inProgress: boolean;
    completedVideos: number;
    totalVideos: number;
  }>({
    completed: false,
    inProgress: false,
    completedVideos: 0,
    totalVideos: 0
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const videoCount = course.videos?.filter(v => v.video?.youtube_url !== '-----').length || 0;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) return;

        // Fetch user profile to check admin status
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        setIsAdmin(profile?.is_admin || false);

        // Get all videos in the course (excluding section breaks)
        const courseVideos = course.videos?.filter(v => v.video?.youtube_url !== '-----') || [];
        const totalVideos = courseVideos.length;

        // Fetch video progress for all videos in the course
        const { data: videoProgress, error: progressError } = await supabase
          .from('video_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('course_id', course.id)
          .eq('completed', true);

        if (progressError && progressError.code !== 'PGRST116') {
          console.error('Error fetching video progress:', progressError);
          return;
        }

        const completedVideos = videoProgress?.length || 0;
        const isCompleted = completedVideos === totalVideos && totalVideos > 0;
        const isInProgress = completedVideos > 0 && !isCompleted;

        setProgress({
          completed: isCompleted,
          inProgress: isInProgress,
          completedVideos,
          totalVideos
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [course.id, course.videos]);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(course);
  };

  const getProgressBadge = () => {
    if (progress.completed) {
      return (
        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full flex items-center text-sm">
          <CheckCircle className="w-4 h-4 mr-1" />
          Completed
        </div>
      );
    } else if (progress.inProgress) {
      return (
        <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-full flex items-center text-sm">
          <Clock className="w-4 h-4 mr-1" />
          In Progress ({progress.completedVideos}/{progress.totalVideos})
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-transform hover:scale-105"
      onClick={() => onClick(course)}
    >
      <div className="relative">
        <img 
          src={course.thumbnail_url || 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'} 
          alt={course.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <Play className="w-12 h-12 text-white" />
        </div>
        {getProgressBadge()}
        {isAdmin && onEdit && (
          <button
            onClick={handleEdit}
            className="absolute top-2 left-2 bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-opacity"
          >
            <Edit className="w-4 h-4 text-gray-700" />
          </button>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{course.title}</h3>
        {course.description && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">{course.description}</p>
        )}
        <div className="flex items-center justify-end text-gray-600 text-sm">
          <BookOpen className="w-4 h-4 mr-1" />
          {videoCount} {videoCount === 1 ? 'video' : 'videos'}
        </div>
      </div>
    </div>
  );
}