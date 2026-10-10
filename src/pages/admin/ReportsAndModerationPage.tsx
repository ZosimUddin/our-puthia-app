import React from 'react';
import ReportsAndModerationHub from '../../components/admin/ReportsAndModerationHub';
import SEO from '../../components/SEO';

export const ReportsAndModerationPage: React.FC = () => {
  return (
    <div className="w-full min-h-screen font-sans">
      <SEO 
        title="রিপোর্ট ও মডারেশন হাব ⭐ | সুপার এডমিন" 
        description="পুঠিয়া নাগরিক আড্ডার পোস্ট, কমেন্ট, ইউজার, ছবি, ভিডিও, মেসেজ ও ফেক/স্প্যাম রিপোর্ট সমাধান ও ৬-ধাপের অ্যাকশন সেন্টার।" 
      />
      <ReportsAndModerationHub />
    </div>
  );
};

export default ReportsAndModerationPage;
