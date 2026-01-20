// Application constants

export const FILE_CONSTRAINTS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['.csv'],
  ALLOWED_MIME_TYPES: ['text/csv', 'application/csv']
};

export const DATA_TYPES = {
  NUMERIC: 'numeric',
  CATEGORICAL: 'categorical',
  DATETIME: 'datetime',
  TEXT: 'text',
  BOOLEAN: 'boolean'
};

export const IMPACT_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

export const CLEANING_ACTIONS = {
  DROP_DUPLICATES: 'drop_duplicates',
  FILL_MISSING: 'fill_missing',
  DROP_MISSING: 'drop_missing',
  CONVERT_TYPE: 'convert_type',
  REMOVE_OUTLIERS: 'remove_outliers'
};

export const MISSING_VALUE_STRATEGIES = {
  DROP: 'drop',
  MEAN: 'mean',
  MEDIAN: 'median',
  MODE: 'mode',
  FORWARD_FILL: 'forward_fill',
  BACKWARD_FILL: 'backward_fill'
};

export const EXPORT_FORMATS = {
  CSV: 'csv',
  JSON: 'json',
  EXCEL: 'excel'
};

export const QUALITY_THRESHOLDS = {
  EXCELLENT: 95,
  GOOD: 85,
  FAIR: 70,
  POOR: 50
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error - please check your connection',
  FILE_TOO_LARGE: `File size must be less than ${FILE_CONSTRAINTS.MAX_SIZE / (1024 * 1024)}MB`,
  INVALID_FILE_TYPE: 'Please select a CSV file',
  UPLOAD_FAILED: 'Failed to upload file. Please try again.',
  PROFILE_FAILED: 'Failed to load data profile',
  CLEANING_FAILED: 'Failed to apply cleaning operations',
  EXPORT_FAILED: 'Failed to export dataset'
};

export const SUCCESS_MESSAGES = {
  UPLOAD_SUCCESS: 'File uploaded successfully',
  CLEANING_SUCCESS: 'Cleaning operations applied successfully',
  EXPORT_SUCCESS: 'Dataset exported successfully'
};