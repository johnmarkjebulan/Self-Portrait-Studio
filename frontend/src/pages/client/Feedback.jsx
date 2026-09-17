import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { appointmentsApi, feedbackApi } from "../../services/api";

export default function ClientFeedback() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [completed, setCompleted] = useState([]);
  const [existingFeedback, setExistingFeedback] = useState({});
  const [selected, setSelected] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!user) return;
    try {
      const [appts, feedback] = await Promise.all([
        appointmentsApi.getAll(),
        feedbackApi.getAll(),
      ]);
      const completedAppts = appts.filter(a => a.status === "completed");
      setCompleted(completedAppts.sort((a, b) => b.created_at.localeCompare(a.created_at)));
      const fb = {};
      for (const f of feedback) fb[f.appointment_id] = f;
      setExistingFeedback(fb);
    } catch (err) {
      console.error("Failed to load feedback data:", err);
    }
  };

  useEffect(() => { load(); }, [user]);

  const reviewable = completed.filter(a => !existingFeedback[a.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected || !user) return;
    setSubmitting(true);
    try {
      await feedbackApi.create({ appointment_id: selected.id, client_id: user.id, rating, comment });
      toast("Thank you for your feedback!", "success");
      setSelected(null);
      setRating(5);
      setComment("");
      await load();
    } catch (err) {
      toast("Failed to submit feedback.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Feedback</h1>
        <p className="text-gray-500 text-sm mt-1">Share your experience for completed appointments.</p>
      </div>

      {reviewable.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 mb-8 card-shadow">
          <h2 className="font-semibold text-gray-900 mb-4">Leave a Review</h2>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-gray-500 text-xs uppercase tracking-wider block mb-2">Select Appointment</label>
              <select
                value={selected?.id || ""}
                onChange={e => setSelected(completed.find(a => a.id === e.target.value) || null)}
                className="w-full bg-gray-50 border border-gray-200 focus:border-gray-400 text-gray-900 px-4 py-3 rounded-xl outline-none text-sm"
              >
                <option value="">— Select appointment to review —</option>
                {reviewable.map(a => (
                  <option key={a.id} value={a.id}>{a.tracking_number} · {a.package?.name} · {a.date}</option>
                ))}
              </select>
            </div>

            {selected && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="text-gray-500 text-xs uppercase tracking-wider block mb-3">Rating</label>
                  <div className="flex gap-3">
                    {[1, 2, 3, 4, 5].map(r => (
                      <button key={r} type="button" onClick={() => setRating(r)}
                        className={`text-2xl transition-all ${r <= rating ? "text-yellow-400 scale-110" : "text-gray-200 hover:text-gray-300"}`}>
                        ★
                      </button>
                    ))}
                    <span className="text-gray-500 text-sm ml-1 self-center">{["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}</span>
                  </div>
                </div>

                <div>
                  <label className="text-gray-500 text-xs uppercase tracking-wider block mb-2">Comment</label>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    rows={4}
                    placeholder="Share your experience..."
                    className="w-full bg-gray-50 border border-gray-200 focus:border-gray-400 text-gray-900 placeholder:text-gray-400 px-4 py-3 rounded-xl outline-none text-sm resize-none transition-colors"
                  />
                </div>

                <button type="submit" disabled={submitting}
                  className="bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
                  {submitting ? "Submitting…" : "Submit Feedback"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <div>
        <h2 className="font-semibold text-gray-900 mb-4">My Reviews</h2>

        {Object.keys(existingFeedback).length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 text-center text-gray-500 text-sm card-shadow">
            {completed.length === 0 ? "Complete an appointment to leave feedback." : "You haven't submitted any reviews yet."}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {Object.entries(existingFeedback).map(([apptId, fb]) => {
              const appt = completed.find(a => a.id === apptId);
              return (
                <div key={fb.id} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 card-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="tracking-number text-sm font-semibold text-gray-900">{appt?.tracking_number}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{appt?.package?.name} · {appt?.date}</p>
                    </div>
                    <div className="text-yellow-400 text-lg">
                      {"★".repeat(fb.rating)}<span className="text-gray-200">{"★".repeat(5 - fb.rating)}</span>
                    </div>
                  </div>
                  {fb.comment && <p className="text-gray-500 text-sm italic">"{fb.comment}"</p>}
                  <p className="text-gray-400 text-xs mt-3">{new Date(fb.created_at).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
