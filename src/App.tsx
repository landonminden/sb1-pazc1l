import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './config';
import { Video, Course, User, Profile } from './types';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { Search, Plus, LogOut, BookOpen, Film, Shield } from 'lucide-react';
import VideoCard from './components/VideoCard';
import VideoPlayer from './components/VideoPlayer';
import AddVideoForm from './components/AddVideoForm';
import CourseCard from './components/CourseCard';
import CourseForm from './components/CourseForm';
import CourseEditForm from './components/CourseEditForm';
import CoursePlayer from './components/CoursePlayer';
import AdminDashboard from './components/AdminDashboard';
import MainLayout from './components/MainLayout';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [allVideos, setAllVideos] = useState<Video[]>([]); // Including section breaks
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'not-started' | 'completed'>('all');
  const [viewMode, setViewMode] = useState<'videos' | 'courses' | 'admin'>('courses');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [courseProgress, setCourseProgress] = useState<Record<string, { completed: boolean, inProgress: boolean }>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchVideos();
      fetchCourses();
    }
  }, [user, searchQuery]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);

      let allVideosQuery = supabase.from('videos').select('*');
      if (searchQuery) {
        allVideosQuery = allVideosQuery.ilike('title', `%${searchQuery}%`);
      }
      const { data: allVideosData, error: allVideosError } = await allVideosQuery;
      if (allVideosError) throw allVideosError;
      setAllVideos(allVideosData || []);

      let videosQuery = supabase
        .from('videos')
        .select('*')
        .neq('youtube_url', '-----');
      if (searchQuery) {
        videosQuery = videosQuery.ilike('title', `%${searchQuery}%`);
      }
      const { data: videosData, error: videosError } = await videosQuery;
      if (videosError) throw videosError;
      setVideos(videosData || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching videos');
      console.error('Error fetching videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('courses')
        .select(`
          *,
          videos:course_videos(
            *,
            video:videos(*)
          )
        `);

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data: coursesData, error: coursesError } = await query;
      if (coursesError) throw coursesError;

      if (user) {
        const { data: progressData, error: progressError } = await supabase
          .from('course_progress')
          .select('*')
          .eq('user_id', user.id);

        if (progressError) throw progressError;

        const { data: videoProgressData, error: videoProgressError } = await supabase
          .from('video_progress')
          .select('*')
          .eq('user_id', user.id);

        if (videoProgressError) throw videoProgressError;

        const progress: Record<string, { completed: boolean, inProgress: boolean }> = {};
        coursesData?.forEach(course => {
          const courseProgress = progressData?.find(p => p.course_id === course.id);
          const courseVideoProgress = videoProgressData?.filter(p => p.course_id === course.id) || [];
          const totalVideos = course.videos?.filter(v => v.video?.youtube_url !== '-----').length || 0;
          
          progress[course.id] = {
            completed: courseProgress?.completed || false,
            inProgress: !courseProgress?.completed && courseVideoProgress.length > 0 && courseVideoProgress.length < totalVideos
          };
        });

        setCourseProgress(progress);
      }

      const filteredCourses = coursesData?.filter(course => {
        const progress = courseProgress[course.id];
        switch (filter) {
          case 'completed':
            return progress?.completed;
          case 'in-progress':
            return progress?.inProgress;
          case 'not-started':
            return !progress?.completed && !progress?.inProgress;
          default:
            return true;
        }
      });

      setCourses(filteredCourses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching courses');
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCourses();
    }
  }, [filter]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={['google']}
          />
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <MainLayout
            user={user}
            profile={profile}
            viewMode={viewMode}
            setViewMode={setViewMode}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            showAddVideo={showAddVideo}
            setShowAddVideo={setShowAddVideo}
            showAddCourse={showAddCourse}
            setShowAddCourse={setShowAddCourse}
          >
            {viewMode === 'admin' ? (
              <AdminDashboard />
            ) : (
              <>
                {viewMode === 'courses' && (
                  <div className="flex space-x-4 mb-6">
                    {[
                      { id: 'all', label: 'All Courses' },
                      { id: 'in-progress', label: 'In Progress' },
                      { id: 'not-started', label: 'Not Started' },
                      { id: 'completed', label: 'Completed' }
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setFilter(option.id as typeof filter)}
                        className={`px-4 py-2 rounded-full text-sm font-medium ${
                          filter === option.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                    {error}
                  </div>
                )}

                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {viewMode === 'courses' 
                      ? courses.map((course) => (
                          <CourseCard
                            key={course.id}
                            course={course}
                            onClick={() => window.location.href = `/course/${course.id}`}
                            onEdit={profile?.is_admin ? setEditingCourse : undefined}
                          />
                        ))
                      : videos.map((video) => (
                          <VideoCard
                            key={video.id}
                            video={video}
                            onClick={setSelectedVideo}
                          />
                        ))}
                  </div>
                )}

                {selectedVideo && (
                  <VideoPlayer
                    video={selectedVideo}
                    onClose={() => setSelectedVideo(null)}
                  />
                )}

                {showAddVideo && (
                  <AddVideoForm
                    onClose={() => setShowAddVideo(false)}
                    onVideoAdded={fetchVideos}
                  />
                )}

                {showAddCourse && (
                  <CourseForm
                    onClose={() => setShowAddCourse(false)}
                    onCourseAdded={fetchCourses}
                    availableVideos={allVideos}
                  />
                )}

                {editingCourse && (
                  <CourseEditForm
                    course={editingCourse}
                    onClose={() => setEditingCourse(null)}
                    onCourseUpdated={fetchCourses}
                    availableVideos={allVideos}
                  />
                )}
              </>
            )}
          </MainLayout>
        } />
        <Route path="/course/:courseId" element={<CoursePlayer onClose={() => window.location.href = '/'} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;