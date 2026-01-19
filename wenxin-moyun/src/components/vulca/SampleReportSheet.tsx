/**
 * SampleReportSheet - Preview and download sample VULCA report
 * Uses IOSSheet to display report preview before download
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  ExternalLink,
  CheckCircle2,
  BarChart3,
  Globe,
  Layers,
  X
} from 'lucide-react';
import { IOSSheet } from '../ios/core/IOSSheet';
import { IOSButton } from '../ios/core/IOSButton';
import { downloadSampleReport, SAMPLE_REPORT_PDF_URL } from '../../utils/pdfExport';

interface SampleReportSheetProps {
  visible: boolean;
  onClose: () => void;
}

// Report preview sections
const reportSections = [
  {
    icon: BarChart3,
    title: 'Executive Summary',
    description: 'Overall performance metrics and key findings across all 47 dimensions'
  },
  {
    icon: Layers,
    title: '6D Overview Analysis',
    description: 'High-level breakdown of creativity, technique, emotion, context, innovation, and impact'
  },
  {
    icon: Globe,
    title: 'Cultural Perspective Breakdown',
    description: 'Detailed analysis from 8 cultural viewpoints (Eastern, Western, African, etc.)'
  },
  {
    icon: CheckCircle2,
    title: 'Recommendations',
    description: 'Actionable insights for improving cultural understanding capabilities'
  }
];

export const SampleReportSheet: React.FC<SampleReportSheetProps> = ({
  visible,
  onClose
}) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadSampleReport();
    } finally {
      setDownloading(false);
    }
  };

  const handleOpenInNewTab = () => {
    window.open(SAMPLE_REPORT_PDF_URL, '_blank');
  };

  return (
    <IOSSheet
      visible={visible}
      onClose={onClose}
      height="large"
      showHandle={true}
      allowDismiss={true}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Sample VULCA Report
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                25 pages &middot; PDF format
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Report Page Previews */}
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
            Report Preview
          </h3>
          <div className="mb-6 flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
            {/* Page 1: Executive Summary */}
            <div className="flex-shrink-0 w-28 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="h-36 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 p-2 flex flex-col">
                <div className="w-full h-2 bg-slate-400/30 rounded mb-1.5" />
                <div className="w-3/4 h-1.5 bg-slate-400/20 rounded mb-3" />
                <div className="flex-1 flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-slate-400/50" />
                </div>
                <div className="space-y-1">
                  <div className="w-full h-1 bg-slate-400/20 rounded" />
                  <div className="w-2/3 h-1 bg-slate-400/20 rounded" />
                </div>
              </div>
              <div className="px-2 py-1.5 text-center border-t border-gray-200 dark:border-gray-700">
                <span className="text-xs text-gray-600 dark:text-gray-400">Summary</span>
              </div>
            </div>

            {/* Page 2: 47D Breakdown */}
            <div className="flex-shrink-0 w-28 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="h-36 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 p-2 flex flex-col">
                <div className="w-full h-2 bg-slate-400/30 rounded mb-2" />
                <div className="flex-1 grid grid-cols-3 gap-1">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="bg-slate-400/20 rounded" />
                  ))}
                </div>
              </div>
              <div className="px-2 py-1.5 text-center border-t border-gray-200 dark:border-gray-700">
                <span className="text-xs text-gray-600 dark:text-gray-400">47D Grid</span>
              </div>
            </div>

            {/* Page 3: Cultural Perspectives */}
            <div className="flex-shrink-0 w-28 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="h-36 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 p-2 flex flex-col">
                <div className="w-full h-2 bg-slate-400/30 rounded mb-2" />
                <div className="flex-1 flex items-center justify-center">
                  <Globe className="w-8 h-8 text-slate-400/50" />
                </div>
                <div className="flex justify-around">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-4 h-4 bg-slate-400/20 rounded-full" />
                  ))}
                </div>
              </div>
              <div className="px-2 py-1.5 text-center border-t border-gray-200 dark:border-gray-700">
                <span className="text-xs text-gray-600 dark:text-gray-400">Cultures</span>
              </div>
            </div>

            {/* Page 4: Recommendations */}
            <div className="flex-shrink-0 w-28 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="h-36 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 p-2 flex flex-col">
                <div className="w-full h-2 bg-slate-400/30 rounded mb-2" />
                <div className="flex-1 space-y-1.5">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-400/50 rounded-full" />
                      <div className="flex-1 h-1 bg-slate-400/20 rounded" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-2 py-1.5 text-center border-t border-gray-200 dark:border-gray-700">
                <span className="text-xs text-gray-600 dark:text-gray-400">Actions</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-6">
            Scroll to see more pages →
          </p>

          {/* Report Contents */}
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">
            What's Included
          </h3>
          <div className="space-y-3">
            {reportSections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <section.icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {section.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {section.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Key Metrics Preview */}
          <div className="mt-6 p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Sample Metrics Preview
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">47</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Dimensions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">8</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Perspectives</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">42</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Models</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex flex-col sm:flex-row gap-3">
            <IOSButton
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </>
              )}
            </IOSButton>
            <IOSButton
              variant="secondary"
              size="lg"
              className="flex-1"
              onClick={handleOpenInNewTab}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in New Tab
            </IOSButton>
          </div>
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
            Full version available with paid subscription
          </p>
        </div>
      </div>
    </IOSSheet>
  );
};

export default SampleReportSheet;
