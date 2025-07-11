import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { AIService } from '../services/aiService';

// Helper component for collapsible data fields
const DataField: React.FC<{ label: string; value: string | React.ReactNode; isLong?: boolean }> = ({ label, value, isLong = false }) => {
  if (!isLong) {
    return (
      <div className="py-3 flex flex-col sm:grid sm:grid-cols-4 sm:gap-4">
        <dt className="font-semibold text-gray-700 dark:text-gray-300">{label}:</dt>
        <dd className="sm:col-span-3 mt-1 sm:mt-0 text-black dark:text-white break-words">{value}</dd>
      </div>
    );
  }

  return (
    <details className="group">
      <summary className="py-3 flex justify-between items-center cursor-pointer list-none">
        <dt className="font-semibold text-gray-700 dark:text-gray-300">{label}:</dt>
        <span className="text-sm text-blue-500 flex items-center shrink-0 ml-4">
          Show Full Value
          <ChevronRight className="w-4 h-4 ml-1 group-open:hidden" />
          <ChevronDown className="w-4 h-4 ml-1 hidden group-open:block" />
        </span>
      </summary>
      <pre className="mt-1 mb-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs whitespace-pre-wrap break-all overflow-x-auto">
        {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
};


interface AttestationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AttestationModal: React.FC<AttestationModalProps> = ({ isOpen, onClose }) => {
  const [report, setReport] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aiService = AIService.getInstance();

  useEffect(() => {
    if (isOpen && !report) {
      const fetchReport = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const data = await aiService.getAttestationReport();
          if (data.nvidia_payload) {
            data.parsed_nvidia_payload = JSON.parse(data.nvidia_payload);
          }
          if (data.all_attestations && Array.isArray(data.all_attestations)) {
            data.all_attestations.forEach((att: any) => {
              if (att.nvidia_payload) {
                att.parsed_nvidia_payload = JSON.parse(att.nvidia_payload);
              }
            });
          }
          setReport(data);
        } catch (e: any) {
          setError(e.message || 'Failed to fetch attestation report.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchReport();
    }
  }, [isOpen, report]);

  if (!isOpen) return null;

  const renderAttestation = (attestation: any, index?: number) => (
    <div key={index ?? 0}>
      {index !== undefined && <h3 className="text-lg font-semibold mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-black dark:text-white">Attestation #{index + 1}</h3>}
      <dl className="text-sm divide-y divide-gray-200 dark:divide-gray-700">
        <DataField label="Signing Address" value={attestation.signing_address} />
        <DataField label="Intel Quote" value={attestation.intel_quote} isLong />
        {attestation.parsed_nvidia_payload && (
          <details className="group">
            <summary className="py-3 flex justify-between items-center cursor-pointer list-none">
              <dt className="font-semibold text-gray-700 dark:text-gray-300">NVIDIA Payload</dt>
              <span className="text-sm text-blue-500 flex items-center shrink-0 ml-4">
                Show Details
                <ChevronRight className="w-4 h-4 ml-1 group-open:hidden" />
                <ChevronDown className="w-4 h-4 ml-1 hidden group-open:block" />
              </span>
            </summary>
            <div className="pl-4 mt-2 border-l-2 border-gray-200 dark:border-gray-700 ml-1 divide-y divide-gray-200 dark:divide-gray-700">
              <DataField label="Nonce" value={attestation.parsed_nvidia_payload.nonce} />
              {attestation.parsed_nvidia_payload.evidence_list?.map((ev: any, i: number) => (
                <div key={i} className="pt-3">
                  <h4 className="font-medium mb-1 text-black dark:text-white">Evidence #{i + 1}</h4>
                   <div className="pl-2 divide-y divide-gray-200 dark:divide-gray-700">
                     <DataField label="Certificate" value={ev.certificate} isLong />
                     <DataField label="Evidence" value={ev.evidence} isLong />
                   </div>
                </div>
              ))}
            </div>
          </details>
        )}
      </dl>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/60 p-4">
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
             <img 
                src="https://pbs.twimg.com/profile_images/1790094888069115905/4pu53n55_400x400.jpg" 
                alt="Redpill AI Logo" 
                className="w-6 h-6 rounded-full" 
              />
            <h2 className="text-xl font-semibold text-black dark:text-white">Attestation Report</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5 text-black dark:text-white" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="w-12 h-12 animate-spin text-black dark:text-white" />
              <p className="mt-4 text-gray-500 dark:text-gray-400">Fetching report...</p>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center h-64 text-red-500">
              <AlertTriangle className="w-12 h-12 mb-4" />
              <p className="font-semibold">Error</p>
              <p className="text-center">{error}</p>
            </div>
          )}
          {report && (
            <div>
              {renderAttestation(report)}
              {report.all_attestations?.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-xl font-bold mb-2 text-black dark:text-white">All Attestations</h2>
                  <div>
                    {report.all_attestations.map((att: any, index: number) => renderAttestation(att, index))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttestationModal;
