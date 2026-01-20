import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { exportAPI } from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { formatFileSize, formatNumber, formatDate } from '../../utils/formatters';
import styles from './Export.module.css';

const Export = () => {
  const { datasetId } = useParams();
  const navigate = useNavigate();
  
  const [exportInfo, setExportInfo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Export configuration
  const [exportConfig, setExportConfig] = useState({
    format: 'csv',
    include_metadata: true
  });

  useEffect(() => {
    if (datasetId) {
      loadExportInfo();
    }
  }, [datasetId]);

  useEffect(() => {
    if (exportConfig.format && exportInfo) {
      loadPreview();
    }
  }, [exportConfig.format, exportInfo]);

  const loadExportInfo = async () => {
    try {
      setLoading(true);
      const response = await exportAPI.getExportInfo(datasetId);
      setExportInfo(response.export_info);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPreview = async () => {
    try {
      const response = await exportAPI.getExportPreview(datasetId, exportConfig.format, 5);
      setPreview(response.preview);
    } catch (err) {
      console.error('Failed to load preview:', err);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      setError(null);
      
      const response = await exportAPI.exportDataset(datasetId, exportConfig);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `cleaned_${exportInfo.filename}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSuccess(`Successfully exported ${filename}`);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  const getFormatIcon = (format) => {
    switch (format) {
      case 'csv': return '📄';
      case 'json': return '📋';
      case 'excel': return '📊';
      default: return '📁';
    }
  };

  const getFormatDescription = (format) => {
    switch (format) {
      case 'csv': return 'Comma-separated values - Universal format for data analysis';
      case 'json': return 'JavaScript Object Notation - Structured data format';
      case 'excel': return 'Microsoft Excel format - Includes multiple sheets and metadata';
      default: return 'Unknown format';
    }
  };

  const getEstimatedSize = (format) => {
    if (!exportInfo?.estimated_sizes) return 'Unknown';
    return formatFileSize(exportInfo.estimated_sizes[format] || 0);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className="loading-spinner"></div>
        <span>Loading export information...</span>
      </div>
    );
  }

  if (error && !exportInfo) {
    return (
      <div className={styles.error}>
        <span className={styles.errorIcon}>⚠️</span>
        <h3>Error Loading Export Info</h3>
        <p>{error}</p>
        <Button variant="primary" onClick={() => navigate('/upload')}>
          Upload New Dataset
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.export}>
      <div className={styles.exportHeader}>
        <div className={styles.headerInfo}>
          <h2>💾 Export Dataset</h2>
          <p className={styles.datasetName}>{exportInfo?.filename}</p>
          <p className={styles.datasetStats}>
            {formatNumber(exportInfo?.current_rows)} rows • {exportInfo?.current_columns} columns
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button 
            variant="primary" 
            onClick={handleExport}
            loading={exporting}
            disabled={exporting}
            size="large"
          >
            📥 Download {exportConfig.format.toUpperCase()}
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

      <div className={styles.exportGrid}>
        {/* Format Selection */}
        <Card className={styles.formatCard}>
          <div className={styles.cardHeader}>
            <h3>📋 Export Format</h3>
          </div>
          
          <div className={styles.formatOptions}>
            {exportInfo?.available_formats?.map((format) => (
              <div
                key={format}
                className={`${styles.formatOption} ${
                  exportConfig.format === format ? styles.selected : ''
                }`}
                onClick={() => setExportConfig(prev => ({ ...prev, format }))}
              >
                <div className={styles.formatIcon}>
                  {getFormatIcon(format)}
                </div>
                <div className={styles.formatContent}>
                  <h4 className={styles.formatName}>
                    {format.toUpperCase()}
                  </h4>
                  <p className={styles.formatDescription}>
                    {getFormatDescription(format)}
                  </p>
                  <div className={styles.formatMeta}>
                    <span className={styles.formatSize}>
                      ~{getEstimatedSize(format)}
                    </span>
                  </div>
                </div>
                <div className={styles.formatSelector}>
                  <input
                    type="radio"
                    name="format"
                    value={format}
                    checked={exportConfig.format === format}
                    onChange={() => setExportConfig(prev => ({ ...prev, format }))}
                    className={styles.radioInput}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Export Options */}
        <Card className={styles.optionsCard}>
          <div className={styles.cardHeader}>
            <h3>⚙️ Export Options</h3>
          </div>
          
          <div className={styles.optionsContent}>
            <label className={styles.optionLabel}>
              <input
                type="checkbox"
                checked={exportConfig.include_metadata}
                onChange={(e) => setExportConfig(prev => ({
                  ...prev,
                  include_metadata: e.target.checked
                }))}
                className={styles.checkbox}
              />
              <div className={styles.optionContent}>
                <span className={styles.optionTitle}>Include Metadata</span>
                <span className={styles.optionDescription}>
                  Add dataset information, column types, and export timestamp
                </span>
              </div>
            </label>
            
            <div className={styles.optionInfo}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Export Date:</span>
                <span className={styles.infoValue}>
                  {formatDate(new Date().toISOString())}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Data Types:</span>
                <span className={styles.infoValue}>
                  {Object.keys(exportInfo?.data_types || {}).length} columns
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Data Quality Summary */}
      <Card className={styles.qualityCard}>
        <div className={styles.cardHeader}>
          <h3>📊 Data Quality Summary</h3>
        </div>
        
        <div className={styles.qualityGrid}>
          <div className={styles.qualityItem}>
            <div className={styles.qualityIcon}>✅</div>
            <div className={styles.qualityContent}>
              <span className={styles.qualityLabel}>Data Completeness</span>
              <span className={styles.qualityValue}>
                {exportInfo?.quality_summary?.data_completeness?.toFixed(1) || 0}%
              </span>
            </div>
          </div>
          
          <div className={styles.qualityItem}>
            <div className={styles.qualityIcon}>❓</div>
            <div className={styles.qualityContent}>
              <span className={styles.qualityLabel}>Missing Values</span>
              <span className={styles.qualityValue}>
                {formatNumber(exportInfo?.quality_summary?.missing_values || 0)}
              </span>
            </div>
          </div>
          
          <div className={styles.qualityItem}>
            <div className={styles.qualityIcon}>🔄</div>
            <div className={styles.qualityContent}>
              <span className={styles.qualityLabel}>Duplicate Rows</span>
              <span className={styles.qualityValue}>
                {formatNumber(exportInfo?.quality_summary?.duplicate_rows || 0)}
              </span>
            </div>
          </div>
          
          <div className={styles.qualityItem}>
            <div className={styles.qualityIcon}>📅</div>
            <div className={styles.qualityContent}>
              <span className={styles.qualityLabel}>Last Modified</span>
              <span className={styles.qualityValue}>
                {formatDate(exportInfo?.last_modified)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Data Preview */}
      {preview && (
        <Card className={styles.previewCard}>
          <div className={styles.cardHeader}>
            <h3>👁️ Export Preview</h3>
            <div className={styles.cardStats}>
              {exportConfig.format.toUpperCase()} format • {preview.rows_shown} of {formatNumber(preview.total_rows)} rows
            </div>
          </div>
          
          <div className={styles.previewContainer}>
            <pre className={styles.previewContent}>
              {preview.content}
            </pre>
          </div>
        </Card>
      )}

      {/* Column Information */}
      <Card className={styles.columnsCard}>
        <div className={styles.cardHeader}>
          <h3>📋 Column Information</h3>
          <div className={styles.cardStats}>
            {exportInfo?.current_columns} columns
          </div>
        </div>
        
        <div className={styles.columnsGrid}>
          {exportInfo?.column_names?.map((columnName, index) => (
            <div key={index} className={styles.columnItem}>
              <div className={styles.columnHeader}>
                <span className={styles.columnName}>{columnName}</span>
                <span className={`${styles.columnType} ${styles[exportInfo.data_types[columnName]]}`}>
                  {exportInfo.data_types[columnName]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Navigation */}
      <Card className={styles.navigationCard}>
        <div className={styles.navigationContent}>
          <Button 
            variant="secondary" 
            onClick={() => navigate(`/auto-clean/${datasetId}`)}
          >
            ← AI Suggestions
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => navigate(`/profile/${datasetId}`)}
          >
            Back to Profile
          </Button>
          <Button 
            variant="primary" 
            onClick={() => navigate('/')}
          >
            Dashboard →
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Export;