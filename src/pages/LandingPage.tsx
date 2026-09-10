import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Sparkles, Camera, MapPin, ArrowRight, Shield, Zap, Users,
  CheckCircle2, ChevronDown, Star, TrendingUp, Heart, Clock, Award,
} from 'lucide-react';

function useCountUp(target: number, duration = 1500) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { value, ref };
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left"
      >
        <span className="font-semibold text-slate-900">{question}</span>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <p className="px-6 pb-5 text-slate-600 leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const stats = [
    { value: 12000, suffix: '+', label: 'Items reunited' },
    { value: 98, suffix: '%', label: 'Match accuracy' },
    { value: 50, suffix: 'K+', label: 'Community members' },
    { value: 24, suffix: '/7', label: 'AI monitoring' },
  ];

  const heroStats = stats.map((s) => useCountUp(s.value));
  const ctaStats = stats.map((s) => useCountUp(s.value));

  const testimonials = [
    { name: 'Sarah K.', role: 'Student, MIT', text: 'I lost my laptop on campus and within 2 hours Reclaim matched it to someone who found it. Absolutely incredible!', rating: 5 },
    { name: 'James L.', role: 'Office Worker', text: 'The AI matching is scary good. It matched my lost wallet to a found report with a 94% score. Got it back the same day.', rating: 5 },
    { name: 'Maria G.', role: 'Frequent Traveler', text: 'I use Reclaim every time I travel. The photo matching and location features make it so easy to report and find items.', rating: 5 },
  ];

  const faqs = [
    { question: 'Is Reclaim really free?', answer: 'Yes! Reclaim is completely free to use. You can report unlimited lost and found items, get AI-powered match alerts, and connect with finders at no cost.' },
    { question: 'How does the AI matching work?', answer: 'Our algorithm compares six factors — category, color, brand, keywords, date, location, and photo similarity — to generate a match score for every pair of lost and found items. When a strong match is found, both parties get notified instantly.' },
    { question: 'Can I trust the claim verification?', answer: 'Yes. When someone claims your found item, they must answer verification questions and optionally upload proof of ownership. You review the claim and decide whether to approve it before any handover happens.' },
    { question: 'What if nobody has found my item yet?', answer: 'Keep your report active. Our system continuously monitors new found-item reports and will notify you the moment something matches yours. The more details and photos you add, the better the matches.' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-40 glass border-b border-gray-100/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Search className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">Reclaim</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
              Sign in
            </Link>
            <Link
              to="/signup"
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-brand-500/30 transition-all"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-100 rounded-full blur-3xl opacity-60 animate-pulse-slow" />
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-accent-100 rounded-full blur-3xl opacity-60 animate-pulse-slow" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-50 rounded-full blur-3xl opacity-40 animate-pulse-slow" style={{ animationDelay: '4s' }} />
        </div>
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-sm font-medium mb-6 animate-fade-in-up">
            <Sparkles className="w-4 h-4" />
            AI-powered matching engine
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight tracking-tight mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Lost something?<br />
            <span className="text-gradient-brand">Let's find it together.</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Report lost and found items in seconds. Our smart matching system compares category, color, brand, keywords, photos, date and location to connect you with the right match automatically.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Link
              to="/signup"
              className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold hover:shadow-xl hover:shadow-brand-500/30 transition-all flex items-center gap-2 group"
            >
              Start for free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="px-7 py-3.5 rounded-xl border border-gray-200 text-slate-700 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              Sign in
            </Link>
          </div>

          {/* Hero stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            {heroStats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold text-slate-900">
                  <span ref={s.ref}>{s.value.toLocaleString()}</span>{stats[i].suffix}
                </div>
                <div className="text-sm text-slate-500 mt-1">{stats[i].label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Match demo */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-sm font-medium text-slate-500 uppercase tracking-wider mb-6">
            How matching works
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { lost: 'Black HP Laptop', found: 'Black HP Laptop', score: 98, color: 'brand', barColor: 'from-brand-400 to-brand-500' },
              { lost: 'Blue Backpack', found: 'Navy Backpack', score: 90, color: 'green', barColor: 'from-green-400 to-green-500' },
              { lost: 'iPhone 13', found: 'Samsung Phone', score: 15, color: 'red', barColor: 'from-red-400 to-red-500' },
            ].map((m, idx) => (
              <div
                key={m.lost}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 mb-1">Lost</p>
                    <p className="font-semibold text-slate-900 text-sm">{m.lost}</p>
                  </div>
                  <div className="text-2xl font-bold text-slate-300">→</div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 mb-1">Found</p>
                    <p className="font-semibold text-slate-900 text-sm">{m.found}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Match score</span>
                  <span className={`text-2xl font-bold ${
                    m.color === 'brand' ? 'text-brand-600' :
                    m.color === 'green' ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {m.score}%
                  </span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${m.barColor} transition-all duration-1000`}
                    style={{ width: `${m.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-50 border border-accent-200 text-accent-700 text-sm font-medium mb-4">
              <Award className="w-4 h-4" />
              Powerful features
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything you need to reclaim what's lost</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              From reporting to matching, we've built the tools that bring lost items home.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Camera, title: 'Photo uploads', desc: 'Add multiple photos to your reports so others can visually confirm matches.', color: 'from-rose-500 to-pink-500', bg: 'bg-rose-50' },
              { icon: Sparkles, title: 'AI matching', desc: 'Our algorithm compares six factors and gives every pair a similarity score.', color: 'from-brand-500 to-brand-600', bg: 'bg-brand-50' },
              { icon: MapPin, title: 'Location tracking', desc: 'Pinpoint where items were lost or found to surface nearby matches first.', color: 'from-accent-500 to-accent-600', bg: 'bg-accent-50' },
              { icon: Zap, title: 'Instant alerts', desc: 'Get notified the moment a found item matches something you reported lost.', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50' },
              { icon: Shield, title: 'Secure accounts', desc: 'Your reports are tied to your account. Only you can edit or resolve them.', color: 'from-slate-600 to-slate-800', bg: 'bg-slate-50' },
              { icon: Users, title: 'Community driven', desc: 'Everyone contributes. The more reports, the better the matches.', color: 'from-teal-500 to-cyan-500', bg: 'bg-teal-50' },
            ].map((f, idx) => (
              <div
                key={f.title}
                className="rounded-2xl bg-white border border-gray-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium mb-4">
              <Heart className="w-4 h-4" />
              Loved by the community
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Stories of reconnection</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Real people, real reunions. Here's what our community has to say.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div
                key={t.name}
                className="rounded-2xl bg-gradient-to-br from-white to-gray-50 border border-gray-200 p-6 hover:shadow-lg transition-shadow animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 leading-relaxed mb-6 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-sm font-medium mb-4">
              <CheckCircle2 className="w-4 h-4" />
              FAQ
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((f) => (
              <FAQItem key={f.question} question={f.question} answer={f.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-72 h-72 bg-brand-500 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-accent-500 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to find what you lost?</h2>
            <p className="text-slate-300 text-lg mb-8 max-w-xl mx-auto">
              Join Reclaim today. It's free, fast, and your next match could be one report away.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold hover:shadow-xl hover:shadow-brand-500/40 transition-all group"
            >
              Create your account
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* CTA stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 max-w-2xl mx-auto">
              {ctaStats.map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-bold text-white">
                    <span ref={s.ref}>{s.value.toLocaleString()}</span>{stats[i].suffix}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{stats[i].label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 border-t border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
              <Search className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">Reclaim</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Active 24/7</span>
            <span className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Growing daily</span>
          </div>
          <p className="text-sm text-slate-500">Helping people reunite with what they've lost.</p>
        </div>
      </footer>
    </div>
  );
}
