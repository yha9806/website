import { Link } from 'react-router-dom';
import {
  Calendar,
  Shield,
  Heart,
  Eye,
  FileText,
  Scale,
  Globe,
  Lock,
  CheckCircle2,
  Mail,
  Trash2,
  AlertTriangle,
  Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  IOSButton,
  IOSCard,
  IOSCardHeader,
  IOSCardContent,
  IOSCardGrid,
} from '../components/ios';

const dataProcessingPrinciples = [
  {
    icon: FileText,
    title: 'Evaluation Only',
    description: 'Data used exclusively for AI evaluation purposes',
    items: [
      'Model outputs analyzed for quality metrics',
      'No data used for training our systems',
      'Results aggregated for benchmarking',
      'Individual submissions remain confidential',
    ],
  },
  {
    icon: Lock,
    title: 'Client Data Isolation',
    description: 'Complete separation between customer workspaces',
    items: [
      'Dedicated evaluation environments',
      'No cross-customer data access',
      'Isolated storage and processing',
      'Independent audit trails',
    ],
  },
  {
    icon: Trash2,
    title: 'Configurable Retention',
    description: 'You control how long we keep your data',
    items: [
      'Default 90-day retention period',
      'Custom retention policies available',
      'Immediate deletion on request',
      'Deletion verification provided',
    ],
  },
];

const ethicsFramework = [
  {
    icon: Scale,
    title: 'Evaluation Fairness',
    description: 'Our evaluation methodology is designed to be fair and unbiased across all models.',
    principles: [
      'Standardized evaluation criteria for all models',
      'Blind evaluation where possible',
      'Multiple evaluator perspectives',
      'Regular methodology audits',
    ],
  },
  {
    icon: Globe,
    title: 'Cultural Sensitivity',
    description: 'Our 8-perspective framework ensures culturally diverse and inclusive evaluations.',
    principles: [
      'East Asian (Chinese, Japanese, Korean) perspectives',
      'Western (British, American) perspectives',
      'Global South (Indian, African) perspectives',
      'Cross-cultural comparison methodology',
    ],
  },
  {
    icon: Eye,
    title: 'Transparency',
    description: 'We are committed to full transparency in our evaluation processes.',
    principles: [
      'Published evaluation methodology',
      'Open benchmark datasets',
      'Reproducible results',
      'Clear scoring explanations',
    ],
  },
];

const modelRights = [
  {
    title: 'Output Attribution',
    desc: 'Model outputs remain the intellectual property of the model creators. We only use outputs for evaluation purposes.',
  },
  {
    title: 'Evaluation Confidentiality',
    desc: 'Evaluation results for private assessments remain confidential unless explicitly authorized for publication.',
  },
  {
    title: 'Customer Data Ownership',
    desc: 'All data submitted by customers belongs to them. We act only as a data processor, not a data controller.',
  },
  {
    title: 'Deletion Rights',
    desc: 'You can request complete deletion of your data at any time. We provide verification of deletion upon completion.',
  },
];

export default function DataEthicsPage() {
  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="pt-8 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-full mb-6">
            <Heart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-400">
              Data & Ethics
            </span>
          </div>

          <h1 className="text-page-title mb-6">
            Responsible AI Evaluation
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Our commitment to ethical data handling, transparent evaluation, and responsible AI practices
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/trust">
              <IOSButton variant="primary" size="lg" className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                View Security Details
              </IOSButton>
            </Link>
            <a href="mailto:ethics@vulcaart.art">
              <IOSButton variant="secondary" size="lg" className="flex items-center gap-2">
                Contact Ethics Team
              </IOSButton>
            </a>
          </div>
        </motion.div>
      </section>

      {/* Data Processing Statement */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Data Processing Statement
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Clear policies on how we handle your data
          </p>
        </motion.div>

        <IOSCardGrid columns={3} gap="lg">
          {dataProcessingPrinciples.map((principle, index) => (
            <motion.div
              key={principle.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              viewport={{ once: true }}
            >
              <IOSCard variant="elevated" className="h-full">
                <IOSCardHeader
                  emoji={<principle.icon className="w-6 h-6 text-purple-500" />}
                  title={principle.title}
                />
                <IOSCardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {principle.description}
                  </p>
                  <ul className="space-y-2">
                    {principle.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <CheckCircle2 className="w-4 h-4 text-purple-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </IOSCardContent>
              </IOSCard>
            </motion.div>
          ))}
        </IOSCardGrid>
      </section>

      {/* AI Ethics Framework */}
      <section className="bg-gray-50 dark:bg-gray-900/50 -mx-4 px-4 py-16 rounded-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            AI Ethics Framework
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Our principles for ethical AI evaluation
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {ethicsFramework.map((framework, index) => (
            <motion.div
              key={framework.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
            >
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4">
                <framework.icon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {framework.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {framework.description}
              </p>
              <ul className="space-y-2">
                {framework.principles.map((principle) => (
                  <li key={principle} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                    <span>{principle}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Model Rights */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Model Rights & Data Ownership
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Clear guidelines on intellectual property and data rights
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <IOSCard variant="elevated">
            <IOSCardContent>
              <div className="space-y-6">
                {modelRights.map((right) => (
                  <div key={right.title} className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {right.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {right.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </IOSCardContent>
          </IOSCard>
        </div>
      </section>

      {/* Data Deletion Request */}
      <section className="bg-gray-50 dark:bg-gray-900/50 -mx-4 px-4 py-16 rounded-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Data Deletion Request
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Exercise your right to delete your data
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          <IOSCard variant="elevated">
            <IOSCardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Data deletion is permanent and cannot be undone. Please ensure you have exported any necessary data before submitting a deletion request.
                  </p>
                </div>

                <h3 className="font-semibold text-gray-900 dark:text-white">
                  How to Request Data Deletion
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400">
                  <li>Send an email to <a href="mailto:privacy@vulcaart.art" className="text-purple-600 dark:text-purple-400 hover:underline">privacy@vulcaart.art</a></li>
                  <li>Include your account email and the specific data you want deleted</li>
                  <li>Provide verification of account ownership</li>
                  <li>We will process your request within 30 days</li>
                  <li>You will receive confirmation once deletion is complete</li>
                </ol>

                <div className="pt-4">
                  <a href="mailto:privacy@vulcaart.art?subject=Data%20Deletion%20Request">
                    <IOSButton variant="secondary" className="w-full flex items-center justify-center gap-2">
                      <Mail className="w-4 h-4" />
                      Submit Deletion Request
                    </IOSButton>
                  </a>
                </div>
              </div>
            </IOSCardContent>
          </IOSCard>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-purple-50 dark:bg-purple-900/20 -mx-4 px-4 py-12 rounded-2xl text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Questions About Our Ethics Policy?
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
          Our ethics team is available to answer questions and discuss our responsible AI practices
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/demo">
            <IOSButton variant="primary" size="lg" className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Schedule a Discussion
            </IOSButton>
          </Link>
          <a href="mailto:ethics@vulcaart.art">
            <IOSButton variant="secondary" size="lg">
              Contact Ethics Team
            </IOSButton>
          </a>
        </div>
      </section>
    </div>
  );
}
