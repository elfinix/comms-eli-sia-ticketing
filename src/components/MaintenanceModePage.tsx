import { AlertTriangle } from 'lucide-react';

interface MaintenanceModePageProps {
  message?: string;
}

export default function MaintenanceModePage({ message }: MaintenanceModePageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#8B0000] to-[#6B0000] p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
        <div className="mb-6">
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="text-yellow-600" size={48} />
          </div>
          <h1 className="font-['Josefin_Sans',sans-serif] text-3xl md:text-4xl text-gray-900 mb-4">
            System Under Maintenance
          </h1>
          <p className="font-['Abel',sans-serif] text-lg text-gray-600 mb-6">
            {message || 'System is under maintenance. We will be back soon.'}
          </p>
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <p className="font-['Abel',sans-serif] text-sm text-gray-500">
              We apologize for any inconvenience. Our team is working to improve your experience.
            </p>
            <p className="font-['Abel',sans-serif] text-sm text-gray-500 mt-2">
              Please check back later or contact the IT Helpdesk if you need urgent assistance.
            </p>
          </div>
        </div>
        
        <div className="mt-8 flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-[#8B0000] rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-[#8B0000] rounded-full animate-pulse delay-100"></div>
          <div className="w-2 h-2 bg-[#8B0000] rounded-full animate-pulse delay-200"></div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="font-['Abel',sans-serif] text-xs text-gray-400">
            Lyceum of the Philippines University – Cavite
          </p>
          <p className="font-['Abel',sans-serif] text-xs text-gray-400 mt-1">
            IT Helpdesk Ticketing System
          </p>
        </div>
      </div>
    </div>
  );
}
