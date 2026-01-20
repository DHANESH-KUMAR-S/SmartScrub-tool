import pandas as pd
import numpy as np
from typing import List, Dict, Any
import uuid
from app.models.dataset import (
    CleaningSuggestion, CleaningAction, ImpactLevel, 
    DataType, AutoCleanRequest
)
from app.services.profiler import DataProfiler

class AICleaningAgent:
    """AI agent for generating intelligent data cleaning suggestions"""
    
    @staticmethod
    def analyze_missing_values(df: pd.DataFrame, column: str) -> List[CleaningSuggestion]:
        """Analyze missing values and suggest cleaning actions"""
        suggestions = []
        series = df[column]
        missing_count = series.isnull().sum()
        missing_percentage = (missing_count / len(series)) * 100
        
        if missing_count == 0:
            return suggestions
        
        data_type = DataProfiler.detect_data_type(series)
        
        # High missing percentage - suggest dropping column
        if missing_percentage > 70:
            suggestions.append(CleaningSuggestion(
                id=str(uuid.uuid4()),
                column=column,
                issue_type="High Missing Values",
                description=f"Column '{column}' has {missing_percentage:.1f}% missing values. Consider dropping this column.",
                suggested_action=CleaningAction.DROP_MISSING,
                impact_level=ImpactLevel.HIGH,
                affected_rows=missing_count,
                confidence_score=0.9,
                parameters={"strategy": "drop_column"}
            ))
        
        # Medium missing percentage - suggest imputation
        elif missing_percentage > 20:
            if data_type == DataType.NUMERIC:
                strategy = "median" if series.skew() > 1 else "mean"
                suggestions.append(CleaningSuggestion(
                    id=str(uuid.uuid4()),
                    column=column,
                    issue_type="Missing Values",
                    description=f"Fill {missing_count} missing values in '{column}' with {strategy}.",
                    suggested_action=CleaningAction.FILL_MISSING,
                    impact_level=ImpactLevel.MEDIUM,
                    affected_rows=missing_count,
                    confidence_score=0.8,
                    parameters={"strategy": strategy}
                ))
            elif data_type == DataType.CATEGORICAL:
                suggestions.append(CleaningSuggestion(
                    id=str(uuid.uuid4()),
                    column=column,
                    issue_type="Missing Values",
                    description=f"Fill {missing_count} missing values in '{column}' with mode (most frequent value).",
                    suggested_action=CleaningAction.FILL_MISSING,
                    impact_level=ImpactLevel.MEDIUM,
                    affected_rows=missing_count,
                    confidence_score=0.7,
                    parameters={"strategy": "mode"}
                ))
        
        # Low missing percentage - suggest dropping rows
        elif missing_percentage > 0:
            suggestions.append(CleaningSuggestion(
                id=str(uuid.uuid4()),
                column=column,
                issue_type="Missing Values",
                description=f"Drop {missing_count} rows with missing values in '{column}'.",
                suggested_action=CleaningAction.DROP_MISSING,
                impact_level=ImpactLevel.LOW,
                affected_rows=missing_count,
                confidence_score=0.9,
                parameters={"strategy": "drop_rows"}
            ))
        
        return suggestions
    
    @staticmethod
    def analyze_duplicates(df: pd.DataFrame) -> List[CleaningSuggestion]:
        """Analyze duplicate rows and suggest removal"""
        suggestions = []
        duplicate_count = df.duplicated().sum()
        
        if duplicate_count > 0:
            impact = ImpactLevel.HIGH if duplicate_count > len(df) * 0.1 else ImpactLevel.MEDIUM
            suggestions.append(CleaningSuggestion(
                id=str(uuid.uuid4()),
                column="all_columns",
                issue_type="Duplicate Rows",
                description=f"Found {duplicate_count} duplicate rows. Removing duplicates will improve data quality.",
                suggested_action=CleaningAction.DROP_DUPLICATES,
                impact_level=impact,
                affected_rows=duplicate_count,
                confidence_score=0.95,
                parameters={"keep": "first"}
            ))
        
        return suggestions
    
    @staticmethod
    def analyze_data_types(df: pd.DataFrame) -> List[CleaningSuggestion]:
        """Analyze data types and suggest conversions"""
        suggestions = []
        
        for column in df.columns:
            series = df[column]
            current_dtype = str(series.dtype)
            detected_type = DataProfiler.detect_data_type(series)
            
            # Suggest numeric conversion for string numbers
            if current_dtype == 'object' and detected_type == DataType.NUMERIC:
                # Check if conversion is safe
                try:
                    pd.to_numeric(series.dropna(), errors='raise')
                    suggestions.append(CleaningSuggestion(
                        id=str(uuid.uuid4()),
                        column=column,
                        issue_type="Data Type Mismatch",
                        description=f"Column '{column}' contains numeric data stored as text. Convert to numeric type.",
                        suggested_action=CleaningAction.CONVERT_TYPE,
                        impact_level=ImpactLevel.MEDIUM,
                        affected_rows=len(series.dropna()),
                        confidence_score=0.85,
                        parameters={"target_type": "numeric"}
                    ))
                except:
                    pass
            
            # Suggest datetime conversion
            elif current_dtype == 'object' and detected_type == DataType.DATETIME:
                try:
                    pd.to_datetime(series.dropna().head(100), errors='raise')
                    suggestions.append(CleaningSuggestion(
                        id=str(uuid.uuid4()),
                        column=column,
                        issue_type="Data Type Mismatch",
                        description=f"Column '{column}' contains date/time data stored as text. Convert to datetime type.",
                        suggested_action=CleaningAction.CONVERT_TYPE,
                        impact_level=ImpactLevel.LOW,
                        affected_rows=len(series.dropna()),
                        confidence_score=0.75,
                        parameters={"target_type": "datetime"}
                    ))
                except:
                    pass
        
        return suggestions
    
    @staticmethod
    def analyze_outliers(df: pd.DataFrame) -> List[CleaningSuggestion]:
        """Analyze numeric columns for outliers"""
        suggestions = []
        
        for column in df.columns:
            series = df[column]
            if DataProfiler.detect_data_type(series) == DataType.NUMERIC:
                # Use IQR method to detect outliers
                Q1 = series.quantile(0.25)
                Q3 = series.quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                
                outliers = series[(series < lower_bound) | (series > upper_bound)]
                outlier_count = len(outliers)
                
                if outlier_count > 0 and outlier_count < len(series) * 0.1:  # Less than 10% outliers
                    suggestions.append(CleaningSuggestion(
                        id=str(uuid.uuid4()),
                        column=column,
                        issue_type="Outliers Detected",
                        description=f"Found {outlier_count} potential outliers in '{column}' using IQR method.",
                        suggested_action=CleaningAction.REMOVE_OUTLIERS,
                        impact_level=ImpactLevel.LOW,
                        affected_rows=outlier_count,
                        confidence_score=0.6,
                        parameters={
                            "method": "iqr",
                            "lower_bound": float(lower_bound),
                            "upper_bound": float(upper_bound)
                        }
                    ))
        
        return suggestions
    
    @staticmethod
    def analyze_column_consistency(df: pd.DataFrame) -> List[CleaningSuggestion]:
        """Analyze columns for consistency issues"""
        suggestions = []
        
        for column in df.columns:
            series = df[column]
            if series.dtype == 'object':
                # Check for inconsistent casing
                non_null_values = series.dropna().astype(str)
                if len(non_null_values) > 0:
                    unique_values = non_null_values.unique()
                    lower_values = non_null_values.str.lower().unique()
                    
                    if len(unique_values) > len(lower_values):
                        suggestions.append(CleaningSuggestion(
                            id=str(uuid.uuid4()),
                            column=column,
                            issue_type="Inconsistent Casing",
                            description=f"Column '{column}' has inconsistent text casing (e.g., 'Apple' vs 'apple').",
                            suggested_action=CleaningAction.CONVERT_TYPE,
                            impact_level=ImpactLevel.LOW,
                            affected_rows=len(non_null_values),
                            confidence_score=0.7,
                            parameters={"operation": "standardize_case", "case_type": "lower"}
                        ))
                
                # Check for leading/trailing whitespace
                has_whitespace = non_null_values.str.strip().ne(non_null_values).any()
                if has_whitespace:
                    suggestions.append(CleaningSuggestion(
                        id=str(uuid.uuid4()),
                        column=column,
                        issue_type="Whitespace Issues",
                        description=f"Column '{column}' contains leading or trailing whitespace.",
                        suggested_action=CleaningAction.CONVERT_TYPE,
                        impact_level=ImpactLevel.LOW,
                        affected_rows=len(non_null_values),
                        confidence_score=0.8,
                        parameters={"operation": "trim_whitespace"}
                    ))
        
        return suggestions
    
    @staticmethod
    def analyze_data_patterns(df: pd.DataFrame) -> List[CleaningSuggestion]:
        """Analyze data for pattern-based issues"""
        suggestions = []
        
        for column in df.columns:
            series = df[column]
            if series.dtype == 'object':
                non_null_values = series.dropna().astype(str)
                
                # Check for email patterns
                email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
                if len(non_null_values) > 0:
                    potential_emails = non_null_values.str.contains('@', na=False)
                    if potential_emails.any():
                        valid_emails = non_null_values.str.match(email_pattern, na=False)
                        invalid_count = potential_emails.sum() - valid_emails.sum()
                        
                        if invalid_count > 0:
                            suggestions.append(CleaningSuggestion(
                                id=str(uuid.uuid4()),
                                column=column,
                                issue_type="Invalid Email Format",
                                description=f"Found {invalid_count} invalid email addresses in '{column}'.",
                                suggested_action=CleaningAction.CONVERT_TYPE,
                                impact_level=ImpactLevel.MEDIUM,
                                affected_rows=invalid_count,
                                confidence_score=0.85,
                                parameters={"operation": "validate_emails"}
                            ))
                
                # Check for phone number patterns
                phone_patterns = [r'\d{3}-\d{3}-\d{4}', r'\(\d{3}\)\s?\d{3}-\d{4}', r'\d{10}']
                potential_phones = non_null_values.str.contains(r'\d{3}', na=False)
                if potential_phones.any():
                    suggestions.append(CleaningSuggestion(
                        id=str(uuid.uuid4()),
                        column=column,
                        issue_type="Phone Number Format",
                        description=f"Column '{column}' may contain phone numbers that need standardization.",
                        suggested_action=CleaningAction.CONVERT_TYPE,
                        impact_level=ImpactLevel.LOW,
                        affected_rows=potential_phones.sum(),
                        confidence_score=0.6,
                        parameters={"operation": "standardize_phones"}
                    ))
        
        return suggestions
    
    @staticmethod
    def generate_suggestions(df: pd.DataFrame, request: AutoCleanRequest) -> List[CleaningSuggestion]:
        """Generate comprehensive cleaning suggestions for the dataset"""
        all_suggestions = []
        
        # Analyze duplicates
        all_suggestions.extend(AICleaningAgent.analyze_duplicates(df))
        
        # Analyze missing values for each column
        for column in df.columns:
            all_suggestions.extend(AICleaningAgent.analyze_missing_values(df, column))
        
        # Analyze data types
        all_suggestions.extend(AICleaningAgent.analyze_data_types(df))
        
        # Analyze outliers
        all_suggestions.extend(AICleaningAgent.analyze_outliers(df))
        
        # Analyze column consistency
        all_suggestions.extend(AICleaningAgent.analyze_column_consistency(df))
        
        # Analyze data patterns
        all_suggestions.extend(AICleaningAgent.analyze_data_patterns(df))
        
        # Filter by confidence threshold
        filtered_suggestions = [
            s for s in all_suggestions 
            if s.confidence_score >= request.confidence_threshold
        ]
        
        # Sort by impact level and confidence score
        impact_order = {ImpactLevel.HIGH: 3, ImpactLevel.MEDIUM: 2, ImpactLevel.LOW: 1}
        filtered_suggestions.sort(
            key=lambda x: (impact_order[x.impact_level], x.confidence_score),
            reverse=True
        )
        
        # Limit to max suggestions
        return filtered_suggestions[:request.max_suggestions]