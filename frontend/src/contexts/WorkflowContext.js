import React, { createContext, useContext, useState, useEffect } from 'react';

const WorkflowContext = createContext();

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};

export const WorkflowProvider = ({ children }) => {
  const [currentDataset, setCurrentDataset] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [workflowData, setWorkflowData] = useState({
    uploadData: null,
    profileData: null,
    cleaningData: null,
    aiCleanData: null,
    exportData: null
  });

  // Load state from localStorage on mount
  useEffect(() => {
    const savedWorkflow = localStorage.getItem('smartscrub_workflow');
    if (savedWorkflow) {
      try {
        const parsed = JSON.parse(savedWorkflow);
        setCurrentDataset(parsed.currentDataset);
        setCurrentStep(parsed.currentStep || 1);
        setCompletedSteps(new Set(parsed.completedSteps || []));
        setWorkflowData(parsed.workflowData || {
          uploadData: null,
          profileData: null,
          cleaningData: null,
          aiCleanData: null,
          exportData: null
        });
      } catch (error) {
        console.error('Error loading workflow state:', error);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const workflowState = {
      currentDataset,
      currentStep,
      completedSteps: Array.from(completedSteps),
      workflowData
    };
    localStorage.setItem('smartscrub_workflow', JSON.stringify(workflowState));
  }, [currentDataset, currentStep, completedSteps, workflowData]);

  const updateDataset = (dataset) => {
    setCurrentDataset(dataset);
  };

  const completeStep = (stepNumber) => {
    setCompletedSteps(prev => new Set([...prev, stepNumber]));
  };

  const goToStep = (stepNumber) => {
    setCurrentStep(stepNumber);
  };

  const updateStepData = (step, data) => {
    setWorkflowData(prev => ({
      ...prev,
      [step]: data
    }));
  };

  const resetWorkflow = () => {
    setCurrentDataset(null);
    setCurrentStep(1);
    setCompletedSteps(new Set());
    setWorkflowData({
      uploadData: null,
      profileData: null,
      cleaningData: null,
      aiCleanData: null,
      exportData: null
    });
    localStorage.removeItem('smartscrub_workflow');
  };

  const isStepCompleted = (stepNumber) => {
    return completedSteps.has(stepNumber);
  };

  const canAccessStep = (stepNumber) => {
    if (stepNumber === 1) return true; // Upload is always accessible
    return currentDataset !== null; // Other steps require a dataset
  };

  const value = {
    currentDataset,
    currentStep,
    completedSteps,
    workflowData,
    updateDataset,
    completeStep,
    goToStep,
    updateStepData,
    resetWorkflow,
    isStepCompleted,
    canAccessStep
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
};