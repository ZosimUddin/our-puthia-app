import React from 'react';
import AddaCommentManagement from '../../components/admin/AddaCommentManagement';
import SEO from '../../components/SEO';

export const AddaCommentManagementPage: React.FC = () => {
  return (
    <div className="w-full min-h-screen font-sans">
      <SEO 
        title="আড্ডা কমেন্ট ম্যানেজমেন্ট | সুপার এডমিন" 
        description="পুঠিয়া নাগরিক আড্ডার সকল মন্তব্য, রিপোর্টকৃত কমেন্ট, স্প্যাম ফিল্টারিং, ডিলিট, রিস্টোর ও ইউজার ওয়ার্নিং হাব।" 
      />
      <AddaCommentManagement />
    </div>
  );
};

export default AddaCommentManagementPage;
