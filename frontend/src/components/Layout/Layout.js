import React from 'react';
import { useParams } from 'react-router-dom';
import { useWorkflow } from '../../contexts/WorkflowContext';
import Header from './Header';
import styles from './Layout.module.css';

const Layout = ({ children, onOpenCanvas }) => {
  const { datasetId } = useParams();
  const { currentDataset } = useWorkflow();
  
  return (
    <div className={styles.layoutNoSidebar}>
      <Header 
        onOpenCanvas={onOpenCanvas} 
        hasDataset={!!(datasetId || currentDataset)}
      />
      <main className={styles.contentNoSidebar}>
        {children}
      </main>
    </div>
  );
};

export default Layout;