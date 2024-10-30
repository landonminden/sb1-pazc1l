import React, { useState } from 'react';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';
import { supabase } from '../config';
import { Video } from '../types';

interface CourseFormProps {
  onClose: () => void;
  onCourseAdded: () => void;
  availableVideos: Video[];
}

export default function CourseForm({ onClose, onCourseAdded, availableVideos }: CourseFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'programming',
    thumbnail_url: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      // Create course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .insert([
          {
            ...formData,
            user_id: user.id
          }
        ])
        .select()
        .single();

      if (courseError) throw courseError;

      // Add videos to course
      const courseVideos = selectedVideos.map((videoId, index) => ({
        course_id: courseData.id,
        video_id: videoId,
        order_index: index
      }));

      const { error: videosError } = await supabase
        .from('course_videos')
        .insert(courseVideos);

      if (videosError) throw videosError;

      onCourseAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while creating the course');
      console.error('Error creating course:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

  const moveVideo = (fromIndex: number, toIndex: number) => {
    setSelectedVideos(prev => {
      const newOrder = [...prev];
      const [moved] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, moved);
      return newOrder;
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6 m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Create New Course</h2>
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
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category"
                name="category"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="programming">Programming</option>
                <option value="design">Design</option>
                <option value="business">Business</option>
                <option value="marketing">Marketing</option>
              </select>
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
                Course Videos
              </label>
              <div className="border rounded-md divide-y">
                {selectedVideos.map((videoId, index) => {
                  const video = availableVideos.find(v => v.id === videoId);
                  return (
                    <div key={videoId} className="flex items-center p-3 bg-gray-50">
                      <GripVertical className="w-5 h-5 text-gray-400 cursor-move mr-2" />
                      <span className="flex-1">{video?.title}</span>
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
                  {availableVideos
                    .filter(video => !selectedVideos.includes(video.id))
                    .map(video => (
                      <div key={video.id} className="flex items-center p-3">
                        <span className="flex-1">{video.title}</span>
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

          <div className="flex justify-end space-x-3">
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
              {loading ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}