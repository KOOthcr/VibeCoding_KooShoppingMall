import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../../services/api';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import './AdminLayout.css';

function AdminLayout({ children }) {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const checkAdminAuth = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('로그인이 필요한 서비스입니다.');
                navigate('/login');
                return;
            }

            try {
                const response = await userAPI.getCurrentUser();
                const user = response.data; // Assuming response.data is the user object or contains it.

                // Based on LoginPage, response.data.user might be the structure on login, 
                // but getCurrentUser typically returns user info directly or wrapped.
                // Let's assume standard response from existing code patterns.
                // If the user object is directly in data: user.userType
                // If wrapped: user.user.userType?
                // Safest to check both or log. Use inspection or standard pattern.
                // Looking at userController.js getUserById returns `res.json(user)`.
                // getCurrentUser in auth.js likely does similar.

                const userType = user.userType || user.user?.userType;

                if (userType !== 'admin') {
                    alert('관리자 권한이 없습니다.');
                    navigate('/');
                    return;
                }

                setIsAdmin(true);
            } catch (error) {
                console.error('Auth check failed:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                alert('세션이 만료되었습니다. 다시 로그인해주세요.');
                navigate('/login');
            } finally {
                setIsLoading(false);
            }
        };

        checkAdminAuth();
    }, [navigate]);

    const handleMenuClick = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const handleCloseSidebar = () => {
        setSidebarOpen(false);
    };

    if (isLoading) {
        return (
            <div className="admin-loading">
                <div className="loading-spinner"></div>
                <p>권한 확인 중...</p>
            </div>
        );
    }

    if (!isAdmin) {
        return null; // Or some access denied view, but navigate handles it.
    }

    return (
        <div className="admin-layout">
            <AdminSidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} />
            <div className="admin-main">
                <AdminHeader onMenuClick={handleMenuClick} />
                <main className="admin-content">{children}</main>
            </div>
        </div>
    );
}

export default AdminLayout;
