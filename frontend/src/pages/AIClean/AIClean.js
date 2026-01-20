import React, { useState, useEffect } from 'react';
import { useWorkflow } from '../../contexts/WorkflowContext';
import { useNavigate } from 'react-router-dom';
import styles from './AIClean.module.css';

const AIClean = () => {
  const { currentDataset, completeStep } = useWorkflow();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState(new Set());
  const [expandedSuggestion, setExpandedSuggestion] = useState(null);

  useEffect(() => {
    if (!currentDataset) {
      navigate('/upload');
      return;
    }
    generateSuggestions();
  }, [currentDataset, navigate]);

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/clean/auto/${currentDataset}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confidence_threshold: 0.5,
          max_suggestions: 20
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuggestions(data.suggestions);
        // Auto-select high confidence suggestions
        const autoSelect = new Set(
          data.suggestions
            .filter(s => s.confidence_score >= 0.8 && s.impact_level === 'high')
            .map(s => s.id)
        );
        setSelectedSuggestions(autoSelect);
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSuggestion = (id) => {
    setSelectedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedSuggestions(new Set(suggestions.map(s => s.id)));
  };

  const deselectAll = () => {
    setSelectedSuggestions(new Set());
  };

  const applySuggestions = async () => {
    if (selectedSuggestions.size === 0) {
      alert('Please select at least one suggestion');
      return;
    }

    setApplying(true);
    try {
      const response = await fetch(`http://localhost:8000/api/clean/apply/${currentDataset}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestion_ids: Array.from(selectedSuggestions),
          custom_parameters: {}
        })
      });

      const data = await response.json();
      if (data.success) {
        completeStep(4);
        alert(`AI cleaning applied! ${data.applied_suggestions} suggestions processed.`);
        navigate('/export');
      }
    } catch (error) {
      console.error('Error applying suggestions:', error);
      alert('Failed to apply suggestions');
    } finally {
      setApplying(false);
    }
  };

  const getImpactColor = (level) => {
    switch (level) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6366f1';
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

  const getActionLabel = (action) => {
    const labels = {
      'drop_duplicates': 'Remove Duplicates',
      'fill_missing': 'Fill Missing Values',
      'drop_missing': 'Drop Missing Data',
      'convert_type': 'Convert Data Type',
      'remove_outliers': 'Remove Outliers'
    };
    return labels[action] || action;
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Analyzing dataset and generating AI suggestions...</p>
      </div>
    );
  }

  const groupedSuggestions = {
    high: suggestions.filter(s => s.impact_level === 'high'),
    medium: suggestions.filter(s => s.impact_level === 'medium'),
    low: suggestions.filter(s => s.impact_level === 'low')
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>AI-Powered Cleaning</h1>
          <p>Review and apply intelligent cleaning suggestions</p>
        </div>
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{suggestions.length}</span>
            <span className={styles.statLabel}>Suggestions</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{selectedSuggestions.size}</span>
            <span className={styles.statLabel}>Selected</span>
          </div>
        </div>
      </div>

      {suggestions.length === 0 ? (
        <div className={styles.noSuggestions}>
          <div className={styles.noSuggestionsIcon}>✨</div>
          <h2>Your data looks great!</h2>
          <p>No cleaning suggestions found. Your dataset is already in good shape.</p>
          <button 
            className={styles.continueButton}
            onClick={() => {
              completeStep(4);
              navigate('/export');
            }}
          >
            Continue to Export
          </button>
        </div>
      ) : (
        <>
          <div className={styles.controls}>
            <div className={styles.bulkActions}>
              <button onClick={selectAll} className={styles.bulkButton}>
                Select All
              </button>
              <button onClick={deselectAll} className={styles.bulkButton}>
                Deselect All
              </button>
            </div>
            <div className={styles.legend}>
              <span className={styles.legendItem}>
                🔴 High Impact
              </span>
              <span className={styles.legendItem}>
                🟡 Medium Impact
              </span>
              <span className={styles.legendItem}>
                🟢 Low Impact
              </span>
            </div>
          </div>

          <div className={styles.content}>
            {['high', 'medium', 'low'].map(level => {
              const levelSuggestions = groupedSuggestions[level];
              if (levelSuggestions.length === 0) return null;

              return (
                <div key={level} className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h2>
                      {getImpactIcon(level)} {level.charAt(0).toUpperCase() + level.slice(1)} Impact
                    </h2>
                    <span className={styles.badge}>{levelSuggestions.length} suggestions</span>
                  </div>

                  <div className={styles.suggestionsList}>
                    {levelSuggestions.map(suggestion => (
                      <div 
                        key={suggestion.id} 
                        className={`${styles.suggestionCard} ${selectedSuggestions.has(suggestion.id) ? styles.selected : ''}`}
                      >
                        <div className={styles.suggestionHeader}>
                          <label className={styles.checkbox}>
                            <input
                              type="checkbox"
                              checked={selectedSuggestions.has(suggestion.id)}
                              onChange={() => toggleSuggestion(suggestion.id)}
                            />
                            <div className={styles.suggestionInfo}>
                              <h3>{suggestion.issue_type}</h3>
                              <p>{suggestion.description}</p>
                            </div>
                          </label>
                          <button
                            className={styles.expandButton}
                            onClick={() => setExpandedSuggestion(
                              expandedSuggestion === suggestion.id ? null : suggestion.id
                            )}
                          >
                            {expandedSuggestion === suggestion.id ? '−' : '+'}
                          </button>
                        </div>

                        <div className={styles.suggestionMeta}>
                          <span className={styles.metaItem}>
                            <span className={styles.metaLabel}>Action:</span>
                            <span className={styles.metaValue}>
                              {getActionLabel(suggestion.suggested_action)}
                            </span>
                          </span>
                          <span className={styles.metaItem}>
                            <span className={styles.metaLabel}>Affects:</span>
                            <span className={styles.metaValue}>
                              {suggestion.affected_rows} rows
                            </span>
                          </span>
                          <span className={styles.metaItem}>
                            <span className={styles.metaLabel}>Confidence:</span>
                            <span className={styles.metaValue}>
                              {(suggestion.confidence_score * 100).toFixed(0)}%
                            </span>
                          </span>
                          {suggestion.column && suggestion.column !== 'all_columns' && (
                            <span className={styles.metaItem}>
                              <span className={styles.metaLabel}>Column:</span>
                              <span className={styles.columnBadge}>{suggestion.column}</span>
                            </span>
                          )}
                        </div>

                        {expandedSuggestion === suggestion.id && (
                          <div className={styles.suggestionDetails}>
                            <h4>Parameters:</h4>
                            <pre>{JSON.stringify(suggestion.parameters, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.footer}>
            <button 
              className={styles.skipButton}
              onClick={() => {
                completeStep(4);
                navigate('/export');
              }}
            >
              Skip AI Cleaning
            </button>
            <button 
              className={styles.applyButton}
              onClick={applySuggestions}
              disabled={applying || selectedSuggestions.size === 0}
            >
              {applying ? 'Applying...' : `Apply ${selectedSuggestions.size} Suggestions`}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AIClean;
