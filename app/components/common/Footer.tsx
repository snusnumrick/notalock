import { Link } from '@remix-run/react';
import React, { useState, useEffect } from 'react';
import { EnvelopeIcon, PhoneIcon, MapPinIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [isMobile, setIsMobile] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    shop: false,
    company: false,
    contact: false,
  });

  // Check if the viewport is mobile sized
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px is md breakpoint in Tailwind
    };

    // Initial check
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);

    // Cleanup on unmount
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Toggle a section's expanded state
  const toggleSection = (section: string) => {
    if (isMobile) {
      setExpandedSections(prev => ({
        ...prev,
        [section]: !prev[section],
      }));
    }
  };

  return (
    <footer className="bg-footer-bg text-footer-text border-t border-border mt-auto shadow-inner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-8">
          {/* Company Information */}
          {/* Company information - always visible */}
          <div className="space-y-3 md:space-y-4">
            <Link
              to="/"
              className="flex items-center group transition-transform duration-300 hover:scale-105"
            >
              <svg className="h-6 w-auto" viewBox="0 0 200 50">
                <path
                  d="M40 25 A10 10 0 1 1 40 24.9L55 25"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="30" cy="25" r="5" fill="currentColor" />
                <text
                  x="65"
                  y="35"
                  fontFamily="Arial"
                  fontWeight="bold"
                  fontSize="24"
                  fill="currentColor"
                >
                  Notalock
                </text>
              </svg>
            </Link>
            <p className="text-footer-text/80 text-sm">
              Premium European door hardware solutions for homes and businesses. Quality
              craftsmanship with modern design and functionality.
            </p>
          </div>

          {/* Navigation Links */}
          {/* Shop links - collapsible on mobile */}
          <div>
            <div
              className="flex items-center justify-between border-b border-border pb-2 mb-3 md:mb-4 cursor-pointer md:cursor-default"
              onClick={() => toggleSection('shop')}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  toggleSection('shop');
                }
              }}
              role="button"
              tabIndex={0}
              aria-expanded={expandedSections.shop}
              aria-controls="shop-links"
            >
              <h3 className="text-sm font-bold text-footer-text tracking-wider uppercase">Shop</h3>
              {isMobile && (
                <ChevronDownIcon
                  className={`h-5 w-5 text-footer-text/70 transition-transform ${expandedSections.shop ? 'rotate-180' : ''}`}
                />
              )}
            </div>
            <ul
              className={`space-y-3 ${isMobile && !expandedSections.shop ? 'hidden' : 'block'}`}
              data-testid="shop-links"
            >
              <li>
                <Link
                  to="/products"
                  className="text-footer-text/80 hover:text-btn-primary transition-colors duration-200 text-sm flex items-center"
                >
                  <span className="mr-1">›</span>
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  to="/categories"
                  className="text-footer-text/80 hover:text-btn-primary transition-colors duration-200 text-sm flex items-center"
                >
                  <span className="mr-1">›</span>
                  Categories
                </Link>
              </li>
              <li>
                <Link
                  to="/new-arrivals"
                  className="text-footer-text/80 hover:text-btn-primary transition-colors duration-200 text-sm flex items-center"
                >
                  <span className="mr-1">›</span>
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link
                  to="/featured"
                  className="text-footer-text/80 hover:text-btn-primary transition-colors duration-200 text-sm flex items-center"
                >
                  <span className="mr-1">›</span>
                  Featured Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          {/* Company links - collapsible on mobile */}
          <div>
            <div
              className="flex items-center justify-between border-b border-border pb-2 mb-3 md:mb-4 cursor-pointer md:cursor-default"
              onClick={() => toggleSection('company')}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  toggleSection('company');
                }
              }}
              role="button"
              tabIndex={0}
              aria-expanded={expandedSections.company}
              aria-controls="company-links"
            >
              <h3 className="text-sm font-semibold text-footer-text tracking-wider uppercase">
                Company
              </h3>
              {isMobile && (
                <ChevronDownIcon
                  className={`h-5 w-5 text-footer-text/70 transition-transform ${expandedSections.company ? 'rotate-180' : ''}`}
                />
              )}
            </div>
            <ul
              className={`space-y-3 ${isMobile && !expandedSections.company ? 'hidden' : 'block'}`}
              data-testid="company-links"
            >
              <li>
                <Link
                  to="/about"
                  className="text-footer-text/80 hover:text-btn-primary transition-colors duration-200 text-sm flex items-center"
                >
                  <span className="mr-1">›</span>
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-footer-text/80 hover:text-btn-primary transition-colors duration-200 text-sm flex items-center"
                >
                  <span className="mr-1">›</span>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-footer-text/80 hover:text-btn-primary transition-colors duration-200 text-sm flex items-center"
                >
                  <span className="mr-1">›</span>
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link
                  to="/shipping"
                  className="text-footer-text/80 hover:text-btn-primary transition-colors duration-200 text-sm flex items-center"
                >
                  <span className="mr-1">›</span>
                  Shipping Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          {/* Contact information - collapsible on mobile */}
          <div>
            <div
              className="flex items-center justify-between border-b border-border pb-2 mb-3 md:mb-4 cursor-pointer md:cursor-default"
              onClick={() => toggleSection('contact')}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  toggleSection('contact');
                }
              }}
              role="button"
              tabIndex={0}
              aria-expanded={expandedSections.contact}
              aria-controls="contact-links"
            >
              <h3 className="text-sm font-semibold text-footer-text tracking-wider uppercase">
                Contact
              </h3>
              {isMobile && (
                <ChevronDownIcon
                  className={`h-5 w-5 text-footer-text/70 transition-transform ${expandedSections.contact ? 'rotate-180' : ''}`}
                />
              )}
            </div>
            <ul
              className={`space-y-3 ${isMobile && !expandedSections.contact ? 'hidden' : 'block'}`}
              data-testid="contact-links"
            >
              <li className="text-footer-text/80 text-sm flex items-center space-x-2">
                <EnvelopeIcon className="h-4 w-4 text-btn-primary" />
                <a
                  href="mailto:support@notalock.com"
                  className="hover:text-btn-primary transition-colors duration-200"
                >
                  support@notalock.com
                </a>
              </li>
              <li className="text-footer-text/80 text-sm flex items-center space-x-2">
                <PhoneIcon className="h-4 w-4 text-btn-primary" />
                <a
                  href="tel:+1-555-123-4567"
                  className="hover:text-btn-primary transition-colors duration-200"
                >
                  (555) 123-4567
                </a>
              </li>
              <li className="text-footer-text/80 text-sm flex items-start space-x-2">
                <MapPinIcon className="h-4 w-4 text-btn-primary mt-0.5 flex-shrink-0" />
                <span>123 Commerce St, Suite 100, Business City, BC 12345</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="flex items-center justify-center space-x-6 mt-6 md:mt-8">
          <a
            href="https://twitter.com/notalock"
            className="text-footer-text/70 hover:text-btn-primary transition-colors duration-200 transform hover:scale-110"
          >
            <span className="sr-only">Twitter</span>
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
            </svg>
          </a>
          <a
            href="https://facebook.com/notalock"
            className="text-footer-text/70 hover:text-btn-primary transition-colors duration-200 transform hover:scale-110"
          >
            <span className="sr-only">Facebook</span>
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                clipRule="evenodd"
              />
            </svg>
          </a>
          <a
            href="https://instagram.com/notalock"
            className="text-footer-text/70 hover:text-btn-primary transition-colors duration-200 transform hover:scale-110"
          >
            <span className="sr-only">Instagram</span>
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                clipRule="evenodd"
              />
            </svg>
          </a>
          <a
            href="https://github.com/notalock"
            className="text-footer-text/70 hover:text-btn-primary transition-colors duration-200 transform hover:scale-110"
          >
            <span className="sr-only">GitHub</span>
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        </div>

        {/* Copyright */}
        <div className="mt-6 md:mt-8 border-t border-border pt-4 md:pt-6 text-center">
          <p className="text-footer-text/80 text-sm font-medium">
            &copy; {currentYear} Notalock. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
