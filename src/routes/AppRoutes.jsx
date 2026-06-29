import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '../pages/public/LandingPage';
import AdminDashboard from '../pages/admin/AdminDashboard';
import CoordinatorDashboard from '../pages/coordinator/CoordinatorDashboard';
import CreateEvent from '../pages/coordinator/CreateEvent';
import AuditLogScoring from '../pages/coordinator/AuditLogScoring';
import StaffDashboard from '../pages/staff/StaffDashboard';

export default function AppRoutes() {
    return (
        <Router>
            <Routes>
                {/* Các trang công cộng */}
                <Route path="/" element={<LandingPage />} />

                {/* Phân hệ ADMIN (Người mua hệ thống) */}
                <Route path="/admin/dashboard" element={<AdminDashboard />} />

                {/* Phân hệ COORDINATOR (Ban tổ chức) */}
                <Route path="/coordinator/dashboard" element={<CoordinatorDashboard />} />
                <Route path="/coordinator/create-event" element={<CreateEvent />} />
                <Route path="/coordinator/audit-log" element={<AuditLogScoring />} />

                {/* Phân hệ STAFF (Judge & Mentor đa nhiệm) */}
                <Route path="/staff/dashboard" element={<StaffDashboard />} />

                {/* Bắt các đường dẫn bậy bạ về trang chủ */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}