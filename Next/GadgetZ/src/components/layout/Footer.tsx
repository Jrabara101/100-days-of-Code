import Link from "next/link";
import { X, Camera, Play, Globe, MapPin, Phone, Mail, ArrowRight } from "lucide-react";

const footerLinks = {
  Shop: [
    "Smartphones",
    "Laptops",
    "Audio",
    "Wearables",
    "Gaming",
    "Smart Home",
    "Cameras",
    "Accessories",
  ],
  Support: [
    "Help Center",
    "Track Order",
    "Returns & Refunds",
    "Warranty",
    "Contact Us",
    "Live Chat",
  ],
  Company: [
    "About GadgetZ",
    "Careers",
    "Press",
    "Blog",
    "Affiliate Program",
    "B2B / Business",
  ],
};

const socialLinks = [
  { icon: X, label: "X (Twitter)", href: "#" },
  { icon: Camera, label: "Instagram", href: "#" },
  { icon: Play, label: "YouTube", href: "#" },
  { icon: Globe, label: "Facebook", href: "#" },
];

export default function Footer() {
  return (
    <footer className="bg-gadget-surface border-t border-gadget-border">
      {/* Main footer */}
      <div className="max-w-screen-xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="font-montserrat font-900 text-2xl tracking-tight block mb-4"
            >
              GADGET<span className="text-gadget-cyan">Z</span>
            </Link>
            <p className="text-gadget-muted text-sm leading-relaxed max-w-xs mb-6">
              Your premium destination for the latest tech. From smartphones to smart homes — we curate the future of technology.
            </p>
            {/* Social */}
            <div className="flex items-center gap-3">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-lg bg-gadget-border/50 flex items-center justify-center text-gadget-muted hover:text-gadget-cyan hover:bg-gadget-cyan/10 transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </Link>
              ))}
            </div>

            {/* Contact info */}
            <div className="mt-6 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-gadget-muted text-xs">
                <MapPin className="w-3.5 h-3.5 text-gadget-cyan shrink-0" />
                <span>123 Tech Boulevard, San Francisco, CA 94105</span>
              </div>
              <div className="flex items-center gap-2 text-gadget-muted text-xs">
                <Phone className="w-3.5 h-3.5 text-gadget-cyan shrink-0" />
                <span>+1 (800) 428-3893</span>
              </div>
              <div className="flex items-center gap-2 text-gadget-muted text-xs">
                <Mail className="w-3.5 h-3.5 text-gadget-cyan shrink-0" />
                <span>support@gadgetz.store</span>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="font-montserrat font-700 text-gadget-text text-sm tracking-wide mb-4">
                {heading}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-gadget-muted hover:text-gadget-cyan text-sm transition-colors duration-200"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter mini */}
        <div className="mt-12 pt-8 border-t border-gadget-border">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <p className="font-montserrat font-700 text-gadget-text text-sm">
                Stay in the loop
              </p>
              <p className="text-gadget-muted text-xs mt-0.5">
                Get the latest deals and tech news directly in your inbox.
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 sm:w-56 bg-gadget-border/30 border border-gadget-border rounded-xl px-4 py-2.5 text-sm text-gadget-text placeholder:text-gadget-muted focus:outline-none focus:border-gadget-cyan/60 transition-colors duration-200"
              />
              <button className="shrink-0 flex items-center gap-1.5 bg-gadget-cyan text-gadget-dark font-montserrat font-700 text-sm px-4 py-2.5 rounded-xl hover:bg-gadget-cyan-dark transition-colors duration-200">
                Subscribe <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gadget-border bg-gadget-dark/50">
        <div className="max-w-screen-xl mx-auto px-4 h-12 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gadget-muted">
          <p>© 2025 GadgetZ. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
              <Link
                key={item}
                href="#"
                className="hover:text-gadget-cyan transition-colors duration-200"
              >
                {item}
              </Link>
            ))}
          </div>
          <p className="hidden sm:block">
            🔒 Secure payments · Visa · MC · PayPal · Amex
          </p>
        </div>
      </div>
    </footer>
  );
}
