import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { ComingSoonPage } from '@/components/PageContent';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const getPageTitle = (tab: string) => {
    return tab.charAt(0).toUpperCase() + tab.slice(1);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'analytics':
        return <ComingSoonPage title="Analytics" />;
      case 'wallet':
        return <ComingSoonPage title="Wallet" />;
      case 'investments':
        return <ComingSoonPage title="Investments" />;
      case 'cards':
        return <ComingSoonPage title="Cards" />;
      case 'goals':
        return <ComingSoonPage title="Goals" />;
      case 'settings':
        return <ComingSoonPage title="Settings" />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      pageTitle={getPageTitle(activeTab)}
    >
      {renderContent()}
    </Layout>
  );
};

export default Index;
