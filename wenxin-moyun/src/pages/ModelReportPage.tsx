/**
 * ModelReportPage
 *
 * Complete VULCA evaluation report preview page.
 * Demonstrates all report components working together.
 */

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Download, Share2, FileText, Calendar,
  Printer, ExternalLink, Clock, CheckCircle
} from 'lucide-react';
import { IOSButton } from '../components/ios/core/IOSButton';
import { IOSCard, IOSCardContent } from '../components/ios/core/IOSCard';
import { ReportScoreboard } from '../components/report/ReportScoreboard';
import { TopDeltaDimensions } from '../components/report/TopDeltaDimensions';
import { PerspectiveMatrix } from '../components/report/PerspectiveMatrix';
import { EvidenceCollection } from '../components/report/EvidenceSample';
import Breadcrumb from '../components/common/Breadcrumb';
import { exportToPDF, generatePDFFilename } from '../utils/pdfExport';
import {
  VULCA_VERSION,
  VULCA_VERSION_STRING,
  generateReportId,
} from '../config/version';

// Sample report data
const SAMPLE_SCORE_DATA = {
  modelName: 'GPT-4o',
  organization: 'OpenAI',
  overallScore: 0.782,
  rank: 1,
  totalModels: VULCA_VERSION.totalModels,
  dimensions: [
    { name: 'Creativity', score: 0.85, change: 0.03 },
    { name: 'Technique', score: 0.78, change: 0.02 },
    { name: 'Emotion', score: 0.72, change: -0.01 },
    { name: 'Context', score: 0.81, change: 0.05 },
    { name: 'Innovation', score: 0.76, change: 0.01 },
    { name: 'Impact', score: 0.77, change: 0.02 },
  ],
  evaluationDate: VULCA_VERSION.lastUpdated,
  version: VULCA_VERSION_STRING,
};

const SAMPLE_DELTA_DIMENSIONS = [
  {
    name: 'Cross-Cultural Symbolism',
    category: 'Context',
    model1Score: 0.88,
    model2Score: 0.62,
    delta: 0.26,
    significance: 'high' as const,
    recommendation: 'GPT-4o shows exceptional understanding of cultural symbols across traditions.',
  },
  {
    name: 'Historical Context',
    category: 'Context',
    model1Score: 0.82,
    model2Score: 0.65,
    delta: 0.17,
    significance: 'high' as const,
    recommendation: 'Strong historical knowledge enables nuanced period-specific analysis.',
  },
  {
    name: 'Emotional Resonance',
    category: 'Emotion',
    model1Score: 0.71,
    model2Score: 0.78,
    delta: -0.07,
    significance: 'medium' as const,
    recommendation: 'Room for improvement in expressing emotional nuance.',
  },
  {
    name: 'Aesthetic Language',
    category: 'Technique',
    model1Score: 0.79,
    model2Score: 0.72,
    delta: 0.07,
    significance: 'low' as const,
  },
  {
    name: 'Creative Synthesis',
    category: 'Creativity',
    model1Score: 0.84,
    model2Score: 0.69,
    delta: 0.15,
    significance: 'medium' as const,
    recommendation: 'Demonstrates ability to synthesize diverse artistic influences.',
  },
];

const SAMPLE_PERSPECTIVES = [
  {
    perspective: 'Chinese',
    region: 'Eastern' as const,
    score: 0.81,
    rank: 2,
    description: 'Evaluation from traditional Chinese aesthetic principles including qi, yun, and brush techniques.',
    strengths: ['Strong understanding of ink wash concepts', 'Good grasp of symbolic meanings'],
    weaknesses: ['Limited knowledge of regional variations', 'Missing calligraphic integration'],
  },
  {
    perspective: 'Japanese',
    region: 'Eastern' as const,
    score: 0.76,
    rank: 4,
    description: 'Analysis based on Japanese aesthetics: wabi-sabi, mono no aware, and seasonal themes.',
    strengths: ['Appreciates minimalism', 'Understands seasonal symbolism'],
    weaknesses: ['Overlooks subtle imperfection beauty', 'Limited ukiyo-e knowledge'],
  },
  {
    perspective: 'Western Classical',
    region: 'Western' as const,
    score: 0.85,
    rank: 1,
    description: 'Evaluation through Renaissance and Classical European art theory.',
    strengths: ['Excellent compositional analysis', 'Strong art historical knowledge'],
    weaknesses: ['May impose Western hierarchy', 'Limited non-Western context'],
  },
  {
    perspective: 'Contemporary',
    region: 'Western' as const,
    score: 0.78,
    rank: 3,
    description: 'Modern and postmodern art criticism frameworks.',
    strengths: ['Understands conceptual art', 'Good with multimedia'],
    weaknesses: ['Variable with emerging movements', 'Bias toward established artists'],
  },
  {
    perspective: 'Islamic',
    region: 'Eastern' as const,
    score: 0.68,
    rank: 6,
    description: 'Analysis through Islamic art principles: geometry, calligraphy, and aniconism.',
    strengths: ['Good geometric pattern analysis', 'Respects cultural sensitivities'],
    weaknesses: ['Limited regional specificity', 'Missing Sufi aesthetic depth'],
  },
  {
    perspective: 'African',
    region: 'Universal' as const,
    score: 0.62,
    rank: 8,
    description: 'Evaluation through diverse African artistic traditions and philosophies.',
    strengths: ['Basic understanding of symbolism', 'Acknowledges diversity'],
    weaknesses: ['Insufficient regional knowledge', 'May generalize traditions'],
  },
  {
    perspective: 'Latin American',
    region: 'Western' as const,
    score: 0.71,
    rank: 5,
    description: 'Analysis through Latin American art movements and indigenous influences.',
    strengths: ['Good muralism knowledge', 'Understands colonial context'],
    weaknesses: ['Limited pre-Columbian depth', 'Regional variation gaps'],
  },
  {
    perspective: 'South Asian',
    region: 'Eastern' as const,
    score: 0.66,
    rank: 7,
    description: 'Evaluation through Indian, Pakistani, and regional artistic traditions.',
    strengths: ['Good miniature painting knowledge', 'Understands religious context'],
    weaknesses: ['Limited folk art coverage', 'Missing contemporary movements'],
  },
];

const SAMPLE_EVIDENCE = [
  {
    id: '1',
    type: 'text' as const,
    dimension: 'Cross-Cultural Symbolism',
    score: 0.92,
    prompt: 'Analyze the symbolism of the lotus flower in this painting and its cross-cultural significance.',
    response: 'The lotus flower in this composition operates on multiple symbolic registers. In the Buddhist tradition from which this painting emerges, the lotus represents enlightenment—the capacity to rise above muddy waters into pristine beauty. The specific pink hue suggests the supreme lotus of the Buddha himself. Yet the artist has positioned it alongside Western vanitas elements, creating a fascinating dialogue between Eastern cyclical rebirth and Western mortality concerns.',
    annotations: [
      { type: 'positive' as const, text: 'Correctly identifies Buddhist symbolism' },
      { type: 'positive' as const, text: 'Notes cross-cultural dialogue with Western vanitas' },
      { type: 'positive' as const, text: 'Demonstrates awareness of color significance' },
    ],
    expertComment: 'Excellent cross-cultural analysis that bridges Eastern and Western symbolic traditions without privileging either perspective.',
    perspective: 'Chinese',
  },
  {
    id: '2',
    type: 'dialogue' as const,
    dimension: 'Historical Context',
    score: 0.85,
    prompt: 'Discuss how this artwork reflects its historical period and artistic movements.',
    response: 'This work emerges from the Song Dynasty golden age of landscape painting (960-1279 CE), specifically reflecting the Northern Song emphasis on monumental landscapes. The technique of "three distances" (san yuan)—high distance, deep distance, and level distance—is masterfully employed here. The artist follows the literati painting (wenrenhua) tradition, valuing personal expression over technical virtuosity.',
    annotations: [
      { type: 'positive' as const, text: 'Accurate period identification' },
      { type: 'positive' as const, text: 'Correctly applies traditional spatial concepts' },
      { type: 'negative' as const, text: 'Could elaborate on political context' },
    ],
    expertComment: 'Strong historical grounding with appropriate technical terminology. Minor gap in connecting to broader Song Dynasty cultural politics.',
    perspective: 'Chinese',
  },
  {
    id: '3',
    type: 'image' as const,
    dimension: 'Aesthetic Language',
    score: 0.78,
    prompt: 'Provide an aesthetic analysis of the brushwork and composition.',
    response: 'The brushwork demonstrates the "boneless" (mogu) technique, where forms emerge through layered washes rather than defining outlines. There is a rhythmic quality to the strokes—what Chinese aesthetics terms "qi" or vital energy flowing through the marks. The composition follows the principle of leaving "breathing room" (liubai), with significant empty space that paradoxically feels full of presence.',
    annotations: [
      { type: 'positive' as const, text: 'Correctly identifies mogu technique' },
      { type: 'positive' as const, text: 'Applies concept of qi appropriately' },
      { type: 'neutral' as const, text: 'Analysis could be more specific about stroke variations' },
    ],
    perspective: 'Chinese',
  },
];

export default function ModelReportPage() {
  const { id: modelId } = useParams();
  const navigate = useNavigate();
  const [selectedPerspective, setSelectedPerspective] = useState<string>('Western Classical');

  // Handle PDF export using browser print
  const handleDownloadReport = () => {
    const filename = generatePDFFilename(SAMPLE_SCORE_DATA.modelName, 'evaluation-report');
    exportToPDF({
      title: `VULCA Report - ${SAMPLE_SCORE_DATA.modelName}`,
      filename,
    });
  };

  // Handle share
  const handleShare = async () => {
    const shareData = {
      title: `VULCA Evaluation Report - ${SAMPLE_SCORE_DATA.modelName}`,
      text: `Check out the VULCA cultural AI evaluation report for ${SAMPLE_SCORE_DATA.modelName}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or error
        navigator.clipboard.writeText(window.location.href);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Report link copied to clipboard!');
    }
  };

  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Models', path: '/models' },
    { label: SAMPLE_SCORE_DATA.modelName, path: `/model/${modelId || 'gpt-4o'}` },
    { label: 'Evaluation Report' },
  ];

  const reportId = generateReportId(SAMPLE_SCORE_DATA.modelName);

  return (
    <div className="min-h-screen">
      {/* Print-only header */}
      <div className="print-only report-header mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">VULCA Evaluation Report</h1>
            <p className="text-gray-600">{SAMPLE_SCORE_DATA.modelName} - {SAMPLE_SCORE_DATA.organization}</p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>Report ID: {reportId}</p>
            <p>Generated: {new Date().toLocaleDateString()}</p>
            <p>Version: {SAMPLE_SCORE_DATA.version}</p>
          </div>
        </div>
      </div>
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                VULCA Evaluation Report
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {SAMPLE_SCORE_DATA.modelName} • {SAMPLE_SCORE_DATA.organization}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 no-print">
            <IOSButton
              variant="secondary"
              size="sm"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </IOSButton>
            <IOSButton
              variant="secondary"
              size="sm"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </IOSButton>
            <IOSButton
              variant="primary"
              size="sm"
              onClick={handleDownloadReport}
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </IOSButton>
          </div>
        </div>

        {/* Report Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            Evaluated: {SAMPLE_SCORE_DATA.evaluationDate}
          </span>
          <span className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            Version: {SAMPLE_SCORE_DATA.version}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            Generation time: 2.3s
          </span>
          <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
            <CheckCircle className="w-4 h-4" />
            Verified
          </span>
        </div>
      </motion.div>

      {/* Report Content */}
      <div className="space-y-8">
        {/* Section 1: Executive Summary Scoreboard */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ReportScoreboard data={SAMPLE_SCORE_DATA} />
        </motion.section>

        {/* Section 2: Top-Δ Dimensions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <TopDeltaDimensions
            model1Name={SAMPLE_SCORE_DATA.modelName}
            model2Name="Baseline Average"
            dimensions={SAMPLE_DELTA_DIMENSIONS}
          />
        </motion.section>

        {/* Section 3: Cultural Perspective Matrix */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <PerspectiveMatrix
            modelName={SAMPLE_SCORE_DATA.modelName}
            perspectives={SAMPLE_PERSPECTIVES}
            selectedPerspective={selectedPerspective}
            onPerspectiveSelect={setSelectedPerspective}
          />
        </motion.section>

        {/* Section 4: Evidence Samples */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <EvidenceCollection
            samples={SAMPLE_EVIDENCE}
            modelName={SAMPLE_SCORE_DATA.modelName}
            title="Evidence Samples"
          />
        </motion.section>

        {/* Upgrade CTA */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <IOSCard variant="elevated" className="bg-gradient-to-r from-slate-600 to-amber-600 text-white">
            <IOSCardContent>
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    Need Full Enterprise Report?
                  </h3>
                  <p className="text-white/80">
                    Get comprehensive 35-page PDF with detailed diagnostics,
                    risk analysis, and actionable recommendations.
                  </p>
                </div>
                <div className="flex gap-3 flex-shrink-0">
                  <Link to="/pricing">
                    <IOSButton variant="secondary" className="bg-white text-slate-700 hover:bg-gray-100">
                      View Pricing
                    </IOSButton>
                  </Link>
                  <Link to="/demo">
                    <IOSButton variant="secondary" className="bg-white/20 text-white border border-white/30 hover:bg-white/30">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Book Demo
                    </IOSButton>
                  </Link>
                </div>
              </div>
            </IOSCardContent>
          </IOSCard>
        </motion.section>

        {/* Methodology Note */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center text-sm text-gray-500 dark:text-gray-400 pb-8"
        >
          <p>
            This report is generated using the VULCA 47-dimension evaluation framework.
            <Link to="/methodology" className="text-slate-700 dark:text-slate-500 hover:underline ml-1">
              Learn more about our methodology
            </Link>
          </p>
          <p className="mt-2">
            Report ID: {reportId}
          </p>
        </motion.section>
      </div>
    </div>
  );
}
