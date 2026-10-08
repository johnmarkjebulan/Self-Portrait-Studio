import { Link } from "react-router-dom";
import { packagesApi, settingsApi, publicStatsApi } from "../../services/api";
import { useEffect, useState } from "react";

const STUDIO_MEDIA = [
  { src: "/studio-media/packages-group-hug-threshold.jpg", title: "Group Hug & Threshold Packages", type: "Packages" },
  { src: "/studio-media/packages-candid-smooch.jpg", title: "Candid & Smooch Packages", type: "Packages" },
  { src: "/studio-media/packages-bum-up-flex.jpg", title: "Bum Up & Flex Ur Tog Packages", type: "Packages" },
  { src: "/studio-media/packages-wish-maternity.jpg", title: "Birthday & Maternity Packages", type: "Packages" },
  { src: "/studio-media/packages-linked-tangled.jpg", title: "Linked In & Tangled Up Packages", type: "Packages" },
  { src: "/studio-media/toddler-backdrops.jpg", title: "Toddler Monthly Milestone Backdrops", type: "Backdrops" },
  { src: "/studio-media/available-backdrops.jpg", title: "Available Plain Backdrops", type: "Backdrops" },
  { src: "/studio-media/add-ons.jpg", title: "Studio Add-ons", type: "Add-ons" },
  { src: "/studio-media/toddler-sample-gallery.jpg", title: "Toddler Portrait Samples", type: "Gallery" },
  { src: "/studio-media/promo-anniversary.jpg", title: "Ikalong Taon Anniversary Promo", type: "Promos" },
  { src: "/studio-media/promo-candid.jpg", title: "Candid Special Promo", type: "Promos" },
  { src: "/studio-media/promo-smooch.jpg", title: "Smooch Special Promo", type: "Promos" },
  { src: "/studio-media/promo-tangled.jpg", title: "Tangled Up Special Promo", type: "Promos" },
  { src: "/studio-media/promo-linkedin.jpg", title: "LinkedIn Special Promo", type: "Promos" },
];

function HeroSection({ stats }) {
  return (
    <section className="cinematic-hero relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="/studio-media/hero-main.jpg"
          alt="Pose and Pics Photography Studio portrait"
          className="hero-kenburns w-full h-full object-cover"
        />
        <div className="hero-vignette absolute inset-0" /><div className="hero-light hero-light-a" /><div className="hero-light hero-light-b" /><div className="hero-grain" />
      </div>

      <div className="hero-content relative z-10 text-center px-6 max-w-4xl mx-auto">
        <p className="text-white/70 text-xs uppercase tracking-[0.25em] font-semibold mb-6">Premium Portrait Studio · San Agustin St, Poblacion 4, Calaca, Batangas</p>
        <h1 className="font-display text-5xl md:text-7xl font-light leading-none mb-8 text-white">
          Your Moment.<br />
          <em className="not-italic text-white/90">Your Style.</em><br />
          Your Portrait.
        </h1>
        <p className="text-white/60 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          A curated photography experience where every frame tells your unique story. Book your session online in minutes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register" className="studio-cta bg-white hover:bg-gray-100 text-gray-900 font-semibold px-8 py-4 rounded-xl text-base transition-all">
            Book an Appointment
          </Link>
          <a href="#packages" className="border border-white/30 hover:border-white/60 text-white/80 hover:text-white font-medium px-8 py-4 rounded-xl text-base transition-all">
            View Packages
          </a>
        </div>

        <div className="mt-12 sm:mt-16 grid grid-cols-3 gap-3 sm:gap-8 max-w-sm mx-auto">
          {[[String(stats.sessions_done), "Sessions Done"], [stats.average_rating == null ? "—" : `${stats.average_rating.toFixed(1)}★`, "Avg Rating"], [String(stats.available_packages), "Available Packages"]].map(([val, label]) => (
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
    <section id="about" className="studio-section py-16 sm:py-24 px-4 sm:px-6 bg-white">
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-gray-400 text-xs uppercase tracking-[0.2em] font-semibold mb-4">About the Studio</p>
        <h2 className="font-display text-4xl md:text-5xl font-light text-gray-900 mb-6 leading-tight">
          The art of capturing <em className="not-italic text-gray-600">you</em>
        </h2>
        <p className="text-gray-500 text-base leading-relaxed mb-6 max-w-3xl mx-auto">
          Pose and Pics Photography Studio is a photography experience designed to make every session comfortable, memorable, and uniquely yours.
          We believe every person deserves beautiful, professionally crafted portraits that
          celebrate who they are — whether it's a solo session, couple shoot, or family portrait.
        </p>
        <p className="text-gray-500 text-base leading-relaxed mb-10 max-w-3xl mx-auto">
          Our online booking system makes scheduling effortless. Choose your package,
          pick a time slot, and complete your booking online. We handle everything else.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          {[
            { title: "Choose a Package", desc: "Select from our curated packages" },
            { title: "Book Online", desc: "Pick your date and time instantly" },
            { title: "Review Your Booking", desc: "Confirm your selected package and add-ons" },
            { title: "Arrive & Shine", desc: "We handle the rest" },
          ].map(item => (
            <div key={item.title} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <p className="text-gray-800 font-semibold text-sm mb-1">{item.title}</p>
              <p className="text-gray-500 text-xs">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PackagesSection({ packages }) {
  return (
    <section id="packages" className="studio-section py-16 sm:py-24 px-4 sm:px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-gray-400 text-xs uppercase tracking-[0.2em] font-semibold mb-4">Our Offerings</p>
          <h2 className="font-display text-4xl md:text-5xl font-light text-gray-900">Studio Packages</h2>
          <p className="text-gray-500 mt-4 max-w-xl mx-auto text-sm">Every package includes professional lighting, multiple backdrops, and our signature editing treatment.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-7 items-stretch">
          {packages.map((pkg, i) => (
            <div key={pkg.id} className={`studio-card-motion relative rounded-2xl border overflow-hidden flex flex-col bg-white h-full ${i === 1 ? "border-gray-900 shadow-md ring-1 ring-gray-900/5" : "border-gray-200"}`}>
              {i === 1 && <div className="floating-badge absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-gray-900 text-white text-xs font-bold px-4 py-1 rounded-full">Most Popular</div>}
              {(pkg.image_data || pkg.image_url) && <button type="button" onClick={() => window.open(pkg.image_data || pkg.image_url, "_blank")} className="w-full bg-gray-100"><img src={pkg.image_data || pkg.image_url} alt={pkg.name} className="w-full aspect-[4/5] object-contain bg-white" /></button>}
              <div className="p-8 flex flex-col flex-1">
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


function StudioMediaSection() {
  const [active, setActive] = useState(null);
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Packages", "Promos", "Backdrops", "Add-ons", "Gallery"];
  const visible = filter === "All" ? STUDIO_MEDIA : STUDIO_MEDIA.filter((item) => item.type === filter);

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setActive(null);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [active]);

  return (
    <section id="gallery" className="studio-section py-16 sm:py-24 px-4 sm:px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-gray-400 text-xs uppercase tracking-[0.2em] font-semibold mb-4">Pose and Pics Studio</p>
          <h2 className="font-display text-4xl md:text-5xl font-light text-gray-900">Packages, Promos & Studio Gallery</h2>
          <p className="text-gray-500 mt-4 max-w-2xl mx-auto text-sm leading-relaxed">
            Browse the studio's package cards, current promotional materials, available backdrops, add-ons, sample portraits, and payment reference. Click any image to view it in full size.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${filter === item ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900"}`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((item) => (
            <button
              key={item.src}
              type="button"
              onClick={() => setActive(item)}
              className="group text-left bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className="bg-white aspect-[4/5] overflow-hidden">
                <img
                  src={item.src}
                  alt={item.title}
                  loading="lazy"
                  className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-300"
                />
              </div>
              <div className="p-4">
                <span className="inline-block text-[11px] uppercase tracking-wider font-semibold text-gray-400 mb-1">{item.type}</span>
                <p className="text-gray-900 font-semibold text-sm">{item.title}</p>
                <p className="text-gray-500 text-xs mt-1">Click to enlarge</p>
              </div>
            </button>
          ))}
        </div>

        {active && (
          <div
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm p-4 sm:p-8 flex items-center justify-center"
            onClick={() => setActive(null)}
            role="dialog"
            aria-modal="true"
            aria-label={active.title}
          >
            <div className="relative max-w-5xl w-full max-h-[92vh] flex flex-col items-center" onClick={(event) => event.stopPropagation()}>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="absolute -top-2 right-0 sm:-right-2 z-10 w-10 h-10 rounded-full bg-white text-gray-900 shadow-lg text-xl font-bold flex items-center justify-center"
                aria-label="Close image preview"
              >
                ×
              </button>
              <img src={active.src} alt={active.title} className="max-w-full max-h-[82vh] object-contain rounded-xl shadow-2xl bg-white" />
              <div className="mt-3 bg-black/40 text-white px-4 py-2 rounded-full text-sm">{active.title}</div>
            </div>
          </div>
        )}
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
    <section id="how-it-works" className="studio-section py-16 sm:py-24 px-4 sm:px-6 bg-white">
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
  const studioAddress = "San Agustin St, Poblacion 4, Calaca, 4212 Batangas";
  const mapsQuery = encodeURIComponent(studioAddress);
  const mapSrc = `https://www.google.com/maps?q=${mapsQuery}&output=embed`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  return (
    <section id="contact" className="studio-section py-16 sm:py-24 px-4 sm:px-6 bg-gray-50">
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
                  { label: "Address", value: studioAddress },
                  { label: "Phone", value: "0910 831 3847" },
                  { label: "Email", value: "poseandpics@gmail.com" },
                  ...(settings.business_hours && Object.keys(settings.business_hours).length
                    ? [{ label: "Hours", value: formatBusinessHours(settings.business_hours) }]
                    : []),
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
              <a href={googleMapsUrl}
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
  const [stats, setStats] = useState({ sessions_done: 0, average_rating: null, available_packages: 0 });
  const [settings, setSettings] = useState({
    studio_name: "Pose and Pics Photography Studio",
    studio_address: "San Agustin St, Poblacion 4, Calaca, 4212 Batangas",
    studio_phone: "0910 831 3847",
    studio_email: "poseandpics@gmail.com",
  });

  useEffect(() => {
    async function load() {
      try {
        const [pkgs, studioSettings, publicStats] = await Promise.all([
          packagesApi.getAll(),
          settingsApi.get(),
          publicStatsApi.get(),
        ]);
        setPackages(pkgs);
        if (publicStats) setStats(publicStats);
        if (studioSettings) {
          setSettings({
            ...studioSettings,
            studio_name: "Pose and Pics Photography Studio",
            studio_address: "San Agustin St, Poblacion 4, Calaca, 4212 Batangas",
            studio_phone: "0910 831 3847",
            studio_email: "poseandpics@gmail.com",
          });
        }
      } catch (err) {
        console.error("Failed to load studio data:", err);
      }
    }
    load();
  }, []);

  return (
    <div className="animate-fade-in">
      <HeroSection stats={stats} />
      <AboutSection />
      <PackagesSection packages={packages} />
      <StudioMediaSection />
      <HowItWorksSection />
      <ContactSection settings={settings} />
    </div>
  );
}
