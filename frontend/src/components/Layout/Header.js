import React from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkflow } from '../../contexts/WorkflowContext';
import Button from '../UI/Button';
import styles from './Header.module.css';

const Header = ({ onOpenCanvas, hasDataset }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { datasetId } = useParams();
  const { user, isAuthenticated, logout } = useAuth();
  const { currentDataset } = useWorkflow();

  const steps = [
    { id: 1, label: 'Upload', path: '/upload', icon: '📁', description: 'Import your data' },
    { id: 2, label: 'Profile', path: '/profile', icon: '📊', description: 'Analyze data quality', requiresDataset: true },
    { id: 3, label: 'Clean', path: '/cleaning', icon: '🛠️', description: 'Clean your data', requiresDataset: true },
    { id: 4, label: 'AI Clean', path: '/auto-clean', icon: '🤖', description: 'AI suggestions', requiresDataset: true },
    { id: 5, label: 'Export', path: '/export', icon: '💾', description: 'Download results', requiresDataset: true }
  ];

  const getCurrentStep = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 0;
    if (path === '/upload') return 1;
    if (path.includes('/profile')) return 2;
    if (path.includes('/cleaning')) return 3;
    if (path.includes('/auto-clean')) return 4;
    if (path.includes('/export')) return 5;
    return 0;
  };

  const activeStep = getCurrentStep();
  const workingDatasetId = datasetId || currentDataset?.id;

  const handleStepClick = (step) => {
    if (step.requiresDataset && !workingDatasetId) {
      // If no dataset, go to upload first
      navigate('/upload');
      return;
    }

    if (workingDatasetId && step.requiresDataset) {
      navigate(`${step.path}/${workingDatasetId}`);
    } else {
      navigate(step.path);
    }
  };

  const showCanvasButton = workingDatasetId && activeStep >= 2;

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        {/* Logo */}
        <div className={styles.leftSection}>
          <button 
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
            className={styles.logo}
          >
            <span className={styles.logoIcon}>✨</span>
            <span className={styles.logoText}>SmartScrub</span>
          </button>
        </div>

        {/* Step Navigation */}
        <div className={styles.stepNavigation}>
          {steps.map((step, index) => {
            const isActive = activeStep === step.id;
            const isCompleted = activeStep > step.id;
            const isDisabled = step.requiresDataset && !workingDatasetId;
            
            return (
              <div key={step.id} className={styles.stepContainer}>
                <button
                  onClick={() => handleStepClick(step)}
                  disabled={isDisabled}
                  className={`${styles.stepButton} ${
                    isActive ? styles.active : ''
                  } ${isCompleted ? styles.completed : ''} ${
                    isDisabled ? styles.disabled : ''
                  }`}
                >
                  <div className={styles.stepNumber}>
                    {isCompleted ? '✓' : step.id}
                  </div>
                  <div className={styles.stepContent}>
                    <span className={styles.stepLabel}>{step.label}</span>
                    <span className={styles.stepDescription}>{step.description}</span>
                  </div>
                </button>
                
                {index < steps.length - 1 && (
                  <div className={`${styles.stepConnector} ${
                    isCompleted ? styles.connectorCompleted : ''
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Right Actions */}
        <div className={styles.rightSection}>
          {showCanvasButton && (
            <Button
              variant="primary"
              size="small"
              onClick={() => onOpenCanvas(workingDatasetId)}
              className={styles.canvasButton}
            >
              🎨 Canvas
            </Button>
          )}
          
          <div className={styles.userProfile}>
            <div className={styles.avatar}>
              <span>{isAuthenticated ? user?.full_name?.charAt(0) || user?.email?.charAt(0) || '👤' : '👤'}</span>
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>
                {isAuthenticated ? (user?.full_name || user?.email || 'User') : 'Guest User'}
              </span>
              <span className={styles.userRole}>
                {isAuthenticated ? 'Premium User' : 'Guest Mode'}
              </span>
            </div>
            {isAuthenticated && (
              <button 
                className={styles.logoutBtn}
                onClick={logout}
                title="Logout"
              >
                🚪
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;