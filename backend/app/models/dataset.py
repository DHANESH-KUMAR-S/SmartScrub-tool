from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from enum import Enum

class DataType(str, Enum):
    NUMERIC = "numeric"
    CATEGORICAL = "categorical"
    DATETIME = "datetime"
    TEXT = "text"
    BOOLEAN = "boolean"

class ImpactLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class CleaningAction(str, Enum):
    DROP_DUPLICATES = "drop_duplicates"
    FILL_MISSING = "fill_missing"
    DROP_MISSING = "drop_missing"
    CONVERT_TYPE = "convert_type"
    REMOVE_OUTLIERS = "remove_outliers"

class MissingValueStrategy(str, Enum):
    DROP = "drop"
    MEAN = "mean"
    MEDIAN = "median"
    MODE = "mode"
    FORWARD_FILL = "forward_fill"
    BACKWARD_FILL = "backward_fill"

class ColumnProfile(BaseModel):
    name: str
    data_type: DataType
    missing_count: int
    missing_percentage: float
    unique_count: int
    duplicate_count: int
    sample_values: List[Any]
    statistics: Optional[Dict[str, Any]] = None

class DatasetProfile(BaseModel):
    dataset_id: str
    filename: str
    total_rows: int
    total_columns: int
    columns: List[ColumnProfile]
    overall_missing_percentage: float
    duplicate_rows: int
    file_size: int
    upload_timestamp: str

class CleaningSuggestion(BaseModel):
    id: str
    column: str
    issue_type: str
    description: str
    suggested_action: CleaningAction
    impact_level: ImpactLevel
    affected_rows: int
    confidence_score: float
    parameters: Dict[str, Any]

class ManualCleaningRequest(BaseModel):
    remove_duplicates: bool = False
    missing_value_strategies: Dict[str, MissingValueStrategy] = {}
    columns_to_drop: List[str] = []
    type_conversions: Dict[str, DataType] = {}

class AutoCleanRequest(BaseModel):
    confidence_threshold: float = 0.7
    max_suggestions: int = 10

class ApplyCleaningRequest(BaseModel):
    suggestion_ids: List[str]
    custom_parameters: Dict[str, Dict[str, Any]] = {}

class ExportRequest(BaseModel):
    format: str = "csv"
    include_metadata: bool = False