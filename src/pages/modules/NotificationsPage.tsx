import React from 'react';
import Notifications from '../../components/user/Notifications';
import { AddaFacebookHeader } from '../../components/adda/AddaFacebookHeader';
import SEO from '../../components/SEO';

export const NotificationsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col font-sans pb-12">
      <SEO 
        title="নোটিফিকেশন – পুঠিয়া আড্ডা" 
        description="আপনার সকল সাম্প্রতিক ও পূর্ববর্তী নোটিফিকেশন" 
        path="/notifications"
      />

      {/* 1. Full Adda Facebook Header (Logo, Search, Chat, and 5 Tabs) */}
      <AddaFacebookHeader activeTab="notifications" />

      {/* 2. Main Notifications Content */}
      <main className="flex-1 max-w-2xl w-full mx-auto md:py-3 px-0 sm:px-2">
        <Notifications hideHeader={true} />
      </main>
    </div>
  );
};

export default NotificationsPage;
