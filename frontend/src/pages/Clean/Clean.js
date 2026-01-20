import React, { useState, useEffect } from 'react';
import { useWorkflow } from '../../contexts/WorkflowContext';
import { useNavigate } from 'react-router-dom';
import styles from './Clean.module.css';

const Clean = () => {
  const { currentDataset, completeStep } = useWorkflow();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  
  // Cleaning options
  const [removeDuplicates, setRemoveDuplicates] = useState(false);
  const [columnsToDrop, setColumnsToDrop] = useState([]);
  const [missingStrategies, setMissingStrategies] = useState({});
  const [typeConversions, setTypeConversions] = useState({});

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

  const handleColumnDrop = (columnName) => {
    setColumnsToDrop(prev => 
      prev.includes(columnName) 
        ? prev.filter(c => c !== columnName)
        : [...prev, columnName]
    );
  };

  const handleMissingStrategy = (columnName, strategy) => {
    setMissingStrategies(prev => ({
      ...prev,
      [columnName]: strategy
    }));
  };

  const handleTypeConversion = (columnName, targetType) => {
    setTypeConversions(prev => ({
      ...prev,
      [columnName]: targetType
    }));
  };

  const applyClean = async () => {
    setApplying(true);
    try {
      const response = await fetch(`http://localhost:8000/api/clean/manual/${currentDataset}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          remove_duplicates: removeDuplicates,
          columns_to_drop: columnsToDrop,
          missing_value_strategies: missingStrategies,
          type_conversions: typeConversions
        })
      });

      const data = await response.json();
      if (data.success) {
        completeStep(3);
        alert(`Cleaning applied! ${data.rows_removed} rows removed, ${data.cleaned_columns} columns remaining.`);
        navigate('/ai-clean');
      }
    } catch (error) {
      console.error('Error applying cleaning:', error);
      alert('Failed to apply cleaning');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading dataset profile...</p>
      </div>
    );
  }

  if (!profile) {
    return <div className={styles.error}>Failed to load profile</div>;
  }

  const columnsWithIssues = profile.columns.filter(col => 
    col.missing_count > 0 || col.data_type === 'TEXT'
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Manual Data Cleaning</h1>
          <p>Configure cleaning operations for your dataset</p>
        </div>
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{profile.total_rows}</span>
            <span className={styles.statLabel}>Rows</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{profile.total_columns}</span>
            <span className={styles.statLabel}>Columns</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{columnsWithIssues.length}</span>
            <span className={styles.statLabel}>Issues</span>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {/* Duplicate Removal */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Duplicate Rows</h2>
            <span className={styles.badge}>{profile.duplicate_rows} found</span>
          </div>
          {profile.duplicate_rows > 0 && (
            <div className={styles.option}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={removeDuplicates}
                  onChange={(e) => setRemoveDuplicates(e.target.checked)}
                />
                <span>Remove {profile.duplicate_rows} duplicate rows</span>
              </label>
            </div>
          )}
        </div>

        {/* Column Operations */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Column Operations</h2>
            <span className={styles.badge}>{profile.columns.length} columns</span>
          </div>
          <div className={styles.columnGrid}>
            {profile.columns.map(column => (
              <div key={column.name} className={styles.columnCard}>
                <div className={styles.columnHeader}>
                  <div className={styles.columnInfo}>
                    <h3>{column.name}</h3>
                    <span className={styles.columnType}>{column.data_type}</span>
                  </div>
                  <label className={styles.dropCheckbox}>
                    <input
                      type="checkbox"
                      checked={columnsToDrop.includes(column.name)}
                      onChange={() => handleColumnDrop(column.name)}
                    />
                    <span>Drop</span>
                  </label>
                </div>

                <div className={styles.columnStats}>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Missing</span>
                    <span className={styles.statValue}>
                      {column.missing_count} ({column.missing_percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Unique</span>
                    <span className={styles.statValue}>{column.unique_count}</span>
                  </div>
                </div>

                {/* Missing Value Strategy */}
                {column.missing_count > 0 && !columnsToDrop.includes(column.name) && (
                  <div className={styles.strategySelect}>
                    <label>Handle Missing Values:</label>
                    <select
                      value={missingStrategies[column.name] || ''}
                      onChange={(e) => handleMissingStrategy(column.name, e.target.value)}
                    >
                      <option value="">No action</option>
                      <option value="drop">Drop rows</option>
                      {column.data_type === 'NUMERIC' && (
                        <>
                          <option value="mean">Fill with mean</option>
                          <option value="median">Fill with median</option>
                        </>
                      )}
                      <option value="mode">Fill with mode</option>
                      <option value="forward_fill">Forward fill</option>
                      <option value="backward_fill">Backward fill</option>
                    </select>
                  </div>
                )}

                {/* Type Conversion */}
                {!columnsToDrop.includes(column.name) && (
                  <div className={styles.strategySelect}>
                    <label>Convert Type:</label>
                    <select
                      value={typeConversions[column.name] || ''}
                      onChange={(e) => handleTypeConversion(column.name, e.target.value)}
                    >
                      <option value="">Keep current</option>
                      <option value="NUMERIC">Numeric</option>
                      <option value="TEXT">Text</option>
                      <option value="DATETIME">DateTime</option>
                      <option value="CATEGORICAL">Categorical</option>
                      <option value="BOOLEAN">Boolean</option>
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <button 
          className={styles.skipButton}
          onClick={() => navigate('/ai-clean')}
        >
          Skip Manual Cleaning
        </button>
        <button 
          className={styles.applyButton}
          onClick={applyClean}
          disabled={applying}
        >
          {applying ? 'Applying...' : 'Apply Cleaning'}
        </button>
      </div>
    </div>
  );
};

export default Clean;
