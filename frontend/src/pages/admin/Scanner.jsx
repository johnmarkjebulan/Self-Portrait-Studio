import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { appointmentsApi } from "../../services/api";
import { StatusBadge } from "../../components/common/StatusBadge";
import jsQR from "jsqr";
import { studioToday } from "../../utils/date";

export default function AdminScanner() {
  const { user } = useAuth();
  const { toast } = useToast();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const streamRef = useRef(null);

  // mode: 'camera' | 'manual'
  const [mode, setMode] = useState("camera");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null); // appointment with joined client/package
  const [error, setError] = useState("");
  const [trackingInput, setTrackingInput] = useState("");
  const [checkInDone, setCheckInDone] = useState(false);

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const lookupByTracking = async (tn) => {
    const clean = tn.trim().toUpperCase();
    if (!clean) return;
    setError("");
    try {
      const appt = await appointmentsApi.findByTracking(clean);
      setResult(appt);
      setCheckInDone(false);
      stopCamera();
    } catch (err) {
      setResult(null);
      setError("No appointment found for that tracking number.");
    }
  };

  const handleQRData = (data) => {
    const parts = data.split("|");
    if (parts[0] === "SP-STUDIO" && parts[1]) {
      const tracking = parts[1];
      setTrackingInput(tracking);
      lookupByTracking(tracking);
    }
  };

  const startCamera = async () => {
    setError("");
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      videoRef.current.play();

      const scan = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx || video.readyState < 2) {
          rafRef.current = requestAnimationFrame(scan);
          return;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });
        if (code && code.data) {
          handleQRData(code.data);
        } else {
          rafRef.current = requestAnimationFrame(scan);
        }
      };

      rafRef.current = requestAnimationFrame(scan);
    } catch (err) {
      const msg =
        err && err.name === "NotAllowedError"
          ? "Camera permission denied. Use manual input below."
          : "Camera not available on this device.";
      setError(msg);
      setScanning(false);
    }
  };

  useEffect(() => () => stopCamera(), []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!trackingInput.trim()) return;
    lookupByTracking(trackingInput);
  };

  const handleCheckIn = async () => {
    if (!result) return;
    const today = studioToday();

    if (result.date !== today) {
      toast(`This appointment is scheduled for ${result.date}, not today.`, "warning");
      return;
    }
    if (!["confirmed", "rescheduled"].includes(result.status)) {
      toast(`Cannot check in — appointment is already ${result.status.replace(/_/g, " ")}.`, "error");
      return;
    }

    try {
      const updated = await appointmentsApi.update(result.id, { status: "waiting" });
      setResult(updated);
      setCheckInDone(true);
      toast(`Checked in! Queue #${updated.queue_number} assigned.`, "success");
    } catch (err) {
      toast(err.message || "Check-in failed.", "error");
    }
  };

  const reset = () => {
    stopCamera();
    setResult(null);
    setError("");
    setTrackingInput("");
    setCheckInDone(false);
    setMode("camera");
  };

  const today = studioToday();
  const isToday = result && result.date === today;
  const canCheckIn = result && isToday && ["confirmed", "rescheduled"].includes(result.status);

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">QR Check-In Scanner</h1>
        <p className="text-gray-500 text-sm mt-1">
          Scan a client QR code or enter a tracking number to check them in.
        </p>
      </div>

      {/* Scanner area — hidden once result is found */}
      {!result && (
        <div className="flex flex-col gap-4 mb-6">
          {/* Camera panel */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden card-shadow">
            <div className="relative bg-gray-950 aspect-video flex items-center justify-center">
              {scanning ? (
                <>
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  {/* Scan overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-48 h-48">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white rounded-tl" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white rounded-tr" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white rounded-bl" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white rounded-br" />
                      <div
                        className="absolute inset-x-0 top-0 h-0.5 bg-amber-400/70"
                        style={{ animation: "scan 2s linear infinite" }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={stopCamera}
                    className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Stop Camera
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 py-12 px-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                    <svg
                      className="w-7 h-7 text-white/60"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-white/60 text-sm">Point camera at client QR code</p>
                  {error && mode === "camera" && (
                    <p className="text-red-400 text-xs">{error}</p>
                  )}
                  <button
                    onClick={startCamera}
                    className="mt-1 bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors"
                  >
                    Open Camera
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Manual input */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 card-shadow">
            <p className="text-gray-500 text-xs uppercase tracking-wider font-medium mb-3">
              Manual Entry
            </p>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={trackingInput}
                onChange={(e) => {
                  setTrackingInput(e.target.value.toUpperCase());
                  setError("");
                }}
                placeholder="SP-2026-0001"
                className="flex-1 bg-gray-50 border border-gray-200 focus:border-gray-400 text-gray-900 placeholder:text-gray-400 px-4 py-3 rounded-xl outline-none text-sm font-mono transition-colors"
              />
              <button
                type="submit"
                className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-5 py-3 rounded-xl text-sm transition-colors whitespace-nowrap"
              >
                Look Up
              </button>
            </form>
            {error && (
              <p className="text-red-500 text-xs mt-2">{error}</p>
            )}
          </div>
        </div>
      )}

      {/* Result panel */}
      {result && (
        <div className="flex flex-col gap-4">
          {/* Success banner */}
          {checkInDone && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
              <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-emerald-900 text-lg mb-1">
                Checked In Successfully!
              </h3>
              <p className="text-emerald-700 text-sm mb-1">
                {result.client ? result.client.name : result.client_name || "—"}
              </p>
              <div className="tracking-number text-2xl font-bold text-emerald-900 mb-2">
                {result.tracking_number}
              </div>
              <p className="text-emerald-700 text-sm">
                Queue #{result.queue_number} · Waiting
              </p>
            </div>
          )}

          {/* Wrong date warning */}
          {!checkInDone && !isToday && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
              <p className="text-orange-700 text-sm font-medium mb-1">
                Appointment is not for today
              </p>
              <p className="text-orange-600 text-xs">
                Scheduled for{" "}
                {new Date(result.date + "T12:00:00").toLocaleDateString("en-PH", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          )}

          {/* Appointment details card */}
          <div className="bg-white border border-gray-200 rounded-2xl card-shadow overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-5 py-4 flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                  Tracking Number
                </p>
                <p className="tracking-number text-xl font-bold text-gray-900">
                  {result.tracking_number}
                </p>
              </div>
              <div className="flex flex-col gap-1.5 items-end">
                <StatusBadge status={result.status} />
                <StatusBadge status={result.payment_status} />
              </div>
            </div>

            <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 text-sm">
              <div className="sm:col-span-2">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Client</p>
                <p className="font-semibold text-gray-900">
                  {result.client ? result.client.name : result.client_name || "—"}
                </p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {result.client ? `${result.client.email} · ${result.client.mobile}` : ""}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Package</p>
                <p className="text-gray-700 font-medium">
                  {result.package ? result.package.name : result.package_name || "—"}
                </p>
                <p className="text-gray-400 text-xs">
                  {result.package ? `${result.package.duration} min` : ""} · {result.num_people} people
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Schedule</p>
                <p className="text-gray-700 font-medium">
                  {new Date(result.date + "T12:00:00").toLocaleDateString("en-PH", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p className="text-gray-400 text-xs font-mono">{result.time}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total</p>
                <p className="text-gray-700 font-mono font-semibold">
                  ₱{Number(result.total_price).toLocaleString()}
                </p>
                <p className="text-gray-400 text-xs">
                  Balance: ₱{Number(result.remaining_balance).toLocaleString()}
                </p>
              </div>
              {result.queue_number && (
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Queue #</p>
                  <p className="text-purple-700 font-mono font-bold text-lg">
                    #{result.queue_number}
                  </p>
                </div>
              )}
              {result.special_requests && (
                <div className="sm:col-span-2">
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                    Special Requests
                  </p>
                  <p className="text-gray-500 italic text-xs">"{result.special_requests}"</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t border-gray-200 p-4 sm:p-5 flex flex-col sm:flex-row gap-3">
              {canCheckIn && !checkInDone && (
                <button
                  onClick={handleCheckIn}
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
                >
                  Check In & Assign Queue
                </button>
              )}
              {!canCheckIn && !checkInDone && (
                <div className="flex-1 text-center text-gray-400 text-sm py-3">
                  {!isToday
                    ? "Not scheduled for today"
                    : result.status === "waiting" || result.status === "now_serving"
                    ? `Already in queue (#${result.queue_number})`
                    : `Status: ${result.status.replace(/_/g, " ")}`}
                </div>
              )}
              <button
                onClick={reset}
                className="px-5 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-sm transition-colors"
              >
                Scan Another
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0%   { transform: translateY(0); }
          50%  { transform: translateY(192px); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
