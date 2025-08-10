'use client';

import { useState } from 'react';
import { Header } from '@/components/layouts/Header';
import { Sidebar } from '@/components/layouts/Sidebar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AudioContextProvider } from '@/components/features/GlobalAudioPlayer/AudioContextProvider';
import { PlayerContainer } from '@/components/features/GlobalAudioPlayer/PlayerContainer';
import { AgeRatingProvider } from '@/lib/contexts/AgeRatingContext';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    console.log('toggleSidebar called, current state:', isSidebarOpen);
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <ProtectedRoute requireAuth={false}>
      <AgeRatingProvider>
        <AudioContextProvider>
          <div className="min-h-screen bg-gray-50">
            <Header onMenuToggle={toggleSidebar} />
            
            <div className="flex">
              <Sidebar 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)}
                onToggle={toggleSidebar}
              />
              
              <main className={`flex-1 transition-all duration-300 ease-in-out ${
                isSidebarOpen ? 'md:ml-64' : 'md:ml-0'
              } pb-16`}>
                {children}
              </main>
            </div>
            
            {/* グローバル音声プレイヤー */}
            <PlayerContainer />
          </div>
        </AudioContextProvider>
      </AgeRatingProvider>
    </ProtectedRoute>
  );
}