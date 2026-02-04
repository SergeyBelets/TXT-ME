import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './utils/AuthContext';
import { setAuthModalHandler } from './services/api';
import { useState, useEffect, Component } from 'react';

import Home from './pages/Home';
import PostsV2 from './pages/PostsV2';
import Login from './pages/Login';
import Register from './pages/Register';
import PostView from './pages/PostView';
import CreatePost from './pages/CreatePost';
import EditPost from './pages/EditPost';
import ProfileEdit from './pages/ProfileEdit';
import ReauthModal from './components/ReauthModal';
import './App.css';

export default function App() {
  const [showReauthModal, setShowReauthModal] = useState(false);

  useEffect(() => {
    // Устанавливаем мост между api.js и этим компонентом
    setAuthModalHandler(() => {
      setShowReauthModal(true);
    });
  }, []);

  return (
    <Router>
    <AuthProvider>
    <Routes>
    {/* Статические роуты (твои оригинальные пути) */}
    <Route path="/" element={<Home />} />
    <Route path="/posts" element={<PostsV2 />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/posts/new" element={<CreatePost />} />
    <Route path="/profile/edit" element={<ProfileEdit />} />

    {/* Динамические роуты */}
    <Route path="/posts/:postId/edit" element={<EditPost />} />
    <Route path="/posts/:postId" element={<PostView />} />

    {/* Редирект для всего остального */}
    <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>

    {showReauthModal && (
      <ReauthModal onClose={() => setShowReauthModal(false)} />
    )}
    </AuthProvider>
    </Router>
  );
}
