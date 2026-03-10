import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoginPage from './pages/Auth/LoginPage.jsx';
import RegisterPage from './pages/Auth/RegisterPage.jsx';
import DashboardLayout from './components/dashboard/DashboardLayout.jsx';
import DashboardHome from './pages/Dashboard/DashboardHome.jsx';
import CreateBotPage from './pages/Dashboard/CreateBotPage.jsx';
import MyBotsPage from './pages/Dashboard/MyBotsPage.jsx';
import EditBotPage from './pages/Dashboard/EditBotPage.jsx';
import StatsPage from './pages/Dashboard/StatsPage.jsx';
import ChatPage from './pages/Chat/ChatPage.jsx';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Auth */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Chat público (sin auth, sin sidebar) */}
          <Route path="/chat/:botId" element={<ChatPage />} />

          {/* Dashboard protegido */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="create" element={<CreateBotPage />} />
              <Route path="bots" element={<MyBotsPage />} />
              <Route path="bots/:id/edit" element={<EditBotPage />} />
              <Route path="stats" element={<StatsPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

