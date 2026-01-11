import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  Building2,
  GraduationCap,
  Palette,
  Clock,
  Users,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  IOSButton,
  IOSCard,
  IOSCardHeader,
  IOSCardContent,
} from '../components/ios';

// Calendly embed URL - replace with actual URL
const CALENDLY_URL = 'https://calendly.com/vulca-demo/30min';

const benefits = [
  {
    icon: CheckCircle2,
    title: '47D Framework Overview',
    desc: 'See how our 47-dimension evaluation works',
  },
  {
    icon: Users,
    title: '8 Cultural Perspectives',
    desc: 'Understand multi-perspective evaluation',
  },
  {
    icon: Clock,
    title: '30-Minute Session',
    desc: 'Quick intro tailored to your needs',
  },
];

const useCases = [
  {
    icon: Building2,
    title: 'AI Labs',
    desc: 'Pre-release cultural audits',
    color: 'blue',
  },
  {
    icon: GraduationCap,
    title: 'Research',
    desc: 'Academic benchmarking',
    color: 'purple',
  },
  {
    icon: Palette,
    title: 'Museums',
    desc: 'Cultural AI validation',
    color: 'orange',
  },
];

export default function BookDemoPage() {
  const [selectedUseCase, setSelectedUseCase] = useState<string | null>(null);

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="pt-8 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-6">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
              Schedule a Demo
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Book a Demo
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            See how VULCA can help you evaluate AI models for cultural understanding
          </p>
        </motion.div>
      </section>

      {/* Main Content */}
      <section className="grid lg:grid-cols-2 gap-12">
        {/* Left: Info */}
        <div className="space-y-8">
          {/* What to expect */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              What to Expect
            </h2>
            <div className="space-y-4">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {benefit.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Select use case */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              I'm interested in...
            </h2>
            <div className="space-y-3">
              {useCases.map((useCase) => (
                <button
                  key={useCase.title}
                  onClick={() => setSelectedUseCase(useCase.title)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    selectedUseCase === useCase.title
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <useCase.icon className={`w-6 h-6 text-${useCase.color}-500`} />
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {useCase.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {useCase.desc}
                    </p>
                  </div>
                  {selectedUseCase === useCase.title && (
                    <CheckCircle2 className="w-5 h-5 text-blue-500 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Additional links */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="pt-4"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Want to explore first?
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/vulca">
                <IOSButton variant="secondary" size="sm" className="flex items-center gap-1">
                  Try Public Demo
                  <ArrowRight className="w-4 h-4" />
                </IOSButton>
              </Link>
              <Link to="/methodology">
                <IOSButton variant="secondary" size="sm" className="flex items-center gap-1">
                  Read Documentation
                </IOSButton>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Right: Calendly Embed */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <IOSCard variant="elevated" className="overflow-hidden">
            <IOSCardHeader
              emoji={<Calendar className="w-6 h-6 text-blue-500" />}
              title="Schedule Your Demo"
              subtitle="Pick a time that works for you"
            />
            <IOSCardContent className="p-0">
              {/* Calendly Embed Placeholder */}
              <div className="bg-gray-50 dark:bg-gray-900/50 min-h-[500px] flex flex-col items-center justify-center p-8">
                <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Calendly Integration
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-sm">
                  In production, this area will display an embedded Calendly scheduler.
                </p>
                <a
                  href={CALENDLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IOSButton variant="primary" size="lg" className="flex items-center gap-2">
                    Open Calendly
                    <ExternalLink className="w-4 h-4" />
                  </IOSButton>
                </a>

                {/* Calendly embed script would go here in production */}
                {/*
                  <div
                    className="calendly-inline-widget"
                    data-url={CALENDLY_URL}
                    style={{ minWidth: '320px', height: '700px' }}
                  />
                  <script type="text/javascript" src="https://assets.calendly.com/assets/external/widget.js" async />
                */}
              </div>
            </IOSCardContent>
          </IOSCard>

          {/* Alternative: Form fallback */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Prefer email? Contact us at{' '}
              <a href="mailto:demo@vulca.ai" className="text-blue-600 dark:text-blue-400 hover:underline">
                demo@vulca.ai
              </a>
            </p>
          </div>
        </motion.div>
      </section>

      {/* Trust indicators */}
      <section className="bg-gray-50 dark:bg-gray-900/50 -mx-4 px-4 py-8 rounded-2xl">
        <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            No credit card required
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            30-minute session
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500" />
            Tailored to your use case
          </div>
        </div>
      </section>
    </div>
  );
}
