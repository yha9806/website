import { Github, Twitter, Mail, Heart } from 'lucide-react';
import { IOSButton } from '../ios';
import { EmojiIcon } from '../ios';

export default function Footer() {
  return (
    <footer className="ios-glass border-t border-gray-200/20 dark:border-gray-700/20 mt-auto">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-h3 mb-4 flex items-center gap-2">
              <EmojiIcon category="feedback" name="info" size="sm" />
              About WenXin MoYun
            </h3>
            <p className="text-body">
              Modern AI art evaluation platform focused on creativity assessment, aesthetic analysis, and intelligent evaluation.
              Bridging the gap between technology and artistic expression.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-h3 mb-4 flex items-center gap-2">
              <EmojiIcon category="navigation" name="info" size="sm" />
              Quick Links
            </h3>
            <div className="space-y-2">
              <a href="/leaderboard" className="block">
                <IOSButton variant="text" size="sm" className="w-full justify-start">
                  <EmojiIcon category="navigation" name="leaderboard" size="xs" />
                  Model Rankings
                </IOSButton>
              </a>
              <a href="/battle" className="block">
                <IOSButton variant="text" size="sm" className="w-full justify-start">
                  <EmojiIcon category="navigation" name="battle" size="xs" />
                  Live Battles
                </IOSButton>
              </a>
              <a href="/evaluations" className="block">
                <IOSButton variant="text" size="sm" className="w-full justify-start">
                  <EmojiIcon category="evaluationType" name="general" size="xs" />
                  Evaluation Tasks
                </IOSButton>
              </a>
              <a href="/about" className="block">
                <IOSButton variant="text" size="sm" className="w-full justify-start">
                  <EmojiIcon category="feedback" name="info" size="xs" />
                  Documentation
                </IOSButton>
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-h3 mb-4 flex items-center gap-2">
              <EmojiIcon category="actions" name="share" size="sm" />
              Connect With Us
            </h3>
            <div className="flex space-x-3 mb-4">
              <IOSButton variant="glass" size="sm" className="p-3">
                <Github className="w-4 h-4" />
              </IOSButton>
              <IOSButton variant="glass" size="sm" className="p-3">
                <Twitter className="w-4 h-4" />
              </IOSButton>
              <IOSButton variant="glass" size="sm" className="p-3">
                <Mail className="w-4 h-4" />
              </IOSButton>
            </div>
            <p className="text-footnote text-gray-500 dark:text-gray-400">
              hello@wenxinmoyun.ai
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200/20 dark:border-gray-700/20 mt-8 pt-8 text-center">
          <p className="text-footnote text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1 mb-2">
            Made with <Heart className="w-4 h-4 text-red-500" /> by WenXin MoYun Team
          </p>
          <p className="text-footnote text-gray-500 dark:text-gray-500">
            © 2024 WenXin MoYun. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}