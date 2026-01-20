import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { profileAPI, cleanAPI } from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { formatNumber, formatPercentage } from '../../utils/formatters';
import styles from './Cleaning.module.css';

const Cleaning = () => {
  const { datasetId } = useParams();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Cleaning configuration state
  const [cleaningConfig, setCleaningConfig] = useState({
    remove_duplicates: false,
    missing_value_strategies: {},
    columns_to_drop: [],
    type_conversions: {}
  });

  useEffect(() => {
    if (datasetId) {
      loadData();
    }
  }, [datasetId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileResponse, previewResponse] = await Promise.all([
        profileAPI.getProfile(datasetId),
        profileAPI.getPreview(datasetId, 10)
      ]);
      
      setProfile(profileResponse.profile);
      setPreview(previewResponse.preview);
      
      // Initialize missing value strategies
      const initialStrategies = {};
      profileResponse.profile.columns.forEach(col => {
        if (col.missing_count > 0) {
          initialStrategies[col.name] = 'drop';
        }
      });
      
      setCleaningConfig(prev => ({
        ...prev,
        missing_value_strategies: initialStrategies
      }));
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMissingValueStrategyChange = (column, strategy) => {
    setCleaningConfig(prev => ({
      ...prev,
      missing_value_strategies: {
        ...prev.missing_value_strategies,
        [column]: strategy
      }
    }));
  };

  const handleColumnDrop = (column, shouldDrop) => {
    setCleaningConfig(prev => ({
      ...prev,
      columns_to_drop: shouldDrop 
        ? [...prev.columns_to_drop, column]
        : prev.columns_to_drop.filter(col => col !== column)
    }));
  };

  const handleTypeConversion = (column, targetType) => {
    setCleaningConfig(prev => ({
      ...prev,
      type_conversions: targetType 
        ? { ...prev.type_conversions, [column]: targetType }
        : Object.fromEntries(Object.entries(prev.type_conversions).filter(([key]) => key !== column))
    }));
  };

  const applyManualCleaning = async () => {
    try {
      setApplying(true);
      setError(null);
      
      const response = await cleanAPI.applyManualCleaning(datasetId, cleaningConfig);
      
      setSuccess(`Cleaning applied successfully! ${response.rows_removed} rows removed, ${response.original_columns - response.cleaned_columns} columns dropped.`);
      
      // Reload data to show updated state
      setTimeout(() => {
        loadData();
        setSuccess(null);
      }, 2000);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setApplying(false);
    }
  };

  const resetConfiguration = () => {
    setCleaningConfig({
      remove_duplicates: false,
      missing_value_strategies: {},
      columns_to_drop: [],
      type_conversions: {}
    });
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className="loading-spinner"></div>
        <span>Loading dataset for cleaning...</span>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className={styles.error}>
        <span className={styles.errorIcon}>⚠️</span>
        <h3>Error Loading Dataset</h3>
        <p>{error}</p>
        <Button variant="primary" onClick={() => navigate('/upload')}>
          Upload New Dataset
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.cleaning}>
      <div className={styles.cleaningHeader}>
        <div className={styles.headerInfo}>
          <h2>Manual Data Cleaning</h2>
          <p className={styles.datasetName}>{profile?.filename}</p>
          <p className={styles.datasetStats}>
            {formatNumber(profile?.total_rows)} rows • {profile?.total_columns} columns
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary" onClick={resetConfiguration}>
            🔄 Reset
          </Button>
          <Button 
            variant="primary" 
            onClick={applyManualCleaning}
            loading={applying}
            disabled={applying}
          >
            ✨ Apply Cleaning
          </Button>
        </div>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <span className={styles.errorIcon}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className={styles.successMessage}>
          <span className={styles.successIcon}>✅</span>
          <span>{success}</span>
        </div>
      )}

      <div className={styles.cleaningGrid}>
        {/* Duplicate Removal */}
        <Card className={styles.cleaningCard}>
          <div className={styles.cardHeader}>
            <h3>🔄 Duplicate Rows</h3>
            <div className={styles.cardStats}>
              {formatNumber(profile?.duplicate_rows || 0)} duplicates found
            </div>
          </div>
          
          <div className={styles.cardContent}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={cleaningConfig.remove_duplicates}
                onChange={(e) => setCleaningConfig(prev => ({
                  ...prev,
                  remove_duplicates: e.target.checked
                }))}
                className={styles.checkbox}
              />
              <span className={styles.checkboxText}>
                Remove duplicate rows (keep first occurrence)
              </span>
            </label>
            
            {profile?.duplicate_rows > 0 && (
              <div className={styles.impactPreview}>
                <span className={styles.impactLabel}>Impact:</span>
                <span className={styles.impactValue}>
                  -{formatNumber(profile.duplicate_rows)} rows
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Missing Values */}
        <Card className={styles.cleaningCard}>
          <div className={styles.cardHeader}>
            <h3>❓ Missing Values</h3>
            <div className={styles.cardStats}>
              {formatPercentage(profile?.overall_missing_percentage || 0)} missing overall
            </div>
          </div>
          
          <div className={styles.cardContent}>
            <div className={styles.columnsList}>
              {profile?.columns
                ?.filter(col => col.missing_count > 0)
                ?.map((column, index) => (
                  <div key={index} className={styles.columnItem}>
                    <div className={styles.columnHeader}>
                      <span className={styles.columnName}>{column.name}</span>
                      <span className={styles.columnMissing}>
                        {formatPercentage(column.missing_percentage)} missing
                      </span>
                    </div>
                    
                    <select
                      value={cleaningConfig.missing_value_strategies[column.name] || 'drop'}
                      onChange={(e) => handleMissingValueStrategyChange(column.name, e.target.value)}
                      className={styles.strategySelect}
                    >
                      <option value="drop">Drop rows with missing values</option>
                      {column.data_type === 'numeric' && (
                        <>
                          <option value="mean">Fill with mean</option>
                          <option value="median">Fill with median</option>
                        </>
                      )}
                      <option value="mode">Fill with most frequent value</option>
                      <option value="forward_fill">Forward fill</option>
                      <option value="backward_fill">Backward fill</option>
                    </select>
                  </div>
                )) || (
                  <div className={styles.noIssues}>
                    <span className={styles.noIssuesIcon}>✅</span>
                    <span>No missing values found</span>
                  </div>
                )}
            </div>
          </div>
        </Card>

        {/* Column Management */}
        <Card className={styles.cleaningCard}>
          <div className={styles.cardHeader}>
            <h3>📋 Column Management</h3>
            <div className={styles.cardStats}>
              {profile?.total_columns} columns total
            </div>
          </div>
          
          <div className={styles.cardContent}>
            <div className={styles.columnsList}>
              {profile?.columns?.map((column, index) => (
                <div key={index} className={styles.columnItem}>
                  <div className={styles.columnHeader}>
                    <span className={styles.columnName}>{column.name}</span>
                    <span className={`${styles.columnType} ${styles[column.data_type]}`}>
                      {column.data_type}
                    </span>
                  </div>
                  
                  <div className={styles.columnActions}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={cleaningConfig.columns_to_drop.includes(column.name)}
                        onChange={(e) => handleColumnDrop(column.name, e.target.checked)}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxText}>Drop column</span>
                    </label>
                    
                    <select
                      value={cleaningConfig.type_conversions[column.name] || ''}
                      onChange={(e) => handleTypeConversion(column.name, e.target.value)}
                      className={styles.typeSelect}
                    >
                      <option value="">Keep current type</option>
                      <option value="numeric">Convert to numeric</option>
                      <option value="categorical">Convert to categorical</option>
                      <option value="datetime">Convert to datetime</option>
                      <option value="text">Convert to text</option>
                      <option value="boolean">Convert to boolean</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Data Preview */}
      {preview && (
        <Card className={styles.previewCard}>
          <div className={styles.cardHeader}>
            <h3>📊 Data Preview</h3>
            <div className={styles.cardStats}>
              Showing {preview.data.length} of {formatNumber(preview.total_rows)} rows
            </div>
          </div>
          
          <div className={styles.tableContainer}>
            <table className={styles.previewTable}>
              <thead>
                <tr>
                  {preview.columns
                    .filter(col => !cleaningConfig.columns_to_drop.includes(col))
                    .map((col, index) => (
                      <th key={index} className={styles.tableHeader}>
                        <div className={styles.headerContent}>
                          <span className={styles.headerName}>{col}</span>
                          {cleaningConfig.type_conversions[col] && (
                            <span className={styles.headerConversion}>
                              → {cleaningConfig.type_conversions[col]}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {preview.data.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {preview.columns
                      .filter(col => !cleaningConfig.columns_to_drop.includes(col))
                      .map((col, colIndex) => (
                        <td key={colIndex} className={styles.tableCell}>
                          {row[col] === null || row[col] === undefined || row[col] === '' ? (
                            <span className={styles.missingValue}>NULL</span>
                          ) : (
                            String(row[col])
                          )}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Cleaning Summary */}
      <Card className={styles.summaryCard}>
        <div className={styles.cardHeader}>
          <h3>📋 Cleaning Summary</h3>
        </div>
        
        <div className={styles.summaryContent}>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Remove Duplicates:</span>
              <span className={styles.summaryValue}>
                {cleaningConfig.remove_duplicates ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Columns to Drop:</span>
              <span className={styles.summaryValue}>
                {cleaningConfig.columns_to_drop.length || 'None'}
              </span>
            </div>
            
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Missing Value Rules:</span>
              <span className={styles.summaryValue}>
                {Object.keys(cleaningConfig.missing_value_strategies).length || 'None'}
              </span>
            </div>
            
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Type Conversions:</span>
              <span className={styles.summaryValue}>
                {Object.keys(cleaningConfig.type_conversions).length || 'None'}
              </span>
            </div>
          </div>
          
          <div className={styles.summaryActions}>
            <Button 
              variant="secondary" 
              onClick={() => navigate(`/profile/${datasetId}`)}
            >
              ← Back to Profile
            </Button>
            <Button 
              variant="primary" 
              onClick={() => navigate(`/auto-clean/${datasetId}`)}
            >
              Try AI Suggestions →
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Cleaning;