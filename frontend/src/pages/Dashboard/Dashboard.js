import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflow } from '../../contexts/WorkflowContext';
import { uploadAPI } from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentDataset, currentStep, completedSteps, resetWorkflow, updateDataset } = useWorkflow();
  const [recentDatasets, setRecentDatasets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentDatasets();
  }, []);

  const loadRecentDatasets = async () => {
    try {
      const response = await uploadAPI.listDatasets();
      setRecentDatasets(response.datasets?.slice(0, 5) || []); // Show last 5 datasets
    } catch (error) {
      console.error('Error loading datasets:', error);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, label: 'Upload Data', icon: '📁', description: 'Import your CSV file' },
    { id: 2, label: 'Data Profile', icon: '📊', description: 'Analyze data quality' },
    { id: 3, label: 'Manual Clean', icon: '🛠️', description: 'Apply cleaning rules' },
    { id: 4, label: 'AI Clean', icon: '🤖', description: 'Get AI suggestions' },
    { id: 5, label: 'Export', icon: '💾', description: 'Download cleaned data' }
  ];

  const getStepStatus = (stepId) => {
    if (completedSteps.has(stepId)) return 'completed';
    if (currentStep === stepId) return 'active';
    if (currentStep > stepId) return 'completed';
    return 'pending';
  };

  const handleStepClick = (step) => {
    if (step.id === 1) {
      navigate('/upload');
    } else if (currentDataset) {
      const paths = {
        2: `/profile/${currentDataset.id}`,
        3: `/cleaning/${currentDataset.id}`,
        4: `/auto-clean/${currentDataset.id}`,
        5: `/export/${currentDataset.id}`
      };
      navigate(paths[step.id]);
    } else {
      navigate('/upload');
    }
  };

  const handleDatasetClick = (dataset) => {
    // Update workflow context with selected dataset
    updateDataset({
      id: dataset.dataset_id,
      filename: dataset.filename,
      rows: dataset.original_shape?.[0] || 0,
      columns: dataset.original_shape?.[1] || 0
    });
    navigate(`/profile/${dataset.dataset_id}`);
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.dashboardHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.dashboardTitle}>Data Cleaning Workflow</h1>
          <p className={styles.dashboardDescription}>
            Follow the step-by-step process to clean and analyze your data
          </p>
        </div>
        {currentDataset && (
          <div className={styles.headerActions}>
            <Button variant="secondary" onClick={resetWorkflow}>
              Start New Project
            </Button>
          </div>
        )}
      </div>

      {/* Current Project Status */}
      {currentDataset && (
        <Card className={styles.currentProjectCard}>
          <div className={styles.projectHeader}>
            <div className={styles.projectInfo}>
              <h3 className={styles.projectTitle}>Current Project</h3>
              <div className={styles.projectDetails}>
                <span className={styles.projectName}>{currentDataset.filename}</span>
                <span className={styles.projectStats}>
                  {currentDataset.rows?.toLocaleString()} rows • {currentDataset.columns} columns
                </span>
              </div>
            </div>
            <div className={styles.projectProgress}>
              <div className={styles.progressLabel}>
                Step {currentStep} of {steps.length}
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ width: `${(currentStep / steps.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Workflow Steps */}
      <Card className={styles.workflowCard}>
        <h3 className={styles.workflowTitle}>Workflow Steps</h3>
        <div className={styles.stepsContainer}>
          {steps.map((step, index) => {
            const status = getStepStatus(step.id);
            const isClickable = step.id === 1 || currentDataset;
            
            return (
              <div key={step.id} className={styles.stepWrapper}>
                <button
                  onClick={() => handleStepClick(step)}
                  disabled={!isClickable}
                  className={`${styles.stepCard} ${styles[status]} ${
                    !isClickable ? styles.disabled : ''
                  }`}
                >
                  <div className={styles.stepNumber}>
                    {status === 'completed' ? '✓' : step.id}
                  </div>
                  <div className={styles.stepIcon}>{step.icon}</div>
                  <h4 className={styles.stepLabel}>{step.label}</h4>
                  <p className={styles.stepDescription}>{step.description}</p>
                  {status === 'active' && (
                    <div className={styles.activeIndicator}>Current Step</div>
                  )}
                </button>
                
                {index < steps.length - 1 && (
                  <div className={`${styles.stepConnector} ${
                    getStepStatus(step.id + 1) !== 'pending' ? styles.connectorActive : ''
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recent Datasets */}
      <Card className={styles.recentCard}>
        <div className={styles.recentHeader}>
          <h3 className={styles.recentTitle}>Recent Datasets</h3>
          <Button variant="ghost" onClick={() => navigate('/upload')}>
            Upload New
          </Button>
        </div>
        
        {loading ? (
          <div className={styles.loading}>Loading datasets...</div>
        ) : recentDatasets.length > 0 ? (
          <div className={styles.datasetsList}>
            {recentDatasets.map((dataset) => (
              <button
                key={dataset.dataset_id}
                onClick={() => handleDatasetClick(dataset)}
                className={styles.datasetItem}
              >
                <div className={styles.datasetIcon}>📊</div>
                <div className={styles.datasetInfo}>
                  <div className={styles.datasetName}>{dataset.filename}</div>
                  <div className={styles.datasetStats}>
                    {dataset.original_shape?.[0]?.toLocaleString()} rows • {dataset.original_shape?.[1]} columns
                  </div>
                </div>
                <div className={styles.datasetDate}>
                  {new Date(dataset.upload_timestamp).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📁</div>
            <h4>No datasets yet</h4>
            <p>Upload your first CSV file to get started</p>
            <Button variant="primary" onClick={() => navigate('/upload')}>
              Upload Dataset
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;