/**
 * Pilot Landing Page
 *
 * Dedicated page for enterprise pilot requests with lead capture form.
 * Part of Sprint 0: SEO infrastructure.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { IOSButton } from '../components/ios/core/IOSButton';
import { IOSCard, IOSCardHeader, IOSCardContent } from '../components/ios/core/IOSCard';
import {
  FileText, CheckCircle, ArrowRight, Clock, BarChart3,
  Globe2, Shield, Send, Building2, Mail, User, MessageSquare
} from 'lucide-react';
import { usePageSEO } from '../hooks/useSEO';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

// What's included in pilot
const pilotIncludes = [
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: '47D Diagnostic Scores',
    description: 'Complete evaluation across all 47 VULCA dimensions'
  },
  {
    icon: <Globe2 className="w-6 h-6" />,
    title: '8 Cultural Perspectives',
    description: 'Cross-cultural analysis from Chinese, Western, Japanese, and more'
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: 'Comprehensive Report',
    description: '20-35 page PDF with evidence samples and recommendations'
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Risk Assessment',
    description: 'Failure taxonomy and actionable risk mitigation strategies'
  }
];

// Process steps
const processSteps = [
  {
    step: 1,
    title: 'Tell Us About Your Model',
    description: 'Share your model details, use case, and evaluation goals'
  },
  {
    step: 2,
    title: 'We Run VULCA Evaluation',
    description: 'Our team conducts comprehensive 47D cultural evaluation'
  },
  {
    step: 3,
    title: 'Receive Your Report',
    description: 'Get detailed diagnostic report within 2 weeks'
  }
];

export default function PilotPage() {
  usePageSEO({
    title: 'Request Pilot Evaluation | VULCA',
    description: 'Get a comprehensive VULCA pilot evaluation report for your AI model. 47-dimension cultural analysis with cross-cultural perspectives delivered in 2 weeks.',
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    modelName: '',
    useCase: 'model_selection',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://wenxin-moyun-api-229980166599.asia-east1.run.app';
      const response = await fetch(`${apiUrl}/api/v1/leads/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company || undefined,
          use_case: formData.useCase,
          message: formData.message || undefined,
          source_page: 'pilot'
        })
      });

      if (response.ok) {
        setIsSubmitted(true);
        toast.success('Request submitted! We will contact you within 24 hours.');
      } else {
        throw new Error('Failed to submit');
      }
    } catch {
      toast.error('Submission failed. Please try again or email us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-center" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto"
      >
        {/* Hero Section */}
        <motion.div variants={itemVariants} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-600/10 text-slate-600 dark:text-slate-500 text-sm font-medium mb-6">
            <Clock className="w-4 h-4" />
            2-Week Delivery
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Get Your VULCA Pilot Report
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Comprehensive 47-dimension cultural evaluation for your AI model.
            Understand strengths, identify risks, and make informed decisions.
          </p>
        </motion.div>

        {/* What's Included */}
        <motion.div variants={itemVariants} className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
            What's Included
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pilotIncludes.map((item, index) => (
              <IOSCard key={index} variant="elevated" className="text-center">
                <IOSCardContent className="pt-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-600/10 text-slate-600 mb-4">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.description}
                  </p>
                </IOSCardContent>
              </IOSCard>
            ))}
          </div>
        </motion.div>

        {/* Process Steps */}
        <motion.div variants={itemVariants} className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
            How It Works
          </h2>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            {processSteps.map((step, index) => (
              <div key={step.step} className="flex items-center gap-4">
                <div className="flex flex-col items-center text-center max-w-xs">
                  <div className="w-12 h-12 rounded-full bg-slate-600 text-white flex items-center justify-center text-xl font-bold mb-3">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {step.description}
                  </p>
                </div>

                {index < processSteps.length - 1 && (
                  <ArrowRight className="hidden md:block w-6 h-6 text-gray-400 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Request Form */}
        <motion.div variants={itemVariants} className="max-w-2xl mx-auto">
          <IOSCard variant="elevated">
            <IOSCardHeader
              title={isSubmitted ? 'Request Received' : 'Request Your Pilot'}
              subtitle={isSubmitted ? 'We will be in touch soon' : 'Fill out the form below to get started'}
            />
            <IOSCardContent>
              {isSubmitted ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 text-green-500 mb-4">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Thank You!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Your pilot request has been submitted. Our team will review your information and contact you within 24 hours.
                  </p>
                  <IOSButton
                    variant="secondary"
                    onClick={() => setIsSubmitted(false)}
                  >
                    Submit Another Request
                  </IOSButton>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <User className="w-4 h-4 inline mr-1" />
                        Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-slate-600 focus:border-transparent transition-all"
                        placeholder="Your name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <Mail className="w-4 h-4 inline mr-1" />
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-slate-600 focus:border-transparent transition-all"
                        placeholder="you@company.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <Building2 className="w-4 h-4 inline mr-1" />
                        Company
                      </label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-slate-600 focus:border-transparent transition-all"
                        placeholder="Your company"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Model / Product Name
                      </label>
                      <input
                        type="text"
                        name="modelName"
                        value={formData.modelName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-slate-600 focus:border-transparent transition-all"
                        placeholder="e.g., GPT-4, Claude, Custom Model"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Use Case *
                    </label>
                    <select
                      name="useCase"
                      required
                      value={formData.useCase}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-slate-600 focus:border-transparent transition-all"
                    >
                      <option value="model_selection">Model Selection / Comparison</option>
                      <option value="pre_release">Pre-Release Evaluation</option>
                      <option value="research">Academic Research</option>
                      <option value="compliance">Compliance / Risk Assessment</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <MessageSquare className="w-4 h-4 inline mr-1" />
                      Additional Information
                    </label>
                    <textarea
                      name="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-slate-600 focus:border-transparent transition-all resize-none"
                      placeholder="Tell us more about your evaluation needs, timeline, or specific focus areas..."
                    />
                  </div>

                  <IOSButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      'Submitting...'
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Request Pilot Evaluation
                      </>
                    )}
                  </IOSButton>

                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                    By submitting, you agree to our privacy policy. We'll only use your information to process this request.
                  </p>
                </form>
              )}
            </IOSCardContent>
          </IOSCard>
        </motion.div>

        {/* Sample Report CTA */}
        <motion.div variants={itemVariants} className="text-center mt-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Want to see what a VULCA report looks like?
          </p>
          <IOSButton
            variant="secondary"
            onClick={() => window.open('/sample-report.pdf', '_blank')}
          >
            <FileText className="w-5 h-5 mr-2" />
            Download Sample Report
          </IOSButton>
        </motion.div>
      </motion.div>
    </div>
  );
}
