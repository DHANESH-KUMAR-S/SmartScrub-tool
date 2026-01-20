import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadAPI } from '../../services/api';
import { useWorkflow } from '../../contexts/WorkflowContext';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import styles from './Upload.module.css';

const Upload = () => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { updateDataset, completeStep, goToStep } = useWorkflow();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setError(null);
    setSuccess(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 20;
        });
      }, 200);

      const response = await uploadAPI.uploadDataset(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setUploadedFile({
        ...response,
        file: file
      });
      
      setSuccess(`Successfully uploaded ${file.name}`);
      
      // Update workflow context
      updateDataset({
        id: response.dataset_id,
        filename: response.filename,
        rows: response.rows,
        columns: response.columns
      });
      
      // Mark upload step as completed
      completeStep(1);
      goToStep(2);

      // Auto-navigate to profile after 2 seconds
      setTimeout(() => {
        navigate(`/profile/${response.dataset_id}`);
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setError(null);
    setSuccess(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={styles.upload}>
      <div className={styles.uploadContainer}>
        <Card className={styles.uploadCard}>
          <div className={styles.uploadHeader}>
            <h2 className={styles.uploadTitle}>Upload Dataset</h2>
            <p className={styles.uploadDescription}>
              Upload your CSV file to start the data cleaning process
            </p>
          </div>

          {!uploadedFile ? (
            <div
              className={`${styles.dropzone} ${dragActive ? styles.dragActive : ''} ${uploading ? styles.uploading : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={openFileDialog}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className={styles.fileInput}
              />
              
              <div className={styles.dropzoneContent}>
                <div className={styles.dropzoneIcon}>
                  {uploading ? '⏳' : '📁'}
                </div>
                
                {uploading ? (
                  <div className={styles.uploadingState}>
                    <h3>Uploading...</h3>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill}
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p>{Math.round(uploadProgress)}% complete</p>
                  </div>
                ) : (
                  <div className={styles.dropzoneText}>
                    <h3>Drop your CSV file here</h3>
                    <p>or click to browse files</p>
                    <div className={styles.fileRequirements}>
                      <span>• CSV format only</span>
                      <span>• Maximum 10MB</span>
                      <span>• UTF-8 encoding recommended</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.uploadSuccess}>
              <div className={styles.successIcon}>✅</div>
              <h3>Upload Successful!</h3>
              <div className={styles.fileInfo}>
                <div className={styles.fileName}>{uploadedFile.filename}</div>
                <div className={styles.fileStats}>
                  {uploadedFile.rows?.toLocaleString()} rows • {uploadedFile.columns} columns
                </div>
              </div>
              <div className={styles.successActions}>
                <Button 
                  variant="primary" 
                  onClick={() => navigate(`/profile/${uploadedFile.dataset_id}`)}
                >
                  View Data Profile
                </Button>
                <Button variant="secondary" onClick={resetUpload}>
                  Upload Another File
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className={styles.errorMessage}>
              <span className={styles.errorIcon}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {success && !uploadedFile && (
            <div className={styles.successMessage}>
              <span className={styles.successIcon}>✅</span>
              <span>{success}</span>
            </div>
          )}
        </Card>

        <Card className={styles.tipsCard}>
          <h3 className={styles.tipsTitle}>💡 Upload Tips</h3>
          <div className={styles.tipsList}>
            <div className={styles.tip}>
              <span className={styles.tipIcon}>📋</span>
              <div>
                <strong>CSV Format:</strong> Ensure your file is in CSV format with proper column headers
              </div>
            </div>
            <div className={styles.tip}>
              <span className={styles.tipIcon}>🔤</span>
              <div>
                <strong>Encoding:</strong> Use UTF-8 encoding to avoid character issues
              </div>
            </div>
            <div className={styles.tip}>
              <span className={styles.tipIcon}>📏</span>
              <div>
                <strong>File Size:</strong> Keep files under 10MB for optimal performance
              </div>
            </div>
            <div className={styles.tip}>
              <span className={styles.tipIcon}>🏷️</span>
              <div>
                <strong>Column Names:</strong> Use descriptive column names without special characters
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Upload;