import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout from './components/PublicLayout';
import DashboardLayout from './components/DashboardLayout';
import Homepage from './pages/Homepage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MyTeam from './pages/MyTeam';
import EventManagement from './pages/EventManagement';
import UserManagement from './pages/UserManagement';
import Grading from './pages/Grading';
import Submission from './pages/Submission';
import TeamExplorer from './pages/TeamExplorer';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import EventResults from './pages/EventResults';
import AuditLogs from './pages/AuditLogs';
import Notifications from './pages/Notifications';
import TeamChat from './pages/TeamChat';
import About from './pages/About';
import ScoringStats from './pages/ScoringStats';
import SubmissionManagement from './pages/SubmissionManagement';
import StudentApproval from './pages/StudentApproval';
import StaffManagement from './pages/StaffManagement';
import AdminMonitoring from './pages/AdminMonitoring';
import AdminSettings from './pages/AdminSettings';
import BackupRestore from './pages/BackupRestore';
import ScoringConfiguration from './pages/ScoringConfiguration';

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/login" replace />;
    return children;
};

const RoleRoute = ({ roles, children }) => {
    const role = localStorage.getItem('role');
    return roles.includes(role) ? children : <Navigate to="/dashboard" replace />;
};

function App() {
    return (
        <BrowserRouter>
            <div className="min-h-screen font-sans text-[#0b1f3f]">
                <Routes>
                    <Route element={<PublicLayout />}>
                        <Route path="/" element={<Homepage />} />
                        <Route path="/events" element={<Events />} />
                        <Route path="/events/:eventId" element={<EventDetail />} />
                        <Route path="/events/:eventId/results" element={<EventResults />} />
                        <Route path="/leaderboard" element={<Leaderboard />} />
                        <Route path="/about" element={<About />} />

                        <Route path="/my-team" element={<ProtectedRoute><MyTeam /></ProtectedRoute>} />
                        <Route path="/teams" element={<ProtectedRoute><TeamExplorer /></ProtectedRoute>} />
                        <Route path="/submissions" element={<ProtectedRoute><Submission /></ProtectedRoute>} />
                        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                        <Route path="/chat" element={<ProtectedRoute><TeamChat /></ProtectedRoute>} />
                        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    </Route>

                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                        <Route index element={<Dashboard />} />
                        <Route path="teams" element={<TeamExplorer />} />
                        <Route path="my-team" element={<Navigate to="/my-team" replace />} />
                        <Route path="submissions" element={<SubmissionManagement />} />
                        <Route path="events" element={<EventManagement />} />
                        <Route path="scoring-config" element={<RoleRoute roles={['COORDINATOR', 'ADMIN']}><ScoringConfiguration /></RoleRoute>} />
                        <Route path="users" element={<RoleRoute roles={['ADMIN']}><UserManagement /></RoleRoute>} />
                        <Route path="monitoring" element={<RoleRoute roles={['ADMIN']}><AdminMonitoring /></RoleRoute>} />
                        <Route path="backups" element={<RoleRoute roles={['ADMIN']}><BackupRestore /></RoleRoute>} />
                        <Route path="settings" element={<RoleRoute roles={['ADMIN']}><AdminSettings /></RoleRoute>} />
                        <Route path="student-approval" element={<StudentApproval />} />
                        <Route path="staff" element={<StaffManagement />} />
                        <Route path="audit-logs" element={<AuditLogs />} />
                        <Route path="grading" element={<Grading />} />
                        <Route path="scoring-stats" element={<ScoringStats />} />
                        <Route path="leaderboard" element={<Leaderboard />} />
                        <Route path="notifications" element={<Notifications />} />
                        <Route path="chat" element={<TeamChat />} />
                        <Route path="profile" element={<Profile />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
