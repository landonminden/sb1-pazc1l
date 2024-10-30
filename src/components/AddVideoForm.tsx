import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../config';

interface AddVideoFormProps {
  onClose: () => void;
  onVideoAdded: () => void;
}

export default function AddVideoForm({ onClose, onVideoAdded }: AddVideoFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_id: '',
    library_id: '326463',
    storage_url: 'https://vz-803138bc-70c.b-cdn.net',
    category: 'programming'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('User not authenticated');

      // For section breaks, only use the title
      if (formData.video_id.trim() === '-----') {
        const { error: supabaseError } = await supabase
          .from('videos')
          .insert([{
            title: formData.title,
            youtube_url: '-----',
            library_id: '-----',
            storage_url: '-----',
            category: formData.category,
            user_id: user.id
          }]);

        if (supabaseError) throw supabaseError;
      } else {
        // Regular video entry
        const { error: supabaseError } = await supabase
          .from('videos')
          .insert([{
            ...formData,
            youtube_url: formData.video_id, // Store just the video ID
            user_id: user.id
          }]);

        if (supabaseError) throw supabaseError;
      }

      onVideoAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while adding the video');
      console.error('Error adding video:', err);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Add New Video</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
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
              <label htmlFor="video_id" className="block text-sm font-medium text-gray-700">
                Video ID
              </label>
              <input
                type="text"
                id="video_id"
                name="video_id"
                required
                placeholder="e.g., fce1613a-fc05-4fec-9de4-298b741dcfe7 or -----"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={formData.video_id}
                onChange={handleChange}
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter the video ID or "-----" for a section break
              </p>
            </div>

            {formData.video_id !== '-----' && (
              <>
                <div>
                  <label htmlFor="library_id" className="block text-sm font-medium text-gray-700">
                    Library ID
                  </label>
                  <input
                    type="text"
                    id="library_id"
                    name="library_id"
                    required={formData.video_id !== '-----'}
                    placeholder="e.g., 803138bc-70c"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={formData.library_id}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="storage_url" className="block text-sm font-medium text-gray-700">
                    Storage URL
                  </label>
                  <input
                    type="text"
                    id="storage_url"
                    name="storage_url"
                    required={formData.video_id !== '-----'}
                    placeholder="e.g., https://vz-803138bc-70c.b-cdn.net"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={formData.storage_url}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}

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
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Video'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}