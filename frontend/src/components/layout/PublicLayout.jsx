import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useState, useEffect } from "react";

export default function PublicLayout() {
  const { user, logout, dashboardPath } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!location.hash) return;
    const sectionId = location.hash.slice(1);
    const timer = window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [location.pathname, location.hash]);

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white shadow-sm border-b border-gray-100" : "bg-white/95 backdrop-blur-sm"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
              <span className="text-white font-bold text-xs">SP</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm tracking-tight">Self-Portrait Studio</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">Home</Link>
            <Link to="/#packages" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">Packages</Link>
            <Link to="/#how-it-works" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">How It Works</Link>
            <Link to="/#about" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">About</Link>
            <Link to="/#contact" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">Contact</Link>
            {user ? (
              <div className="flex items-center gap-4">
                <Link to={dashboardPath} className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">Dashboard</Link>
                <button onClick={handleLogout} className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">Logout</button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">Login</Link>
                <Link to="/register" className="bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors">Book Now</Link>
              </div>
            )}
          </div>

          <button className="md:hidden text-gray-600 hover:text-gray-900 p-1" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 sm:px-6 py-4 flex flex-col gap-4 shadow-lg">
            <Link to="/" className="text-gray-700 text-sm font-medium" onClick={() => setMenuOpen(false)}>Home</Link>
            <Link to="/#packages" className="text-gray-700 text-sm font-medium" onClick={() => setMenuOpen(false)}>Packages</Link>
            <Link to="/#how-it-works" className="text-gray-700 text-sm font-medium" onClick={() => setMenuOpen(false)}>How It Works</Link>
            <Link to="/#about" className="text-gray-700 text-sm font-medium" onClick={() => setMenuOpen(false)}>About</Link>
            <Link to="/#contact" className="text-gray-700 text-sm font-medium" onClick={() => setMenuOpen(false)}>Contact</Link>
            {user ? (
              <>
                <Link to={dashboardPath} className="text-gray-700 text-sm font-medium" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="text-left text-gray-700 text-sm font-medium">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 text-sm font-medium" onClick={() => setMenuOpen(false)}>Login</Link>
                <Link to="/register" className="bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl text-center" onClick={() => setMenuOpen(false)}>Book Now</Link>
              </>
            )}
          </div>
        )}
      </nav>

      <div className="pt-16">
        <Outlet />
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-white font-bold text-xs">SP</span>
              </div>
              <span className="font-semibold text-white text-sm">Self-Portrait Studio</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Professional self-portrait studio for everyone. Book your session online and create memories that last a lifetime.
            </p>
            <div className="flex gap-4 mt-5">
              {["f", "ig", "tt", "yt"].map(s => (
                <button key={s} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg text-gray-400 hover:text-white text-xs font-semibold transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Quick Links</h4>
            <div className="flex flex-col gap-2.5">
              <Link to="/#packages" className="text-gray-400 hover:text-white text-sm transition-colors">Packages</Link>
              <Link to="/register" className="text-gray-400 hover:text-white text-sm transition-colors">Book Appointment</Link>
              <Link to="/login" className="text-gray-400 hover:text-white text-sm transition-colors">Client Login</Link>
              <Link to="/#how-it-works" className="text-gray-400 hover:text-white text-sm transition-colors">How It Works</Link>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">Contact Us</h4>
            <div className="flex flex-col gap-2.5 text-gray-400 text-sm">
              <p>📍 123 Photography St, Makati City</p>
              <p>📞 +63 912 345 6789</p>
              <p>✉️ hello@selfportrait.studio</p>
              <p>🕐 Mon–Sat  9:00 AM – 9:00 PM</p>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 py-5 px-4 sm:px-6">
          <p className="text-center text-gray-600 text-xs">© 2026 Self-Portrait Studio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
