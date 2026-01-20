import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { profileAPI, cleanAPI } from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { formatNumber, formatPercentage } from '../../utils/formatters';
import styles from './AutoClean.module.css';

const AutoClean = () => {
  const { datasetId } = useParams();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // AI configuration
  const [aiConfig, setAiConfig] = useState({
    confidence_threshold: 0.7,
    max_suggestions: 10
  });

  useEffect(() => {
    if (datasetId) {
      loadData();
    }
  }, [datasetId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const profileResponse = await profileAPI.getProfile(datasetId);
      setProfile(profileResponse.profile);
      
      // Try to load existing suggestions
      try {
        const suggestionsResponse = await cleanAPI.getStoredSuggestions(datasetId);
        if (suggestionsResponse.suggestions.length > 0) {
          setSuggestions(suggestionsResponse.suggestions);
        }
      } catch (err) {
        // No existing suggestions, that's fine
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestions = async () => {
    try {
      setGenerating(true);
      setError(null);
      
      const response = await cleanAPI.getAutoSuggestions(datasetId, aiConfig);
      setSuggestions(response.suggestions);
      setSelectedSuggestions(new Set());
      
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const toggleSuggestion = (suggestionId) => {
    setSelectedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(suggestionId)) {
        newSet.delete(suggestionId);
      } else {
        newSet.add(suggestionId);
      }
      return newSet;
    });
  };

  const selectAllSuggestions = () => {
    setSelectedSuggestions(new Set(suggestions.map(s => s.id)));
  };

  const clearAllSuggestions = () => {
    setSelectedSuggestions(new Set());
  };

  const applySuggestions = async () => {
    if (selectedSuggestions.size === 0) {
      setError('Please select at least one suggestion to apply');
      return;
    }

    try {
      setApplying(true);
      setError(null);
      
      const response = await cleanAPI.applySuggestions(datasetId, {
        suggestion_ids: Array.from(selectedSuggestions),
        custom_parameters: {}
      });
      
      setSuccess(`Successfully applied ${response.applied_suggestions} suggestions! ${response.rows_affected} rows affected.`);
      
      // Clear suggestions and reload data
      setTimeout(() => {
        setSuggestions([]);
        setSelectedSuggestions(new Set());
        loadData();
        setSuccess(null);
      }, 3000);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setApplying(false);
    }
  };

  const getImpactColor = (level) => {
    switch (level) {
      case 'high': return styles.impactHigh;
      case 'medium': return styles.impactMedium;
      case 'low': return styles.impactLow;
      default: return '';
    }
  };

  const getImpactIcon = (level) => {
    switch (level) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const getConfidenceColor = (score) => {
    if (score >= 0.9) return styles.confidenceHigh;
    if (score >= 0.7) return styles.confidenceMedium;
    return styles.confidenceLow;
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className="loading-spinner"></div>
        <span>Loading AI suggestions...</span>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className={styles.error}>
        <span className={styles.errorIcon}>⚠️</span>
        <h3>Error Loading Dataset</h3>
        <p>{error}</p>
        <Button variant="primary" onClick={() => navigate('/upload')}>
          Upload New Dataset
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.autoClean}>
      <div className={styles.autoCleanHeader}>
        <div className={styles.headerInfo}>
          <h2>🤖 AI-Powered Suggestions</h2>
          <p className={styles.datasetName}>{profile?.filename}</p>
          <p className={styles.datasetStats}>
            {formatNumber(profile?.total_rows)} rows • {profile?.total_columns} columns
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button 
            variant="secondary" 
            onClick={generateSuggestions}
            loading={generating}
            disabled={generating}
          >
            🔄 Generate Suggestions
          </Button>
          <Button 
            variant="primary" 
            onClick={applySuggestions}
            loading={applying}
            disabled={applying || selectedSuggestions.size === 0}
          >
            ✨ Apply Selected ({selectedSuggestions.size})
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

      {/* AI Configuration */}
      <Card className={styles.configCard}>
        <div className={styles.cardHeader}>
          <h3>⚙️ AI Configuration</h3>
        </div>
        
        <div className={styles.configContent}>
          <div className={styles.configItem}>
            <label className={styles.configLabel}>
              Confidence Threshold: {(aiConfig.confidence_threshold * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0.5"
              max="1.0"
              step="0.1"
              value={aiConfig.confidence_threshold}
              onChange={(e) => setAiConfig(prev => ({
                ...prev,
                confidence_threshold: parseFloat(e.target.value)
              }))}
              className={styles.configSlider}
            />
            <span className={styles.configHelp}>
              Higher values show only high-confidence suggestions
            </span>
          </div>
          
          <div className={styles.configItem}>
            <label className={styles.configLabel}>
              Max Suggestions: {aiConfig.max_suggestions}
            </label>
            <input
              type="range"
              min="5"
              max="20"
              step="1"
              value={aiConfig.max_suggestions}
              onChange={(e) => setAiConfig(prev => ({
                ...prev,
                max_suggestions: parseInt(e.target.value)
              }))}
              className={styles.configSlider}
            />
            <span className={styles.configHelp}>
              Maximum number of suggestions to generate
            </span>
          </div>
        </div>
      </Card>

      {/* Suggestions List */}
      {suggestions.length > 0 ? (
        <>
          <div className={styles.suggestionsHeader}>
            <div className={styles.suggestionsInfo}>
              <h3>💡 Cleaning Suggestions</h3>
              <span className={styles.suggestionsCount}>
                {suggestions.length} suggestions found
              </span>
            </div>
            <div className={styles.suggestionsActions}>
              <Button variant="ghost" size="small" onClick={clearAllSuggestions}>
                Clear All
              </Button>
              <Button variant="ghost" size="small" onClick={selectAllSuggestions}>
                Select All
              </Button>
            </div>
          </div>

          <div className={styles.suggestionsList}>
            {suggestions.map((suggestion, index) => (
              <Card 
                key={suggestion.id} 
                className={`${styles.suggestionCard} ${
                  selectedSuggestions.has(suggestion.id) ? styles.selected : ''
                }`}
              >
                <div className={styles.suggestionHeader}>
                  <div className={styles.suggestionMeta}>
                    <label className={styles.suggestionCheckbox}>
                      <input
                        type="checkbox"
                        checked={selectedSuggestions.has(suggestion.id)}
                        onChange={() => toggleSuggestion(suggestion.id)}
                        className={styles.checkbox}
                      />
                      <span className={styles.suggestionTitle}>
                        {suggestion.issue_type}
                      </span>
                    </label>
                    
                    <div className={styles.suggestionBadges}>
                      <span className={`${styles.impactBadge} ${getImpactColor(suggestion.impact_level)}`}>
                        {getImpactIcon(suggestion.impact_level)} {suggestion.impact_level.toUpperCase()}
                      </span>
                      <span className={`${styles.confidenceBadge} ${getConfidenceColor(suggestion.confidence_score)}`}>
                        {Math.round(suggestion.confidence_score * 100)}% confidence
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className={styles.suggestionContent}>
                  <p className={styles.suggestionDescription}>
                    {suggestion.description}
                  </p>
                  
                  <div className={styles.suggestionDetails}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Column:</span>
                      <span className={styles.detailValue}>{suggestion.column}</span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Affected Rows:</span>
                      <span className={styles.detailValue}>
                        {formatNumber(suggestion.affected_rows)}
                      </span>
                    </div>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Action:</span>
                      <span className={styles.detailValue}>{suggestion.suggested_action}</span>
                    </div>
                  </div>
                  
                  {suggestion.parameters && Object.keys(suggestion.parameters).length > 0 && (
                    <div className={styles.suggestionParameters}>
                      <span className={styles.parametersLabel}>Parameters:</span>
                      <div className={styles.parametersList}>
                        {Object.entries(suggestion.parameters).map(([key, value]) => (
                          <span key={key} className={styles.parameter}>
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card className={styles.noSuggestions}>
          <div className={styles.noSuggestionsContent}>
            <div className={styles.noSuggestionsIcon}>🤖</div>
            <h3>No Suggestions Generated</h3>
            <p>
              {generating 
                ? 'AI is analyzing your data...' 
                : 'Click "Generate Suggestions" to let AI analyze your data and recommend cleaning operations.'
              }
            </p>
            {!generating && (
              <Button variant="primary" onClick={generateSuggestions}>
                🚀 Generate AI Suggestions
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Data Quality Overview */}
      <Card className={styles.qualityCard}>
        <div className={styles.cardHeader}>
          <h3>📊 Data Quality Overview</h3>
        </div>
        
        <div className={styles.qualityGrid}>
          <div className={styles.qualityItem}>
            <div className={styles.qualityIcon}>📈</div>
            <div className={styles.qualityContent}>
              <span className={styles.qualityLabel}>Overall Quality</span>
              <span className={styles.qualityValue}>
                {profile ? Math.round((100 - profile.overall_missing_percentage) * 0.9) : 0}%
              </span>
            </div>
          </div>
          
          <div className={styles.qualityItem}>
            <div className={styles.qualityIcon}>❓</div>
            <div className={styles.qualityContent}>
              <span className={styles.qualityLabel}>Missing Data</span>
              <span className={styles.qualityValue}>
                {formatPercentage(profile?.overall_missing_percentage || 0)}
              </span>
            </div>
          </div>
          
          <div className={styles.qualityItem}>
            <div className={styles.qualityIcon}>🔄</div>
            <div className={styles.qualityContent}>
              <span className={styles.qualityLabel}>Duplicates</span>
              <span className={styles.qualityValue}>
                {formatNumber(profile?.duplicate_rows || 0)}
              </span>
            </div>
          </div>
          
          <div className={styles.qualityItem}>
            <div className={styles.qualityIcon}>🎯</div>
            <div className={styles.qualityContent}>
              <span className={styles.qualityLabel}>Suggestions</span>
              <span className={styles.qualityValue}>
                {suggestions.length}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Navigation */}
      <Card className={styles.navigationCard}>
        <div className={styles.navigationContent}>
          <Button 
            variant="secondary" 
            onClick={() => navigate(`/cleaning/${datasetId}`)}
          >
            ← Manual Cleaning
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => navigate(`/profile/${datasetId}`)}
          >
            Back to Profile
          </Button>
          <Button 
            variant="primary" 
            onClick={() => navigate(`/export/${datasetId}`)}
          >
            Export Data →
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AutoClean;