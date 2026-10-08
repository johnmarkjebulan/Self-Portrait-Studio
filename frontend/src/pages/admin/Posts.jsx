import { useCallback, useEffect, useRef, useState } from "react";
import { postsApi } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";

/* =========================================================
   IMAGE PREPARATION
========================================================= */
async function prepareImage(file) {
  if (!file) {
    throw new Error("Please choose an image first.");
  }

  if (!file.type?.startsWith("image/")) {
    throw new Error("Please choose a valid image file.");
  }

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);

    reader.onerror = () => {
      reject(new Error("Could not read the selected image."));
    };

    reader.readAsDataURL(file);
  });

  const img = await new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);

    image.onerror = () => {
      reject(new Error("Could not process the selected image."));
    };

    image.src = dataUrl;
  });

  const maxSize = 1600;

  const scale = Math.min(
    1,
    maxSize / Math.max(img.width, img.height)
  );

  const canvas = document.createElement("canvas");

  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Image processing is not supported by this browser.");
  }

  context.drawImage(
    img,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvas.toDataURL("image/jpeg", 0.86);
}

/* =========================================================
   NORMALIZE API RESPONSE
========================================================= */
function normalizePosts(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.posts)) {
    return response.posts;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.posts)) {
    return response.data.posts;
  }

  return [];
}

/* =========================================================
   ADMIN POSTS
========================================================= */
export default function AdminPosts() {
  const { toast } = useToast();

  const inputRef = useRef(null);

  const [posts, setPosts] = useState([]);

  const [form, setForm] = useState({
    title: "",
    caption: "",
    image_data: "",
  });

  const [loading, setLoading] = useState(true);
  const [processingImage, setProcessingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [preview, setPreview] = useState(null);

  /* =========================================================
     LOAD POSTS
  ========================================================= */
  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);

      const response = await postsApi.getAll();

      setPosts(normalizePosts(response));
    } catch (error) {
      console.error("Load posts error:", error);

      setPosts([]);

      toast(
        error?.message || "Unable to load posted pictures.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  /* =========================================================
     IMAGE UPLOAD
  ========================================================= */
  async function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setProcessingImage(true);

      const imageData = await prepareImage(file);

      setForm((previous) => ({
        ...previous,
        image_data: imageData,
      }));
    } catch (error) {
      console.error("Image preparation error:", error);

      toast(
        error?.message || "Could not prepare the image.",
        "error"
      );

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } finally {
      setProcessingImage(false);
    }
  }

  /* =========================================================
     REMOVE SELECTED IMAGE
  ========================================================= */
  function removeSelectedImage() {
    setForm((previous) => ({
      ...previous,
      image_data: "",
    }));

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  /* =========================================================
     CREATE POST
  ========================================================= */
  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.image_data) {
      toast("Choose a photo first.", "warning");
      return;
    }

    if (processingImage) {
      toast(
        "Please wait while the image is being prepared.",
        "warning"
      );
      return;
    }

    try {
      setSaving(true);

      await postsApi.create({
        title: form.title.trim(),
        caption: form.caption.trim(),
        image_data: form.image_data,
      });

      toast(
        "Photo posted successfully.",
        "success"
      );

      setForm({
        title: "",
        caption: "",
        image_data: "",
      });

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      await loadPosts();
    } catch (error) {
      console.error("Create post error:", error);

      toast(
        error?.message || "Failed to publish the post.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     DELETE POST
  ========================================================= */
  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this post?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionId(id);

      await postsApi.delete(id);

      toast(
        "Post deleted successfully.",
        "success"
      );

      await loadPosts();
    } catch (error) {
      console.error("Delete post error:", error);

      toast(
        error?.message || "Failed to delete the post.",
        "error"
      );
    } finally {
      setActionId(null);
    }
  }

  /* =========================================================
     PUBLISH / HIDE POST
  ========================================================= */
  async function handleToggle(post) {
    try {
      setActionId(post.id);

      await postsApi.update(post.id, {
        is_published: !post.is_published,
      });

      toast(
        post.is_published
          ? "Post hidden from clients."
          : "Post published successfully.",
        "success"
      );

      await loadPosts();
    } catch (error) {
      console.error("Update post error:", error);

      toast(
        error?.message || "Failed to update the post.",
        "error"
      );
    } finally {
      setActionId(null);
    }
  }

  /* =========================================================
     PAGE
  ========================================================= */
  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* PAGE HEADER */}
      <div className="mb-7">
        <h1 className="text-2xl font-semibold text-gray-900">
          Posted Pictures
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Publish studio photos, client highlights, promos,
          and announcements that clients can view.
        </p>
      </div>

      <div className="grid lg:grid-cols-[380px_minmax(0,1fr)] gap-6">
        {/* =====================================================
            CREATE POST
        ===================================================== */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-2xl p-5 h-fit shadow-sm"
        >
          <h2 className="font-semibold text-gray-900 mb-5">
            Create Post
          </h2>

          {/* PHOTO */}
          <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
            Photo
          </label>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={processingImage || saving}
            className="w-full text-sm mb-4 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200"
          />

          {processingImage && (
            <div className="mb-4 rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-500">
              Preparing image...
            </div>
          )}

          {form.image_data && (
            <div className="relative mb-5">
              <img
                src={form.image_data}
                alt="Post preview"
                className="w-full aspect-square object-cover rounded-xl bg-gray-100 border border-gray-200"
              />

              <button
                type="button"
                onClick={removeSelectedImage}
                className="absolute top-3 right-3 bg-black/70 hover:bg-black text-white rounded-full w-9 h-9 flex items-center justify-center"
                aria-label="Remove selected image"
              >
                ×
              </button>
            </div>
          )}

          {/* TITLE */}
          <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
            Title
          </label>

          <input
            type="text"
            value={form.title}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                title: event.target.value,
              }))
            }
            placeholder="e.g. Family Portrait Highlight"
            maxLength={120}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-4 outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400"
          />

          {/* CAPTION */}
          <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
            Caption
          </label>

          <textarea
            value={form.caption}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                caption: event.target.value,
              }))
            }
            rows={5}
            maxLength={1500}
            placeholder="Write a caption, promo details, announcement, or description..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400"
          />

          <div className="text-right text-xs text-gray-400 mt-1">
            {form.caption.length}/1500
          </div>

          {/* PUBLISH */}
          <button
            type="submit"
            disabled={
              saving ||
              processingImage ||
              !form.image_data
            }
            className="w-full mt-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving
              ? "Publishing..."
              : processingImage
              ? "Preparing Photo..."
              : "Publish Photo"}
          </button>
        </form>

        {/* =====================================================
            POSTS LIST
        ===================================================== */}
        <div>
          {loading ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
              <div className="text-gray-500 text-sm">
                Loading posted pictures...
              </div>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 mx-auto flex items-center justify-center mb-4">
                📷
              </div>

              <h3 className="font-semibold text-gray-900">
                No posts yet
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Upload your first studio photo using the form.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {posts.map((post) => {
                const busy = actionId === post.id;

                return (
                  <article
                    key={post.id}
                    className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
                  >
                    {/* IMAGE */}
                    <div className="relative bg-gray-100">
                      {(post.image_data || post.image_url) ? (
                        <button type="button" onClick={() => setPreview({ src: post.image_data || post.image_url, title: post.title || "Studio post" })} className="block w-full cursor-zoom-in">
                        <img
                          src={post.image_data || post.image_url}
                          alt={post.title || "Studio post"}
                          className="w-full aspect-square object-cover"
                        />
                        </button>
                      ) : (
                        <div className="w-full aspect-square flex items-center justify-center text-gray-400">
                          No image
                        </div>
                      )}

                      <span
                        className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold shadow-sm ${
                          post.is_published
                            ? "bg-emerald-600 text-white"
                            : "bg-gray-900 text-white"
                        }`}
                      >
                        {post.is_published
                          ? "Published"
                          : "Hidden"}
                      </span>
                    </div>

                    {/* CONTENT */}
                    <div className="p-4">
                      <p className="font-semibold text-gray-900 break-words">
                        {post.title || "Untitled Post"}
                      </p>

                      {post.caption && (
                        <p className="text-sm text-gray-500 mt-2 leading-relaxed break-words">
                          {post.caption}
                        </p>
                      )}

                      {post.created_at && (
                        <p className="text-xs text-gray-400 mt-3">
                          {new Date(
                            post.created_at
                          ).toLocaleString()}
                        </p>
                      )}

                      {/* ACTIONS */}
                      <div className="flex gap-2 mt-4">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            handleToggle(post)
                          }
                          className="flex-1 border border-gray-200 hover:bg-gray-50 rounded-lg py-2 text-xs font-medium disabled:opacity-50"
                        >
                          {busy
                            ? "Please wait..."
                            : post.is_published
                            ? "Hide"
                            : "Publish"}
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            handleDelete(post.id)
                          }
                          className="px-3 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg py-2 text-xs font-medium disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}