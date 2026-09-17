import { useEffect, useRef, useState } from "react";
import { useToast } from "../../contexts/ToastContext";
import { packagesApi, appointmentsApi } from "../../services/api.js";

const emptyPkg = () => ({
  name: "",
  description: "",
  price: 0,
  duration: 60,
  max_people: 2,
  edited_photos: 10,
  printed_photos: 0,
  services: [],
  active: true,
});

function ThreeDotMenu({ onEdit, onToggle, onDelete, isActive }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[160px]">
          <button
            onClick={() => { setOpen(false); onEdit(); }}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Edit Package
          </button>
          <button
            onClick={() => { setOpen(false); onToggle(); }}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {isActive ? "Deactivate" : "Activate"}
          </button>
          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              onClick={() => { setOpen(false); onDelete(); }}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Delete Package
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddonMenu({ onEdit, onToggle, onDelete, isActive }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[160px]">
          <button
            onClick={() => { setOpen(false); onEdit(); }}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Edit Add-on
          </button>
          <button
            onClick={() => { setOpen(false); onToggle(); }}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {isActive ? "Deactivate" : "Activate"}
          </button>
          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              onClick={() => { setOpen(false); onDelete(); }}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, required = false, children }) {
  return (
    <div>
      <label className="text-gray-700 text-sm font-medium block mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full bg-white border border-gray-200 focus:border-gray-400 text-gray-900 placeholder:text-gray-400 px-3.5 py-2.5 rounded-xl outline-none text-sm transition-colors";

export default function AdminPackages() {
  const { toast } = useToast();
  const [tab, setTab] = useState("packages");
  const [packages, setPackages] = useState([]);
  const [addons, setAddons] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Package form
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [editPkg, setEditPkg] = useState(null);
  const [formData, setFormData] = useState(emptyPkg());
  const [serviceInput, setServiceInput] = useState("");

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBookingCount, setDeleteBookingCount] = useState(0);

  // Addon form
  const [showAddonForm, setShowAddonForm] = useState(false);
  const [addonMode, setAddonMode] = useState("create");
  const [editAddon, setEditAddon] = useState(null);
  const [addonData, setAddonData] = useState({ name: "", description: "", price: 0, active: true });

  const load = async () => {
    try {
      const [pkgs, ads, appts] = await Promise.all([
        packagesApi.getAll(true),
        packagesApi.getAddons(true),
        appointmentsApi.getAll(),
      ]);
      setPackages([...pkgs].sort((a, b) => a.name.localeCompare(b.name)));
      setAddons([...ads].sort((a, b) => a.name.localeCompare(b.name)));
      setAppointments(appts);
    } catch {
      toast("Failed to load data.", "error");
    }
  };

  useEffect(() => {
    async function init() {
      setLoading(true);
      await load();
      setLoading(false);
    }
    init();
  }, []);

  const filteredPkgs = packages.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" || (statusFilter === "active" ? p.active : !p.active);
    return matchSearch && matchStatus;
  });

  const getBookingCount = (pkgId) =>
    appointments.filter(
      (a) => a.package_id === pkgId && a.status !== "cancelled"
    ).length;

  const openCreateForm = () => {
    setFormMode("create");
    setEditPkg(null);
    setFormData(emptyPkg());
    setServiceInput("");
    setShowForm(true);
  };

  const openEditForm = (pkg) => {
    setFormMode("edit");
    setEditPkg(pkg);
    setFormData({ ...pkg });
    setServiceInput("");
    setShowForm(true);
  };

  const savePkg = async () => {
    if (!formData.name.trim()) { toast("Package name is required.", "error"); return; }
    if (formData.price <= 0) { toast("Price must be greater than zero.", "error"); return; }
    if (formData.duration <= 0) { toast("Duration must be greater than zero.", "error"); return; }

    try {
      if (formMode === "edit" && editPkg) {
        await packagesApi.update(editPkg.id, formData);
        toast("Package updated successfully.", "success");
      } else {
        await packagesApi.create(formData);
        toast("Package created successfully.", "success");
      }
      setShowForm(false);
      await load();
    } catch {
      toast("Failed to save package.", "error");
    }
  };

  const confirmDelete = (pkg) => {
    const count = getBookingCount(pkg.id);
    setDeleteTarget(pkg);
    setDeleteBookingCount(count);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      await packagesApi.delete(deleteTarget.id);
      toast("Package deleted.", "info");
      setDeleteTarget(null);
      await load();
    } catch {
      toast("Failed to delete package.", "error");
    }
  };

  const executeDeactivate = async () => {
    if (!deleteTarget) return;
    try {
      await packagesApi.update(deleteTarget.id, { active: false });
      toast("Package deactivated.", "success");
      setDeleteTarget(null);
      await load();
    } catch {
      toast("Failed to deactivate package.", "error");
    }
  };

  const togglePkg = async (pkg) => {
    try {
      await packagesApi.update(pkg.id, { active: !pkg.active });
      toast(pkg.active ? "Package deactivated." : "Package activated.", "success");
      await load();
    } catch {
      toast("Failed to update package.", "error");
    }
  };

  const saveAddon = async () => {
    if (!addonData.name.trim()) { toast("Name is required.", "error"); return; }
    if (addonData.price <= 0) { toast("Price must be greater than zero.", "error"); return; }
    try {
      if (addonMode === "edit" && editAddon) {
        await packagesApi.updateAddon(editAddon.id, addonData);
        toast("Add-on updated successfully.", "success");
      } else {
        await packagesApi.createAddon(addonData);
        toast("Add-on created successfully.", "success");
      }
      setShowAddonForm(false);
      await load();
    } catch {
      toast("Failed to save add-on.", "error");
    }
  };

  const toggleAddon = async (addon) => {
    try {
      await packagesApi.updateAddon(addon.id, { active: !addon.active });
      toast(addon.active ? "Add-on deactivated." : "Add-on activated.", "success");
      await load();
    } catch {
      toast("Failed to update add-on.", "error");
    }
  };

  const deleteAddon = async (addon) => {
    if (!window.confirm(`Delete "${addon.name}"?`)) return;
    try {
      await packagesApi.deleteAddon(addon.id);
      toast("Add-on deleted.", "info");
      await load();
    } catch {
      toast("Failed to delete add-on.", "error");
    }
  };

  const addService = () => {
    if (!serviceInput.trim()) return;
    setFormData((p) => ({ ...p, services: [...p.services, serviceInput.trim()] }));
    setServiceInput("");
  };

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-gray-900">Packages & Add-ons</h1>
          <p className="text-gray-500 text-sm mt-1">
            Create and manage photography packages and add-ons offered to clients.
          </p>
        </div>
        <button
          onClick={
            tab === "packages"
              ? openCreateForm
              : () => {
                  setAddonMode("create");
                  setEditAddon(null);
                  setAddonData({ name: "", description: "", price: 0, active: true });
                  setShowAddonForm(true);
                }
          }
          className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0"
        >
          + {tab === "packages" ? "Add Package" : "Add Add-on"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {["packages", "addons"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
              tab === t
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "packages"
              ? `Packages (${packages.length})`
              : `Add-ons (${addons.length})`}
          </button>
        ))}
      </div>

      {/* Packages Tab */}
      {tab === "packages" && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-5">
            <input
              type="text"
              placeholder="Search packages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] bg-white border border-gray-200 focus:border-gray-400 text-gray-900 placeholder:text-gray-400 px-4 py-2.5 rounded-xl outline-none text-sm transition-colors"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-200 card-shadow p-16 text-center">
              <p className="text-gray-400 text-sm">Loading packages...</p>
            </div>
          ) : filteredPkgs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 card-shadow p-16 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-gray-900 font-semibold mb-1">
                {search || statusFilter !== "all"
                  ? "No packages match your filters"
                  : "No packages yet"}
              </h3>
              <p className="text-gray-500 text-sm mb-5">
                {search || statusFilter !== "all"
                  ? "Try adjusting your search or filter."
                  : "Create your first photography package so clients can start booking your services."}
              </p>
              {!search && statusFilter === "all" && (
                <button
                  onClick={openCreateForm}
                  className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
                >
                  + Add Package
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 card-shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      {["Package Name", "Duration", "Price", "Inclusions", "Bookings", "Status", ""].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-left text-gray-500 text-xs uppercase tracking-wider py-3 px-4 font-medium first:pl-5 last:pr-4 last:w-10"
                          >
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPkgs.map((pkg) => {
                      const bookings = getBookingCount(pkg.id);
                      return (
                        <tr
                          key={pkg.id}
                          className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${!pkg.active ? "opacity-55" : ""}`}
                        >
                          <td className="py-3.5 pl-5 pr-4">
                            <p className="font-semibold text-gray-900 text-sm">{pkg.name}</p>
                            <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{pkg.description}</p>
                          </td>
                          <td className="py-3.5 pr-4 text-gray-600 text-sm">{pkg.duration} min</td>
                          <td className="py-3.5 pr-4 text-gray-900 font-mono font-semibold text-sm">
                            ₱{pkg.price.toLocaleString()}
                          </td>
                          <td className="py-3.5 pr-4 text-gray-500 text-xs">
                            {pkg.edited_photos} edited · {pkg.max_people} pax
                            {pkg.services && pkg.services.length > 0
                              ? ` · +${pkg.services.length} more`
                              : ""}
                          </td>
                          <td className="py-3.5 pr-4 text-gray-600 text-sm">{bookings}</td>
                          <td className="py-3.5 pr-4">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                                pkg.active
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-gray-100 text-gray-500 border-gray-200"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${pkg.active ? "bg-emerald-500" : "bg-gray-400"}`}
                              />
                              {pkg.active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="py-3.5 pr-4">
                            <ThreeDotMenu
                              isActive={pkg.active}
                              onEdit={() => openEditForm(pkg)}
                              onToggle={() => togglePkg(pkg)}
                              onDelete={() => confirmDelete(pkg)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add-ons Tab */}
      {tab === "addons" && (
        <>
          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-200 card-shadow p-16 text-center">
              <p className="text-gray-400 text-sm">Loading add-ons...</p>
            </div>
          ) : addons.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 card-shadow p-16 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-gray-900 font-semibold mb-1">No add-ons yet</h3>
              <p className="text-gray-500 text-sm mb-5">
                Create optional add-ons clients can include with their booking.
              </p>
              <button
                onClick={() => {
                  setAddonMode("create");
                  setEditAddon(null);
                  setAddonData({ name: "", description: "", price: 0, active: true });
                  setShowAddonForm(true);
                }}
                className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
              >
                + Add Add-on
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 card-shadow overflow-hidden">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    {["Add-on Name", "Description", "Price", "Status", ""].map((h) => (
                      <th
                        key={h}
                        className="text-left text-gray-500 text-xs uppercase tracking-wider py-3 px-4 font-medium first:pl-5 last:pr-4 last:w-10"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {addons.map((addon) => (
                    <tr
                      key={addon.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${!addon.active ? "opacity-55" : ""}`}
                    >
                      <td className="py-3.5 pl-5 pr-4 font-semibold text-gray-900">{addon.name}</td>
                      <td className="py-3.5 pr-4 text-gray-500 text-xs">{addon.description || "—"}</td>
                      <td className="py-3.5 pr-4 text-gray-900 font-mono font-semibold">
                        +₱{addon.price.toLocaleString()}
                      </td>
                      <td className="py-3.5 pr-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                            addon.active
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-gray-100 text-gray-500 border-gray-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${addon.active ? "bg-emerald-500" : "bg-gray-400"}`}
                          />
                          {addon.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <AddonMenu
                          isActive={addon.active}
                          onEdit={() => {
                            setAddonMode("edit");
                            setEditAddon(addon);
                            setAddonData({ ...addon });
                            setShowAddonForm(true);
                          }}
                          onToggle={() => toggleAddon(addon)}
                          onDelete={() => deleteAddon(addon)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Package Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <div>
                <h2 className="font-semibold text-gray-900">
                  {formMode === "edit" ? "Edit Package" : "Add New Package"}
                </h2>
                <p className="text-gray-400 text-xs mt-0.5">
                  {formMode === "edit"
                    ? "Update package details."
                    : "Fill in the details for the new package."}
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-7">
              {/* Basic Information */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  Basic Information
                </h3>
                <div className="space-y-4">
                  <FormField label="Package Name" required>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Solo Classic, Couple Premium"
                      className={inputClass}
                    />
                  </FormField>
                  <FormField label="Short Description">
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                      rows={2}
                      placeholder="Brief description shown to clients on the booking page..."
                      className={`${inputClass} resize-none`}
                    />
                  </FormField>
                </div>
              </div>

              {/* Pricing & Duration */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  Pricing & Duration
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Package Price (₱)" required>
                    <input
                      type="number"
                      value={formData.price}
                      min="0"
                      step="100"
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, price: parseFloat(e.target.value) || 0 }))
                      }
                      className={inputClass}
                    />
                  </FormField>
                  <FormField label="Duration (minutes)" required>
                    <input
                      type="number"
                      value={formData.duration}
                      min="15"
                      step="15"
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, duration: parseInt(e.target.value) || 60 }))
                      }
                      className={inputClass}
                    />
                  </FormField>
                </div>
              </div>

              {/* Package Inclusions */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  Package Inclusions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <FormField label="Max People">
                    <input
                      type="number"
                      value={formData.max_people}
                      min="1"
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, max_people: parseInt(e.target.value) || 1 }))
                      }
                      className={inputClass}
                    />
                  </FormField>
                  <FormField label="Edited Photos">
                    <input
                      type="number"
                      value={formData.edited_photos}
                      min="0"
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          edited_photos: parseInt(e.target.value) || 0,
                        }))
                      }
                      className={inputClass}
                    />
                  </FormField>
                  <FormField label="Printed Photos">
                    <input
                      type="number"
                      value={formData.printed_photos}
                      min="0"
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          printed_photos: parseInt(e.target.value) || 0,
                        }))
                      }
                      className={inputClass}
                    />
                  </FormField>
                </div>

                <FormField label="Additional Inclusions">
                  <div className="flex gap-2 mb-3">
                    <input
                      value={serviceInput}
                      onChange={(e) => setServiceInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); addService(); }
                      }}
                      placeholder="e.g. Same-Day Edit, Photo Album, Makeup Touch-up"
                      className={`${inputClass} flex-1`}
                    />
                    <button
                      onClick={addService}
                      type="button"
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm transition-colors shrink-0"
                    >
                      + Add
                    </button>
                  </div>
                  {formData.services && formData.services.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {formData.services.map((s, i) => (
                        <span
                          key={i}
                          className="bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                        >
                          {s}
                          <button
                            onClick={() =>
                              setFormData((p) => ({
                                ...p,
                                services: p.services.filter((_, j) => j !== i),
                              }))
                            }
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-xs">No additional inclusions added yet.</p>
                  )}
                </FormField>
              </div>

              {/* Availability */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  Availability
                </h3>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData((p) => ({ ...p, active: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 accent-gray-900"
                  />
                  <div>
                    <p className="text-gray-900 text-sm font-medium">Package is active</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      Active packages are visible to clients on the booking page.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={savePkg}
                className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {formMode === "edit" ? "Save Changes" : "Save Package"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            {deleteBookingCount > 0 ? (
              <>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">Cannot Delete Package</h3>
                <p className="text-gray-500 text-sm mb-3">
                  <span className="font-medium text-gray-700">"{deleteTarget.name}"</span> has{" "}
                  {deleteBookingCount} existing booking{deleteBookingCount !== 1 ? "s" : ""} and
                  cannot be permanently deleted. Deleting it would break historical records.
                </p>
                <p className="text-gray-500 text-sm mb-5">
                  You can deactivate it instead — it will be hidden from clients but your booking
                  history will remain intact.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeDeactivate}
                    className="flex-1 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    Deactivate Package
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">Delete Package?</h3>
                <p className="text-gray-500 text-sm mb-5">
                  Are you sure you want to permanently delete{" "}
                  <span className="font-medium text-gray-700">"{deleteTarget.name}"</span>? This
                  action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeDelete}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    Delete Package
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add-on Form Modal */}
      {showAddonForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">
                {addonMode === "edit" ? "Edit Add-on" : "Add New Add-on"}
              </h2>
              <button
                onClick={() => setShowAddonForm(false)}
                className="text-gray-400 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <FormField label="Add-on Name" required>
                <input
                  type="text"
                  value={addonData.name}
                  onChange={(e) => setAddonData((a) => ({ ...a, name: e.target.value }))}
                  placeholder="e.g. Photo Booth, Extra Edited Photos"
                  className={inputClass}
                />
              </FormField>
              <FormField label="Price (₱)" required>
                <input
                  type="number"
                  value={addonData.price}
                  min="0"
                  onChange={(e) =>
                    setAddonData((a) => ({ ...a, price: parseFloat(e.target.value) || 0 }))
                  }
                  className={inputClass}
                />
              </FormField>
              <FormField label="Description">
                <textarea
                  value={addonData.description}
                  onChange={(e) => setAddonData((a) => ({ ...a, description: e.target.value }))}
                  rows={2}
                  placeholder="Brief description..."
                  className={`${inputClass} resize-none`}
                />
              </FormField>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addonData.active}
                  onChange={(e) => setAddonData((a) => ({ ...a, active: e.target.checked }))}
                  className="w-4 h-4 accent-gray-900"
                />
                <span className="text-sm text-gray-700 font-medium">
                  Active (visible to clients)
                </span>
              </label>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowAddonForm(false)}
                className="px-6 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveAddon}
                className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {addonMode === "edit" ? "Save Changes" : "Save Add-on"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
