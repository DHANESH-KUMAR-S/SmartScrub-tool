// Utility functions for formatting data

export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  
  const number = Number(num);
  if (isNaN(number)) return '0';
  
  if (number >= 1000000) {
    return (number / 1000000).toFixed(1) + 'M';
  } else if (number >= 1000) {
    return (number / 1000).toFixed(1) + 'K';
  }
  
  return number.toLocaleString();
};

export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatPercentage = (value, total) => {
  if (value === null || value === undefined) return '0%';
  
  // If total is provided, calculate percentage
  if (total !== undefined && total !== null) {
    if (total === 0) return '0%';
    return ((value / total) * 100).toFixed(1) + '%';
  }
  
  // If value is already a percentage
  const numValue = Number(value);
  if (isNaN(numValue)) return '0%';
  
  return numValue.toFixed(1) + '%';
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
// Additional utility functions for data analysis

export const formatFileSize = formatBytes; // Alias for compatibility

export const getDataTypeColor = (dataType) => {
  const colors = {
    'NUMERIC': '#3b82f6',    // Blue
    'TEXT': '#10b981',       // Green
    'CATEGORICAL': '#f59e0b', // Yellow
    'DATETIME': '#8b5cf6',   // Purple
    'BOOLEAN': '#ef4444',    // Red
    'MIXED': '#6b7280'       // Gray
  };
  
  return colors[dataType] || colors['MIXED'];
};

export const calculateQualityScore = (profile) => {
  if (!profile || !profile.columns) return 0;
  
  let totalScore = 0;
  let columnCount = profile.columns.length;
  
  if (columnCount === 0) return 0;
  
  profile.columns.forEach(column => {
    let columnScore = 100;
    
    // Deduct points for missing values
    if (column.missing_percentage) {
      columnScore -= column.missing_percentage * 0.8;
    }
    
    // Deduct points for duplicates (if applicable)
    if (column.duplicate_count && column.duplicate_count > 0) {
      const totalValues = column.unique_count + column.duplicate_count;
      if (totalValues > 0) {
        const duplicatePercentage = (column.duplicate_count / totalValues) * 100;
        columnScore -= duplicatePercentage * 0.3;
      }
    }
    
    // Bonus for good data types
    if (column.data_type === 'NUMERIC' || column.data_type === 'DATETIME') {
      columnScore += 5;
    }
    
    totalScore += Math.max(0, Math.min(100, columnScore));
  });
  
  return Math.round(totalScore / columnCount);
};

export const getQualityLabel = (score) => {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Poor';
  return 'Critical';
};

export const getQualityColor = (score) => {
  if (score >= 90) return '#10b981'; // Green
  if (score >= 75) return '#3b82f6'; // Blue
  if (score >= 60) return '#f59e0b'; // Yellow
  if (score >= 40) return '#f97316'; // Orange
  return '#ef4444'; // Red
};