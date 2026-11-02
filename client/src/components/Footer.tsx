import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Mail, Phone, MapPin, ShieldCheck, Award, Heart, Sparkles, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="liquid-glass bg-[#102a3a] text-slate-300 pt-16 pb-10 border-t border-white/10 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-emerald-500/10 blur-[140px] pointer-events-none rounded-full"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-5">
            <Link to="/" className="flex items-center space-x-3.5 group">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/15">
                <Compass className="w-5 h-5 text-[#d8c49b]" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-2xl font-semibold tracking-tight text-white">
                  Stay<span className="text-[#d8c49b] italic ml-0.5">Ease</span>
                </span>
                <span className="text-[8px] tracking-[0.22em] uppercase text-white/60 font-semibold -mt-0.5">
                  Stays made personal
                </span>
              </div>
            </Link>

            <p className="text-sm text-slate-300/80 max-w-sm leading-relaxed">
              Find a place that fits the way you want to travel, from a quiet weekend away to a memorable escape.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero Collision Hold</span>
              </span>
              <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Best Rate Guarantee</span>
              </span>
            </div>
          </div>

          {/* Curated Destinations */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-5 font-luxury">
              Destinations
            </h4>
            <ul className="space-y-3 text-xs text-slate-400">
              <li>
                <Link to="/hotels?destination=Miami" className="hover:text-amber-300 transition-colors">
                  Miami Beach, USA
                </Link>
              </li>
              <li>
                <Link to="/hotels?destination=Aspen" className="hover:text-amber-300 transition-colors">
                  Aspen Rockies, USA
                </Link>
              </li>
              <li>
                <Link to="/hotels?destination=Kyoto" className="hover:text-amber-300 transition-colors">
                  Kyoto Heritage, Japan
                </Link>
              </li>
              <li>
                <Link to="/hotels" className="hover:text-amber-300 transition-colors text-amber-400/90 font-bold">
                  Browse Entire Portfolio →
                </Link>
              </li>
            </ul>
          </div>

          {/* Guest Services */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-5 font-luxury">
              Guest Services
            </h4>
            <ul className="space-y-3 text-xs text-slate-400">
              <li>
                <Link to="/dashboard" className="hover:text-amber-300 transition-colors">
                  My Reservation Vouchers
                </Link>
              </li>
              <li>
                <Link to="/hotels" className="hover:text-amber-300 transition-colors">
                  15-Min Booking Hold
                </Link>
              </li>
              <li>
                <a href="#experience" className="hover:text-amber-300 transition-colors">
                  Bespoke Chauffeur & Jets
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-amber-300 transition-colors">
                  48-Hour Cancellation Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Management & Legal */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-5 font-luxury">
              Privilege
            </h4>
            <ul className="space-y-3 text-xs text-slate-400">
              <li>
                <Link to="/login" className="hover:text-amber-300 transition-colors">
                  Staff & Concierge Portal
                </Link>
              </li>
              <li>
                <span className="text-emerald-300 font-mono text-[11px] block">
                  WELCOME10 · 10% OFF
                </span>
              </li>
              <li>
                <span className="text-[#e2c99a] font-mono text-[11px] block">
                  LUXURY50 · $50 OFF
                </span>
              </li>
              <li className="pt-2 text-[10px] text-slate-500">
                256-Bit SSL Encrypted
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} StayEase Luxury Sanctuaries. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Charter</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Luxury Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Security Protocol</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
