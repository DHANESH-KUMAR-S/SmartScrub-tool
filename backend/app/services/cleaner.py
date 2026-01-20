import pandas as pd
import numpy as np
from typing import Dict, List, Any
from app.models.dataset import (
    ManualCleaningRequest, MissingValueStrategy, DataType,
    CleaningSuggestion, CleaningAction, ApplyCleaningRequest
)
from app.services.profiler import DataProfiler

class DataCleaner:
    """Service for applying data cleaning operations"""
    
    @staticmethod
    def apply_manual_cleaning(df: pd.DataFrame, request: ManualCleaningRequest) -> pd.DataFrame:
        """Apply manual cleaning operations to the dataset"""
        cleaned_df = df.copy()
        
        # Remove duplicates if requested
        if request.remove_duplicates:
            cleaned_df = cleaned_df.drop_duplicates()
        
        # Drop specified columns
        if request.columns_to_drop:
            columns_to_drop = [col for col in request.columns_to_drop if col in cleaned_df.columns]
            cleaned_df = cleaned_df.drop(columns=columns_to_drop)
        
        # Apply missing value strategies
        for column, strategy in request.missing_value_strategies.items():
            if column in cleaned_df.columns:
                cleaned_df = DataCleaner._handle_missing_values(cleaned_df, column, strategy)
        
        # Apply type conversions
        for column, target_type in request.type_conversions.items():
            if column in cleaned_df.columns:
                cleaned_df = DataCleaner._convert_column_type(cleaned_df, column, target_type)
        
        return cleaned_df
    
    @staticmethod
    def _handle_missing_values(df: pd.DataFrame, column: str, strategy: MissingValueStrategy) -> pd.DataFrame:
        """Handle missing values in a specific column"""
        if strategy == MissingValueStrategy.DROP:
            return df.dropna(subset=[column])
        
        elif strategy == MissingValueStrategy.MEAN:
            if pd.api.types.is_numeric_dtype(df[column]):
                df[column] = df[column].fillna(df[column].mean())
        
        elif strategy == MissingValueStrategy.MEDIAN:
            if pd.api.types.is_numeric_dtype(df[column]):
                df[column] = df[column].fillna(df[column].median())
        
        elif strategy == MissingValueStrategy.MODE:
            mode_value = df[column].mode()
            if not mode_value.empty:
                df[column] = df[column].fillna(mode_value.iloc[0])
        
        elif strategy == MissingValueStrategy.FORWARD_FILL:
            df[column] = df[column].fillna(method='ffill')
        
        elif strategy == MissingValueStrategy.BACKWARD_FILL:
            df[column] = df[column].fillna(method='bfill')
        
        return df
    
    @staticmethod
    def _convert_column_type(df: pd.DataFrame, column: str, target_type: DataType) -> pd.DataFrame:
        """Convert column to target data type"""
        try:
            if target_type == DataType.NUMERIC:
                df[column] = pd.to_numeric(df[column], errors='coerce')
            
            elif target_type == DataType.DATETIME:
                df[column] = pd.to_datetime(df[column], errors='coerce')
            
            elif target_type == DataType.CATEGORICAL:
                df[column] = df[column].astype('category')
            
            elif target_type == DataType.BOOLEAN:
                # Convert common boolean representations
                bool_map = {
                    'true': True, 'false': False,
                    'True': True, 'False': False,
                    '1': True, '0': False,
                    'yes': True, 'no': False,
                    'Yes': True, 'No': False
                }
                df[column] = df[column].map(bool_map).fillna(df[column])
            
            elif target_type == DataType.TEXT:
                df[column] = df[column].astype(str)
        
        except Exception as e:
            # If conversion fails, leave column unchanged
            print(f"Failed to convert column {column} to {target_type}: {e}")
        
        return df
    
    @staticmethod
    def apply_ai_suggestions(df: pd.DataFrame, suggestions: List[CleaningSuggestion], 
                           request: ApplyCleaningRequest) -> pd.DataFrame:
        """Apply selected AI cleaning suggestions"""
        cleaned_df = df.copy()
        
        # Filter suggestions by requested IDs
        selected_suggestions = [s for s in suggestions if s.id in request.suggestion_ids]
        
        # Sort suggestions by impact level (apply high impact first)
        impact_order = {"high": 3, "medium": 2, "low": 1}
        selected_suggestions.sort(
            key=lambda x: impact_order.get(x.impact_level.value, 0),
            reverse=True
        )
        
        for suggestion in selected_suggestions:
            # Get custom parameters if provided
            params = request.custom_parameters.get(suggestion.id, suggestion.parameters)
            
            try:
                if suggestion.suggested_action == CleaningAction.DROP_DUPLICATES:
                    cleaned_df = cleaned_df.drop_duplicates(keep=params.get("keep", "first"))
                
                elif suggestion.suggested_action == CleaningAction.FILL_MISSING:
                    strategy = params.get("strategy", "mean")
                    if strategy == "mean" and pd.api.types.is_numeric_dtype(cleaned_df[suggestion.column]):
                        cleaned_df[suggestion.column] = cleaned_df[suggestion.column].fillna(
                            cleaned_df[suggestion.column].mean()
                        )
                    elif strategy == "median" and pd.api.types.is_numeric_dtype(cleaned_df[suggestion.column]):
                        cleaned_df[suggestion.column] = cleaned_df[suggestion.column].fillna(
                            cleaned_df[suggestion.column].median()
                        )
                    elif strategy == "mode":
                        mode_value = cleaned_df[suggestion.column].mode()
                        if not mode_value.empty:
                            cleaned_df[suggestion.column] = cleaned_df[suggestion.column].fillna(mode_value.iloc[0])
                
                elif suggestion.suggested_action == CleaningAction.DROP_MISSING:
                    if params.get("strategy") == "drop_column":
                        cleaned_df = cleaned_df.drop(columns=[suggestion.column])
                    else:
                        cleaned_df = cleaned_df.dropna(subset=[suggestion.column])
                
                elif suggestion.suggested_action == CleaningAction.CONVERT_TYPE:
                    target_type = params.get("target_type")
                    operation = params.get("operation")
                    
                    if operation == "standardize_case":
                        case_type = params.get("case_type", "lower")
                        if case_type == "lower":
                            cleaned_df[suggestion.column] = cleaned_df[suggestion.column].astype(str).str.lower()
                        elif case_type == "upper":
                            cleaned_df[suggestion.column] = cleaned_df[suggestion.column].astype(str).str.upper()
                        elif case_type == "title":
                            cleaned_df[suggestion.column] = cleaned_df[suggestion.column].astype(str).str.title()
                    
                    elif operation == "trim_whitespace":
                        cleaned_df[suggestion.column] = cleaned_df[suggestion.column].astype(str).str.strip()
                    
                    elif operation == "validate_emails":
                        # Mark invalid emails as NaN for further processing
                        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
                        mask = cleaned_df[suggestion.column].astype(str).str.match(email_pattern, na=False)
                        cleaned_df.loc[~mask, suggestion.column] = np.nan
                    
                    elif operation == "standardize_phones":
                        # Basic phone number standardization
                        phone_col = cleaned_df[suggestion.column].astype(str)
                        # Remove non-digits
                        phone_col = phone_col.str.replace(r'[^\d]', '', regex=True)
                        # Format as XXX-XXX-XXXX if 10 digits
                        mask = phone_col.str.len() == 10
                        phone_col.loc[mask] = phone_col.loc[mask].str.replace(r'(\d{3})(\d{3})(\d{4})', r'\1-\2-\3', regex=True)
                        cleaned_df[suggestion.column] = phone_col
                    
                    elif target_type == "numeric":
                        cleaned_df[suggestion.column] = pd.to_numeric(
                            cleaned_df[suggestion.column], errors='coerce'
                        )
                    elif target_type == "datetime":
                        cleaned_df[suggestion.column] = pd.to_datetime(
                            cleaned_df[suggestion.column], errors='coerce'
                        )
                
                elif suggestion.suggested_action == CleaningAction.REMOVE_OUTLIERS:
                    if params.get("method") == "iqr":
                        lower_bound = params.get("lower_bound")
                        upper_bound = params.get("upper_bound")
                        if lower_bound is not None and upper_bound is not None:
                            mask = (cleaned_df[suggestion.column] >= lower_bound) & \
                                   (cleaned_df[suggestion.column] <= upper_bound)
                            cleaned_df = cleaned_df[mask]
            
            except Exception as e:
                print(f"Failed to apply suggestion {suggestion.id}: {e}")
                continue
        
        return cleaned_df