import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  Palette,
  CheckCircle2,
  Globe,
  Eye,
  MessageSquare,
  Users,
  Image,
  Shield,
  Sparkles,
  Languages
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  IOSButton,
  IOSCard,
  IOSCardHeader,
  IOSCardContent,
  IOSCardGrid,
} from '../../components/ios';

export default function MuseumSolutionPage() {
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
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
              <Palette className="w-6 h-6 text-orange-500" />
            </div>
            <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
              Solution for Museums
            </span>
          </div>

          <h1 className="text-page-title mb-6">
            Cultural AI for Museums & Galleries
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Deploy AI for cultural interpretation with confidence. Validate cross-cultural accuracy and ensure interpretive quality for diverse audiences.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/demo">
              <IOSButton variant="primary" size="lg" className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Book a Consultation
              </IOSButton>
            </Link>
            <Link to="/exhibitions">
              <IOSButton variant="secondary" size="lg" className="flex items-center gap-2">
                View Exhibition Demo
              </IOSButton>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Use Cases */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            AI Applications in Cultural Institutions
          </h2>
        </motion.div>

        <IOSCardGrid columns={3} gap="lg">
          <IOSCard variant="elevated">
            <IOSCardHeader
              emoji={<MessageSquare className="w-8 h-8 text-orange-500" />}
              title="AI Docents & Guides"
            />
            <IOSCardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Conversational AI that explains artworks to visitors. Ensure cultural sensitivity and interpretive accuracy across languages.
              </p>
            </IOSCardContent>
          </IOSCard>

          <IOSCard variant="elevated">
            <IOSCardHeader
              emoji={<Image className="w-8 h-8 text-slate-600" />}
              title="Artwork Description"
            />
            <IOSCardContent>
              <p className="text-gray-600 dark:text-gray-400">
                Auto-generated descriptions for catalog and accessibility. Validate cultural context and avoid misinterpretation.
              </p>
            </IOSCardContent>
          </IOSCard>

          <IOSCard variant="elevated">
            <IOSCardHeader
              emoji={<Sparkles className="w-8 h-8 text-amber-600" />}
              title="Curatorial AI"
            />
            <IOSCardContent>
              <p className="text-gray-600 dark:text-gray-400">
                AI-assisted exhibition curation and thematic grouping. Ensure cross-cultural themes are represented authentically.
              </p>
            </IOSCardContent>
          </IOSCard>
        </IOSCardGrid>
      </section>

      {/* Challenges */}
      <section className="bg-gray-50 dark:bg-gray-900/50 -mx-4 px-4 py-16 rounded-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Why Cultural Validation Matters
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Globe className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Global Audiences
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Museums serve visitors from diverse cultural backgrounds. AI interpretations must resonate authentically across cultures.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Institutional Trust
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Museums are trusted authorities on cultural interpretation. AI errors can damage institutional credibility.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Languages className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Multilingual Accuracy
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Translations must preserve cultural nuance, not just linguistic meaning. VULCA validates cross-cultural fidelity.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-amber-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Eye className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Interpretive Quality
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Art interpretation requires depth beyond surface description. VULCA evaluates L1-L5 cognitive levels.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VULCA for Museums */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            VULCA for Cultural Institutions
          </h2>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <IOSCard variant="elevated">
            <IOSCardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    8 Cultural Perspectives
                  </h3>
                  <ul className="space-y-2">
                    {[
                      'Su Shi (Chinese literati)',
                      'Guo Xi (Chinese landscape)',
                      'John Ruskin (Victorian critic)',
                      'Clement Greenberg (Modernist)',
                    ].map((critic) => (
                      <li key={critic} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        {critic}
                      </li>
                    ))}
                    <li className="text-sm text-gray-500 dark:text-gray-400 pl-6">...and 4 more</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    47 Evaluation Dimensions
                  </h3>
                  <ul className="space-y-2">
                    {[
                      'Cultural symbolism accuracy',
                      'Historical context fidelity',
                      'Cross-cultural sensitivity',
                      'Interpretive depth (L1-L5)',
                    ].map((dim) => (
                      <li key={dim} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        {dim}
                      </li>
                    ))}
                    <li className="text-sm text-gray-500 dark:text-gray-400 pl-6">...and 43 more</li>
                  </ul>
                </div>
              </div>
            </IOSCardContent>
          </IOSCard>
        </div>
      </section>

      {/* Exhibition Demo */}
      <section className="bg-orange-50 dark:bg-orange-900/20 -mx-4 px-4 py-12 rounded-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            See It in Action
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Explore our "Echoes and Returns" exhibition demo featuring AI dialogue on 87 contemporary artworks with 8 historical art critics.
          </p>
          <Link to="/exhibitions">
            <IOSButton variant="primary" size="lg" className="flex items-center gap-2 mx-auto">
              <Image className="w-5 h-5" />
              View Exhibition Demo
              <ArrowRight className="w-4 h-4" />
            </IOSButton>
          </Link>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="py-12 text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Partner with Us
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
          Let's discuss how VULCA can support your institution's AI initiatives
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/demo">
            <IOSButton variant="primary" size="lg" className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Book a Consultation
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
