from fastapi import APIRouter, HTTPException
from app.core.storage import storage
from app.services.cleaner import DataCleaner
from app.services.ai_agent import AICleaningAgent
from app.models.dataset import (
    ManualCleaningRequest, AutoCleanRequest, ApplyCleaningRequest
)

router = APIRouter()

# Store suggestions temporarily (in production, use proper storage)
suggestions_store = {}

@router.post("/clean/manual/{dataset_id}")
async def apply_manual_cleaning(dataset_id: str, request: ManualCleaningRequest):
    """Apply manual cleaning operations to the dataset"""
    
    # Retrieve dataset
    df = storage.get_dataset(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    try:
        # Apply manual cleaning
        cleaned_df = DataCleaner.apply_manual_cleaning(df, request)
        
        # Update stored dataset
        storage.update_dataset(dataset_id, cleaned_df)
        
        return {
            "success": True,
            "message": "Manual cleaning applied successfully",
            "original_rows": len(df),
            "cleaned_rows": len(cleaned_df),
            "rows_removed": len(df) - len(cleaned_df),
            "original_columns": len(df.columns),
            "cleaned_columns": len(cleaned_df.columns)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to apply manual cleaning: {str(e)}")

@router.post("/clean/auto/{dataset_id}")
async def get_auto_clean_suggestions(dataset_id: str, request: AutoCleanRequest):
    """Generate AI-powered cleaning suggestions for the dataset"""
    
    # Retrieve dataset
    df = storage.get_dataset(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    try:
        # Generate AI suggestions
        suggestions = AICleaningAgent.generate_suggestions(df, request)
        
        # Store suggestions for later application
        suggestions_store[dataset_id] = suggestions
        
        return {
            "success": True,
            "suggestions": [suggestion.dict() for suggestion in suggestions],
            "total_suggestions": len(suggestions),
            "message": f"Generated {len(suggestions)} cleaning suggestions"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate suggestions: {str(e)}")

@router.post("/clean/apply/{dataset_id}")
async def apply_cleaning_suggestions(dataset_id: str, request: ApplyCleaningRequest):
    """Apply selected AI cleaning suggestions to the dataset"""
    
    # Retrieve dataset
    df = storage.get_dataset(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Retrieve stored suggestions
    suggestions = suggestions_store.get(dataset_id, [])
    if not suggestions:
        raise HTTPException(status_code=404, detail="No suggestions found for this dataset")
    
    try:
        # Apply selected suggestions
        cleaned_df = DataCleaner.apply_ai_suggestions(df, suggestions, request)
        
        # Update stored dataset
        storage.update_dataset(dataset_id, cleaned_df)
        
        # Get applied suggestions details
        applied_suggestions = [s for s in suggestions if s.id in request.suggestion_ids]
        
        return {
            "success": True,
            "message": "AI suggestions applied successfully",
            "original_rows": len(df),
            "cleaned_rows": len(cleaned_df),
            "rows_affected": len(df) - len(cleaned_df),
            "original_columns": len(df.columns),
            "cleaned_columns": len(cleaned_df.columns),
            "applied_suggestions": len(applied_suggestions),
            "suggestion_details": [
                {
                    "id": s.id,
                    "description": s.description,
                    "impact_level": s.impact_level,
                    "affected_rows": s.affected_rows
                }
                for s in applied_suggestions
            ]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to apply suggestions: {str(e)}")

@router.get("/clean/suggestions/{dataset_id}")
async def get_stored_suggestions(dataset_id: str):
    """Retrieve previously generated suggestions for a dataset"""
    
    suggestions = suggestions_store.get(dataset_id, [])
    
    return {
        "success": True,
        "suggestions": [suggestion.dict() for suggestion in suggestions],
        "total_suggestions": len(suggestions)
    }

@router.delete("/clean/suggestions/{dataset_id}")
async def clear_suggestions(dataset_id: str):
    """Clear stored suggestions for a dataset"""
    
    if dataset_id in suggestions_store:
        del suggestions_store[dataset_id]
    
    return {
        "success": True,
        "message": "Suggestions cleared successfully"
    }