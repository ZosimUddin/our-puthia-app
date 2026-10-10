import React from 'react';
import EmergencyModerationControl from '../../components/admin/EmergencyModerationControl';
import SEO from '../../components/SEO';

export const EmergencyModerationControlPage: React.FC = () => {
  return (
    <div className="w-full min-h-screen font-sans">
      <SEO 
        title="Emergency Moderation & Lock Down Adda | সুপার এডমিন" 
        description="জরুরি সাইবার নিরাপত্তা ও কন্টেন্ট মডারেশনের জন্য এক ক্লিকে পোস্ট, কমেন্ট, রেজিস্টার ও মেসেজিং লকডাউন সেন্টার।" 
      />
      <EmergencyModerationControl />
    </div>
  );
};

export default EmergencyModerationControlPage;
