import { useEffect, useState } from "react";
import { postsApi } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";

function formatDate(value) {
  return new Date(value).toLocaleString("en-PH", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function ClientPosts() {
  const { toast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [liking, setLiking] = useState(null);

  useEffect(() => {
    postsApi.getAll().then(setPosts).catch((e)=>toast(e.message || "Could not load posts.", "error")).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!preview) return;
    const close = (e) => e.key === "Escape" && setPreview(null);
    document.addEventListener("keydown", close);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", close); document.body.style.overflow = ""; };
  }, [preview]);

  async function toggleLike(post) {
    try {
      setLiking(post.id);
      const result = await postsApi.toggleLike(post.id);
      setPosts((items) => items.map((item) => item.id === post.id ? { ...item, liked_by_me: result.liked, like_count: result.like_count } : item));
    } catch (e) { toast(e.message || "Could not update like.", "error"); }
    finally { setLiking(null); }
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-gray-900">Studio Posts</h1>
        <p className="text-sm text-gray-500 mt-1">Latest portraits, announcements, promos, and photo highlights posted by the studio owner.</p>
      </div>
      {loading ? <div className="text-sm text-gray-400 py-12 text-center">Loading posts…</div> : posts.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-500">No studio posts yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map(post => {
            const src = post.image_data || post.image_url;
            return (
              <article key={post.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden card-shadow">
                <button type="button" onClick={() => setPreview({ src, title: post.title || "Pose and Pics" })} className="block w-full bg-gray-100 cursor-zoom-in">
                  <img src={src} alt={post.title || "Studio post"} className="w-full aspect-square object-cover bg-gray-100" />
                </button>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="font-semibold text-gray-900">{post.title || "Pose and Pics"}</p>
                    <span className="text-[11px] text-gray-400 text-right">{formatDate(post.created_at)}</span>
                  </div>
                  {post.caption && <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{post.caption}</p>}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <button type="button" disabled={liking===post.id} onClick={() => toggleLike(post)} className={`inline-flex items-center gap-2 text-sm font-semibold ${post.liked_by_me ? "text-rose-600" : "text-gray-500 hover:text-rose-600"}`}>
                      <span className="text-xl">{post.liked_by_me ? "♥" : "♡"}</span> {post.like_count || 0} {Number(post.like_count)===1 ? "Like" : "Likes"}
                    </button>
                    <p className="text-xs text-gray-400">Posted by {post.author?.name || "Studio Owner"}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {preview && (
        <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-sm p-4 flex items-center justify-center" onClick={() => setPreview(null)}>
          <div className="relative max-w-6xl w-full max-h-[94vh] flex flex-col items-center" onClick={(e)=>e.stopPropagation()}>
            <button type="button" onClick={() => setPreview(null)} className="absolute right-2 top-2 z-10 w-10 h-10 rounded-full bg-white text-gray-900 text-2xl shadow-lg">×</button>
            <img src={preview.src} alt={preview.title} className="max-w-full max-h-[88vh] object-contain rounded-xl bg-white shadow-2xl" />
            <p className="mt-3 text-white text-sm">{preview.title}</p>
          </div>
        </div>
      )}
    </div>
  );
}
