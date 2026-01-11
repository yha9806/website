import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  Building2,
  CheckCircle2,
  TrendingUp,
  Target,
  Shield,
  BarChart3,
  AlertTriangle,
  FileText,
  GitBranch,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  IOSButton,
  IOSCard,
  IOSCardHeader,
  IOSCardContent,
  IOSCardGrid,
} from '../../components/ios';

export default function AILabSolutionPage() {
  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="pt-8 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-500" />
            </div>
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Solution for AI Labs
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Cultural Evaluation for Model Selection & Release
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Make informed decisions for model selection, fine-tuning validation, and safe public release with comprehensive 47D cultural evaluation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/demo">
              <IOSButton variant="primary" size="lg" className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Request a Pilot
              </IOSButton>
            </Link>
            <Link to="/pricing">
              <IOSButton variant="secondary" size="lg" className="flex items-center gap-2">
                View Pricing
              </IOSButton>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Pain Points */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Challenges We Solve
          </h2>
        </motion.div>

        <IOSCardGrid columns={3} gap="lg">
          <IOSCard variant="elevated">
            <IOSCardHeader
              emoji={<AlertTriangle className="w-8 h-8 text-orange-500" />}
              title="Hidden Cultural Risks"
            />
            <IOSCardContent>
              <p className="text-gray-600 dark:text-gray-400">
                More capable models produce more sophisticated cultural content — but subtle biases become harder to detect with standard evaluation.
              </p>
            </IOSCardContent>
          </IOSCard>

          <IOSCard variant="elevated">
            <IOSCardHeader
              emoji={<Target className="w-8 h-8 text-red-500" />}
              title="Selection Complexity"
            />
            <IOSCardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Choosing between models based on aggregate scores misses critical dimension-level differences that matter for your use case.
              </p>
            </IOSCardContent>
          </IOSCard>

          <IOSCard variant="elevated">
            <IOSCardHeader
              emoji={<GitBranch className="w-8 h-8 text-purple-500" />}
              title="Version Regressions"
            />
            <IOSCardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Model updates and fine-tuning can introduce cultural regressions that are invisible without systematic tracking.
              </p>
            </IOSCardContent>
          </IOSCard>
        </IOSCardGrid>
      </section>

      {/* Deliverables */}
      <section className="bg-gray-50 dark:bg-gray-900/50 -mx-4 px-4 py-16 rounded-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            What You Get
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Comprehensive evaluation package for model decisions
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {[
            {
              icon: BarChart3,
              title: '47D Diagnostic Report',
              items: [
                'Full dimension-level scores',
                'Top-Δ gap analysis',
                'Cross-perspective comparisons',
                'Evidence samples for each finding',
              ],
            },
            {
              icon: Shield,
              title: 'Risk Assessment',
              items: [
                'Cultural risk identification',
                'Severity ranking',
                'Mitigation recommendations',
                'Release readiness checklist',
              ],
            },
            {
              icon: TrendingUp,
              title: 'Competitive Analysis',
              items: [
                'Benchmark against leading models',
                'Dimension-level comparisons',
                'Strength/weakness mapping',
                'Market positioning insights',
              ],
            },
            {
              icon: FileText,
              title: 'Documentation Package',
              items: [
                'PDF executive report',
                'JSON raw data export',
                'Methodology appendix',
                'Version & reproducibility info',
              ],
            },
          ].map((item) => (
            <div key={item.title} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.title}</h3>
              </div>
              <ul className="space-y-2">
                {item.items.map((i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Integration Workflow
          </h2>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          {[
            { step: '1', title: 'Model Access', desc: 'Provide API access or model outputs for evaluation' },
            { step: '2', title: 'VULCA Evaluation', desc: 'We run full 47D × 8 perspective analysis' },
            { step: '3', title: 'Report Delivery', desc: 'Receive comprehensive PDF and JSON reports' },
            { step: '4', title: 'Ongoing Monitoring', desc: 'Track regressions across versions (Enterprise)' },
          ].map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="flex items-center gap-4 mb-6"
            >
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                {item.step}
              </div>
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
              </div>
              {index < 3 && (
                <ArrowRight className="w-5 h-5 text-gray-300 dark:text-gray-600 hidden md:block" />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-50 dark:bg-blue-900/20 -mx-4 px-4 py-12 rounded-2xl text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Start with a Pilot Evaluation
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
          Get a comprehensive 47D evaluation report for your model in 1-2 weeks
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/demo">
            <IOSButton variant="primary" size="lg" className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Request a Pilot
            </IOSButton>
          </Link>
          <Link to="/solutions">
            <IOSButton variant="secondary" size="lg" className="flex items-center gap-2">
              View All Solutions
            </IOSButton>
          </Link>
        </div>
      </section>
    </div>
  );
}
