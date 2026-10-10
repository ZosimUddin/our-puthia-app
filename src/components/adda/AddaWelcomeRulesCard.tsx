import React from "react";
import { Sparkles } from "lucide-react";

export const AddaWelcomeRulesCard: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-4 sm:p-5 text-white shadow-md space-y-3 mb-4">
      <div className="flex items-center gap-2.5">
        <div className="p-2 bg-white/10 rounded-xl text-emerald-300">
          <Sparkles size={20} />
        </div>
        <div>
          <h3 className="text-base font-black">আমাদের পুঠিয়া আড্ডা জোনে স্বাগতম!</h3>
          <p className="text-xs text-emerald-200">সবার সাথে সৎ থাকুন, সুন্দর আলোচনা করুন এবং নিয়ম মেনে চলুন।</p>
        </div>
      </div>
    </div>
  );
};
