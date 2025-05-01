import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import HomePage from './pages/HomePage';
import DebatePage from './pages/DebatePage';
import AuthCallback from './pages/AuthCallback';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/debate/:debateId" element={<DebatePage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;