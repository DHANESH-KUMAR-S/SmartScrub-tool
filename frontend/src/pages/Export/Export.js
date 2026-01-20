import React, { useState, useEffect } from 'react';
import { useWorkflow } from '../../contexts/WorkflowContext';
import { useNavigate } from 'react-router-dom';
import styles from './Export.module.css';

const Export = () => {
  const { currentDataset, completeStep } = useWorkflow();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');

  useEffect(() => {
    if (!currentDataset) {
      navigate('/upload');
      return;
    }
    fetchProfile();
  }, [currentDataset, navigate]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/profile/${currentDataset}`);
      const data = await response.json();
      if (data.success) {
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/export/${currentDataset}?format=${exportFormat}`
      );

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cleaned_${profile.filename.replace(/\.[^/.]+$/, '')}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      completeStep(5);
      alert('Export successful!');
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Failed to export file');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading dataset information...</p>
      </div>
    );
  }

  if (!profile) {
    return <div className={styles.error}>Failed to load dataset</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Export Cleaned Data</h1>
          <p>Download your cleaned dataset in your preferred format</p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.summaryCard}>
          <h2>Dataset Summary</h2>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Filename</span>
              <span className={styles.summaryValue}>{profile.filename}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Total Rows</span>
              <span className={styles.summaryValue}>{profile.total_rows.toLocaleString()}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Total Columns</span>
              <span className={styles.summaryValue}>{profile.total_columns}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Data Quality</span>
              <span className={styles.summaryValue}>
                {(100 - profile.overall_missing_percentage).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className={styles.exportCard}>
          <h2>Export Options</h2>
          <div className={styles.formatSelector}>
            <label className={styles.formatOption}>
              <input
                type="radio"
                name="format"
                value="csv"
                checked={exportFormat === 'csv'}
                onChange={(e) => setExportFormat(e.target.value)}
              />
              <div className={styles.formatInfo}>
                <span className={styles.formatName}>CSV</span>
                <span className={styles.formatDesc}>Comma-separated values</span>
              </div>
            </label>
            <label className={styles.formatOption}>
              <input
                type="radio"
                name="format"
                value="excel"
                checked={exportFormat === 'excel'}
                onChange={(e) => setExportFormat(e.target.value)}
              />
              <div className={styles.formatInfo}>
                <span className={styles.formatName}>Excel</span>
                <span className={styles.formatDesc}>Microsoft Excel format (.xlsx)</span>
              </div>
            </label>
            <label className={styles.formatOption}>
              <input
                type="radio"
                name="format"
                value="json"
                checked={exportFormat === 'json'}
                onChange={(e) => setExportFormat(e.target.value)}
              />
              <div className={styles.formatInfo}>
                <span className={styles.formatName}>JSON</span>
                <span className={styles.formatDesc}>JavaScript Object Notation</span>
              </div>
            </label>
          </div>

          <button
            className={styles.exportButton}
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : `Export as ${exportFormat.toUpperCase()}`}
          </button>
        </div>

        <div className={styles.actionsCard}>
          <h2>What's Next?</h2>
          <div className={styles.actionsList}>
            <button
              className={styles.actionButton}
              onClick={() => navigate('/upload')}
            >
              <span className={styles.actionIcon}>📁</span>
              <div className={styles.actionInfo}>
                <span className={styles.actionTitle}>Upload New Dataset</span>
                <span className={styles.actionDesc}>Start a new cleaning workflow</span>
              </div>
            </button>
            <button
              className={styles.actionButton}
              onClick={() => navigate('/dashboard')}
            >
              <span className={styles.actionIcon}>📊</span>
              <div className={styles.actionInfo}>
                <span className={styles.actionTitle}>View Dashboard</span>
                <span className={styles.actionDesc}>See all your datasets</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Export;
