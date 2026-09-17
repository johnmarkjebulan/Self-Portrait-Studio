import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";

export default function Register() {
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", mobile: "", password: "", confirmPassword: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required.";
    if (!form.email) e.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.mobile) e.mobile = "Mobile number is required.";
    else if (!/^09\d{9}$/.test(form.mobile.replace(/\s/g, ""))) e.mobile = "Enter a valid PH mobile (e.g. 09XXXXXXXXX).";
    if (!form.password) e.password = "Password is required.";
    else if (form.password.length < 8) e.password = "Password must be at least 8 characters.";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match.";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const result = await register({ name: form.name, email: form.email, mobile: form.mobile, password: form.password });
      if (result.success) {
        toast("Account created! Welcome to Self-Portrait Studio.", "success");
        navigate("/client/dashboard");
      } else {
        toast(result.message, "error");
        setErrors({ general: result.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left photo panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=900&h=1200&fit=crop&auto=format"
          alt="Portrait photography"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.65) 100%)" }} />
        <div className="absolute bottom-16 left-12 right-12">
          <h2 className="font-display text-3xl font-light text-white leading-snug mb-3">
            Begin your<br />portrait journey.
          </h2>
          <p className="text-white/50 text-sm">Join hundreds of clients who trust us with their most meaningful moments.</p>
        </div>
        <div className="absolute top-8 left-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <span className="text-white font-bold text-xs">SP</span>
            </div>
            <span className="text-white/80 font-semibold text-sm">Self-Portrait Studio</span>
          </Link>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 bg-white flex items-center justify-center px-4 sm:px-8 py-8 sm:py-12 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
                <span className="text-white font-bold text-xs">SP</span>
              </div>
              <span className="font-semibold text-gray-900 text-sm">Self-Portrait Studio</span>
            </Link>
          </div>

          <h1 className="font-display text-3xl font-light text-gray-900 mb-1">Create your account</h1>
          <p className="text-gray-500 text-sm mb-8">Start booking your portrait session today.</p>

          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-6">{errors.general}</div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="text-gray-500 text-xs uppercase tracking-wider block mb-2">Full Name</label>
              <input type="text" value={form.name} onChange={set("name")} placeholder="Maria Santos"
                className="w-full bg-gray-50 border border-gray-200 focus:border-gray-400 focus:bg-white text-gray-900 placeholder:text-gray-400 px-4 py-3 rounded-xl outline-none text-sm transition-colors" />
              {errors.name && <p className="text-red-500 text-xs mt-1.5">{errors.name}</p>}
            </div>

            <div>
              <label className="text-gray-500 text-xs uppercase tracking-wider block mb-2">Email Address</label>
              <input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com"
                className="w-full bg-gray-50 border border-gray-200 focus:border-gray-400 focus:bg-white text-gray-900 placeholder:text-gray-400 px-4 py-3 rounded-xl outline-none text-sm transition-colors" />
              {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email}</p>}
            </div>

            <div>
              <label className="text-gray-500 text-xs uppercase tracking-wider block mb-2">Mobile Number</label>
              <input type="tel" value={form.mobile} onChange={set("mobile")} placeholder="09XXXXXXXXX"
                className="w-full bg-gray-50 border border-gray-200 focus:border-gray-400 focus:bg-white text-gray-900 placeholder:text-gray-400 px-4 py-3 rounded-xl outline-none text-sm transition-colors" />
              {errors.mobile && <p className="text-red-500 text-xs mt-1.5">{errors.mobile}</p>}
            </div>

            <div>
              <label className="text-gray-500 text-xs uppercase tracking-wider block mb-2">Password</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} value={form.password} onChange={set("password")} placeholder="Minimum 8 characters"
                  className="w-full bg-gray-50 border border-gray-200 focus:border-gray-400 focus:bg-white text-gray-900 placeholder:text-gray-400 px-4 py-3 pr-12 rounded-xl outline-none text-sm transition-colors" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium">
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password}</p>}
            </div>

            <div>
              <label className="text-gray-500 text-xs uppercase tracking-wider block mb-2">Confirm Password</label>
              <input type={showPass ? "text" : "password"} value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="Re-enter password"
                className="w-full bg-gray-50 border border-gray-200 focus:border-gray-400 focus:bg-white text-gray-900 placeholder:text-gray-400 px-4 py-3 rounded-xl outline-none text-sm transition-colors" />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1.5">{errors.confirmPassword}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm mt-1">
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="text-gray-500 text-sm text-center mt-8">
            Already have an account?{" "}
            <Link to="/login" className="text-gray-900 hover:text-gray-700 font-semibold transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
