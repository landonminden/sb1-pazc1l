import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle, ArrowLeft, Menu, X, Home } from 'lucide-react';
import { Course, Video, VideoProgress } from '../types';
import VideoPlayer from './VideoPlayer';
import { supabase } from '../config';

interface CoursePlayerProps {
  onClose: () => void;
}

export default function CoursePlayer({ onClose }: CoursePlayerProps) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number | null>(null);
  const [videoProgress, setVideoProgress] = useState<Record<string, VideoProgress>>({});
  const [courseCompleted, setCourseCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(window.innerWidth > 450);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 450);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 450;
      setIsMobile(mobile);
      setShowSidebar(!mobile);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          videos:course_videos(
            *,
            video:videos(*)
          )
        `)
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);
      await fetchProgress(courseData);
    } catch (error) {
      console.error('Error fetching course:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async (courseData: Course) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data: progressData, error: progressError } = await supabase
        .from('video_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId);

      if (progressError) throw progressError;

      const progressMap: Record<string, VideoProgress> = {};
      progressData?.forEach(progress => {
        progressMap[progress.video_id] = progress;
      });
      setVideoProgress(progressMap);

      const sortedVideos = courseData.videos
        ?.sort((a, b) => a.order_index - b.order_index)
        .map(cv => cv.video)
        .filter((v): v is Video => !!v) || [];

      const firstUnwatchedIndex = sortedVideos.findIndex(
        video => !progressMap[video.id]?.completed && video.youtube_url !== '-----'
      );
      setCurrentVideoIndex(firstUnwatchedIndex >= 0 ? firstUnwatchedIndex : 0);

      const { data: courseProgress, error: courseError } = await supabase
        .from('course_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();

      if (courseError && courseError.code !== 'PGRST116') throw courseError;
      setCourseCompleted(courseProgress?.completed || false);
    } catch (error) {
      console.error('Error fetching progress:', error);
      setCurrentVideoIndex(0);
    }
  };

  const sortedVideos = course?.videos
    ?.sort((a, b) => a.order_index - b.order_index)
    .map(cv => cv.video)
    .filter((v): v is Video => !!v) || [];

  const handlePrevVideo = () => {
    if (currentVideoIndex === null) return;
    let prevIndex = currentVideoIndex - 1;
    while (prevIndex >= 0 && sortedVideos[prevIndex].youtube_url === '-----') {
      prevIndex--;
    }
    if (prevIndex >= 0) setCurrentVideoIndex(prevIndex);
  };

  const handleNextVideo = () => {
    if (currentVideoIndex === null) return;
    let nextIndex = currentVideoIndex + 1;
    while (nextIndex < sortedVideos.length && sortedVideos[nextIndex].youtube_url === '-----') {
      nextIndex++;
    }
    if (nextIndex < sortedVideos.length) setCurrentVideoIndex(nextIndex);
  };

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!course || currentVideoIndex === null) return null;

  const currentVideo = sortedVideos[currentVideoIndex];
  const watchableVideosCount = sortedVideos.filter(v => v.youtube_url !== '-----').length;
  const currentWatchableIndex = sortedVideos
    .filter(v => v.youtube_url !== '-----')
    .findIndex(v => v.id === currentVideo.id);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex space-x-2">
                <button
                  onClick={() => navigate('/')}
                  className="p-2 hover:bg-gray-100 rounded-full flex items-center text-gray-700"
                >
                  <Home className="w-5 h-5 mr-1" />
                  <span className="hidden sm:inline">Dashboard</span>
                </button>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-800">
                  {course.title}
                  {currentVideo.youtube_url !== '-----' && (
                    <span className="text-gray-500 text-lg ml-2">
                      • {currentVideo.title}
                    </span>
                  )}
                </h1>
                {currentVideo.youtube_url !== '-----' && (
                  <p className="text-sm text-gray-600">
                    Video {currentWatchableIndex + 1} of {watchableVideosCount}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {courseCompleted && (
                <span className="hidden sm:flex items-center text-green-600">
                  <CheckCircle className="w-5 h-5 mr-1" />
                  Course Completed
                </span>
              )}
              <button
                onClick={toggleSidebar}
                className="p-2 hover:bg-gray-100 rounded-full"
                aria-label="Toggle course content"
              >
                {showSidebar ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex relative">
        <div className={`${
          isMobile ? 'w-full' : showSidebar ? 'w-3/4' : 'w-full'
        } bg-black transition-all duration-300`}>
          {currentVideo.youtube_url !== '-----' && (
            <VideoPlayer
              video={currentVideo}
              onClose={() => {}}
              embedded
              courseId={course.id}
            />
          )}
        </div>

        <div 
          className={`${
            isMobile 
              ? `fixed right-0 top-0 bottom-0 ${showSidebar ? 'w-[70%]' : 'w-0'}`
              : showSidebar ? 'w-1/4' : 'w-0'
          } bg-white border-l overflow-hidden transition-all duration-300 h-full z-50`}
        >
          <div className="p-4 h-full overflow-y-auto">
            <h3 className="font-semibold text-gray-700 mb-2">Course Content</h3>
            <div className="space-y-2">
              {sortedVideos.map((video, index) => {
                const progress = videoProgress[video.id];
                const isSection = video.youtube_url === '-----';

                return (
                  <button
                    key={video.id}
                    onClick={() => {
                      if (!isSection) {
                        setCurrentVideoIndex(index);
                        if (isMobile) {
                          setShowSidebar(false);
                        }
                      }
                    }}
                    disabled={isSection}
                    className={`w-full text-left p-2 rounded ${
                      isSection
                        ? 'bg-gray-100 cursor-default font-semibold'
                        : index === currentVideoIndex
                        ? 'bg-blue-50 text-blue-700'
                        : progress?.completed
                        ? 'bg-green-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      {!isSection && (
                        <span className="w-6 text-sm text-gray-500">
                          {sortedVideos.slice(0, index).filter(v => v.youtube_url !== '-----').length + 1}.
                        </span>
                      )}
                      <span className="flex-1 text-sm font-medium truncate">
                        {video.title}
                      </span>
                      {!isSection && progress?.completed && (
                        <CheckCircle className="w-4 h-4 text-green-600 ml-2" />
                      )}
                    </div>
                    {!isSection && progress && (
                      <div className="mt-1 h-1 bg-gray-200 rounded-full">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-300"
                          style={{ width: `${progress.progress_percentage}%` }}
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Overlay when mobile sidebar is open */}
        {isMobile && showSidebar && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowSidebar(false)}
          />
        )}
      </div>

      <div className="bg-white border-t py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button
            onClick={handlePrevVideo}
            disabled={currentVideoIndex === 0}
            className={`btn ${
              currentVideoIndex === 0 ? 'text-gray-400' : 'btn-secondary'
            }`}
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            <span className="hidden sm:inline">Previous</span>
          </button>
          <button
            onClick={handleNextVideo}
            disabled={currentVideoIndex === sortedVideos.length - 1}
            className={`btn ${
              currentVideoIndex === sortedVideos.length - 1
                ? 'text-gray-400'
                : 'btn-primary'
            }`}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-5 h-5 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}