import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { profileAPI } from '../../services/api';
import { useWorkflow } from '../../contexts/WorkflowContext';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { formatNumber, calculateQualityScore, getDataTypeColor, getQualityColor, getQualityLabel } from '../../utils/formatters';
import styles from './Profile.module.css';

const Profile = ({ onOpenCanvas }) => {
  const { datasetId } = useParams();
  const navigate = useNavigate();
  const { completeStep, goToStep } = useWorkflow();
  const [profile, setProfile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedColumn, setSelectedColumn] = useState(null);

  useEffect(() => {
    if (datasetId) {
      loadProfile();
      loadPreview();
      completeStep(2);
      goToStep(3);
    }
  }, [datasetId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProfile = async () => {
    try {
      const response = await profileAPI.getProfile(datasetId);
      setProfile(response.profile);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadPreview = async () => {
    try {
      const response = await profileAPI.getPreview(datasetId, 10);
      setPreview(response.preview);
    } catch (err) {
      console.error('Failed to load preview:', err);
    } finally {
      setLoading(false);
    }
  };

  const qualityScore = calculateQualityScore(profile);
  const qualityColor = getQualityColor(qualityScore);
  const qualityLabel = getQualityLabel(qualityScore);

  const getColumnsByType = () => {
    if (!profile?.columns) return {};
    
    const grouped = {};
    profile.columns.forEach(col => {
      if (!grouped[col.data_type]) {
        grouped[col.data_type] = [];
      }
      grouped[col.data_type].push(col);
    });
    
    return grouped;
  };

  const getIssuesCount = () => {
    if (!profile?.columns) return 0;
    
    let issues = 0;
    profile.columns.forEach(col => {
      if (col.missing_percentage > 0) issues++;
      if (col.duplicate_count > 0) issues++;
    });
    
    if (profile.duplicate_rows > 0) issues++;
    
    return issues;
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <span>Analyzing your data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <span className={styles.errorIcon}>⚠️</span>
        <h3>Error Loading Profile</h3>
        <p>{error}</p>
        <Button variant="primary" onClick={() => navigate('/upload')}>
          Upload New Dataset
        </Button>
      </div>
    );
  }

  const columnsByType = getColumnsByType();
  const issuesCount = getIssuesCount();

  return (
    <div className={styles.profile}>
      {/* Header Section */}
      <div className={styles.profileHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.datasetInfo}>
            <h1 className={styles.datasetName}>{profile?.filename || 'Dataset Profile'}</h1>
            <div className={styles.datasetMeta}>
              <span className={styles.metaItem}>
                <span className={styles.metaIcon}>📊</span>
                {formatNumber(profile?.total_rows)} rows
              </span>
              <span className={styles.metaDivider}>•</span>
              <span className={styles.metaItem}>
                <span className={styles.metaIcon}>📋</span>
                {profile?.total_columns} columns
              </span>
              <span className={styles.metaDivider}>•</span>
              <span className={styles.metaItem}>
                <span className={styles.metaIcon}>💾</span>
                {profile ? (profile.file_size / 1024).toFixed(2) : 0} KB
              </span>
            </div>
          </div>
          
          <div className={styles.qualityIndicator}>
            <div className={styles.qualityScoreCircle} style={{ borderColor: qualityColor }}>
              <span className={styles.qualityScoreValue} style={{ color: qualityColor }}>
                {qualityScore}
              </span>
              <span className={styles.qualityScoreLabel}>Quality</span>
            </div>
            <div className={styles.qualityInfo}>
              <span className={styles.qualityStatus} style={{ color: qualityColor }}>
                {qualityLabel}
              </span>
              <span className={styles.qualityDescription}>
                {issuesCount} {issuesCount === 1 ? 'issue' : 'issues'} detected
              </span>
            </div>
          </div>
        </div>

        <div className={styles.headerActions}>
          <Button 
            variant="ghost" 
            onClick={() => onOpenCanvas(datasetId)}
          >
            🎨 Open Canvas
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => navigate(`/cleaning/${datasetId}`)}
          >
            🛠️ Clean Data
          </Button>
          <Button 
            variant="primary" 
            onClick={() => navigate(`/auto-clean/${datasetId}`)}
          >
            🤖 AI Suggestions
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className={styles.overviewSection}>
        <h2 className={styles.sectionTitle}>Data Overview</h2>
        <div className={styles.overviewGrid}>
          <Card className={styles.overviewCard}>
            <div className={styles.cardIcon} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              📊
            </div>
            <div className={styles.cardContent}>
              <span className={styles.cardLabel}>Total Records</span>
              <span className={styles.cardValue}>{formatNumber(profile?.total_rows || 0)}</span>
            </div>
          </Card>

          <Card className={styles.overviewCard}>
            <div className={styles.cardIcon} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              ❓
            </div>
            <div className={styles.cardContent}>
              <span className={styles.cardLabel}>Missing Data</span>
              <span className={styles.cardValue}>
                {profile?.overall_missing_percentage?.toFixed(1) || 0}%
              </span>
            </div>
          </Card>

          <Card className={styles.overviewCard}>
            <div className={styles.cardIcon} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              🔄
            </div>
            <div className={styles.cardContent}>
              <span className={styles.cardLabel}>Duplicate Rows</span>
              <span className={styles.cardValue}>{formatNumber(profile?.duplicate_rows || 0)}</span>
            </div>
          </Card>

          <Card className={styles.overviewCard}>
            <div className={styles.cardIcon} style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
              ⚠️
            </div>
            <div className={styles.cardContent}>
              <span className={styles.cardLabel}>Issues Found</span>
              <span className={styles.cardValue}>{issuesCount}</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Columns Section */}
      <div className={styles.columnsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Column Analysis</h2>
          <div className={styles.columnTypeFilters}>
            {Object.keys(columnsByType).map(type => (
              <button
                key={type}
                className={styles.typeFilter}
                style={{ borderColor: getDataTypeColor(type) }}
              >
                <span className={styles.typeDot} style={{ background: getDataTypeColor(type) }}></span>
                {type} ({columnsByType[type].length})
              </button>
            ))}
          </div>
        </div>

        <div className={styles.columnsGrid}>
          {profile?.columns?.map((column, index) => {
            const columnQuality = 100 - (column.missing_percentage || 0);
            const columnColor = getDataTypeColor(column.data_type);
            
            return (
              <Card 
                key={index} 
                className={styles.columnCard}
                onClick={() => setSelectedColumn(selectedColumn === index ? null : index)}
              >
                <div className={styles.columnHeader}>
                  <div className={styles.columnTitle}>
                    <span 
                      className={styles.columnType}
                      style={{ background: columnColor }}
                    >
                      {column.data_type}
                    </span>
                    <span className={styles.columnName}>{column.name}</span>
                  </div>
                  <div className={styles.columnQuality}>
                    <div className={styles.qualityBar}>
                      <div 
                        className={styles.qualityBarFill}
                        style={{ 
                          width: `${columnQuality}%`,
                          background: columnQuality > 90 ? '#10b981' : columnQuality > 70 ? '#f59e0b' : '#ef4444'
                        }}
                      />
                    </div>
                    <span className={styles.qualityPercent}>{columnQuality.toFixed(0)}%</span>
                  </div>
                </div>

                <div className={styles.columnMetrics}>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Missing</span>
                    <span className={styles.metricValue}>
                      {column.missing_count} ({column.missing_percentage?.toFixed(1)}%)
                    </span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Unique</span>
                    <span className={styles.metricValue}>{formatNumber(column.unique_count)}</span>
                  </div>
                  {column.duplicate_count > 0 && (
                    <div className={styles.metric}>
                      <span className={styles.metricLabel}>Duplicates</span>
                      <span className={styles.metricValue}>{formatNumber(column.duplicate_count)}</span>
                    </div>
                  )}
                </div>

                {selectedColumn === index && (
                  <div className={styles.columnDetails}>
                    <div className={styles.detailsHeader}>
                      <h4>Column Statistics</h4>
                    </div>
                    
                    {column.statistics && Object.keys(column.statistics).length > 0 && (
                      <div className={styles.statisticsGrid}>
                        {Object.entries(column.statistics).map(([key, value]) => {
                          // Skip frequency_distribution as it's an object
                          if (key === 'frequency_distribution') {
                            if (typeof value === 'object' && value !== null) {
                              return (
                                <div key={key} className={styles.frequencySection}>
                                  <span className={styles.statLabel}>Top Values:</span>
                                  <div className={styles.frequencyList}>
                                    {Object.entries(value).slice(0, 5).map(([val, count]) => (
                                      <div key={val} className={styles.frequencyItem}>
                                        <span className={styles.frequencyValue}>{val}</span>
                                        <span className={styles.frequencyCount}>{count}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }
                          
                          return (
                            <div key={key} className={styles.statItem}>
                              <span className={styles.statLabel}>{key}:</span>
                              <span className={styles.statValue}>
                                {typeof value === 'number' ? value.toFixed(2) : String(value)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {column.sample_values && column.sample_values.length > 0 && (
                      <div className={styles.sampleSection}>
                        <span className={styles.sampleLabel}>Sample Values:</span>
                        <div className={styles.sampleValues}>
                          {column.sample_values.slice(0, 5).map((value, idx) => (
                            <span key={idx} className={styles.sampleValue}>
                              {value === null || value === undefined ? 'NULL' : String(value)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Data Preview Section */}
      {preview && preview.data && preview.data.length > 0 && (
        <div className={styles.previewSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Data Preview</h2>
            <span className={styles.previewInfo}>
              Showing {preview.data.length} of {formatNumber(profile?.total_rows || 0)} rows
            </span>
          </div>
          
          <Card className={styles.previewCard}>
            <div className={styles.tableWrapper}>
              <table className={styles.previewTable}>
                <thead>
                  <tr>
                    <th className={styles.rowNumber}>#</th>
                    {preview.columns.map((col, idx) => (
                      <th key={idx}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.data.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      <td className={styles.rowNumber}>{rowIdx + 1}</td>
                      {preview.columns.map((col, colIdx) => (
                        <td key={colIdx}>
                          {row[col] === null || row[col] === undefined || row[col] === '' ? (
                            <span className={styles.nullValue}>NULL</span>
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
        </div>
      )}

      {/* Action Footer */}
      <div className={styles.actionFooter}>
        <div className={styles.footerContent}>
          <div className={styles.footerInfo}>
            <span className={styles.footerIcon}>💡</span>
            <div>
              <h4>Ready to clean your data?</h4>
              <p>Use manual cleaning or let AI suggest improvements</p>
            </div>
          </div>
          <div className={styles.footerActions}>
            <Button 
              variant="secondary" 
              onClick={() => navigate(`/cleaning/${datasetId}`)}
            >
              Manual Clean
            </Button>
            <Button 
              variant="primary" 
              onClick={() => navigate(`/auto-clean/${datasetId}`)}
            >
              AI Suggestions
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;