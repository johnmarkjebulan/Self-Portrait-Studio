import { useEffect, useState } from "react";
import { postsApi } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";

export default function StaffPosts() {
  const { toast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    postsApi.getAll()
      .then(setPosts)
      .catch((err) => toast(err.message || "Could not load studio posts.", "error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!preview) return;
    const close = (event) => event.key === "Escape" && setPreview(null);
    document.addEventListener("keydown", close);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", close);
      document.body.style.overflow = "";
    };
  }, [preview]);

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-gray-900">Studio Posts</h1>
        <p className="text-sm text-gray-500 mt-1">View published portraits, promos, and studio updates posted by the Owner.</p>
      </div>

      {loading ? (
        <div className="text-center py-14 text-sm text-gray-400">Loading studio posts…</div>
      ) : posts.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-500">No studio posts yet.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map((post) => {
            const src = post.image_data || post.image_url;
            return (
              <article key={post.id} className="studio-card-motion bg-white border border-gray-200 rounded-2xl overflow-hidden card-shadow">
                <button type="button" onClick={() => src && setPreview({ src, title: post.title || "Pose and Pics" })} className="block w-full bg-gray-100 cursor-zoom-in">
                  {src ? (
                    <img src={src} alt={post.title || "Studio post"} className="aspect-square w-full object-cover" />
                  ) : (
                    <div className="aspect-square w-full grid place-items-center text-gray-400">No image</div>
                  )}
                </button>
                <div className="p-4">
                  <p className="font-semibold text-gray-900">{post.title || "Pose and Pics"}</p>
                  {post.caption && <p className="text-sm text-gray-500 mt-1 line-clamp-3">{post.caption}</p>}
                  <p className="text-xs text-gray-400 mt-3">{Number(post.like_count || 0)} client {Number(post.like_count || 0) === 1 ? "like" : "likes"}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-sm p-4 flex items-center justify-center" onClick={() => setPreview(null)}>
          <div className="relative max-w-6xl w-full max-h-[94vh] flex flex-col items-center" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setPreview(null)} className="absolute right-2 top-2 z-10 w-10 h-10 rounded-full bg-white text-gray-900 text-2xl shadow-lg">×</button>
            <img src={preview.src} alt={preview.title} className="max-w-full max-h-[88vh] object-contain rounded-xl bg-white shadow-2xl" />
            <p className="mt-3 text-white text-sm">{preview.title}</p>
          </div>
        </div>
      )}
    </div>
  );
}
