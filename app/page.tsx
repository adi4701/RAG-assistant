'use client';
import React, { useState } from 'react';
import { AuthProvider, useAuth } from '@/components/AuthContext';
import AuthPage from '@/components/AuthPage';
import ChatInterface from '@/components/ChatInterface';
import UploadPanel from '@/components/UploadPanel';
import { ToastProvider } from '@/components/Toast';
import { PanelLeftOpen, X } from 'lucide-react';

function AppShell() {
  const [showAuth, setShowAuth] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploadKey, setUploadKey] = useState(0);
  
  const { user } = useAuth();

  if (!user) {
    return <AuthPage onSuccess={() => setShowAuth(false)} />;
  }

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 shadow-xl md:shadow-none transform transition-transform duration-300 ease-in-out flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:hidden'}
      `}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100 md:hidden">
          <h2 className="font-semibold text-gray-800">Documents</h2>
          <button onClick={() => setSidebarOpen(false)} className="p-1 text-gray-500 hover:bg-gray-100 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <UploadPanel key={uploadKey} onDocumentUploaded={() => setUploadKey(k => k + 1)} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {!sidebarOpen && (
          <button 
            onClick={() => setSidebarOpen(true)}
            className="absolute top-3 left-3 z-20 p-1.5 bg-white border border-gray-200 rounded-md shadow-sm text-gray-600 hover:bg-gray-50 hidden md:block"
            title="Open sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}
        
        <ChatInterface />

        {/* Mobile Toggle */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed bottom-20 right-4 z-30 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700"
        >
          <PanelLeftOpen className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ToastProvider>
  );
}
