import React, { useState, useEffect, useRef } from 'react';
import { profileAPI } from '../../services/api';
import Button from '../UI/Button';
import { formatNumber } from '../../utils/formatters';
import styles from './DataCanvas.module.css';

// Column Quality Indicator Component
const ColumnQualityIndicator = ({ column, profile, onHover, onLeave }) => {
  const getQualityColor = (missingPercentage) => {
    if (missingPercentage === 0) return '#10b981'; // Green - Perfect
    if (missingPercentage < 10) return '#f59e0b'; // Yellow - Good
    if (missingPercentage < 30) return '#f97316'; // Orange - Fair
    return '#ef4444'; // Red - Poor
  };

  const getQualityLabel = (missingPercentage) => {
    if (missingPercentage === 0) return 'Perfect';
    if (missingPercentage < 10) return 'Good';
    if (missingPercentage < 30) return 'Fair';
    return 'Poor';
  };

  const qualityColor = getQualityColor(profile.missing_percentage);
  const qualityLabel = getQualityLabel(profile.missing_percentage);

  const handleMouseEnter = (event) => {
    onHover(column, profile, event);
  };

  return (
    <div 
      className={styles.qualityIndicator}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onLeave}
    >
      <div className={styles.qualityHeader}>
        <span className={styles.qualityColumnName}>{column}</span>
        <span 
          className={styles.qualityBadge}
          style={{ backgroundColor: qualityColor }}
        >
          {qualityLabel}
        </span>
      </div>
      
      <div className={styles.qualityMetrics}>
        <div className={styles.qualityMetric}>
          <span className={styles.metricLabel}>Missing:</span>
          <span className={styles.metricValue}>{profile.missing_percentage.toFixed(1)}%</span>
        </div>
        <div className={styles.qualityMetric}>
          <span className={styles.metricLabel}>Unique:</span>
          <span className={styles.metricValue}>{profile.unique_count}</span>
        </div>
        <div className={styles.qualityMetric}>
          <span className={styles.metricLabel}>Type:</span>
          <span className={styles.metricValue}>{profile.data_type}</span>
        </div>
      </div>
      
      {/* Quality Progress Bar */}
      <div className={styles.qualityProgress}>
        <div 
          className={styles.qualityProgressFill}
          style={{ 
            width: `${100 - profile.missing_percentage}%`,
            backgroundColor: qualityColor
          }}
        />
      </div>
    </div>
  );
};

// Chart Component for Hover
const ColumnChart = ({ column, profile, position }) => {
  const renderChart = () => {
    if (profile.data_type === 'NUMERIC' && profile.statistics) {
      return (
        <div className={styles.chartContent}>
          <h4>Distribution</h4>
          <div className={styles.numericStats}>
            <div className={styles.statItem}>
              <span>Min:</span>
              <span>{profile.statistics.min?.toFixed(2) || 'N/A'}</span>
            </div>
            <div className={styles.statItem}>
              <span>Max:</span>
              <span>{profile.statistics.max?.toFixed(2) || 'N/A'}</span>
            </div>
            <div className={styles.statItem}>
              <span>Mean:</span>
              <span>{profile.statistics.mean?.toFixed(2) || 'N/A'}</span>
            </div>
            <div className={styles.statItem}>
              <span>Std Dev:</span>
              <span>{profile.statistics.std?.toFixed(2) || 'N/A'}</span>
            </div>
          </div>
          {/* Simple histogram representation */}
          <div className={styles.histogram}>
            <div className={styles.histogramBar} style={{ height: '60%' }}></div>
            <div className={styles.histogramBar} style={{ height: '80%' }}></div>
            <div className={styles.histogramBar} style={{ height: '100%' }}></div>
            <div className={styles.histogramBar} style={{ height: '70%' }}></div>
            <div className={styles.histogramBar} style={{ height: '40%' }}></div>
          </div>
        </div>
      );
    } else if (profile.data_type === 'CATEGORICAL' && profile.statistics?.frequency_distribution) {
      const frequencies = Object.entries(profile.statistics.frequency_distribution).slice(0, 5);
      const maxFreq = Math.max(...frequencies.map(([, freq]) => freq));
      
      return (
        <div className={styles.chartContent}>
          <h4>Top Values</h4>
          <div className={styles.categoryChart}>
            {frequencies.map(([value, freq]) => (
              <div key={value} className={styles.categoryItem}>
                <span className={styles.categoryLabel}>{value}</span>
                <div className={styles.categoryBar}>
                  <div 
                    className={styles.categoryBarFill}
                    style={{ width: `${(freq / maxFreq) * 100}%` }}
                  />
                  <span className={styles.categoryCount}>{freq}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    } else {
      return (
        <div className={styles.chartContent}>
          <h4>Sample Values</h4>
          <div className={styles.sampleValues}>
            {profile.sample_values?.slice(0, 5).map((value, index) => (
              <div key={index} className={styles.sampleValue}>
                {String(value)}
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  return (
    <div 
      className={styles.columnChart}
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className={styles.chartHeader}>
        <span className={styles.chartTitle}>{column}</span>
        <span className={styles.chartType}>{profile.data_type}</span>
      </div>
      {renderChart()}
    </div>
  );
};

const DataCanvas = ({ datasetId, isOpen, onClose }) => {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [columnProfiles, setColumnProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(50);
  const [hasChanges, setHasChanges] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [hoveredColumn, setHoveredColumn] = useState(null);
  const [chartPosition, setChartPosition] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef(null);
  const editInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && datasetId) {
      loadData();
      loadColumnProfiles();
    }
  }, [isOpen, datasetId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCell]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await profileAPI.getPreview(datasetId, 1000); // Load more data for canvas
      setData(response.preview.data);
      setColumns(response.preview.columns);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadColumnProfiles = async () => {
    try {
      const profileResponse = await profileAPI.getProfile(datasetId);
      const profiles = {};
      profileResponse.profile.columns.forEach(col => {
        profiles[col.name] = col;
      });
      setColumnProfiles(profiles);
    } catch (err) {
      console.error('Error loading column profiles:', err);
    }
  };

  const handleColumnHover = (column, profile, event) => {
    const rect = event.target.getBoundingClientRect();
    setChartPosition({
      x: rect.left + rect.width / 2 - 150, // Center the chart
      y: rect.bottom + 10
    });
    setHoveredColumn({ column, profile });
  };

  const handleColumnLeave = () => {
    setHoveredColumn(null);
  };

  const handleCellClick = (rowIndex, columnIndex) => {
    const cellKey = `${rowIndex}-${columnIndex}`;
    setEditingCell({ row: rowIndex, col: columnIndex, key: cellKey });
  };

  const handleCellChange = (value, rowIndex, columnIndex) => {
    const newData = [...data];
    const columnName = columns[columnIndex];
    newData[rowIndex][columnName] = value;
    setData(newData);
    setHasChanges(true);
  };

  const handleKeyDown = (e, rowIndex, columnIndex) => {
    if (e.key === 'Enter') {
      setEditingCell(null);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      // Revert changes if needed
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const nextCol = columnIndex + 1;
      if (nextCol < columns.length) {
        setEditingCell({ row: rowIndex, col: nextCol, key: `${rowIndex}-${nextCol}` });
      } else if (rowIndex + 1 < data.length) {
        setEditingCell({ row: rowIndex + 1, col: 0, key: `${rowIndex + 1}-0` });
      }
    }
  };

  const handleSort = (columnName) => {
    let direction = 'asc';
    if (sortConfig.key === columnName && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    const sortedData = [...data].sort((a, b) => {
      if (a[columnName] < b[columnName]) return direction === 'asc' ? -1 : 1;
      if (a[columnName] > b[columnName]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    setData(sortedData);
    setSortConfig({ key: columnName, direction });
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const filteredData = data.filter(row =>
    Object.values(row).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const addRow = () => {
    const newRow = {};
    columns.forEach(col => {
      newRow[col] = '';
    });
    setData([...data, newRow]);
    setHasChanges(true);
  };

  const deleteRow = (rowIndex) => {
    const newData = data.filter((_, index) => index !== rowIndex);
    setData(newData);
    setHasChanges(true);
  };

  const addColumn = () => {
    const columnName = prompt('Enter column name:');
    if (columnName && !columns.includes(columnName)) {
      setColumns([...columns, columnName]);
      const newData = data.map(row => ({ ...row, [columnName]: '' }));
      setData(newData);
      setHasChanges(true);
    }
  };

  const deleteColumn = (columnName) => {
    if (window.confirm(`Are you sure you want to delete column "${columnName}"?`)) {
      setColumns(columns.filter(col => col !== columnName));
      const newData = data.map(row => {
        const { [columnName]: deleted, ...rest } = row;
        return rest;
      });
      setData(newData);
      setHasChanges(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.canvasOverlay}>
      <div className={styles.canvasContainer} ref={canvasRef}>
        <div className={styles.canvasHeader}>
          <div className={styles.headerLeft}>
            <h2 className={styles.canvasTitle}>
              <span className={styles.canvasIcon}>🎨</span>
              Data Canvas
            </h2>
            <div className={styles.dataInfo}>
              <span className={styles.dataCount}>
                {formatNumber(filteredData.length)} rows • {columns.length} columns
              </span>
              {hasChanges && (
                <span className={styles.changesIndicator}>
                  <span className={styles.changesDot}></span>
                  Unsaved changes
                </span>
              )}
            </div>
          </div>
          
          <div className={styles.headerActions}>
            <div className={styles.searchBox}>
              <input
                type="text"
                placeholder="Search data..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className={styles.searchInput}
              />
              <span className={styles.searchIcon}>🔍</span>
            </div>
            
            <Button variant="ghost" size="small" onClick={addRow}>
              + Row
            </Button>
            <Button variant="ghost" size="small" onClick={addColumn}>
              + Column
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Close Canvas
            </Button>
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className="loading-spinner"></div>
            <span>Loading canvas...</span>
          </div>
        ) : error ? (
          <div className={styles.error}>
            <span className={styles.errorIcon}>⚠️</span>
            <span>{error}</span>
          </div>
        ) : (
          <>
            {/* Column Quality Indicators */}
            <div className={styles.qualityIndicatorsSection}>
              <div className={styles.qualityIndicatorsHeader}>
                <h3>Column Quality Overview</h3>
                <span className={styles.qualityHint}>Hover over columns to see detailed charts</span>
              </div>
              <div className={styles.qualityIndicators}>
                {columns.map(column => {
                  const profile = columnProfiles[column];
                  if (!profile) return null;
                  
                  return (
                    <ColumnQualityIndicator
                      key={column}
                      column={column}
                      profile={profile}
                      onHover={handleColumnHover}
                      onLeave={handleColumnLeave}
                    />
                  );
                })}
              </div>
            </div>

            <div className={styles.canvasContent}>
              <div className={styles.tableContainer}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th className={styles.rowNumberHeader}>#</th>
                      {columns.map((column, colIndex) => (
                        <th key={column} className={styles.columnHeader}>
                          <div className={styles.headerContent}>
                            <span
                              className={styles.columnName}
                              onClick={() => handleSort(column)}
                            >
                              {column}
                              {sortConfig.key === column && (
                                <span className={styles.sortIndicator}>
                                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                </span>
                              )}
                            </span>
                            <button
                              className={styles.deleteColumnBtn}
                              onClick={() => deleteColumn(column)}
                              title="Delete column"
                            >
                              ×
                            </button>
                          </div>
                        </th>
                      ))}
                      <th className={styles.actionsHeader}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((row, rowIndex) => {
                      const actualRowIndex = (currentPage - 1) * rowsPerPage + rowIndex;
                      return (
                        <tr key={actualRowIndex} className={styles.dataRow}>
                          <td className={styles.rowNumber}>
                            {actualRowIndex + 1}
                          </td>
                          {columns.map((column, colIndex) => (
                            <td
                              key={`${actualRowIndex}-${colIndex}`}
                              className={styles.dataCell}
                              onClick={() => handleCellClick(actualRowIndex, colIndex)}
                            >
                              {editingCell?.row === actualRowIndex && editingCell?.col === colIndex ? (
                                <input
                                  ref={editInputRef}
                                  type="text"
                                  value={row[column] || ''}
                                  onChange={(e) => handleCellChange(e.target.value, actualRowIndex, colIndex)}
                                  onBlur={() => setEditingCell(null)}
                                  onKeyDown={(e) => handleKeyDown(e, actualRowIndex, colIndex)}
                                  className={styles.cellInput}
                                />
                              ) : (
                                <span className={styles.cellValue}>
                                  {row[column] === null || row[column] === undefined || row[column] === '' ? (
                                    <span className={styles.emptyCell}>NULL</span>
                                  ) : (
                                    String(row[column])
                                  )}
                                </span>
                              )}
                            </td>
                          ))}
                          <td className={styles.actionsCell}>
                            <button
                              className={styles.deleteRowBtn}
                              onClick={() => deleteRow(actualRowIndex)}
                              title="Delete row"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className={styles.pageInfo}>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <span className={styles.pageDetails}>
                    Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredData.length)} of {formatNumber(filteredData.length)} rows
                  </span>
                </div>
                
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}

        {hasChanges && (
          <div className={styles.changesBar}>
            <div className={styles.changesInfo}>
              <span className={styles.changesIcon}>⚠️</span>
              <span>You have unsaved changes</span>
            </div>
            <div className={styles.changesActions}>
              <Button variant="ghost" size="small" onClick={() => setHasChanges(false)}>
                Discard
              </Button>
              <Button variant="primary" size="small">
                Save Changes
              </Button>
            </div>
          </div>
        )}

        {/* Hover Chart */}
        {hoveredColumn && (
          <ColumnChart
            column={hoveredColumn.column}
            profile={hoveredColumn.profile}
            position={chartPosition}
          />
        )}
      </div>
    </div>
  );
};

export default DataCanvas;