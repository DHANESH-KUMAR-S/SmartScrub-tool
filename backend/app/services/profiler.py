import pandas as pd
import numpy as np
from typing import List, Dict, Any
from app.models.dataset import DataType, ColumnProfile, DatasetProfile
from datetime import datetime

class DataProfiler:
    """Service for analyzing and profiling datasets"""
    
    @staticmethod
    def detect_data_type(series: pd.Series) -> DataType:
        """Detect the most appropriate data type for a pandas Series"""
        # Remove null values for type detection
        non_null_series = series.dropna()
        
        if len(non_null_series) == 0:
            return DataType.TEXT
        
        # Check for boolean
        if series.dtype == bool or non_null_series.isin([True, False, 0, 1, 'true', 'false', 'True', 'False']).all():
            return DataType.BOOLEAN
        
        # Check for numeric
        if pd.api.types.is_numeric_dtype(series):
            return DataType.NUMERIC
        
        # Check for datetime
        if pd.api.types.is_datetime64_any_dtype(series):
            return DataType.DATETIME
        
        # Try to parse as datetime
        try:
            pd.to_datetime(non_null_series.head(100), errors='raise')
            return DataType.DATETIME
        except:
            pass
        
        # Try to parse as numeric
        try:
            pd.to_numeric(non_null_series.head(100), errors='raise')
            return DataType.NUMERIC
        except:
            pass
        
        # Check if categorical (low cardinality relative to size)
        unique_ratio = len(non_null_series.unique()) / len(non_null_series)
        if unique_ratio < 0.1 and len(non_null_series.unique()) < 50:
            return DataType.CATEGORICAL
        
        return DataType.TEXT
    
    @staticmethod
    def safe_float(value):
        """Safely convert value to float, handling NaN values"""
        try:
            if pd.isna(value):
                return None
            if isinstance(value, (np.integer, np.floating)):
                if not np.isfinite(value):
                    return None
            return float(value)
        except (ValueError, TypeError, OverflowError):
            return None
    
    @staticmethod
    def get_column_statistics(series: pd.Series, data_type: DataType) -> Dict[str, Any]:
        """Generate statistics based on column data type"""
        stats = {}
        
        if data_type == DataType.NUMERIC:
            # Only calculate stats for non-null numeric values
            numeric_series = pd.to_numeric(series, errors='coerce').dropna()
            
            if not numeric_series.empty:
                stats.update({
                    "mean": DataProfiler.safe_float(numeric_series.mean()),
                    "median": DataProfiler.safe_float(numeric_series.median()),
                    "std": DataProfiler.safe_float(numeric_series.std()),
                    "min": DataProfiler.safe_float(numeric_series.min()),
                    "max": DataProfiler.safe_float(numeric_series.max()),
                    "q25": DataProfiler.safe_float(numeric_series.quantile(0.25)),
                    "q75": DataProfiler.safe_float(numeric_series.quantile(0.75))
                })
            else:
                stats.update({
                    "mean": None,
                    "median": None,
                    "std": None,
                    "min": None,
                    "max": None,
                    "q25": None,
                    "q75": None
                })
        
        elif data_type == DataType.CATEGORICAL:
            value_counts = series.value_counts().head(10)
            stats.update({
                "most_frequent": str(value_counts.index[0]) if not value_counts.empty else None,
                "frequency_distribution": {str(k): int(v) for k, v in value_counts.to_dict().items()}
            })
        
        elif data_type == DataType.TEXT:
            non_null_series = series.dropna()
            if not non_null_series.empty:
                lengths = non_null_series.astype(str).str.len()
                stats.update({
                    "avg_length": DataProfiler.safe_float(lengths.mean()),
                    "min_length": int(lengths.min()) if not lengths.empty else None,
                    "max_length": int(lengths.max()) if not lengths.empty else None
                })
        
        return stats
    
    @staticmethod
    def profile_column(series: pd.Series, column_name: str) -> ColumnProfile:
        """Generate a complete profile for a single column"""
        data_type = DataProfiler.detect_data_type(series)
        missing_count = int(series.isnull().sum())
        missing_percentage = float((missing_count / len(series)) * 100) if len(series) > 0 else 0
        unique_count = int(series.nunique())
        duplicate_count = int(len(series) - unique_count)
        
        # Get sample values (non-null) and ensure they're JSON serializable
        non_null_values = series.dropna()
        if not non_null_values.empty:
            sample_values = []
            for val in non_null_values.head(5):
                if pd.isna(val):
                    continue
                elif isinstance(val, (np.integer, np.floating)):
                    if np.isnan(val) or np.isinf(val):
                        continue
                    sample_values.append(float(val) if isinstance(val, np.floating) else int(val))
                else:
                    sample_values.append(str(val))
        else:
            sample_values = []
        
        # Generate statistics
        statistics = DataProfiler.get_column_statistics(series, data_type)
        
        return ColumnProfile(
            name=column_name,
            data_type=data_type,
            missing_count=missing_count,
            missing_percentage=missing_percentage,
            unique_count=unique_count,
            duplicate_count=duplicate_count,
            sample_values=sample_values,
            statistics=statistics
        )
    
    @staticmethod
    def profile_dataset(df: pd.DataFrame, dataset_id: str, filename: str) -> DatasetProfile:
        """Generate a complete profile for the entire dataset"""
        # Profile each column
        columns = []
        for col_name in df.columns:
            column_profile = DataProfiler.profile_column(df[col_name], col_name)
            columns.append(column_profile)
        
        # Calculate overall statistics
        total_cells = df.shape[0] * df.shape[1]
        missing_cells = df.isnull().sum().sum()
        overall_missing_percentage = float((missing_cells / total_cells) * 100) if total_cells > 0 else 0
        
        # Count duplicate rows
        duplicate_rows = int(df.duplicated().sum())
        
        # Estimate file size
        file_size = len(df.to_csv().encode('utf-8'))
        
        return DatasetProfile(
            dataset_id=dataset_id,
            filename=filename,
            total_rows=df.shape[0],
            total_columns=df.shape[1],
            columns=columns,
            overall_missing_percentage=overall_missing_percentage,
            duplicate_rows=duplicate_rows,
            file_size=file_size,
            upload_timestamp=datetime.now().isoformat()
        )