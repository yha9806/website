import { Github, Twitter, Mail, Heart, Trophy, Image, FlaskConical } from 'lucide-react';
import { IOSButton } from '../ios';

export default function Footer() {
  return (
    <footer className="ios-glass border-t border-gray-200/20 dark:border-gray-700/20 mt-auto">
      <div className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-h3 mb-3">About</h3>
            <p className="text-body text-gray-600 dark:text-gray-400">
              AI art evaluation platform with multi-dimensional creativity assessment and intelligent analysis.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-h3 mb-3">Links</h3>
            <div className="space-y-1">
              <a href="#/models" className="block">
                <IOSButton variant="text" size="sm" className="w-full justify-start gap-2">
                  <Trophy className="w-4 h-4" />
                  Models
                </IOSButton>
              </a>
              <a href="#/exhibitions" className="block">
                <IOSButton variant="text" size="sm" className="w-full justify-start gap-2">
                  <Image className="w-4 h-4" />
                  Exhibitions
                </IOSButton>
              </a>
              <a href="#/vulca" className="block">
                <IOSButton variant="text" size="sm" className="w-full justify-start gap-2">
                  <FlaskConical className="w-4 h-4" />
                  VULCA
                </IOSButton>
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-h3 mb-3">Connect</h3>
            <div className="flex space-x-2 mb-3">
              <IOSButton variant="glass" size="sm" className="p-2.5" aria-label="GitHub">
                <Github className="w-4 h-4" />
              </IOSButton>
              <IOSButton variant="glass" size="sm" className="p-2.5" aria-label="Twitter">
                <Twitter className="w-4 h-4" />
              </IOSButton>
              <IOSButton variant="glass" size="sm" className="p-2.5" aria-label="Email">
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