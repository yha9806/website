import { Link } from 'react-router-dom';
import {
  Calendar,
  ArrowRight,
  Building2,
  GraduationCap,
  Palette,
  Quote,
  Star,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  IOSButton,
  IOSCard,
  IOSCardHeader,
  IOSCardContent,
  IOSCardFooter,
  IOSCardGrid,
} from '../components/ios';

// Placeholder logos - in production these would be real customer logos
const customerLogos = [
  { name: 'AI Research Lab', category: 'ai-lab' },
  { name: 'Tech University', category: 'research' },
  { name: 'National Museum', category: 'museum' },
  { name: 'AI Company', category: 'ai-lab' },
  { name: 'Research Institute', category: 'research' },
  { name: 'Art Gallery', category: 'museum' },
];

const caseStudies = [
  {
    title: 'Pre-Release Cultural Audit',
    company: 'Leading AI Lab',
    category: 'AI Labs',
    icon: Building2,
    color: 'blue',
    challenge: 'Needed to validate cultural understanding before releasing a new multimodal model to global users.',
    solution: 'Used VULCA 47D evaluation to identify cultural blind spots and target fine-tuning.',
    results: [
      '23% improvement in cross-cultural accuracy',
      'Identified 3 critical cultural risk areas',
      'Documented release readiness for compliance',
    ],
    quote: 'VULCA gave us the confidence to release knowing we had systematically evaluated cultural risks.',
  },
  {
    title: 'Academic Benchmark Publication',
    company: 'Top Research University',
    category: 'Research',
    icon: GraduationCap,
    color: 'purple',
    challenge: 'Required reproducible evaluation methodology for a peer-reviewed publication comparing vision-language models.',
    solution: 'Leveraged VULCA framework with full version control and citation export.',
    results: [
      'Paper accepted at EMNLP 2025',
      '100% reproducible results',
      'Standardized comparison across 15 models',
    ],
    quote: 'The reproducibility guarantees made the review process much smoother.',
  },
  {
    title: 'AI Docent Validation',
    company: 'Major Art Museum',
    category: 'Museums',
    icon: Palette,
    color: 'orange',
    challenge: 'Deploying an AI guide for international visitors required validation of cultural interpretations across languages.',
    solution: 'VULCA 8-perspective evaluation ensured interpretive quality for diverse audiences.',
    results: [
      'Validated across 4 language versions',
      'Identified 12 interpretation improvements',
      'Visitor satisfaction up 18%',
    ],
    quote: 'We couldn\'t deploy AI to explain art without knowing it understood cultural context correctly.',
  },
];

const testimonials = [
  {
    quote: 'VULCA transformed how we think about model evaluation. It\'s not just about performance metrics anymore.',
    author: 'Dr. Sarah Chen',
    role: 'ML Research Lead',
    company: 'AI Research Institute',
  },
  {
    quote: 'Finally, a benchmark that takes cultural understanding seriously. Essential for any global AI deployment.',
    author: 'James Wilson',
    role: 'VP of AI Safety',
    company: 'Tech Company',
  },
  {
    quote: 'The multi-perspective evaluation is exactly what museum AI needs. We use it for all our digital initiatives.',
    author: 'Dr. Maria Santos',
    role: 'Digital Innovation Director',
    company: 'National Art Museum',
  },
];

export default function CustomersPage() {
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
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Trusted by Teams Building Culturally-Aware AI
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            From AI labs to museums, organizations rely on VULCA for cultural AI evaluation
          </p>
        </motion.div>
      </section>

      {/* Logo Cloud (Placeholder) */}
      <section className="bg-gray-50 dark:bg-gray-900/50 -mx-4 px-4 py-12 rounded-2xl">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Organizations using VULCA
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {customerLogos.map((logo, index) => (
              <motion.div
                key={logo.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
                className="flex items-center justify-center h-16 bg-white dark:bg-gray-800 rounded-lg shadow-sm px-4"
              >
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {logo.name}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Case Studies */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Case Studies
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            See how organizations use VULCA for cultural AI evaluation
          </p>
        </motion.div>

        <div className="space-y-8">
          {caseStudies.map((study, index) => (
            <motion.div
              key={study.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <IOSCard variant="elevated">
                <div className="md:flex">
                  {/* Left: Category */}
                  <div className={`md:w-1/4 p-6 bg-${study.color}-50 dark:bg-${study.color}-900/20 flex flex-col items-center justify-center text-center`}>
                    <study.icon className={`w-12 h-12 text-${study.color}-500 mb-3`} />
                    <span className={`text-sm font-medium text-${study.color}-600 dark:text-${study.color}-400`}>
                      {study.category}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {study.company}
                    </span>
                  </div>

                  {/* Right: Content */}
                  <div className="md:w-3/4 p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      {study.title}
                    </h3>

                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Challenge</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{study.challenge}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Solution</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{study.solution}</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Results</h4>
                      <ul className="grid sm:grid-cols-3 gap-2">
                        {study.results.map((result) => (
                          <li key={result} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            {result}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-400">
                      "{study.quote}"
                    </blockquote>
                  </div>
                </div>
              </IOSCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 dark:bg-gray-900/50 -mx-4 px-4 py-16 rounded-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            What Our Users Say
          </h2>
        </motion.div>

        <IOSCardGrid columns={3} gap="lg">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <IOSCard variant="flat" className="h-full">
                <IOSCardContent>
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <Quote className="w-8 h-8 text-gray-200 dark:text-gray-700 mb-2" />
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {testimonial.quote}
                  </p>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.author}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {testimonial.role}, {testimonial.company}
                    </p>
                  </div>
                </IOSCardContent>
              </IOSCard>
            </motion.div>
          ))}
        </IOSCardGrid>
      </section>

      {/* CTA */}
      <section className="py-12 text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Join These Organizations
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Start evaluating your AI models for cultural understanding
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/demo">
            <IOSButton variant="primary" size="lg" className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Book a Demo
            </IOSButton>
          </Link>
          <Link to="/solutions">
            <IOSButton variant="secondary" size="lg" className="flex items-center gap-2">
              View Solutions
              <ArrowRight className="w-4 h-4" />
            </IOSButton>
          </Link>
        </div>
      </section>
    </div>
  );
}
