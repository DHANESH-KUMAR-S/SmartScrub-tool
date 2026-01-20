import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    {
      path: '/',
      label: 'Dashboard',
      icon: '📊',
      description: 'Overview & Analytics'
    },
    {
      path: '/upload',
      label: 'Upload Data',
      icon: '📁',
      description: 'Import CSV Files'
    },
    {
      path: '/profile',
      label: 'Data Profile',
      icon: '🔍',
      description: 'Analyze Quality'
    },
    {
      path: '/cleaning',
      label: 'Manual Clean',
      icon: '🛠️',
      description: 'Custom Rules'
    },
    {
      path: '/auto-clean',
      label: 'AI Suggestions',
      icon: '🤖',
      description: 'Smart Recommendations'
    },
    {
      path: '/export',
      label: 'Export Data',
      icon: '💾',
      description: 'Download Results'
    }
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>✨</span>
          <span className={styles.logoText}>SmartScrub</span>
        </div>
        <p className={styles.tagline}>Smart Data Cleaning Platform</p>
      </div>

      <nav className={styles.navigation}>
        <ul className={styles.menuList}>
          {menuItems.map((item) => (
            <li key={item.path} className={styles.menuItem}>
              <Link
                to={item.path}
                className={`${styles.menuLink} ${
                  location.pathname === item.path ? styles.active : ''
                }`}
              >
                <span className={styles.menuIcon}>{item.icon}</span>
                <div className={styles.menuContent}>
                  <span className={styles.menuLabel}>{item.label}</span>
                  <span className={styles.menuDescription}>{item.description}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.footer}>
        <div className={styles.status}>
          <div className={styles.statusIndicator}></div>
          <span className={styles.statusText}>System Online</span>
        </div>
        <p className={styles.version}>v1.0.0</p>
      </div>
    </aside>
  );
};

export default Sidebar;