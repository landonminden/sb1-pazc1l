import React, { useState } from 'react';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';
import { supabase } from '../config';
import { Video, Course } from '../types';

interface CourseEditFormProps {
  course: Course;
  onClose: () => void;
  onCourseUpdated: () => void;
  availableVideos: Video[];
}

export default function CourseEditForm({ course, onClose, onCourseUpdated, availableVideos }: CourseEditFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<string[]>(
    course.videos?.sort((a, b) => a.order_index - b.order_index).map(v => v.video_id) || []
  );
  const [formData, setFormData] = useState({
    title: course.title,
    description: course.description || '',
    thumbnail_url: course.thumbnail_url || ''
  });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      // Update course details
      const { error: courseError } = await supabase
        .from('courses')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', course.id);

      if (courseError) throw courseError;

      // Delete existing course videos
      const { error: deleteError } = await supabase
        .from('course_videos')
        .delete()
        .eq('course_id', course.id);

      if (deleteError) throw deleteError;

      // Add new course videos with updated order
      if (selectedVideos.length > 0) {
        const courseVideos = selectedVideos.map((videoId, index) => ({
          course_id: course.id,
          video_id: videoId,
          order_index: index
        }));

        const { error: videosError } = await supabase
          .from('course_videos')
          .insert(courseVideos);

        if (videosError) throw videosError;
      }

      onCourseUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while updating the course');
      console.error('Error updating course:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleVideoToggle = (videoId: string) => {
    setSelectedVideos(prev => {
      if (prev.includes(videoId)) {
        return prev.filter(id => id !== videoId);
      }
      return [...prev, videoId];
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    if (draggedIndex !== index) {
      const newVideos = [...selectedVideos];
      const [draggedVideo] = newVideos.splice(draggedIndex, 1);
      newVideos.splice(index, 0, draggedVideo);
      setSelectedVideos(newVideos);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', course.id);

      if (error) throw error;

      onCourseUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while deleting the course');
      console.error('Error deleting course:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sort videos to put section breaks at the bottom
  const sortedSelectedVideos = selectedVideos.sort((a, b) => {
    const videoA = availableVideos.find(v => v.id === a);
    const videoB = availableVideos.find(v => v.id === b);
    if (videoA?.youtube_url === '-----' && videoB?.youtube_url !== '-----') return 1;
    if (videoA?.youtube_url !== '-----' && videoB?.youtube_url === '-----') return -1;
    return 0;
  });

  // Sort available videos to put section breaks at the bottom
  const sortedAvailableVideos = availableVideos
    .filter(video => !selectedVideos.includes(video.id))
    .sort((a, b) => {
      if (a.youtube_url === '-----' && b.youtube_url !== '-----') return 1;
      if (a.youtube_url !== '-----' && b.youtube_url === '-----') return -1;
      return 0;
    });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6 m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Edit Course</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Course Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={formData.title}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="thumbnail_url" className="block text-sm font-medium text-gray-700">
                Thumbnail URL
              </label>
              <input
                type="url"
                id="thumbnail_url"
                name="thumbnail_url"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={formData.thumbnail_url}
                onChange={handleChange}
                placeholder="https://example.com/thumbnail.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Videos (Drag to reorder)
              </label>
              <div className="border rounded-md divide-y">
                {sortedSelectedVideos.map((videoId, index) => {
                  const video = availableVideos.find(v => v.id === videoId);
                  const isSection = video?.youtube_url === '-----';
                  return (
                    <div
                      key={videoId}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center p-3 ${
                        isSection ? 'bg-gray-100' : 'bg-gray-50'
                      } ${draggedIndex === index ? 'opacity-50' : ''}`}
                    >
                      <GripVertical className="w-5 h-5 text-gray-400 cursor-move mr-2" />
                      <span className="flex-1">
                        {isSection ? `Section: ${video.title}` : video.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleVideoToggle(videoId)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available Videos
                </label>
                <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                  {sortedAvailableVideos.map(video => (
                    <div key={video.id} className="flex items-center p-3">
                      <span className="flex-1">
                        {video.youtube_url === '-----' ? `Section: ${video.title}` : video.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleVideoToggle(video.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Plus className="w-4 h-4 text-blue-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleDelete}
              className="btn bg-red-600 hover:bg-red-700 text-white"
              disabled={loading}
            >
              Delete Course
            </button>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || selectedVideos.length === 0}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}