// components/Navbar.tsx
import React, { useState, useEffect } from 'react';
import './Navbar.css';
import logo from '../assets/logo-avocarbon-1-removebg-preview.png';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        {/* Logo Section */}
        <div className="nav-logo">
          <div >
            <img 
              src={logo} 
              alt="AvoCarbon Logo" 
              className="logo-img"
            />
          </div>
        </div>

        {/* Navigation Links */}
        <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <div className="nav-links">
            <a href="#rfqs" className="nav-link active">
              <span className="nav-icon">📋</span>
              <span className="nav-text">RFQs List</span>
              <div className="link-underline"></div>
            </a>
      
          </div>

          {/* Right Section */}
          <div className="nav-right">
            {/* Notifications */}
            <div className="nav-item notification">
              <div className="notification-bell">
                <span className="bell-icon">🔔</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className={`nav-toggle ${isMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span className="toggle-line"></span>
          <span className="toggle-line"></span>
          <span className="toggle-line"></span>
        </button>
      </div>

      {/* Background Overlay for Mobile */}
      {isMenuOpen && (
        <div 
          className="nav-overlay" 
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </nav>
  );
};

export default Navbar;