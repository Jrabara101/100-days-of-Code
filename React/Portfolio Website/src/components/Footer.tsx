import React from 'react';
import { ArrowUpRight, Github, Twitter, Linkedin, Rss, Lock, Sparkles } from 'lucide-react';

interface FooterProps {
  onOpenAdmin: () => void;
  onOpenRSS: () => void;
  onOpenNowModal: () => void;
  onNavigate: (section: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenAdmin,
  onOpenRSS,
  onOpenNowModal,
  onNavigate,
}) => {
  return (
    <footer className="border-t border-border-subtle-light dark:border-border-subtle-dark bg-surface-secondary-light/40 dark:bg-surface-secondary-dark/40 py-16 text-xs font-mono">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Monogram & Bio */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-serif">✦</span>
              <span className="font-semibold text-primary-light dark:text-primary-dark tracking-wider uppercase">
                Julian Vance
              </span>
            </div>
            <p className="text-muted-light dark:text-muted-dark font-sans leading-relaxed text-sm max-w-sm">
              Staff Design Technologist & Systems Architect. Designing high-polish digital tools, local-first state engines, and typographic ergonomics.
            </p>
            <div className="flex items-center space-x-3 pt-2 text-muted-light dark:text-muted-dark">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary-light dark:hover:text-primary-dark transition-colors"
                title="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary-light dark:hover:text-primary-dark transition-colors"
                title="Twitter / X"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary-light dark:hover:text-primary-dark transition-colors"
                title="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <button
                onClick={onOpenRSS}
                className="hover:text-amber-500 transition-colors"
                title="RSS Feed"
              >
                <Rss className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-2">
            <h4 className="text-[11px] uppercase tracking-wider text-primary-light dark:text-primary-dark font-semibold mb-3">
              Index
            </h4>
            <ul className="space-y-2 text-muted-light dark:text-muted-dark">
              <li>
                <button onClick={() => onNavigate('work')} className="hover:text-primary-light dark:hover:text-primary-dark">
                  Selected Work
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('essays')} className="hover:text-primary-light dark:hover:text-primary-dark">
                  Digital Garden Essays
                </button>
              </li>
              <li>
                <button onClick={onOpenNowModal} className="hover:text-primary-light dark:hover:text-primary-dark">
                  The "Now" Page
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-primary-light dark:hover:text-primary-dark">
                  Opportunity Gateway
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Colophon & Engineering */}
          <div className="space-y-2">
            <h4 className="text-[11px] uppercase tracking-wider text-primary-light dark:text-primary-dark font-semibold mb-3">
              Colophon
            </h4>
            <ul className="space-y-1.5 text-muted-light dark:text-muted-dark text-[11px]">
              <li>React 18 & Vite 6</li>
              <li>Tailwind CSS & Editorial Tokens</li>
              <li>Supabase / PostgreSQL Ready</li>
              <li>KaTeX Math & Marked MDX</li>
              <li>JetBrains Mono & Newsreader</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border-subtle-light/60 dark:border-border-subtle-dark/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-muted-light dark:text-muted-dark text-[11px]">
          <p>© {new Date().getFullYear()} Julian Vance. Crafted with Swiss editorial precision.</p>

          <div className="flex items-center space-x-4">
            <button
              onClick={onOpenRSS}
              className="hover:text-primary-light dark:hover:text-primary-dark flex items-center space-x-1"
            >
              <Rss className="w-3 h-3 text-amber-500" />
              <span>/rss.xml</span>
            </button>

            <button
              onClick={onOpenAdmin}
              className="hover:text-accent-indigo flex items-center space-x-1"
            >
              <Lock className="w-3 h-3" />
              <span>Editorial Cockpit</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
