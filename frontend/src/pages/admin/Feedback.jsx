import { useState, useEffect } from "react";
import { feedbackApi } from "../../services/api.js";
import { useToast } from "../../contexts/ToastContext";

function StarDisplay({ rating }) {
  return (
    <span className="text-amber-400 text-sm">
      {"★".repeat(rating)}
      {"☆".repeat(5 - rating)}
    </span>
  );
}

export default function Feedback() {
  const { showToast } = useToast();
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await feedbackApi.getAll();
        setFeedbackList(data);
      } catch (err) {
        showToast("Failed to load feedback", "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const total = feedbackList.length;
  const avgRating =
    total > 0
      ? feedbackList.reduce((sum, f) => sum + (f.rating || 0), 0) / total
      : 0;

  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: feedbackList.filter((f) => f.rating === star).length,
  }));

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-400">Loading feedback...</div>
    );
  }

  return (
    <div className="p-6 max-w-screen-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Feedback</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* Average Rating */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col items-center justify-center text-center">
          <div className="text-4xl font-bold text-amber-500 mb-1">
            {avgRating.toFixed(1)}
          </div>
          <StarDisplay rating={Math.round(avgRating)} />
          <div className="text-xs text-gray-400 mt-1">Average Rating</div>
        </div>

        {/* Rating Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="text-xs text-gray-500 font-semibold uppercase mb-3">
            Rating Breakdown
          </div>
          <div className="space-y-1.5">
            {ratingBreakdown.map(({ star, count }) => {
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="text-amber-400 w-4">{star}★</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-400 h-2 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-gray-500 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Total Count */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col items-center justify-center text-center">
          <div className="text-4xl font-bold text-blue-600 mb-1">{total}</div>
          <div className="text-xs text-gray-400">Total Reviews</div>
        </div>
      </div>

      {/* Feedback List */}
      {feedbackList.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No feedback yet</div>
      ) : (
        <div className="space-y-4">
          {feedbackList.map((f) => (
            <div
              key={f.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <div className="font-semibold text-gray-800">
                    {f.client?.name || "Unknown Client"}
                  </div>
                  <div className="text-xs text-gray-400">
                    Booking:{" "}
                    <span className="font-mono">
                      {f.appointment?.tracking_number || "—"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StarDisplay rating={f.rating || 0} />
                  <span className="text-xs text-gray-400">
                    {f.created_at
                      ? new Date(f.created_at).toLocaleDateString()
                      : ""}
                  </span>
                </div>
              </div>
              {f.comment && (
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                  {f.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
