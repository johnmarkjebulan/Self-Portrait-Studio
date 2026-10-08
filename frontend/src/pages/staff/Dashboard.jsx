import { useEffect, useState } from "react";
import { appointmentsApi, feedbackApi, postsApi, usersApi } from "../../services/api";
export default function StaffDashboard(){
 const [data,setData]=useState({appointments:[],clients:[],feedback:[],posts:[]});
 useEffect(()=>{Promise.all([appointmentsApi.getAll(),usersApi.getAll('client'),feedbackApi.getAll(),postsApi.getAll()]).then(([appointments,clients,feedback,posts])=>setData({appointments,clients,feedback,posts})).catch(console.error)},[]);
 const today=new Date().toISOString().slice(0,10);
 const cards=[['Today’s Sessions',data.appointments.filter(a=>a.date===today).length],['Registered Clients',data.clients.length],['Client Feedback',data.feedback.length],['Studio Posts',data.posts.length]];
 return <div className="max-w-6xl mx-auto"><div className="mb-7"><h1 className="text-2xl font-semibold">Staff Dashboard</h1><p className="text-sm text-gray-500 mt-1">Read-only operational overview for studio staff.</p></div><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{cards.map(([l,v])=><div key={l} className="bg-white border rounded-2xl p-5"><p className="text-xs text-gray-500 uppercase tracking-wider">{l}</p><p className="text-3xl font-semibold mt-2">{v}</p></div>)}</div><div className="mt-6 bg-white border rounded-2xl p-5"><h2 className="font-semibold mb-3">Staff Access</h2><p className="text-sm text-gray-600 leading-relaxed">You can view appointments, client records, studio posts, and feedback. Owner-only actions such as package setup, payments verification, system settings, and staff account management are not available here.</p></div></div>
}
