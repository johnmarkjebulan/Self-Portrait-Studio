import { useEffect, useMemo, useState } from "react";
import { appointmentsApi, feedbackApi } from "../../services/api";
import { useToast } from "../../contexts/ToastContext";

const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
function Stars({ value, onChange }) {
  return <div className="flex items-center gap-2 flex-wrap">{[1,2,3,4,5].map(n=><button key={n} type="button" onClick={()=>onChange(n)} className={`text-3xl leading-none ${n<=value?'text-amber-400':'text-gray-200 hover:text-gray-300'}`}>★</button>)}<span className="text-sm text-gray-500 ml-1">{labels[value]}</span></div>;
}
export default function ClientFeedback(){
  const {toast}=useToast();
  const [appointments,setAppointments]=useState([]); const [feedback,setFeedback]=useState([]); const [loading,setLoading]=useState(true);
  const [form,setForm]=useState({appointment_id:"",rating:0,booking_experience:0,staff_service:0,studio_experience:0,cleanliness:0,overall_satisfaction:0,comment:""}); const [saving,setSaving]=useState(false);
  async function load(){setLoading(true);try{const [a,f]=await Promise.all([appointmentsApi.getAll(),feedbackApi.getAll()]);setAppointments(a.filter(x=>x.status==='completed'));setFeedback(f);}catch(e){toast(e.message||'Could not load feedback','error')}finally{setLoading(false)}}
  useEffect(()=>{load()},[]);
  const used=new Set(feedback.filter(f=>f.appointment_id).map(f=>f.appointment_id));
  const options=useMemo(()=>appointments.filter(a=>!used.has(a.id)),[appointments,feedback]);
  const setScore=(field)=>(value)=>setForm(f=>({...f,[field]:value}));
  async function submit(e){e.preventDefault();const scores=['rating','booking_experience','staff_service','studio_experience','cleanliness','overall_satisfaction'];if(scores.some(k=>form[k]<1||form[k]>5))return toast('Please choose a 1 to 5 star rating for every category.','warning');if(!form.comment.trim()&&!form.appointment_id)return toast('Please write a short comment for general feedback.','warning');setSaving(true);try{await feedbackApi.create({...form,appointment_id:form.appointment_id||null});toast('Thank you! Your feedback was sent.','success');setForm({appointment_id:"",rating:0,booking_experience:0,staff_service:0,studio_experience:0,cleanliness:0,overall_satisfaction:0,comment:""});await load()}catch(err){toast(err.message||'Failed to submit feedback','error')}finally{setSaving(false)}}
  return <div className="max-w-4xl mx-auto animate-fade-in">
    <div className="mb-7"><h1 className="text-2xl font-semibold text-gray-900">Feedback</h1><p className="text-sm text-gray-500 mt-1">Tell us what went well and what we can improve. You may send general studio feedback even without selecting an appointment.</p></div>
    <form onSubmit={submit} className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 card-shadow mb-8">
      <div className="mb-5"><label className="text-xs uppercase tracking-wider text-gray-500 block mb-2">Feedback For</label><select value={form.appointment_id} onChange={e=>setForm({...form,appointment_id:e.target.value})} className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm"><option value="">General Studio Feedback</option>{options.map(a=><option key={a.id} value={a.id}>{a.tracking_number} · {a.package?.name||'Session'} · {a.date}</option>)}</select><p className="text-xs text-gray-400 mt-2">Completed appointments can be reviewed once. General feedback can be sent anytime.</p></div>
      <div className="mb-6"><label className="text-xs uppercase tracking-wider text-gray-500 block mb-3">Overall Rating</label><Stars value={form.rating} onChange={setScore('rating')}/></div>
      <div className="grid sm:grid-cols-2 gap-5 mb-5">
        {[['booking_experience','Booking Experience'],['staff_service','Staff Service'],['studio_experience','Studio Experience'],['cleanliness','Studio Cleanliness']].map(([key,label])=><div key={key} className="rounded-xl bg-gray-50 border border-gray-100 p-4"><p className="text-sm font-medium text-gray-700 mb-2">{label}</p><Stars value={form[key]} onChange={setScore(key)}/></div>)}
      </div>
      <div className="mb-5"><label className="text-xs uppercase tracking-wider text-gray-500 block mb-2">Comments / Suggestions</label><textarea value={form.comment} onChange={e=>setForm({...form,comment:e.target.value})} rows={5} placeholder="Share your experience, suggestions, or concerns…" className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm resize-none outline-none focus:border-gray-400"/></div>
      <button disabled={saving} className="bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-semibold disabled:opacity-60">{saving?'Sending…':'Send Feedback'}</button>
    </form>
    <h2 className="font-semibold text-gray-900 mb-4">My Feedback</h2>
    {loading?<div className="text-sm text-gray-400">Loading…</div>:feedback.length===0?<div className="bg-white border rounded-2xl p-8 text-center text-gray-500">You have not sent feedback yet.</div>:<div className="space-y-4">{feedback.map(f=><div key={f.id} className="bg-white border rounded-2xl p-5 card-shadow"><div className="flex justify-between gap-3"><div><p className="font-medium text-gray-900">{f.appointment?.tracking_number||'General Studio Feedback'}</p><p className="text-xs text-gray-400 mt-1">{new Date(f.created_at).toLocaleDateString('en-PH',{month:'long',day:'numeric',year:'numeric'})}</p></div><span className="text-amber-400">{'★'.repeat(f.rating)}<span className="text-gray-200">{'★'.repeat(5-f.rating)}</span></span></div>{f.comment&&<p className="text-sm text-gray-600 mt-3 whitespace-pre-line">{f.comment}</p>}{f.staff_reply&&<div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-xl p-4"><p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Studio Reply</p><p className="text-sm text-emerald-900 mt-1 whitespace-pre-line">{f.staff_reply}</p></div>}</div>)}</div>}
  </div>
}
