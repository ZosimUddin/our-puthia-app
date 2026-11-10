import React from 'react';
import SEO from '../../../components/SEO';
import { ServiceDirectoryTemplate } from '../../../components/common/MasterServiceTemplate/ServiceDirectoryTemplate';

export default function HospitalPage({ onGoBack }: { onGoBack?: () => void } = {}) {
  return (
    <>
      <SEO
        title="হাসপাতাল ও ক্লিনিক সেবা ডিরেক্টরি"
        description="পুঠিয়া উপজেলার সরকারি উপজেলা স্বাস্থ্য কমপ্লেক্স, বেসরকারি হাসপাতাল, ক্লিনিক এবং জরুরি স্বাস্থ্যসেবা তথ্যাবলী।"
        path="/hospital"
      />
      <ServiceDirectoryTemplate serviceKeyParam="hospital" />
    </>
  );
}
