import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Shield,
  BarChart3,
  Zap,
  Building2,
  GraduationCap,
  Palette,
  FileText,
  Globe,
  Layers,
  Target,
  Eye,
  AlertTriangle,
  TrendingUp,
  Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLeaderboard } from '../hooks/useLeaderboard';
import {
  IOSButton,
  IOSCard,
  IOSCardHeader,
  IOSCardContent,
  IOSCardFooter,
  IOSCardGrid,
} from '../components/ios';
import { downloadSampleReport } from '../utils/pdfExport';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function HomePage() {
  const { entries: leaderboard } = useLeaderboard();

  return (
    <div className="space-y-24">
      {/* ============= HERO SECTION ============= */}
      <section className="relative pt-8 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Trust badges - above headline */}
          <motion.div
            className="flex flex-wrap justify-center gap-3 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Reproducible
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800/30 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-full">
              <BarChart3 className="w-3.5 h-3.5" />
              Decision-grade
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-bronze-500/10 dark:bg-bronze-500/20 text-purple-500 dark:text-bronze-400 text-xs font-medium rounded-full">
              <Shield className="w-3.5 h-3.5" />
              Enterprise-ready
            </span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            className="text-large-title mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Evaluate AI Models for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-bronze-500 dark:from-slate-400 dark:to-bronze-400">
              Cultural Understanding
            </span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            className="text-h2 text-gray-600 dark:text-gray-300 mb-4 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            47 dimensions × 8 cultural perspectives
          </motion.p>

          <motion.p
            className="text-lg text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Reproducible evaluation + Explainable diagnostics + Deliverable reports
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Link to="/demo">
              <IOSButton
                variant="primary"
                size="lg"
                className="flex items-center gap-2 min-w-[200px] justify-center"
                data-testid="hero-book-demo"
              >
                <Calendar className="w-5 h-5" />
                Book a Demo
                <ArrowRight className="w-5 h-5" />
              </IOSButton>
            </Link>
            <Link to="/vulca">
              <IOSButton
                variant="secondary"
                size="lg"
                className="flex items-center gap-2 min-w-[200px] justify-center"
                data-testid="hero-try-demo"
              >
                Try Public Demo
              </IOSButton>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ============= SOCIAL PROOF STRIP ============= */}
      <section className="py-8 bg-gray-50 dark:bg-gray-900/50 -mx-4 px-4 rounded-2xl">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Peer-reviewed and trusted by teams building generative AI
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12">
            {/* Conference badges */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <FileText className="w-5 h-5 text-slate-600" />
              <span className="font-semibold text-gray-900 dark:text-white">EMNLP 2025</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <FileText className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-900 dark:text-white">WiNLP 2025</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <FileText className="w-5 h-5 text-bronze-500" />
              <span className="font-semibold text-gray-900 dark:text-white">arXiv 2026</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ============= PROBLEM → OUTCOME ============= */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-h1 mb-4">
            Why Cultural Evaluation Matters
          </h2>
          <p className="text-body max-w-2xl mx-auto">
            As AI models grow more powerful, cultural risks become harder to detect
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          <IOSCardGrid columns={3} gap="lg">
            {/* Problem 1 */}
            <motion.div variants={fadeInUp}>
              <IOSCard variant="elevated" className="h-full">
                <IOSCardHeader
                  emoji={<AlertTriangle className="w-8 h-8 text-orange-500" />}
                  title="Hidden Cultural Risks"
                />
                <IOSCardContent>
                  <p className="text-gray-600 dark:text-gray-400">
                    Stronger models can produce more sophisticated — yet subtly biased — cultural content that's harder to catch.
                  </p>
                </IOSCardContent>
              </IOSCard>
            </motion.div>

            {/* Problem 2 */}
            <motion.div variants={fadeInUp}>
              <IOSCard variant="elevated" className="h-full">
                <IOSCardHeader
                  emoji={<Target className="w-8 h-8 text-red-500" />}
                  title="Single Metric Fails"
                />
                <IOSCardContent>
                  <p className="text-gray-600 dark:text-gray-400">
                    A single score can't inform model selection or release decisions. You need multi-dimensional, explainable diagnostics.
                  </p>
                </IOSCardContent>
              </IOSCard>
            </motion.div>

            {/* Problem 3 */}
            <motion.div variants={fadeInUp}>
              <IOSCard variant="elevated" className="h-full">
                <IOSCardHeader
                  emoji={<CheckCircle2 className="w-8 h-8 text-green-500" />}
                  title="Reproducibility Required"
                />
                <IOSCardContent>
                  <p className="text-gray-600 dark:text-gray-400">
                    Evaluations must be reproducible and citable. Ad-hoc testing doesn't support audits or publications.
                  </p>
                </IOSCardContent>
              </IOSCard>
            </motion.div>
          </IOSCardGrid>
        </motion.div>
      </section>

      {/* ============= PRODUCT PILLARS ============= */}
      <section className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900/50 dark:to-gray-900/0 -mx-4 px-4 py-16 rounded-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-h1 mb-4">
            The VULCA Platform
          </h2>
          <p className="text-body max-w-2xl mx-auto">
            Three pillars for comprehensive cultural AI evaluation
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          <IOSCardGrid columns={3} gap="lg">
            {/* Pillar 1: Benchmark Library */}
            <motion.div variants={fadeInUp}>
              <IOSCard variant="flat" className="h-full border-t-4 border-t-slate-500">
                <IOSCardHeader
                  emoji={<Layers className="w-8 h-8 text-slate-500" />}
                  title="Benchmark Library"
                  subtitle="L1-L5 Framework"
                />
                <IOSCardContent>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      130 artworks, 7,410+ annotations
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      5-level cognitive framework (L1-L5)
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      6D core → 47D expanded dimensions
                    </li>
                  </ul>
                </IOSCardContent>
              </IOSCard>
            </motion.div>

            {/* Pillar 2: Evaluation Engine */}
            <motion.div variants={fadeInUp}>
              <IOSCard variant="flat" className="h-full border-t-4 border-t-bronze-500">
                <IOSCardHeader
                  emoji={<Zap className="w-8 h-8 text-bronze-500" />}
                  title="Evaluation Engine"
                  subtitle="Multi-perspective"
                />
                <IOSCardContent>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      8 cultural perspectives (East/West)
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      Automated scoring pipeline
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      Batch evaluation support
                    </li>
                  </ul>
                </IOSCardContent>
              </IOSCard>
            </motion.div>

            {/* Pillar 3: Diagnostics */}
            <motion.div variants={fadeInUp}>
              <IOSCard variant="flat" className="h-full border-t-4 border-t-green-500">
                <IOSCardHeader
                  emoji={<Eye className="w-8 h-8 text-green-500" />}
                  title="Explainable Diagnostics"
                  subtitle="Actionable insights"
                />
                <IOSCardContent>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      Top-Δ dimension analysis
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      Failure taxonomy & evidence
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      Export-ready reports (PDF/JSON)
                    </li>
                  </ul>
                </IOSCardContent>
              </IOSCard>
            </motion.div>
          </IOSCardGrid>
        </motion.div>
      </section>

      {/* ============= HOW IT WORKS ============= */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-h1 mb-4">
            How It Works
          </h2>
          <p className="text-body max-w-2xl mx-auto">
            From benchmark selection to actionable report in three steps
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="relative"
        >
          {/* Connecting line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 -translate-y-1/2 z-0" />

          <div className="grid md:grid-cols-3 gap-8 relative z-10">
            {/* Step 1 */}
            <motion.div variants={fadeInUp} className="text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-slate-600 dark:text-slate-300">1</span>
              </div>
              <h3 className="text-h3 mb-2">
                Choose Benchmark
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Select from our curated benchmark library or upload your custom evaluation data
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div variants={fadeInUp} className="text-center">
              <div className="w-16 h-16 bg-bronze-500/10 dark:bg-bronze-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-bronze-500 dark:text-bronze-400">2</span>
              </div>
              <h3 className="text-h3 mb-2">
                Run Evaluation
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Execute VULCA 47D evaluation across 8 cultural perspectives with full provenance
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div variants={fadeInUp} className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">3</span>
              </div>
              <h3 className="text-h3 mb-2">
                Export & Monitor
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Download reports, track regressions, and integrate into your model release workflow
              </p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ============= SOLUTIONS (3 Customer Segments) ============= */}
      <section className="bg-gray-50 dark:bg-gray-900/50 -mx-4 px-4 py-16 rounded-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-h1 mb-4">
            Solutions for Every Team
          </h2>
          <p className="text-body max-w-2xl mx-auto">
            Whether you're building, researching, or curating AI — we have you covered
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          <IOSCardGrid columns={3} gap="lg">
            {/* AI Labs */}
            <motion.div variants={fadeInUp}>
              <IOSCard variant="elevated" interactive className="h-full">
                <IOSCardHeader
                  emoji={<Building2 className="w-10 h-10 text-slate-500" />}
                  title="AI Labs & Companies"
                  subtitle="Model selection & release"
                />
                <IOSCardContent>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Make informed decisions for model selection, fine-tuning validation, and safe public release.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <TrendingUp className="w-4 h-4 text-slate-500" />
                      Pre-release cultural audits
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Target className="w-4 h-4 text-slate-500" />
                      47D regression tracking
                    </div>
                  </div>
                </IOSCardContent>
                <IOSCardFooter>
                  <Link to="/solutions/ai-labs" className="w-full">
                    <IOSButton variant="secondary" size="sm" className="w-full">
                      Learn More <ArrowRight className="w-4 h-4 ml-1" />
                    </IOSButton>
                  </Link>
                </IOSCardFooter>
              </IOSCard>
            </motion.div>

            {/* Research */}
            <motion.div variants={fadeInUp}>
              <IOSCard variant="elevated" interactive className="h-full">
                <IOSCardHeader
                  emoji={<GraduationCap className="w-10 h-10 text-bronze-500" />}
                  title="Research Institutions"
                  subtitle="Academic benchmarking"
                />
                <IOSCardContent>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Publish with confidence using reproducible, citable evaluation methodology.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <FileText className="w-4 h-4 text-bronze-500" />
                      Citation-ready reports
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-bronze-500" />
                      Version-controlled reproducibility
                    </div>
                  </div>
                </IOSCardContent>
                <IOSCardFooter>
                  <Link to="/solutions/research" className="w-full">
                    <IOSButton variant="secondary" size="sm" className="w-full">
                      Learn More <ArrowRight className="w-4 h-4 ml-1" />
                    </IOSButton>
                  </Link>
                </IOSCardFooter>
              </IOSCard>
            </motion.div>

            {/* Museums */}
            <motion.div variants={fadeInUp}>
              <IOSCard variant="elevated" interactive className="h-full">
                <IOSCardHeader
                  emoji={<Palette className="w-10 h-10 text-orange-500" />}
                  title="Museums & Galleries"
                  subtitle="Cultural AI curation"
                />
                <IOSCardContent>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Deploy AI for cultural interpretation with confidence in cross-cultural accuracy.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Globe className="w-4 h-4 text-orange-500" />
                      Multi-cultural validation
                    </div>
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <Eye className="w-4 h-4 text-orange-500" />
                      Interpretive AI quality
                    </div>
                  </div>
                </IOSCardContent>
                <IOSCardFooter>
                  <Link to="/solutions/museums" className="w-full">
                    <IOSButton variant="secondary" size="sm" className="w-full">
                      Learn More <ArrowRight className="w-4 h-4 ml-1" />
                    </IOSButton>
                  </Link>
                </IOSCardFooter>
              </IOSCard>
            </motion.div>
          </IOSCardGrid>
        </motion.div>
      </section>

      {/* ============= EVIDENCE / STATS ============= */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-h1 mb-4">
            Built on Real Data
          </h2>
          <p className="text-body max-w-2xl mx-auto">
            Comprehensive evaluation framework backed by rigorous research
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <div className="bg-gradient-to-r from-slate-50 to-bronze-500/10 dark:from-slate-800/30 dark:to-bronze-500/20 rounded-2xl p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-slate-600 dark:text-slate-300 mb-2">
                  {leaderboard.length || 42}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Models Evaluated</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-bronze-500 dark:text-bronze-400 mb-2">
                  47
                </div>
                <div className="text-gray-600 dark:text-gray-400">Dimensions</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-green-600 dark:text-green-400 mb-2">
                  8
                </div>
                <div className="text-gray-600 dark:text-gray-400">Cultural Perspectives</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                  130
                </div>
                <div className="text-gray-600 dark:text-gray-400">Artworks</div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">7,410+ annotations</div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <IOSButton
                variant="secondary"
                size="md"
                className="inline-flex items-center gap-2"
                onClick={downloadSampleReport}
              >
                <Download className="w-4 h-4" />
                Download Sample Report
              </IOSButton>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ============= TRUST TEASER ============= */}
      <section className="bg-gray-900 dark:bg-gray-800 text-white -mx-4 px-4 py-12 rounded-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-h3">Trust by Default</h3>
              <p className="text-gray-400">
                Enterprise-grade security, version control, and audit trails
              </p>
            </div>
          </div>
          <Link to="/trust">
            <IOSButton variant="secondary" size="md" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20">
              Learn About Security
              <ArrowRight className="w-4 h-4" />
            </IOSButton>
          </Link>
        </motion.div>
      </section>

      {/* ============= FINAL CTA ============= */}
      <section className="py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-h1 mb-4">
            Make Cultural Evaluation Part of Your Model Release Workflow
          </h2>
          <p className="text-body mb-8">
            Join teams using VULCA to build more culturally aware AI systems
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/demo">
              <IOSButton
                variant="primary"
                size="lg"
                className="flex items-center gap-2 min-w-[200px] justify-center"
              >
                <Calendar className="w-5 h-5" />
                Book a Demo
              </IOSButton>
            </Link>
            <Link to="/pricing">
              <IOSButton
                variant="secondary"
                size="lg"
                className="flex items-center gap-2 min-w-[200px] justify-center"
              >
                View Pricing
              </IOSButton>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
