import React, { useState } from 'react';
import { LogOut, Plus, Search, BookOpen, Film, Shield, Menu as MenuIcon, X } from 'lucide-react';
import { User, Profile } from '../types';
import { supabase } from '../config';

interface MainLayoutProps {
  user: User;
  profile: Profile | null;
  viewMode: 'videos' | 'courses' | 'admin';
  setViewMode: (mode: 'videos' | 'courses' | 'admin') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showAddVideo: boolean;
  setShowAddVideo: (show: boolean) => void;
  showAddCourse: boolean;
  setShowAddCourse: (show: boolean) => void;
  children: React.ReactNode;
}

export default function MainLayout({
  user,
  profile,
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  showAddVideo,
  setShowAddVideo,
  showAddCourse,
  setShowAddCourse,
  children
}: MainLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleViewModeChange = (mode: 'videos' | 'courses' | 'admin') => {
    setViewMode(mode);
    setIsMenuOpen(false);
  };

  const handleAddContent = () => {
    if (viewMode === 'courses') {
      setShowAddCourse(true);
    } else {
      setShowAddVideo(true);
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Video Training Platform</h1>
            
            {/* Mobile menu button */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-md hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <MenuIcon className="h-6 w-6" />
              )}
            </button>

            {/* Desktop navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setViewMode('courses')}
                  className={`btn ${viewMode === 'courses' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Courses
                </button>
                <button
                  onClick={() => setViewMode('videos')}
                  className={`btn ${viewMode === 'videos' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  <Film className="w-4 h-4 mr-2" />
                  Videos
                </button>
                {profile?.is_admin && (
                  <button
                    onClick={() => setViewMode('admin')}
                    className={`btn ${viewMode === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Admin
                  </button>
                )}
              </div>
              {viewMode !== 'admin' && (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={handleAddContent}
                    className="btn btn-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add {viewMode === 'courses' ? 'Course' : 'Video'}
                  </button>
                </>
              )}
              <button
                onClick={() => supabase.auth.signOut()}
                className="btn btn-secondary"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Mobile navigation */}
          <div
            className={`${
              isMenuOpen ? 'flex' : 'hidden'
            } md:hidden flex-col space-y-4 pt-4 border-t mt-4`}
          >
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => handleViewModeChange('courses')}
                className={`btn w-full justify-center ${
                  viewMode === 'courses' ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Courses
              </button>
              <button
                onClick={() => handleViewModeChange('videos')}
                className={`btn w-full justify-center ${
                  viewMode === 'videos' ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                <Film className="w-4 h-4 mr-2" />
                Videos
              </button>
              {profile?.is_admin && (
                <button
                  onClick={() => handleViewModeChange('admin')}
                  className={`btn w-full justify-center ${
                    viewMode === 'admin' ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Admin
                </button>
              )}
            </div>
            {viewMode !== 'admin' && (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button
                  onClick={handleAddContent}
                  className="btn btn-primary w-full justify-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add {viewMode === 'courses' ? 'Course' : 'Video'}
                </button>
              </>
            )}
            <button
              onClick={() => supabase.auth.signOut()}
              className="btn btn-secondary w-full justify-center"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}