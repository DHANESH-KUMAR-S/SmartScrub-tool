import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WorkflowProvider, useWorkflow } from './contexts/WorkflowContext';
import Layout from './components/Layout/Layout';
import DataCanvas from './components/Canvas/DataCanvas';
import Landing from './pages/Landing/Landing';
import Dashboard from './pages/Dashboard/Dashboard';
import Upload from './pages/Upload/Upload';
import Profile from './pages/Profile/Profile';
import Clean from './pages/Clean/Clean';
import AIClean from './pages/AIClean/AIClean';
import Export from './pages/Export/Export';
import './styles/App.css';

// Protected Route Component (for future use)
// const ProtectedRoute = ({ children }) => {
//   const { isAuthenticated } = useAuth();
//   return isAuthenticated ? children : <Navigate to="/" replace />;
// };

// Main App Component
const AppContent = () => {
  const [showCanvas, setShowCanvas] = useState(false);
  const [canvasDatasetId, setCanvasDatasetId] = useState(null);
  const { isAuthenticated } = useAuth();
  const { currentDataset } = useWorkflow();

  const handleOpenCanvas = (datasetId) => {
    setCanvasDatasetId(datasetId || currentDataset?.id);
    setShowCanvas(true);
  };

  const handleCloseCanvas = () => {
    setShowCanvas(false);
    setCanvasDatasetId(null);
  };

  return (
    <div className="App">
      <Routes>
        {/* Landing page - redirect to dashboard if authenticated */}
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />} 
        />
        
        {/* App routes with layout */}
        <Route path="/dashboard" element={
          <Layout onOpenCanvas={handleOpenCanvas}>
            <Dashboard />
          </Layout>
        } />
        <Route path="/upload" element={
          <Layout onOpenCanvas={handleOpenCanvas}>
            <Upload />
          </Layout>
        } />
        <Route path="/profile" element={
          <Layout onOpenCanvas={handleOpenCanvas}>
            <Profile onOpenCanvas={handleOpenCanvas} />
          </Layout>
        } />
        <Route path="/clean" element={
          <Layout onOpenCanvas={handleOpenCanvas}>
            <Clean />
          </Layout>
        } />
        <Route path="/ai-clean" element={
          <Layout onOpenCanvas={handleOpenCanvas}>
            <AIClean />
          </Layout>
        } />
        <Route path="/export" element={
          <Layout onOpenCanvas={handleOpenCanvas}>
            <Export />
          </Layout>
        } />
      </Routes>

      {/* Data Canvas */}
      <DataCanvas
        datasetId={canvasDatasetId}
        isOpen={showCanvas}
        onClose={handleCloseCanvas}
      />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <WorkflowProvider>
        <Router>
          <AppContent />
        </Router>
      </WorkflowProvider>
    </AuthProvider>
  );
}

export default App;