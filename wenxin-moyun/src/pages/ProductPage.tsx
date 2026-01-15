import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Layers,
  Zap,
  Eye,
  BarChart3,
  Globe,
  Shield,
  Download,
  Code,
  FileJson,
  Cpu,
  GitBranch,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  IOSButton,
  IOSCard,
  IOSCardHeader,
  IOSCardContent,
  IOSCardGrid,
} from '../components/ios';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

export default function ProductPage() {
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
          <h1 className="text-page-title mb-6">
            The VULCA Evaluation Platform
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
            A comprehensive framework for evaluating AI models on cultural understanding,
            built on 47 dimensions and 8 cultural perspectives.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/demo">
              <IOSButton variant="primary" size="lg" className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Book a Demo
              </IOSButton>
            </Link>
            <Link to="/methodology">
              <IOSButton variant="secondary" size="lg" className="flex items-center gap-2">
                View Documentation
              </IOSButton>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Framework Overview */}
      <section>
        <motion.div {...fadeInUp} className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            47D × 8 Perspectives Framework
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Multi-dimensional evaluation across cultural contexts
          </p>
        </motion.div>

        <IOSCardGrid columns={2} gap="lg">
          {/* 6D Core */}
          <IOSCard variant="elevated">
            <IOSCardHeader
              emoji={<Layers className="w-8 h-8 text-slate-600" />}
              title="6D Core Dimensions"
              subtitle="Foundation metrics"
            />
            <IOSCardContent>
              <div className="grid grid-cols-2 gap-3">
                {['Creativity', 'Technique', 'Emotion', 'Context', 'Innovation', 'Impact'].map((dim) => (
                  <div key={dim} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    {dim}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Core dimensions expanded to 47 sub-dimensions for granular analysis
              </p>
            </IOSCardContent>
          </IOSCard>

          {/* 8 Perspectives */}
          <IOSCard variant="elevated">
            <IOSCardHeader
              emoji={<Globe className="w-8 h-8 text-amber-600" />}
              title="8 Cultural Perspectives"
              subtitle="East & West viewpoints"
            />
            <IOSCardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Su Shi (East)',
                  'Guo Xi (East)',
                  'Xu Wei (East)',
                  'Qi Baishi (East)',
                  'John Ruskin (West)',
                  'Clement Greenberg (West)',
                  'Arthur Danto (West)',
                  'Rosalind Krauss (West)'
                ].map((critic) => (
                  <div key={critic} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    {critic}
                  </div>
                ))}
              </div>
            </IOSCardContent>
          </IOSCard>
        </IOSCardGrid>
      </section>

      {/* L1-L5 Framework */}
      <section className="bg-gray-50 dark:bg-gray-900/50 -mx-4 px-4 py-16 rounded-2xl">
        <motion.div {...fadeInUp} className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            L1-L5 Cognitive Framework
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Five levels of cognitive depth for comprehensive evaluation
          </p>
        </motion.div>

        <div className="space-y-4 max-w-3xl mx-auto">
          {[
            { level: 'L1', name: 'Perception', desc: 'Basic visual recognition and identification' },
            { level: 'L2', name: 'Description', desc: 'Detailed observation and articulation' },
            { level: 'L3', name: 'Interpretation', desc: 'Meaning-making and contextual understanding' },
            { level: 'L4', name: 'Judgment', desc: 'Critical evaluation and aesthetic assessment' },
            { level: 'L5', name: 'Theorization', desc: 'Abstract conceptualization and cultural synthesis' },
          ].map((item, index) => (
            <motion.div
              key={item.level}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm"
            >
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-slate-700 dark:text-slate-500">{item.level}</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section>
        <motion.div {...fadeInUp} className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Platform Features
          </h2>
        </motion.div>

        <IOSCardGrid columns={3} gap="lg">
          <IOSCard variant="flat">
            <IOSCardHeader
              emoji={<Cpu className="w-6 h-6 text-slate-600" />}
              title="Automated Pipeline"
            />
            <IOSCardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                End-to-end evaluation pipeline with batch processing support
              </p>
            </IOSCardContent>
          </IOSCard>

          <IOSCard variant="flat">
            <IOSCardHeader
              emoji={<BarChart3 className="w-6 h-6 text-amber-600" />}
              title="47D Diagnostics"
            />
            <IOSCardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Granular dimension-level analysis with Top-Δ insights
              </p>
            </IOSCardContent>
          </IOSCard>

          <IOSCard variant="flat">
            <IOSCardHeader
              emoji={<Eye className="w-6 h-6 text-green-500" />}
              title="Evidence Samples"
            />
            <IOSCardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Concrete examples backing every diagnostic finding
              </p>
            </IOSCardContent>
          </IOSCard>

          <IOSCard variant="flat">
            <IOSCardHeader
              emoji={<GitBranch className="w-6 h-6 text-orange-500" />}
              title="Version Control"
            />
            <IOSCardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Full provenance tracking for reproducible results
              </p>
            </IOSCardContent>
          </IOSCard>

          <IOSCard variant="flat">
            <IOSCardHeader
              emoji={<Download className="w-6 h-6 text-red-500" />}
              title="Export Ready"
            />
            <IOSCardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                PDF reports, JSON data, and citation formats
              </p>
            </IOSCardContent>
          </IOSCard>

          <IOSCard variant="flat">
            <IOSCardHeader
              emoji={<Activity className="w-6 h-6 text-teal-500" />}
              title="Regression Tracking"
            />
            <IOSCardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Monitor model performance over time and versions
              </p>
            </IOSCardContent>
          </IOSCard>
        </IOSCardGrid>
      </section>

      {/* Integration */}
      <section className="bg-gray-50 dark:bg-gray-900/50 -mx-4 px-4 py-16 rounded-2xl">
        <motion.div {...fadeInUp} className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Integration Options
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Flexible integration into your workflow
          </p>
        </motion.div>

        <IOSCardGrid columns={2} gap="lg">
          <IOSCard variant="elevated">
            <IOSCardHeader
              emoji={<Code className="w-8 h-8 text-slate-600" />}
              title="REST API"
              subtitle="Programmatic access"
            />
            <IOSCardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Authentication via API keys
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Batch evaluation endpoints
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Webhook notifications
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Rate limiting & quotas
                </li>
              </ul>
            </IOSCardContent>
          </IOSCard>

          <IOSCard variant="elevated">
            <IOSCardHeader
              emoji={<FileJson className="w-8 h-8 text-amber-600" />}
              title="Python SDK"
              subtitle="Native integration"
            />
            <IOSCardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  pip installable package
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Async/await support
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Type hints included
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Example notebooks
                </li>
              </ul>
            </IOSCardContent>
          </IOSCard>
        </IOSCardGrid>
      </section>

      {/* CTA */}
      <section className="py-12 text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Ready to evaluate your models?
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Get started with a demo or explore our public benchmark
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/demo">
            <IOSButton variant="primary" size="lg" className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Book a Demo
            </IOSButton>
          </Link>
          <Link to="/vulca">
            <IOSButton variant="secondary" size="lg" className="flex items-center gap-2">
              Try Public Demo
              <ArrowRight className="w-5 h-5" />
            </IOSButton>
          </Link>
        </div>
      </section>
    </div>
  );
}
