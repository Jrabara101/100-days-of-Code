<?php

declare(strict_types=1);

namespace DailyQuote\Renderer;

use DailyQuote\Exception\StorageException;
use DailyQuote\Model\Quote;

/**
 * HtmlRenderer — generates a premium, responsive HTML quote card.
 */
final class HtmlRenderer
{
    private readonly string $htmlDir;

    public function __construct(private readonly string $rootDir)
    {
        $this->htmlDir = $rootDir . DIRECTORY_SEPARATOR .
            str_replace('/', DIRECTORY_SEPARATOR, $_ENV['HTML_OUTPUT_DIR'] ?? 'storage/html');
    }

    /**
     * Render the quote as an HTML page and write it to disk.
     *
     * @return string Absolute path of generated HTML file
     * @throws StorageException on write failure
     */
    public function render(Quote $quote): string
    {
        $filename = 'quote-' . $quote->fetchedAt->format('Y-m-d') . '.html';
        $path     = $this->htmlDir . DIRECTORY_SEPARATOR . $filename;

        $html    = $this->buildHtml($quote);
        $written = file_put_contents($path, $html, LOCK_EX);

        if ($written === false) {
            throw new StorageException("Failed to write HTML file: {$path}");
        }

        return $path;
    }

    // ── Private ────────────────────────────────────────────────────────────

    private function buildHtml(Quote $quote): string
    {
        $safeText   = htmlspecialchars($quote->text,   ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $safeAuthor = htmlspecialchars($quote->author, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $dateHuman  = $quote->fetchedAt->format('l, d F Y');
        $dateIso    = $quote->fetchedAt->format(\DateTimeInterface::ATOM);
        $timestamp  = $quote->fetchedAt->format('Y-m-d  H:i:s T');
        $wordCount  = str_word_count($quote->text);
        $charCount  = mb_strlen($quote->text);
        $year       = $quote->fetchedAt->format('Y');

        // Build initials avatar for the author
        $parts    = explode(' ', trim($quote->author));
        $initials = strtoupper(
            mb_substr($parts[0] ?? '?', 0, 1) .
            mb_substr($parts[count($parts) - 1] ?? '', 0, 1)
        );

        $phpVersion = PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION . '.' . PHP_RELEASE_VERSION;

        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Daily inspirational quote by {$safeAuthor} — {$dateHuman}">
  <meta name="generator" content="DailyQuoteFetcher/1.0">
  <meta property="og:title" content="Daily Quote — {$dateHuman}">
  <meta property="og:description" content="{$safeText}">
  <title>Daily Quote · {$dateHuman}</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

  <style>
    /* ── Reset & Base ──────────────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg-deep:     #09090f;
      --bg-card:     #111120;
      --bg-glass:    rgba(255,255,255,0.04);
      --bg-pill:     rgba(120,100,255,0.15);
      --border:      rgba(255,255,255,0.08);
      --border-glow: rgba(139,92,246,0.4);
      --accent-1:    #7c3aed;
      --accent-2:    #4f46e5;
      --accent-3:    #06b6d4;
      --gold:        #f59e0b;
      --text-hi:     #f8fafc;
      --text-mid:    #94a3b8;
      --text-lo:     #475569;
      --radius-lg:   24px;
      --radius-md:   14px;
      --radius-sm:   8px;
      --shadow-card: 0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px var(--border);
      --shadow-glow: 0 0 60px rgba(124,58,237,0.25);
      --transition:  all 0.35s cubic-bezier(0.4,0,0.2,1);
    }

    html { scroll-behavior: smooth; }

    body {
      font-family: 'Inter', system-ui, sans-serif;
      background-color: var(--bg-deep);
      color: var(--text-hi);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      position: relative;
      overflow-x: hidden;
    }

    /* ── Ambient Background ───────────────────────────────────────── */
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background:
        radial-gradient(ellipse 80% 60% at 20% 10%, rgba(124,58,237,0.12) 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 80% 80%, rgba(79,70,229,0.10) 0%, transparent 60%),
        radial-gradient(ellipse 40% 30% at 50% 50%, rgba(6,182,212,0.06) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }

    /* Floating orbs */
    body::after {
      content: '';
      position: fixed;
      width: 600px; height: 600px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%);
      top: -200px; right: -200px;
      pointer-events: none;
      animation: drift 20s ease-in-out infinite alternate;
      z-index: 0;
    }

    @keyframes drift {
      from { transform: translate(0,0) scale(1); }
      to   { transform: translate(-40px, 40px) scale(1.1); }
    }

    /* ── Layout Shell ─────────────────────────────────────────────── */
    .page-wrapper {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 780px;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* ── Header ───────────────────────────────────────────────────── */
    .site-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0;
    }

    .logo-mark {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      text-decoration: none;
    }

    .logo-icon {
      width: 36px; height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--accent-1), var(--accent-2));
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
      box-shadow: 0 4px 16px rgba(124,58,237,0.4);
    }

    .logo-text {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      letter-spacing: 0.08em;
      color: var(--text-mid);
      text-transform: uppercase;
    }

    .date-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--bg-glass);
      border: 1px solid var(--border);
      border-radius: 100px;
      padding: 0.35rem 0.85rem;
      font-size: 0.72rem;
      letter-spacing: 0.04em;
      color: var(--text-mid);
      font-family: 'JetBrains Mono', monospace;
    }

    .date-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: var(--accent-3);
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%,100% { opacity:1; transform:scale(1); }
      50%      { opacity:0.5; transform:scale(0.75); }
    }

    /* ── Main Card ────────────────────────────────────────────────── */
    .quote-card {
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-card), var(--shadow-glow);
      border: 1px solid var(--border);
      overflow: hidden;
      position: relative;
      transition: var(--transition);
    }

    .quote-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-card), 0 0 80px rgba(124,58,237,0.35);
      border-color: var(--border-glow);
    }

    /* Top gradient bar */
    .card-accent-bar {
      height: 3px;
      background: linear-gradient(90deg, var(--accent-1), var(--accent-2), var(--accent-3));
      background-size: 200% 100%;
      animation: shimmer 4s linear infinite;
    }

    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .card-body {
      padding: 3rem 3.5rem;
      position: relative;
    }

    /* Giant quotation mark watermark */
    .card-body::before {
      content: '\201C';
      position: absolute;
      top: 1rem; left: 2rem;
      font-family: 'Playfair Display', serif;
      font-size: 10rem;
      line-height: 1;
      color: rgba(124,58,237,0.08);
      pointer-events: none;
      user-select: none;
    }

    /* ── Quote Text ───────────────────────────────────────────────── */
    .quote-label {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: var(--bg-pill);
      border: 1px solid rgba(120,100,255,0.25);
      border-radius: 100px;
      padding: 0.3rem 0.85rem;
      font-size: 0.65rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(167,139,250,0.9);
      font-weight: 600;
      margin-bottom: 2rem;
    }

    .quote-text {
      font-family: 'Playfair Display', serif;
      font-size: clamp(1.25rem, 3.5vw, 1.75rem);
      font-style: italic;
      font-weight: 400;
      line-height: 1.7;
      color: var(--text-hi);
      position: relative;
      z-index: 1;
      margin-bottom: 2.5rem;
      letter-spacing: -0.01em;
    }

    /* ── Author ───────────────────────────────────────────────────── */
    .author-block {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .author-avatar {
      width: 48px; height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent-1), var(--accent-2));
      display: flex; align-items: center; justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
      letter-spacing: 0.05em;
      color: #fff;
      flex-shrink: 0;
      box-shadow: 0 4px 20px rgba(124,58,237,0.5);
      transition: var(--transition);
    }

    .quote-card:hover .author-avatar {
      transform: scale(1.08);
      box-shadow: 0 6px 28px rgba(124,58,237,0.7);
    }

    .author-details { display: flex; flex-direction: column; gap: 0.2rem; }

    .author-name {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-hi);
      letter-spacing: -0.01em;
    }

    .author-role {
      font-size: 0.72rem;
      color: var(--text-mid);
      font-family: 'JetBrains Mono', monospace;
    }

    /* ── Divider ──────────────────────────────────────────────────── */
    .card-divider {
      margin: 2rem 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--border) 20%, var(--border) 80%, transparent);
    }

    /* ── Meta Stats ───────────────────────────────────────────────── */
    .card-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .meta-stats {
      display: flex;
      gap: 1.5rem;
    }

    .stat {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .stat-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--accent-3);
    }

    .stat-label {
      font-size: 0.62rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-lo);
    }

    .meta-source {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.68rem;
      color: var(--text-lo);
      font-family: 'JetBrains Mono', monospace;
    }

    .source-dot {
      width: 5px; height: 5px;
      border-radius: 50%;
      background: var(--gold);
    }

    /* ── Timestamp Strip ──────────────────────────────────────────── */
    .timestamp-strip {
      background: rgba(0,0,0,0.3);
      border-top: 1px solid var(--border);
      padding: 0.9rem 3.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .ts-block {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .ts-icon {
      width: 20px; height: 20px;
      opacity: 0.5;
    }

    .ts-text {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.65rem;
      color: var(--text-lo);
      letter-spacing: 0.04em;
    }

    .ts-text strong {
      color: var(--text-mid);
      font-weight: 500;
    }

    /* ── Footer ───────────────────────────────────────────────────── */
    .site-footer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding-bottom: 1rem;
      font-size: 0.68rem;
      color: var(--text-lo);
      font-family: 'JetBrains Mono', monospace;
      letter-spacing: 0.04em;
    }

    .footer-sep { color: var(--border-glow); }

    a { color: var(--accent-3); text-decoration: none; }
    a:hover { text-decoration: underline; }

    /* ── Responsive ───────────────────────────────────────────────── */
    @media (max-width: 600px) {
      .card-body { padding: 2rem 1.5rem; }
      .timestamp-strip { padding: 0.9rem 1.5rem; }
      .meta-stats { gap: 1rem; }
      .site-header { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
    }

    /* ── Print ────────────────────────────────────────────────────── */
    @media print {
      body { background: #fff; }
      body::before, body::after { display: none; }
      .quote-card { box-shadow: none; border: 1px solid #ddd; }
      .card-accent-bar { animation: none; }
    }
  </style>
</head>
<body>

<div class="page-wrapper">

  <!-- Header -->
  <header class="site-header">
    <a class="logo-mark" href="#">
      <div class="logo-icon">✦</div>
      <span class="logo-text">Daily&nbsp;Quote&nbsp;Fetcher</span>
    </a>
    <div class="date-badge">
      <div class="date-dot"></div>
      <time datetime="{$dateIso}">{$dateHuman}</time>
    </div>
  </header>

  <!-- Card -->
  <main>
    <article class="quote-card" aria-label="Daily Quote">
      <div class="card-accent-bar" role="presentation"></div>

      <div class="card-body">
        <div class="quote-label">
          <span>✦</span>
          <span>Quote of the Day</span>
        </div>

        <blockquote>
          <p class="quote-text">&#8220;{$safeText}&#8221;</p>
        </blockquote>

        <div class="author-block">
          <div class="author-avatar" aria-label="Author initials">{$initials}</div>
          <div class="author-details">
            <span class="author-name">{$safeAuthor}</span>
            <span class="author-role">Author · Speaker</span>
          </div>
        </div>

        <div class="card-divider" role="separator"></div>

        <div class="card-meta">
          <div class="meta-stats">
            <div class="stat">
              <span class="stat-value">{$wordCount}</span>
              <span class="stat-label">Words</span>
            </div>
            <div class="stat">
              <span class="stat-value">{$charCount}</span>
              <span class="stat-label">Characters</span>
            </div>
          </div>
          <div class="meta-source">
            <div class="source-dot"></div>
            <span>ZenQuotes API</span>
          </div>
        </div>
      </div>

      <!-- Timestamp strip -->
      <div class="timestamp-strip">
        <div class="ts-block">
          <svg class="ts-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
          </svg>
          <span class="ts-text">Fetched: <strong>{$timestamp}</strong></span>
        </div>
        <div class="ts-block">
          <svg class="ts-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span class="ts-text">Status: <strong style="color:#34d399;">Verified</strong></span>
        </div>
      </div>
    </article>
  </main>

  <!-- Footer -->
  <footer class="site-footer">
    <span>Generated by <strong>DailyQuoteFetcher/1.0</strong></span>
    <span class="footer-sep">·</span>
    <span>&copy; {$year}</span>
    <span class="footer-sep">·</span>
    <span>PHP {$phpVersion}</span>
  </footer>

</div>

</body>
</html>
HTML;
    }
}
