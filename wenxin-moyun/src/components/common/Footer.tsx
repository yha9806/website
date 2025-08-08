import { Github, Twitter, Mail, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">关于文心墨韵</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              专注于评测 AI 模型在诗歌、绘画、叙事等艺术领域的创造力、美学价值和文化契合度。
              用量化数据赋能感性创作，连接技术开发者与艺术创作者。
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">快速链接</h3>
            <ul className="space-y-2">
              <li>
                <a href="/leaderboard" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                  模型排行榜
                </a>
              </li>
              <li>
                <a href="/battle" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                  实时对决
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                  评测方法论
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                  API 文档
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">联系我们</h3>
            <div className="flex space-x-4">
              <a
                href="https://github.com"
                className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="mailto:contact@wenxinmoyun.ai"
                className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
              contact@wenxinmoyun.ai
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center">
            Made with <Heart className="w-4 h-4 mx-1 text-red-500" /> by WenXin MoYun Team
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            © 2024 文心墨韵. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}