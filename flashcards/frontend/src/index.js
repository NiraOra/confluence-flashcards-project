import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import '@atlaskit/css-reset';
import { invoke } from '@forge/bridge';
import ContentActionModule from './ContentActionModule';
import GlobalPageModule from './GlobalPageModule';
import ContextMenuModule from './ContextMenuModule';
import ContentBylineModule from './ContentBylineModule';

const MainComponent = () => {

  // State to store the module key
  const [moduleKey, setModuleKey] = useState(null);

  // State to handle errors if the module key fetch fails
  const [error, setError] = useState(null);

  // Fetch module key on component mount
  useEffect(() => {
    const fetchModuleKey = async () => {
      try {
        const data = await invoke('getModule');
        setModuleKey(data.moduleKey);
      } catch (err) {
        console.error('Error fetching module key:', err);
        setError('Error fetching module key');
      }
    };
    fetchModuleKey();
  }, []);

  // Render the appropriate module based on moduleKey
  const renderModule = () => {
    switch (moduleKey) {
      case 'content-action':
        return <ContentActionModule />;
      case 'global-page':
        return <GlobalPageModule />;
      case 'context-menu':
        return <ContextMenuModule />;
      case 'content-byline':
        return <ContentBylineModule />;
      default:
        return <div>Module not found</div>;
    }
  };

  // Handle errors or show loading state
  if (error) {
    return <div>{error}</div>;
  }

  // Show the module or loading state
  return moduleKey ? renderModule() : <div>Loading...</div>;

};

// Render MainComponent into the 'root' element
ReactDOM.render(
  <React.StrictMode>
    <MainComponent />
  </React.StrictMode>,
  document.getElementById('root')
);
