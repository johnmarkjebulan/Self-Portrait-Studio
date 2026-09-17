import { Link } from "react-router-dom";
import { packagesApi, settingsApi } from "../../services/api";
import { useEffect, useState } from "react";

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1600&h=900&fit=crop&auto=format"
          alt="Photography studio"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.7) 100%)" }} />
      </div>

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <p className="text-white/70 text-xs uppercase tracking-[0.25em] font-semibold mb-6">Premium Portrait Studio · Baclaran, Balayan, Batangas</p>
        <h1 className="font-display text-5xl md:text-7xl font-light leading-none mb-8 text-white">
          Your Moment.<br />
          <em className="not-italic text-white/90">Your Style.</em><br />
          Your Portrait.
        </h1>
        <p className="text-white/60 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          A curated photography experience where every frame tells your unique story. Book your session online in minutes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register" className="bg-white hover:bg-gray-100 text-gray-900 font-semibold px-8 py-4 rounded-xl text-base transition-all">
            Book an Appointment
          </Link>
          <a href="#packages" className="border border-white/30 hover:border-white/60 text-white/80 hover:text-white font-medium px-8 py-4 rounded-xl text-base transition-all">
            View Packages
          </a>
        </div>

        <div className="mt-12 sm:mt-16 grid grid-cols-3 gap-3 sm:gap-8 max-w-sm mx-auto">
          {[["500+", "Sessions Done"], ["4.9★", "Avg Rating"], ["3", "Studio Setups"]].map(([val, label]) => (
            <div key={label} className="text-center">
              <p className="font-display text-2xl font-semibold text-white">{val}</p>
              <p className="text-white/50 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center pt-2">
          <div className="w-1 h-3 bg-white/40 rounded-full"></div>
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id="about" className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=700&h=800&fit=crop&auto=format"
            alt="Studio interior"
            className="w-full rounded-2xl object-cover h-[500px]"
          />
          <div className="absolute -bottom-6 -right-6 bg-gray-900 rounded-2xl p-6 shadow-2xl">
            <p className="font-display text-3xl font-bold text-white">7+</p>
            <p className="text-gray-400 text-sm font-medium">Years of Experience</p>
          </div>
        </div>

        <div>
          <p className="text-gray-400 text-xs uppercase tracking-[0.2em] font-semibold mb-4">About the Studio</p>
          <h2 className="font-display text-4xl md:text-5xl font-light text-gray-900 mb-6 leading-tight">
            The art of capturing <em className="not-italic text-gray-600">you</em>
          </h2>
          <p className="text-gray-500 text-base leading-relaxed mb-6">
            Self-Portrait Studio is a premium photography experience designed around you.
            We believe every person deserves beautiful, professionally crafted portraits that
            celebrate who they are — whether it's a solo session, couple shoot, or family portrait.
          </p>
          <p className="text-gray-500 text-base leading-relaxed mb-8">
            Our online booking system makes scheduling effortless. Choose your package,
            pick a time slot, and pay securely via QR Ph. We handle everything else.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: "Choose a Package", desc: "Select from our curated packages" },
              { title: "Book Online", desc: "Pick your date and time instantly" },
              { title: "Pay via QR Ph", desc: "Secure, hassle-free payment" },
              { title: "Arrive & Shine", desc: "We handle the rest" },
            ].map(item => (
              <div key={item.title} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-gray-800 font-semibold text-sm mb-1">{item.title}</p>
                <p className="text-gray-500 text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PackagesSection({ packages }) {
  return (
    <section id="packages" className="py-16 sm:py-24 px-4 sm:px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-gray-400 text-xs uppercase tracking-[0.2em] font-semibold mb-4">Our Offerings</p>
          <h2 className="font-display text-4xl md:text-5xl font-light text-gray-900">Studio Packages</h2>
          <p className="text-gray-500 mt-4 max-w-xl mx-auto text-sm">Every package includes professional lighting, multiple backdrops, and our signature editing treatment.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {packages.map((pkg, i) => (
            <div key={pkg.id} className={`relative rounded-2xl border p-8 flex flex-col bg-white transition-all hover:shadow-lg ${i === 1 ? "border-gray-900 shadow-md ring-1 ring-gray-900/5" : "border-gray-200"}`}>
              {i === 1 && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-bold px-4 py-1 rounded-full">Most Popular</div>}
              <div className="mb-6">
                <h3 className="font-display text-2xl font-medium text-gray-900 mb-2">{pkg.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{pkg.description}</p>
              </div>

              <div className="mb-6">
                <span className="font-display text-4xl font-light text-gray-900">₱{pkg.price.toLocaleString()}</span>
              </div>

              <ul className="flex flex-col gap-3 mb-8 flex-1">
                <li className="flex items-center gap-2.5 text-gray-600 text-sm">
                  <span className="text-gray-900 text-xs font-bold">✓</span> Up to {pkg.max_people} {pkg.max_people === 1 ? "person" : "people"}
                </li>
                <li className="flex items-center gap-2.5 text-gray-600 text-sm">
                  <span className="text-gray-900 text-xs font-bold">✓</span> {pkg.duration}-minute session
                </li>
                <li className="flex items-center gap-2.5 text-gray-600 text-sm">
                  <span className="text-gray-900 text-xs font-bold">✓</span> {pkg.edited_photos} edited photos
                </li>
                {pkg.printed_photos > 0 && (
                  <li className="flex items-center gap-2.5 text-gray-600 text-sm">
                    <span className="text-gray-900 text-xs font-bold">✓</span> {pkg.printed_photos} printed photos
                  </li>
                )}
                {pkg.services.map(s => (
                  <li key={s} className="flex items-center gap-2.5 text-gray-600 text-sm">
                    <span className="text-gray-900 text-xs font-bold">✓</span> {s}
                  </li>
                ))}
              </ul>

              <Link to="/register" className={`text-center py-3 rounded-xl font-semibold text-sm transition-all ${i === 1 ? "bg-gray-900 hover:bg-gray-800 text-white" : "border border-gray-200 hover:border-gray-400 text-gray-700 hover:bg-gray-50"}`}>
                Book Now
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { n: "01", title: "Choose a Package", desc: "Browse our curated packages and select the one that fits your vision and group size." },
    { n: "02", title: "Select Your Schedule", desc: "Pick an available date and time slot from our real-time booking calendar." },
    { n: "03", title: "Submit Your Booking", desc: "Fill in your details, select add-ons, and review your booking summary." },
    { n: "04", title: "Pay Through QR Ph", desc: "Scan our studio QR code using any supported banking app or e-wallet." },
    { n: "05", title: "Receive Tracking Number", desc: "Get your unique SP-YYYY-XXXX tracking number to monitor your appointment." },
    { n: "06", title: "Visit the Studio", desc: "Arrive at your scheduled time — we'll take care of everything else." },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-gray-400 text-xs uppercase tracking-[0.2em] font-semibold mb-4">Simple Process</p>
          <h2 className="font-display text-4xl md:text-5xl font-light text-gray-900">How It Works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {steps.map(step => (
            <div key={step.n} className="group flex gap-5">
              <div className="shrink-0">
                <span className="font-mono text-gray-200 text-3xl font-semibold group-hover:text-gray-300 transition-colors">{step.n}</span>
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function formatBusinessHours(hours = {}) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const open = days.filter((day) => !hours?.[day]?.closed);
  if (!open.length) return "By appointment only";
  const first = hours[open[0]] || {};
  const same = open.every((day) => hours[day]?.open === first.open && hours[day]?.close === first.close);
  if (same) return `${open.join(", ")} · ${first.open || "09:00"}–${first.close || "17:00"}`;
  return open.map((day) => `${day} ${hours[day]?.open || "09:00"}–${hours[day]?.close || "17:00"}`).join(" · ");
}

function ContactSection({ settings }) {
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${settings.studio_lng - 0.015}%2C${settings.studio_lat - 0.010}%2C${settings.studio_lng + 0.015}%2C${settings.studio_lat + 0.010}&layer=mapnik&marker=${settings.studio_lat}%2C${settings.studio_lng}`;

  return (
    <section id="contact" className="py-16 sm:py-24 px-4 sm:px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-gray-400 text-xs uppercase tracking-[0.2em] font-semibold mb-4">Find Us</p>
          <h2 className="font-display text-4xl font-light text-gray-900">Visit the Studio</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Map */}
          <div className="lg:col-span-3 rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white" style={{ height: 380 }}>
            <iframe
              src={mapSrc}
              title="Studio Location"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
            />
          </div>

          {/* Info + CTA */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-5">{settings.studio_name}</h3>
              <div className="flex flex-col gap-4">
                {[
                  { label: "Address", value: settings.studio_address },
                  { label: "Phone", value: settings.studio_phone },
                  { label: "Email", value: settings.studio_email },
                  { label: "Hours", value: formatBusinessHours(settings.business_hours) },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">{item.label}</p>
                    <p className="text-gray-700 text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-display text-xl font-medium text-gray-900 mb-2">Ready to book?</h3>
              <p className="text-gray-500 text-sm mb-5">Create your account and book your session in under 2 minutes.</p>
              <Link to="/register" className="block text-center bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
                Get Started
              </Link>
              <a href={`https://www.google.com/maps?q=${settings.studio_lat},${settings.studio_lng}`}
                target="_blank" rel="noopener noreferrer"
                className="block text-center mt-3 border border-gray-200 hover:border-gray-400 text-gray-600 hover:text-gray-900 font-medium py-3 rounded-xl transition-colors text-sm">
                Open in Google Maps →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  const [packages, setPackages] = useState([]);
  const [settings, setSettings] = useState({
    studio_name: "Self-Portrait Studio",
    studio_address: "Baclaran, Balayan, Batangas",
    studio_phone: "0917-123-4567",
    studio_email: "hello@selfportrait.studio",
    studio_lat: 13.9371,
    studio_lng: 120.7276,
  });

  useEffect(() => {
    async function load() {
      try {
        const [pkgs, studioSettings] = await Promise.all([
          packagesApi.getAll(),
          settingsApi.get(),
        ]);
        setPackages(pkgs);
        if (studioSettings) setSettings(studioSettings);
      } catch (err) {
        console.error("Failed to load studio data:", err);
      }
    }
    load();
  }, []);

  return (
    <div className="animate-fade-in">
      <HeroSection />
      <AboutSection />
      <PackagesSection packages={packages} />
      <HowItWorksSection />
      <ContactSection settings={settings} />
    </div>
  );
}
