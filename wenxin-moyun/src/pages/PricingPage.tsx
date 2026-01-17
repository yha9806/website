import { Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  X,
  ArrowRight,
  Sparkles,
  Zap,
  Building2,
  HelpCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  IOSButton,
  IOSCard,
  IOSCardHeader,
  IOSCardContent,
  IOSCardFooter,
  IOSCardGrid,
} from '../components/ios';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'For academic research and open-source projects',
    icon: Sparkles,
    color: 'gray',
    cta: 'Try Public Demo',
    ctaLink: '/vulca',
    ctaVariant: 'secondary' as const,
    deliverables: ['Public demo access', '6D overview only'],
    features: [
      { name: 'Public leaderboard access', included: true },
      { name: 'Limited demo evaluations', included: true },
      { name: 'Citation export (BibTeX, RIS)', included: true },
      { name: 'Community support', included: true },
      { name: 'Batch evaluations', included: false },
      { name: '47D diagnostics', included: false },
      { name: 'Custom benchmarks', included: false },
      { name: 'API access', included: false },
    ],
  },
  {
    name: 'Pilot',
    price: '$2,500',
    period: 'one-time',
    description: 'For model selection and pre-release audits',
    icon: Zap,
    color: 'blue',
    cta: 'Request Pilot',
    ctaLink: '/demo',
    ctaVariant: 'primary' as const,
    popular: true,
    deliverables: ['Full 47D report (PDF)', '8 cultural perspectives', '1-2 weeks delivery'],
    features: [
      { name: 'Everything in Free', included: true },
      { name: 'Full 47D evaluation report', included: true },
      { name: '8 cultural perspective analysis', included: true },
      { name: 'Risk identification & recommendations', included: true },
      { name: 'Evidence samples for findings', included: true },
      { name: 'PDF deliverable report', included: true },
      { name: 'Dedicated support', included: true },
      { name: 'API access', included: false },
    ],
  },
  {
    name: 'Enterprise',
    price: 'From $15,000',
    period: 'annual',
    description: 'For continuous evaluation and private data',
    icon: Building2,
    color: 'purple',
    cta: 'Talk to Sales',
    ctaLink: '/demo',
    ctaVariant: 'secondary' as const,
    deliverables: ['Unlimited evaluations', 'Custom benchmarks', 'API access', 'Regression monitoring'],
    features: [
      { name: 'Everything in Pilot', included: true },
      { name: 'Unlimited evaluations', included: true },
      { name: 'Custom benchmark upload', included: true },
      { name: 'Private workspace & RBAC', included: true },
      { name: 'API & SDK access', included: true },
      { name: 'Regression monitoring', included: true },
      { name: 'SLA & priority support', included: true },
      { name: 'Custom integrations', included: true },
    ],
  },
];

const faqs = [
  {
    q: 'What is included in a Pilot evaluation?',
    a: 'A Pilot includes a comprehensive 47D evaluation across all 8 cultural perspectives, delivered as a PDF report with evidence samples, risk identification, and actionable recommendations. Typical turnaround is 1-2 weeks.',
  },
  {
    q: 'What is your evaluation SOP?',
    a: 'Our 5-step process: (1) Benchmark selection — choose from our curated library or upload custom data; (2) Model inference — run your model against selected benchmarks; (3) Multi-perspective scoring — 47D evaluation across 8 cultural perspectives; (4) QA review — human expert validation of flagged outputs; (5) Report generation — PDF deliverable with evidence samples and recommendations.',
  },
  {
    q: 'Can I evaluate custom models?',
    a: 'Yes! Pilot and Enterprise plans support evaluation of any model via API access. You provide model endpoints or outputs, and we run the VULCA framework.',
  },
  {
    q: 'Is there a free trial for Enterprise?',
    a: 'We offer a Pilot engagement as the entry point for enterprises. This lets you see the full value of VULCA before committing to an annual plan.',
  },
  {
    q: 'What citation formats are supported?',
    a: 'We support BibTeX, RIS, CSL JSON, APA, MLA, Chicago, and Harvard formats for all evaluation results.',
  },
  {
    q: 'Do you offer academic discounts?',
    a: 'Yes! Academic institutions can access the Free tier and request discounted Pilot evaluations. Contact us for details.',
  },
];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
            From Public Demo to Enterprise Evaluation
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
            Choose the plan that fits your cultural AI evaluation needs
          </p>
        </motion.div>
      </section>

      {/* Pricing Cards */}
      <section>
        <IOSCardGrid columns={3} gap="lg">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <IOSCard
                variant="elevated"
                className={`h-full relative ${plan.popular ? 'ring-2 ring-slate-600' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-600 text-white text-xs font-semibold rounded-full">
                    Most Popular
                  </div>
                )}
                <IOSCardHeader
                  emoji={<plan.icon className={`w-8 h-8 text-${plan.color}-500`} />}
                  title={plan.name}
                  subtitle={plan.description}
                />
                <IOSCardContent>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {plan.price}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 ml-2">
                      / {plan.period}
                    </span>
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature.name} className="flex items-start gap-2">
                        {feature.included ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                        )}
                        <span className={feature.included ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </IOSCardContent>
                <IOSCardFooter>
                  <Link to={plan.ctaLink} className="w-full">
                    <IOSButton
                      variant={plan.ctaVariant}
                      size="md"
                      className="w-full flex items-center justify-center gap-2"
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4" />
                    </IOSButton>
                  </Link>
                </IOSCardFooter>
              </IOSCard>
            </motion.div>
          ))}
        </IOSCardGrid>
      </section>

      {/* Feature Comparison Table */}
      <section className="bg-gray-50 dark:bg-gray-900/50 -mx-4 px-4 py-16 rounded-2xl">
        <motion.div {...fadeInUp} className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Feature Comparison
          </h2>
        </motion.div>

        <div className="overflow-x-auto">
          <table className="w-full max-w-4xl mx-auto">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Feature</th>
                <th className="py-4 px-4 text-center text-sm font-semibold text-gray-900 dark:text-white">Free</th>
                <th className="py-4 px-4 text-center text-sm font-semibold text-gray-900 dark:text-white">Pilot</th>
                <th className="py-4 px-4 text-center text-sm font-semibold text-gray-900 dark:text-white">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {[
                ['Public leaderboard', true, true, true],
                ['Demo evaluations', '5/month', 'Unlimited', 'Unlimited'],
                ['47D diagnostics', false, true, true],
                ['8 cultural perspectives', false, true, true],
                ['PDF reports', false, true, true],
                ['API access', false, false, true],
                ['Custom benchmarks', false, false, true],
                ['RBAC & workspace', false, false, true],
                ['SLA support', false, false, true],
              ].map(([feature, free, pilot, enterprise], index) => (
                <tr key={index}>
                  <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300">{feature as string}</td>
                  {[free, pilot, enterprise].map((value, i) => (
                    <td key={i} className="py-3 px-4 text-center">
                      {typeof value === 'boolean' ? (
                        value ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm text-gray-700 dark:text-gray-300">{value}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section>
        <motion.div {...fadeInUp} className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h2>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              viewport={{ once: true }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <span className="text-left font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-slate-600" />
                  {faq.q}
                </span>
                <ArrowRight className={`w-5 h-5 text-gray-400 transition-transform ${openFaq === index ? 'rotate-90' : ''}`} />
              </button>
              {openFaq === index && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 rounded-b-xl -mt-2"
                >
                  <p className="text-gray-600 dark:text-gray-400 pl-7">{faq.a}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Not sure which plan is right for you?
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Book a call and we'll help you find the best fit
        </p>
        <Link to="/demo">
          <IOSButton variant="primary" size="lg" className="flex items-center gap-2 mx-auto">
            <Calendar className="w-5 h-5" />
            Book a Demo
          </IOSButton>
        </Link>
      </section>
    </div>
  );
}
