import { Link } from 'react-router-dom';
import './AdminHeader.css';

function AdminHeader({ onMenuClick }) {
    return (
        <header className="admin-header">
            <div className="header-content">
                <button className="menu-button" onClick={onMenuClick}>
                    <svg className="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                <Link to="/admin" className="header-logo">
                    KOO Admin
                </Link>

                <Link to="/" className="store-button">
                    <svg className="store-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                </Link>
            </div>
        </header>
    );
}

export default AdminHeader;
