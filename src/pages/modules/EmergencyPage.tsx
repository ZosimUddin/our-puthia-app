import React from 'react';
import SEO from '../../components/SEO';
import { ServiceDirectoryTemplate } from '../../components/common/MasterServiceTemplate/ServiceDirectoryTemplate';

export default function EmergencyPage() {
  return (
    <>
      <SEO
        title="জরুরি সেবা ও হেল্পলাইন ফোন নম্বর"
        description="পুঠিয়া উপজেলার পুলিশ থানা, ফায়ার সার্ভিস, অ্যাম্বুলেন্স, বিদ্যুৎ অফিস, পল্লী বিদ্যুৎ ও জরুরি হেল্পলাইন নম্বর।"
        path="/emergency"
      />
      <ServiceDirectoryTemplate serviceKeyParam="emergency" />
    </>
  );
}

