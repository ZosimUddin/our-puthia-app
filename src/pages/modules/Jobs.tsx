import React from 'react';
import SEO from '../../components/SEO';
import { ServiceDirectoryTemplate } from '../../components/common/MasterServiceTemplate/ServiceDirectoryTemplate';

interface JobsProps {
  initialType?: string;
}

const Jobs: React.FC<JobsProps> = ({ initialType }) => {
  return (
    <>
      <SEO
        title="চাকরির খবর ও নিয়োগ বিজ্ঞপ্তি"
        description="পুঠিয়া উপজেলার সর্বশেষ সরকারি ও বেসরকারি চাকরির খবর, শূন্য পদের তালিকা, সরকারি নিয়োগ বিজ্ঞপ্তি এবং ক্যারিয়ার সুযোগ।"
        path="/jobs"
      />
      <ServiceDirectoryTemplate serviceKeyParam="job" />
    </>
  );
};

export default Jobs;
