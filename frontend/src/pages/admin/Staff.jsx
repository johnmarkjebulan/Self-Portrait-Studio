import { useEffect, useState } from "react";
import { usersApi } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";

export default function StaffManagement() {
  const { toast } = useToast();
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({ name:"", email:"", mobile:"", password:"" });
  const [saving, setSaving] = useState(false);
  const load = () => usersApi.getAll("staff").then(setStaff).catch(e => toast(e.message, "error"));
  useEffect(() => { load(); }, []);
  async function create(e) {
    e.preventDefault(); setSaving(true);
    try { await usersApi.createStaff(form); toast("Staff account created.", "success"); setForm({name:"",email:"",mobile:"",password:""}); await load(); }
    catch (err) { toast(err.message || "Could not create staff account", "error"); } finally { setSaving(false); }
  }
  async function toggle(user) {
    try { await usersApi.updateStaff(user.id,{is_active:!user.is_active}); toast(user.is_active ? "Staff account disabled." : "Staff account enabled.", "success"); await load(); }
    catch(err){ toast(err.message,"error"); }
  }
  return <div className="max-w-6xl mx-auto animate-fade-in">
    <div className="mb-7"><h1 className="text-2xl font-semibold text-gray-900">Staff Accounts</h1><p className="text-sm text-gray-500 mt-1">Only the owner can create or disable staff logins.</p></div>
    <div className="grid lg:grid-cols-[360px_1fr] gap-6">
      <form onSubmit={create} className="bg-white border border-gray-200 rounded-2xl p-5 h-fit card-shadow">
        <h2 className="font-semibold mb-4">Add Staff</h2>
        {[['name','Full Name','text'],['email','Email Address','email'],['mobile','Mobile Number','text'],['password','Temporary Password','password']].map(([k,l,t]) => <div key={k} className="mb-4"><label className="text-xs uppercase tracking-wider text-gray-500 block mb-2">{l}</label><input required={k!=='mobile'} minLength={k==='password'?8:undefined} type={t} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-gray-400" /></div>)}
        <button disabled={saving} className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold text-sm">{saving?"Creating…":"Create Staff Login"}</button>
      </form>
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden card-shadow">
        <div className="p-4 border-b"><h2 className="font-semibold">Current Staff</h2></div>
        {staff.length===0 ? <div className="p-10 text-center text-gray-500 text-sm">No staff accounts yet.</div> : <div className="divide-y">{staff.map(u=><div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"><div><p className="font-medium text-gray-900">{u.name}</p><p className="text-xs text-gray-500">{u.email}{u.mobile?` · ${u.mobile}`:''}</p></div><div className="flex items-center gap-3"><span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${u.is_active!==false?'bg-emerald-50 text-emerald-700':'bg-red-50 text-red-700'}`}>{u.is_active!==false?'Active':'Disabled'}</span><button onClick={()=>toggle(u)} className="text-xs border border-gray-200 rounded-lg px-3 py-2">{u.is_active!==false?'Disable':'Enable'}</button></div></div>)}</div>}
      </div>
    </div>
  </div>;
}
