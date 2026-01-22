import { Link, useLocation } from 'react-router-dom';
import './AdminSidebar.css';

const navItems = [
    { href: "/admin", label: "대시보드", icon: "📊" },
    { href: "/admin/products", label: "상품 관리", icon: "📦" },
    { href: "/admin/orders", label: "주문 조회", icon: "🛒" },
    { href: "/admin/analytics", label: "매출 분석", icon: "📈" },
    { href: "/admin/customers", label: "고객 관리", icon: "👥" },
];

function AdminSidebar({ isOpen, onClose }) {
    const location = useLocation();

    const isActive = (href) => {
        if (href === "/admin") {
            return location.pathname === "/admin";
        }
        return location.pathname.startsWith(href);
    };

    return (
        <>
            {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
            <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
                <Link to="/admin" className="sidebar-logo">
                    <span className="logo-icon">🏪</span>
                    <span className="logo-text">KOO Admin</span>
                </Link>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
                            onClick={onClose}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <Link to="/" className="footer-link">
                        <span className="nav-icon">🏠</span>
                        쇼핑몰로 이동
                    </Link>
                </div>
            </aside>
        </>
    );
}

export default AdminSidebar;
