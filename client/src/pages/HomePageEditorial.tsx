import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { HotelCard } from '../components/HotelCard';
import { SearchForm } from '../components/SearchForm';
import { hotelService } from '../services/hotelService';
import { Hotel } from '../types';

const DESTINATIONS = [
  {
    name: 'Miami Beach',
    country: 'Florida, United States',
    query: 'Miami',
    image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1000&q=85',
    note: 'Coastal calm',
  },
  {
    name: 'Aspen',
    country: 'Colorado, United States',
    query: 'Aspen',
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1000&q=85',
    note: 'Mountain air',
  },
  {
    name: 'Kyoto',
    country: 'Japan',
    query: 'Kyoto',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1000&q=85',
    note: 'A slower rhythm',
  },
];

export const HomePageEditorial: React.FC = () => {
  const [featuredHotels, setFeaturedHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    hotelService.getFeaturedHotels()
      .then((response) => {
        if (active) setFeaturedHotels(response.data?.hotels || []);
      })
      .catch((error) => {
        console.error('Failed to load featured hotels:', error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="royal-atmosphere text-brand-950">
      <section className="royal-hero relative isolate flex min-h-[680px] items-center overflow-hidden bg-brand-950 sm:min-h-[730px]">
        <img
          src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=2200&q=90"
          alt="A peaceful resort surrounded by tropical greenery"
          className="royal-hero-image absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#080a0d]/90 via-[#080a0d]/58 to-[#080a0d]/18" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#080a0d]/75 via-transparent to-[#080a0d]/25" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-14 pt-16 sm:px-6 lg:px-8 lg:pb-20">
          <div className="max-w-3xl">
            <span className="liquid-glass royal-outline inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90">
              <Sparkles className="h-3.5 w-3.5 text-[#e2c99a]" /> Thoughtful stays, beautifully simple
            </span>
            <h1 className="mt-6 max-w-2xl font-serif text-5xl font-medium leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Find a place to <span className="text-gold-leaf italic">feel away.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/80 sm:text-lg">
              From slow mornings by the sea to quiet nights in the mountains, discover a stay that feels like yours.
            </p>
          </div>

          <div className="mt-9 max-w-5xl">
            <SearchForm />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-3 text-xs font-medium text-white/80">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#d8c49b]" /> Secure reservations</span>
            <span className="inline-flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-[#d8c49b]" /> Flexible stay dates</span>
            <span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#d8c49b]" /> Handpicked properties</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="royal-kicker text-xs font-semibold uppercase tracking-[0.18em]">Start somewhere inspiring</p>
            <h2 className="mt-2 font-serif text-3xl font-medium tracking-tight text-brand-950 sm:text-4xl">A few places to begin</h2>
          </div>
          <Link to="/hotels" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950">
            Explore all destinations <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {DESTINATIONS.map((destination) => (
            <Link
              key={destination.name}
              to={`/hotels?destination=${encodeURIComponent(destination.query)}`}
              className="royal-card group relative isolate flex min-h-[310px] overflow-hidden rounded-[1.5rem] bg-brand-950 sm:min-h-[360px]"
            >
              <img src={destination.image} alt="" loading="lazy" className="absolute inset-0 -z-20 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#080a0d]/90 via-[#080a0d]/16 to-transparent" />
              <div className="liquid-glass mx-3 mb-3 mt-auto rounded-2xl p-5 text-white sm:mx-4 sm:mb-4 sm:p-6">
                <span className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-white/75">
                  <MapPin className="h-3.5 w-3.5" /> {destination.note}
                </span>
                <h3 className="font-serif text-2xl font-medium">{destination.name}</h3>
                <div className="mt-1 flex items-center justify-between gap-3 text-sm text-white/75">
                  <span>{destination.country}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="liquid-glass-section border-y border-[#e7e3da] bg-white/70">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[0.8fr_1.2fr] md:items-center lg:px-8 lg:py-20">
          <div>
            <p className="royal-kicker text-xs font-semibold uppercase tracking-[0.18em]">Made for good getaways</p>
            <h2 className="mt-3 font-serif text-3xl font-medium leading-tight text-brand-950 sm:text-4xl">The little details make a stay.</h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
              Browse clear room options, review your total before booking, and keep your reservation details together in one place.
            </p>
            <Link to="/hotels" className="royal-gold-button liquid-glass-button mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition">
              Find your stay <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <article className="royal-card rounded-2xl p-6">
              <div className="liquid-glass-control flex h-11 w-11 items-center justify-center rounded-xl text-[#e2c986]"><CalendarCheck className="h-5 w-5" /></div>
              <h3 className="mt-5 font-serif text-xl font-medium text-brand-950">Your plans, in one place</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Keep track of upcoming reservations, booking dates, and guest details from your account.</p>
            </article>
            <article className="royal-card rounded-2xl p-6">
              <div className="liquid-glass-control flex h-11 w-11 items-center justify-center rounded-xl text-[#e2c986]"><ShieldCheck className="h-5 w-5" /></div>
              <h3 className="mt-5 font-serif text-xl font-medium text-brand-950">A clear booking process</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">See pricing and payment details before confirming your reservation.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="royal-kicker text-xs font-semibold uppercase tracking-[0.18em]">Selected for you</p>
            <h2 className="mt-2 font-serif text-3xl font-medium tracking-tight text-brand-950 sm:text-4xl">Stays worth discovering</h2>
          </div>
          <Link to="/hotels" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950">
            View every stay <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => <div key={item} className="h-[420px] animate-pulse rounded-[1.4rem] border border-slate-200 bg-white" />)}
          </div>
        ) : featuredHotels.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredHotels.slice(0, 3).map((hotel) => <HotelCard key={hotel.id} hotel={hotel} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center">
            <p className="text-sm text-slate-600">No featured stays are available right now.</p>
            <Link to="/hotels" className="mt-3 inline-block text-sm font-semibold text-emerald-800 hover:underline">Browse all properties</Link>
          </div>
        )}
      </section>
    </div>
  );
};
