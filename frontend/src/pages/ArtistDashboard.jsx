// import React, { useState, useEffect, useRef } from 'react';
// // Combine all icons into ONE import block
// import { 
//     Clock, Camera, DollarSign, Save, LogOut, 
//     Settings, User, Upload, Trash2, Plus, MapPin, 
//     Instagram, Type, TrendingUp, CheckCircle, 
//     AlertCircle, LayoutDashboard, CreditCard, FileText 
// } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import './ArtistDashboard.css';
// // 👇 ADD THIS LINE BACK
// import ArtistAppointments from '../components/Dashboard/ArtistAppointments';

// // PDF Libraries
// import { jsPDF } from "jspdf";
// import autoTable from 'jspdf-autotable'; // Use the function import for better compatibility

// const API_BASE_URL = 'http://localhost:8000';

// const ArtistDashboard = () => {
//   const [activeTab, setActiveTab] = useState('appointments'); 
//   const [artistData, setArtistData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const navigate = useNavigate();
  
//   const auth = useAuth();
//   const logoutUser = auth?.logoutUser || (() => window.location.href = '/login');

//   const fetchDashboard = async () => {
//     try {
//       const token = localStorage.getItem('access') || localStorage.getItem('token');
//       if (!token) { navigate('/login'); return; }

//       const res = await fetch(`${API_BASE_URL}/api/auth/dashboard/`, {
//           headers: { 'Authorization': `Bearer ${token}` }
//       });

//       if (res.status === 401) { logoutUser(); return; }
//       if (!res.ok) throw new Error("Failed to fetch data");

//       const data = await res.json();
//       setArtistData(data);
//       setLoading(false);
//     } catch (error) {
//         console.error("Error fetching dashboard:", error);
//         setError("Could not load studio data.");
//         setLoading(false);
//     }
//   };

//   useEffect(() => { fetchDashboard(); }, []);

//   if (loading) return <div className="loading-screen">LOADING STUDIO...</div>;
//   if (error || !artistData) return (
//       <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
//           <h2 style={{color: 'white'}}>Unable to load Dashboard</h2>
//           <button onClick={() => window.location.reload()} className="save-btn-primary">Retry Connection</button>
//           <button onClick={logoutUser} style={{color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer'}}>Log Out</button>
//       </div>
//   );

//   return (
//     <div className="dashboard-container">
//       {/* SIDEBAR */}
//       <aside className="dashboard-sidebar">
//         <div>
//             <div className="logo-section">
//                 <div className="logo-icon"></div>
//                 <h2 className="brand-name">INKSPIRE</h2>
//             </div>

//             <div className="artist-snippet">
//                 <div className="snippet-avatar">
//                     {artistData?.profile_picture ? (
//                         <img src={artistData.profile_picture.startsWith('http') ? artistData.profile_picture : `${API_BASE_URL}${artistData.profile_picture}`} alt="Profile" />
//                     ) : (
//                         <User color="#a1a1aa" size={20} />
//                     )}
//                 </div>
//                 <div className="snippet-info">
//                     <p className="role-label">Artist</p>
//                     <p className="artist-name">{artistData?.username}</p>
//                 </div>
//             </div>

//             <nav className="nav-menu">
//                 <NavButton icon={<LayoutDashboard size={20}/>} label="Appointments" active={activeTab === 'appointments'} onClick={() => setActiveTab('appointments')} />
//                 <NavButton icon={<Clock size={20}/>} label="Schedule" active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} />
//                 <NavButton icon={<Camera size={20}/>} label="Portfolio" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
//                 <NavButton icon={<DollarSign size={20}/>} label="Revenue" active={activeTab === 'revenue'} onClick={() => setActiveTab('revenue')} />
//                 <NavButton icon={<Settings size={20}/>} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
//             </nav>
//         </div>
        
//         <button onClick={logoutUser} className="logout-btn">
//             <LogOut size={18} /> <span>Sign Out</span>
//         </button>
//       </aside>

//       {/* MAIN CONTENT */}
//       <main className="dashboard-content">
//         <div className="content-wrapper">
//             <header className="header-section">
//                 <div className="header-title">
//                     <h1>{getHeaderTitle(activeTab)}</h1>
//                     <p>Manage your studio presence and availability.</p>
//                 </div>
//                 <div className="date-display">
//                     {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
//                 </div>
//             </header>

//             <div className="tab-body">
//                 {activeTab === 'appointments' && <ArtistAppointments />}
//                 {activeTab === 'schedule' && <ScheduleSection schedule={artistData.schedule} />}
                
//                 {activeTab === 'profile' && (
//                     <PortfolioSection 
//                         portfolio={artistData.portfolio} 
//                         refreshData={fetchDashboard} 
//                     />
//                 )}
                
//                 {activeTab === 'settings' && (
//                     <SettingsSection 
//                         userData={artistData} 
//                         refreshData={fetchDashboard} 
//                     />
//                 )}

//                 {activeTab === 'revenue' && <RevenueSection />}
//             </div>
//         </div>
//       </main>
//     </div>
//   );
// };


// /* --- 1. SCHEDULE COMPONENT --- */
// const ScheduleSection = ({ schedule: initialSchedule }) => {
//     const [schedule, setSchedule] = useState(initialSchedule || []);
//     const [isSaving, setIsSaving] = useState(false);

//     if (!schedule || schedule.length === 0) return <div style={{color:'white'}}>No schedule data.</div>;

//     const handleTimeChange = (index, field, value) => {
//         const newSchedule = [...schedule];
//         newSchedule[index][field] = value;
//         setSchedule(newSchedule);
//     };

//     const toggleActive = (index) => {
//         const newSchedule = [...schedule];
//         newSchedule[index].is_active = !newSchedule[index].is_active;
//         setSchedule(newSchedule);
//     };

//     const saveSchedule = async () => {
//          setIsSaving(true);
//          const token = localStorage.getItem('access') || localStorage.getItem('token');
//          try {
//              const res = await fetch(`${API_BASE_URL}/api/auth/dashboard/schedule/`, {
//                  method: 'POST',
//                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
//                  body: JSON.stringify(schedule)
//              });
//              if(res.ok) alert("✅ Schedule Saved!");
//              else alert("❌ Error saving schedule");
//          } catch (e) { alert("Connection Error"); } 
//          finally { setIsSaving(false); }
//     };

//     return (
//         <div className="schedule-card">
//             <div className="card-header">
//                 <div>
//                     <h3 style={{ fontSize: '20px', margin: 0, fontWeight: 'bold', color: 'white' }}>Working Hours</h3>
//                     <p style={{ color: '#a1a1aa', fontSize: '14px', margin: '4px 0 0' }}>Set your weekly availability.</p>
//                 </div>
//                 <button onClick={saveSchedule} disabled={isSaving} className="save-btn-primary">
//                     <Save size={18} /> {isSaving ? "Saving..." : "Save Changes"}
//                 </button>
//             </div>
//             <div className="days-list">
//                 {schedule.map((day, index) => (
//                     <div key={index} className={`day-row ${day.is_active ? 'active' : ''}`}>
//                         <div className="day-toggle">
//                             <input type="checkbox" checked={day.is_active} onChange={() => toggleActive(index)} className="toggle-checkbox" />
//                             <span className="day-label">{day.day_name}</span>
//                         </div>
//                         {day.is_active ? (
//                             <div className="time-inputs">
//                                 <TimeInput label="Start" value={day.start_time} onChange={(v) => handleTimeChange(index, 'start_time', v)} />
//                                 <TimeInput label="End" value={day.end_time} onChange={(v) => handleTimeChange(index, 'end_time', v)} />
//                                 <TimeInput label="Lunch In" value={day.break_start} onChange={(v) => handleTimeChange(index, 'break_start', v)} />
//                                 <TimeInput label="Lunch Out" value={day.break_end} onChange={(v) => handleTimeChange(index, 'break_end', v)} />
//                             </div>
//                         ) : ( <span className="unavailable-text">Currently Unavailable</span> )}
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// };

// /* --- 2. PORTFOLIO COMPONENT --- */
// const PortfolioSection = ({ portfolio, refreshData }) => {
//     const fileInputRef = useRef(null);
//     const token = localStorage.getItem('access') || localStorage.getItem('token');

//     const handleUpload = async (e) => {
//         const file = e.target.files[0];
//         if (!file) return;
//         const formData = new FormData();
//         formData.append('image', file);
//         try {
//             const res = await fetch(`${API_BASE_URL}/api/auth/dashboard/portfolio/`, {
//                 method: 'POST',
//                 headers: { 'Authorization': `Bearer ${token}` },
//                 body: formData
//             });
//             if (res.ok) refreshData();
//             else alert("Upload failed.");
//         } catch (error) { console.error("Upload error:", error); }
//     };

//     const handleDelete = async (id) => {
//         if (!confirm("Delete this image?")) return;
//         try {
//             const res = await fetch(`${API_BASE_URL}/api/auth/dashboard/portfolio/${id}/`, {
//                 method: 'DELETE',
//                 headers: { 'Authorization': `Bearer ${token}` }
//             });
//             if (res.ok) refreshData();
//         } catch (error) { console.error("Delete error:", error); }
//     };

//     return (
//         <div className="schedule-card">
//             <div className="card-header">
//                 <div>
//                     <h3 style={{ fontSize: '20px', margin: 0, fontWeight: 'bold', color: 'white' }}>Portfolio Gallery</h3>
//                     <p style={{ color: '#a1a1aa', fontSize: '14px', margin: '4px 0 0' }}>Showcase your best work.</p>
//                 </div>
//                 <button onClick={() => fileInputRef.current.click()} className="save-btn-primary">
//                     <Plus size={18} /> Upload New
//                 </button>
//                 <input type="file" ref={fileInputRef} onChange={handleUpload} hidden accept="image/*" />
//             </div>
//             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
//                 <div onClick={() => fileInputRef.current.click()} style={{ height: '200px', border: '2px dashed #333', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#666', backgroundColor: 'rgba(255,255,255,0.02)' }}>
//                     <Upload size={32} style={{ marginBottom: '10px' }} />
//                     <span>Upload Image</span>
//                 </div>
//                 {portfolio && portfolio.map(img => (
//                     <div key={img.id} style={{ position: 'relative', height: '200px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #333' }}>
//                         <img src={img.image.startsWith('http') ? img.image : `${API_BASE_URL}${img.image}`} alt="Portfolio" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
//                         <button onClick={() => handleDelete(img.id)} style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(220, 38, 38, 0.9)', border: 'none', color: 'white', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
//                             <Trash2 size={16} />
//                         </button>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// };

// /* --- 3. SETTINGS COMPONENT --- */
// const SettingsSection = ({ userData, refreshData }) => {
//     const [formData, setFormData] = useState({
//         bio: userData.bio || '',
//         styles: userData.styles || '',
//         city: userData.city || '',
//         shop_name: userData.shop_name || '',
//         instagram_link: userData.instagram_link || '',
//     });
//     const [isSaving, setIsSaving] = useState(false);
//     const fileInputRef = useRef(null);
//     const token = localStorage.getItem('access') || localStorage.getItem('token');

//     const handleChange = (e) => {
//         setFormData({ ...formData, [e.target.name]: e.target.value });
//     };

//     const handleSave = async () => {
//         setIsSaving(true);
//         try {
//             const res = await fetch(`${API_BASE_URL}/api/auth/dashboard/settings/`, {
//                 method: 'PATCH',
//                 headers: { 
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${token}`
//                 },
//                 body: JSON.stringify(formData)
//             });

//             if (res.ok) {
//                 alert("✅ Settings Updated!");
//                 refreshData(); 
//             } else {
//                 alert("❌ Failed to update settings.");
//             }
//         } catch (e) {
//             console.error(e);
//             alert("Connection Error");
//         } finally {
//             setIsSaving(false);
//         }
//     };

//     const handleProfilePicUpload = async (e) => {
//         const file = e.target.files[0];
//         if (!file) return;

//         const uploadData = new FormData();
//         uploadData.append('profile_picture', file);

//         try {
//             const res = await fetch(`${API_BASE_URL}/api/auth/dashboard/settings/`, {
//                 method: 'PATCH',
//                 headers: { 'Authorization': `Bearer ${token}` },
//                 body: uploadData
//             });

//             if (res.ok) {
//                 refreshData();
//             } else {
//                 alert("❌ Failed to upload profile picture.");
//             }
//         } catch (e) { console.error(e); }
//     };

//     return (
//         <div className="schedule-card">
//             <div className="card-header">
//                 <div>
//                     <h3 style={{ fontSize: '20px', margin: 0, fontWeight: 'bold', color: 'white' }}>Studio Settings</h3>
//                     <p style={{ color: '#a1a1aa', fontSize: '14px', margin: '4px 0 0' }}>Update your profile details.</p>
//                 </div>
//                 <button onClick={handleSave} disabled={isSaving} className="save-btn-primary">
//                     <Save size={18} /> {isSaving ? "Saving..." : "Save Changes"}
//                 </button>
//             </div>

//             <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
//                 <div style={{ textAlign: 'center' }}>
//                     <div style={{ width: '150px', height: '150px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 20px', border: '2px solid #333', backgroundColor: '#111' }}>
//                          {userData?.profile_picture ? (
//                             <img src={userData.profile_picture.startsWith('http') ? userData.profile_picture : `${API_BASE_URL}${userData.profile_picture}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
//                         ) : (
//                             <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={50} color="#555"/></div>
//                         )}
//                     </div>
//                     <button onClick={() => fileInputRef.current.click()} style={{ background: '#333', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>
//                         Change Picture
//                     </button>
//                     <input type="file" ref={fileInputRef} onChange={handleProfilePicUpload} hidden accept="image/*" />
//                 </div>

//                 <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
//                     <InputGroup icon={<Type size={16}/>} label="Bio" name="bio" value={formData.bio} onChange={handleChange} textarea />
//                     <InputGroup icon={<Settings size={16}/>} label="Styles (e.g. Realism, Traditional)" name="styles" value={formData.styles} onChange={handleChange} />
//                     <InputGroup icon={<MapPin size={16}/>} label="City / Location" name="city" value={formData.city} onChange={handleChange} />
//                     <InputGroup icon={<DollarSign size={16}/>} label="Shop Name" name="shop_name" value={formData.shop_name} onChange={handleChange} />
//                     <InputGroup icon={<Instagram size={16}/>} label="Instagram Link" name="instagram_link" value={formData.instagram_link} onChange={handleChange} />
//                 </div>
//             </div>
//         </div>
//     );
// };

// /* --- 4. REVENUE COMPONENT (UPDATED WITH PERIOD FILTERS & SHOP REVENUE) --- */   
// const RevenueSection = () => {
//     const [period, setPeriod] = useState('7days');
//     const [stats, setStats] = useState({ 
//         total_revenue: 0, // From Shop Sales
//         order_count: 0,
//         paidDeposits: 0, 
//         pendingDeposits: 0 
//     });
//     const [paidTransactions, setPaidTransactions] = useState([]);
//     const [loading, setLoading] = useState(true);

    
//     const handleDownloadPDF = () => {
//     console.log("PDF Process Started");
//     try {
//         const doc = new jsPDF();

//         // Safe Math
//         const shopRev = Number(stats?.total_revenue || 0);
//         const apptRev = Number(stats?.paidDeposits || 0);

//         doc.setFontSize(20);
//         doc.setTextColor(99, 102, 241);
//         doc.text("INKSPIRE FINANCIAL REPORT", 14, 22);

//         // THE FIX: Call the function directly and pass the 'doc'
//         autoTable(doc, {
//             startY: 35,
//             head: [['Revenue Stream', 'Total Amount']],
//             body: [
//                 ["Shop Product Sales", `$${shopRev.toFixed(2)}`],
//                 ["Appointment Deposits", `$${apptRev.toFixed(2)}`],
//                 ["Total Gross Revenue", `$${(shopRev + apptRev).toFixed(2)}`]
//             ],
//             headStyles: { fillColor: [99, 102, 241] },
//             theme: 'striped'
//         });

//         console.log("Table generated, attempting save...");
//         doc.save(`Inkspire_Report_${period}.pdf`);
//         console.log("PDF Saved successfully!");

//     } catch (err) {
//         console.error("PDF CRASH DETAILS:", err);
//         alert("PDF Error: " + err.message);
//     }
// };
    
    

//     useEffect(() => {
//         const fetchAllFinancials = async () => {
//             setLoading(true);
//             const token = localStorage.getItem('access') || localStorage.getItem('token');
//             try {
//                 // 1. Fetch Shop Revenue from the new API endpoint
//                 const shopRes = await fetch(`${API_BASE_URL}/api/shop/revenue/?period=${period}`, {
//                     headers: { 'Authorization': `Bearer ${token}` }
//                 });
//                 const shopData = await shopRes.json();

//                 // 2. Fetch Appointments for Deposits
//                 const apptRes = await fetch(`${API_BASE_URL}/api/appointments/artist/list/`, {
//                     headers: { 'Authorization': `Bearer ${token}` }
//                 });
//                 const apptData = await apptRes.json();
//                 const appts = apptData.appointments || [];

//                 const paidDeps = appts
//                     .filter(a => a.is_deposit_paid && a.status !== 'cancelled')
//                     .reduce((sum, a) => sum + parseFloat(a.deposit_amount || 0), 0);

//                 const pendingDeps = appts
//                     .filter(a => a.status === 'confirmed' && !a.is_deposit_paid)
//                     .reduce((sum, a) => sum + parseFloat(a.deposit_amount || 0), 0);

//                 setStats({
//                     total_revenue: shopData.total_revenue || 0,
//                     order_count: shopData.order_count || 0,
//                     paidDeposits: paidDeps,
//                     pendingDeposits: pendingDeps
//                 });
                
//                 setPaidTransactions(appts.filter(a => a.is_deposit_paid));

//             } catch (err) {
//                 console.error("Financial fetch error:", err);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchAllFinancials();
//     }, [period]); 

//     return (
//         <div className="schedule-card">
//             <div className="card-header">
//                 <div>
//                     <h3 style={{ fontSize: '20px', margin: 0, fontWeight: 'bold', color: 'white' }}>Financial Overview</h3>
//                     <p style={{ color: '#a1a1aa', fontSize: '14px', margin: '4px 0 0' }}>Track your revenue across shop sales and bookings.</p>
//                 </div>
//                 <div style={{ display: 'flex', gap: '10px' }}>
//                     <button 
//                         className="save-btn-primary" 
//                         style={{ background: '#10b981' }} 
//                         onClick={handleDownloadPDF}
//                     >
//                         <FileText size={18} /> Export PDF
//                     </button>
//                     <select 
//                         value={period} 
//                         onChange={(e) => setPeriod(e.target.value)}
//                         style={{ background: '#27272a', color: 'white', border: '1px solid #3f3f46', borderRadius: '6px', padding: '5px 10px', outline: 'none' }}
//                     >
//                         <option value="7days">Last 7 Days</option>
//                         <option value="month">Last 30 Days</option>
//                         <option value="year">Last Year</option>
//                         <option value="all">All Time</option>
//                     </select>
//                     <button className="save-btn-primary" onClick={() => alert("Payout feature coming soon!")}>
//                         <DollarSign size={18} /> Withdraw
//                     </button>
//                 </div>
//             </div>

//             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
//                 <StatCard 
//                     label="Shop Revenue" 
//                     value={`$${stats.total_revenue.toFixed(2)}`} 
//                     icon={<TrendingUp size={24} color="#6366f1" />} 
//                     color="rgba(99, 102, 241, 0.1)"
//                 />
//                 <StatCard 
//                     label="Deposits Collected" 
//                     value={`$${stats.paidDeposits.toFixed(2)}`} 
//                     icon={<DollarSign size={24} color="#10b981" />} 
//                     color="rgba(16, 185, 129, 0.1)"
//                 />
//                 <StatCard 
//                     label="Pending Deposits" 
//                     value={`$${stats.pendingDeposits.toFixed(2)}`} 
//                     icon={<Clock size={24} color="#f59e0b" />} 
//                     color="rgba(245, 158, 11, 0.1)"
//                 />
//             </div>

//             <h4 style={{ color: 'white', marginBottom: '15px' }}>Transaction History</h4>
//             <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #27272a', borderRadius: '12px', overflow: 'hidden' }}>
//                 {paidTransactions.length === 0 ? (
//                     <div style={{ padding: '40px', textAlign: 'center', color: '#a1a1aa' }}>
//                         <p>No transactions found for this period.</p>
//                     </div>
//                 ) : (
//                     <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e4e4e7', fontSize: '14px' }}>
//                         <thead>
//                             <tr style={{ backgroundColor: '#18181b', borderBottom: '1px solid #3f3f46', textAlign: 'left' }}>
//                                 <th style={{ padding: '12px 16px', color: '#a1a1aa' }}>Client</th>
//                                 <th style={{ padding: '12px 16px', color: '#a1a1aa' }}>Date</th>
//                                 <th style={{ padding: '12px 16px', color: '#a1a1aa' }}>Status</th>
//                                 <th style={{ padding: '12px 16px', color: '#a1a1aa', textAlign: 'right' }}>Amount</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {paidTransactions.map(t => (
//                                 <tr key={t.id} style={{ borderBottom: '1px solid #27272a' }}>
//                                     <td style={{ padding: '12px 16px' }}>{t.customer_name}</td>
//                                     <td style={{ padding: '12px 16px' }}>{new Date(t.appointment_datetime).toLocaleDateString()}</td>
//                                     <td style={{ padding: '12px 16px' }}>
//                                         <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
//                                             Paid
//                                         </span>
//                                     </td>
//                                     <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>
//                                         +${t.deposit_amount}
//                                     </td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 )}
//             </div>
//         </div>
//     );
// };
// /* --- UTILS --- */
// const StatCard = ({ label, value, icon, color }) => (
//     <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
//         <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//             {icon}
//         </div>
//         <div>
//             <div style={{ color: '#a1a1aa', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>{label}</div>
//             <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>{value}</div>
//         </div>
//     </div>
// );

// const InputGroup = ({ icon, label, name, value, onChange, textarea }) => (
//     <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
//         <label style={{ color: '#a1a1aa', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
//             {icon} {label}
//         </label>
//         {textarea ? (
//             <textarea 
//                 name={name} value={value} onChange={onChange} rows="4"
//                 style={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: 'white', padding: '10px', fontFamily: 'inherit', outline: 'none' }}
//             />
//         ) : (
//             <input 
//                 type="text" name={name} value={value} onChange={onChange}
//                 style={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: 'white', padding: '10px', outline: 'none' }}
//             />
//         )}
//     </div>
// );

// const NavButton = ({ icon, label, active, onClick }) => (
//   <button onClick={onClick} className={`nav-btn ${active ? 'active' : ''}`}>
//     {icon} <span className="nav-label">{label}</span>
//   </button>
// );

// const TimeInput = ({ label, value, onChange }) => (
//     <div className="input-group">
//         <label className="input-label">{label}</label>
//         <input type="time" value={value ? value.slice(0,5) : ""} onChange={(e) => onChange(e.target.value)} className="time-field" />
//     </div>
// );

// const getHeaderTitle = (tab) => {
//     switch(tab) {
//         case 'appointments': return 'Appointment Requests';
//         case 'schedule': return 'Weekly Schedule';
//         case 'profile': return 'Portfolio Gallery';
//         case 'revenue': return 'Financial Overview';
//         case 'settings': return 'Studio Settings';
//         default: return 'Dashboard';
//     }
// };

// export default ArtistDashboard;


import React, { useState, useEffect, useRef } from 'react';
import { 
    Clock, Camera, DollarSign, Save, LogOut, 
    Settings, User, Upload, Trash2, Plus, MapPin, 
    Instagram, Type, TrendingUp, CheckCircle, 
    AlertCircle, LayoutDashboard, CreditCard, FileText,
    Heart, ChevronDown, ChevronUp, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ArtistDashboard.css';
import ArtistAppointments from '../components/Dashboard/ArtistAppointments';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

const API_BASE_URL = 'http://localhost:8000';

const STAGES = [
  { id: 1, range: [1, 3],   label: "Initial Healing",    days: "Days 1–3",   color: "#E24B4A", bg: "rgba(226,75,74,0.08)"   },
  { id: 2, range: [4, 7],   label: "Peeling Phase",      days: "Days 4–7",   color: "#EF9F27", bg: "rgba(239,159,39,0.08)"  },
  { id: 3, range: [8, 14],  label: "Itching & Settling", days: "Days 8–14",  color: "#1D9E75", bg: "rgba(29,158,117,0.08)"  },
  { id: 4, range: [15, 28], label: "Full Surface Heal",  days: "Days 15–28", color: "#378ADD", bg: "rgba(55,138,221,0.08)"  },
];

function getStageColor(day) {
  const s = STAGES.find(s => day >= s.range[0] && day <= s.range[1]);
  return s ? s.color : "#666";
}
function getStage(day) {
  return STAGES.find(s => day >= s.range[0] && day <= s.range[1]);
}
function daysSince(dateStr) {
  if (!dateStr) return 1;
  return Math.min(Math.floor((new Date() - new Date(dateStr)) / 86400000) + 1, 28);
}

// ─── Healing Notes Section ────────────────────────────────────────────────────

const HealingNotesSection = ({ clients }) => {
  const [selectedClientId, setSelectedClientId] = useState(clients?.[0]?.id || null);
  const [notesMap, setNotesMap] = useState({});
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [openDay, setOpenDay] = useState(null);
  const [addMode, setAddMode] = useState(false);
  const [newDay, setNewDay] = useState('');
  const [newText, setNewText] = useState('');
  const [activeStageFilter, setActiveStageFilter] = useState(null);
  const token = localStorage.getItem('access') || localStorage.getItem('token');

  const selectedClient = clients?.find(c => c.id === selectedClientId);

  useEffect(() => {
    if (!selectedClientId) return;
    setLoadingNotes(true);
    fetch(`${API_BASE_URL}/api/healing-notes/${selectedClientId}/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : {})
      .then(data => {
        setNotesMap(prev => ({ ...prev, [selectedClientId]: data.notes || {} }));
      })
      .catch(() => {})
      .finally(() => setLoadingNotes(false));
  }, [selectedClientId]);

  const currentNotes = notesMap[selectedClientId] || {};

  const handleChange = (day, val) => {
    setNotesMap(prev => ({
      ...prev,
      [selectedClientId]: { ...prev[selectedClientId], [day]: val }
    }));
  };

  const handleDelete = (day) => {
    setNotesMap(prev => {
      const updated = { ...prev[selectedClientId] };
      delete updated[day];
      return { ...prev, [selectedClientId]: updated };
    });
  };

  const handleAdd = () => {
    const d = parseInt(newDay);
    if (!d || d < 1 || d > 28 || !newText.trim()) return;
    setNotesMap(prev => ({
      ...prev,
      [selectedClientId]: { ...prev[selectedClientId], [d]: newText.trim() }
    }));
    setNewDay(''); setNewText(''); setAddMode(false);
    setOpenDay(d);
  };

  const handleSave = async () => {
    setSavingNotes(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/healing-notes/${selectedClientId}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ notes: currentNotes })
      });
      if (res.ok) {
        setSavedFeedback(true);
        setTimeout(() => setSavedFeedback(false), 2500);
      } else {
        alert('Failed to save notes.');
      }
    } catch {
      alert('Connection error.');
    } finally {
      setSavingNotes(false);
    }
  };

  const sortedDays = Object.keys(currentNotes).map(Number).sort((a, b) => a - b);
  const filteredDays = activeStageFilter
    ? sortedDays.filter(d => getStage(d)?.id === activeStageFilter)
    : sortedDays;

  if (!clients || clients.length === 0) {
    return (
      <div className="schedule-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Heart size={40} color="#444" style={{ marginBottom: 16 }} />
        <p style={{ color: '#a1a1aa' }}>No active clients with healing sessions found.</p>
      </div>
    );
  }

  return (
    <div className="healing-notes-layout">

      {/* ── Client list ── */}
      <div className="healing-client-list">
        <p className="healing-list-heading">Active Clients</p>
        {clients.map(client => {
          const currentDay = daysSince(client.tattoo_start_date);
          const noteCount = Object.keys(notesMap[client.id] || {}).length;
          const isSelected = client.id === selectedClientId;
          const stageColor = getStageColor(currentDay);
          const initials = client.customer_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CL';

          return (
            <button
              key={client.id}
              onClick={() => setSelectedClientId(client.id)}
              className={`healing-client-card ${isSelected ? 'selected' : ''}`}
              style={{ borderLeftColor: isSelected ? stageColor : 'transparent' }}
            >
              <div className="healing-client-avatar" style={{ background: stageColor + '22', color: stageColor, border: `1.5px solid ${stageColor}44` }}>
                {initials}
              </div>
              <div className="healing-client-info">
                <p className="healing-client-name">{client.customer_name}</p>
                <p className="healing-client-sub">{client.tattoo_description || 'Tattoo session'}</p>
              </div>
              <div className="healing-client-meta">
                <span style={{ color: stageColor, fontSize: 12, fontWeight: 700 }}>Day {currentDay}</span>
                <span style={{ color: '#555', fontSize: 11 }}>{noteCount} note{noteCount !== 1 ? 's' : ''}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Note editor ── */}
      <div className="healing-editor-pane">
        {loadingNotes ? (
          <div style={{ padding: 40, color: '#555', textAlign: 'center' }}>Loading notes...</div>
        ) : (
          <>
            <div className="card-header" style={{ marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 20, margin: 0, fontWeight: 'bold', color: 'white' }}>
                  {selectedClient?.customer_name || 'Client'} — Healing Notes
                </h3>
                <p style={{ color: '#a1a1aa', fontSize: 14, margin: '4px 0 0' }}>
                  Notes appear in the client's day-by-day tracker
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {savedFeedback && (
                  <span style={{ fontSize: 13, color: '#1D9E75', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <CheckCircle size={15} /> Saved
                  </span>
                )}
                <button onClick={handleSave} disabled={savingNotes} className="save-btn-primary">
                  <Save size={18} /> {savingNotes ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </div>

            {/* Stage filter pills */}
            <div className="healing-stage-pills">
              <button
                onClick={() => setActiveStageFilter(null)}
                className={`healing-stage-pill ${!activeStageFilter ? 'active-all' : ''}`}
              >
                All days
              </button>
              {STAGES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveStageFilter(activeStageFilter === s.id ? null : s.id)}
                  className="healing-stage-pill"
                  style={{
                    background: activeStageFilter === s.id ? s.bg : 'transparent',
                    border: `1px solid ${activeStageFilter === s.id ? s.color : '#2a2a2a'}`,
                    color: activeStageFilter === s.id ? s.color : '#555',
                  }}
                >
                  {s.days}
                </button>
              ))}
            </div>

            {/* Notes list */}
            <div className="healing-notes-list">
              {filteredDays.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#444' }}>
                  No notes for this stage yet. Use the button below to add one.
                </div>
              )}
              {filteredDays.map(day => {
                const stageColor = getStageColor(day);
                const currentDay = daysSince(selectedClient?.tattoo_start_date);
                const isPast    = day < currentDay;
                const isCurrent = day === currentDay;
                const isFuture  = day > currentDay;
                const isOpen    = openDay === day;

                return (
                  <div
                    key={day}
                    className="healing-note-row"
                    style={{ borderLeft: `3px solid ${stageColor}`, opacity: isFuture ? 0.7 : 1 }}
                  >
                    <button className="healing-note-header" onClick={() => setOpenDay(isOpen ? null : day)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: stageColor, minWidth: 52 }}>
                          Day {day}
                        </span>
                        {isCurrent && <span className="hn-badge hn-badge-today">today</span>}
                        {isPast    && <span className="hn-badge hn-badge-sent">sent</span>}
                        {isFuture  && <span className="hn-badge hn-badge-upcoming">upcoming</span>}
                        <span style={{ fontSize: 12, color: '#555', marginLeft: 4 }}>
                          {currentNotes[day]?.slice(0, 55)}{currentNotes[day]?.length > 55 ? '…' : ''}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          role="button"
                          onClick={e => { e.stopPropagation(); handleDelete(day); }}
                          className="hn-delete-btn"
                          title="Remove note"
                        >
                          <X size={13} />
                        </span>
                        {isOpen ? <ChevronUp size={15} color="#555" /> : <ChevronDown size={15} color="#555" />}
                      </div>
                    </button>

                    {isOpen && (
                      <textarea
                        value={currentNotes[day] || ''}
                        onChange={e => handleChange(day, e.target.value)}
                        rows={3}
                        placeholder="Write aftercare instructions for this day…"
                        className="hn-textarea"
                        style={{ borderColor: isCurrent ? stageColor + '55' : '#1e1e1e' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add note */}
            {addMode ? (
              <div className="hn-add-box">
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input
                    type="number" min={1} max={28}
                    placeholder="Day (1–28)"
                    value={newDay}
                    onChange={e => setNewDay(e.target.value)}
                    className="hn-input"
                    style={{ width: 150 }}
                  />
                  <button onClick={() => setAddMode(false)} className="hn-cancel-btn">Cancel</button>
                </div>
                <textarea
                  placeholder="Write your aftercare note for this day…"
                  value={newText}
                  onChange={e => setNewText(e.target.value)}
                  rows={3}
                  className="hn-textarea"
                />
                <button
                  onClick={handleAdd}
                  disabled={!newDay || !newText.trim()}
                  className="save-btn-primary"
                  style={{ marginTop: 10, opacity: newDay && newText.trim() ? 1 : 0.4 }}
                >
                  Add Note
                </button>
              </div>
            ) : (
              <button onClick={() => setAddMode(true)} className="hn-add-trigger">
                <Plus size={16} /> Add note for a specific day
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const ArtistDashboard = () => {
  const [activeTab, setActiveTab] = useState('appointments'); 
  const [artistData, setArtistData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [healingClients, setHealingClients] = useState([]);
  const navigate = useNavigate();
  
  const auth = useAuth();
  const logoutUser = auth?.logoutUser || (() => window.location.href = '/login');

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('access') || localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }
      const res = await fetch(`${API_BASE_URL}/api/auth/dashboard/`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) { logoutUser(); return; }
      if (!res.ok) throw new Error("Failed to fetch data");
      const data = await res.json();
      setArtistData(data);
      setLoading(false);
    } catch (error) {
        console.error("Error fetching dashboard:", error);
        setError("Could not load studio data.");
        setLoading(false);
    }
  };

  // Fetch healing clients only when that tab is opened
  useEffect(() => {
    if (activeTab !== 'healing') return;
    const token = localStorage.getItem('access') || localStorage.getItem('token');
    fetch(`${API_BASE_URL}/api/appointments/artist/list/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : { appointments: [] })
      .then(data => {
        const active = (data.appointments || []).filter(
          a => a.status !== 'cancelled' && a.tattoo_start_date
        );
        setHealingClients(active);
      })
      .catch(() => setHealingClients([]));
  }, [activeTab]);

  useEffect(() => { fetchDashboard(); }, []);

  if (loading) return <div className="loading-screen">LOADING STUDIO...</div>;
  if (error || !artistData) return (
      <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
          <h2 style={{color: 'white'}}>Unable to load Dashboard</h2>
          <button onClick={() => window.location.reload()} className="save-btn-primary">Retry Connection</button>
          <button onClick={logoutUser} style={{color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer'}}>Log Out</button>
      </div>
  );

  return (
    <div className="dashboard-container">
      <aside className="dashboard-sidebar">
        <div>
            <div className="logo-section">
                <div className="logo-icon"></div>
                <h2 className="brand-name">INKSPIRE</h2>
            </div>
            <div className="artist-snippet">
                <div className="snippet-avatar">
                    {artistData?.profile_picture ? (
                        <img src={artistData.profile_picture.startsWith('http') ? artistData.profile_picture : `${API_BASE_URL}${artistData.profile_picture}`} alt="Profile" />
                    ) : (
                        <User color="#a1a1aa" size={20} />
                    )}
                </div>
                <div className="snippet-info">
                    <p className="role-label">Artist</p>
                    <p className="artist-name">{artistData?.username}</p>
                </div>
            </div>
            <nav className="nav-menu">
                <NavButton icon={<LayoutDashboard size={20}/>} label="Appointments" active={activeTab === 'appointments'} onClick={() => setActiveTab('appointments')} />
                <NavButton icon={<Clock size={20}/>}           label="Schedule"     active={activeTab === 'schedule'}     onClick={() => setActiveTab('schedule')} />
                <NavButton icon={<Camera size={20}/>}          label="Portfolio"    active={activeTab === 'profile'}      onClick={() => setActiveTab('profile')} />
                <NavButton icon={<DollarSign size={20}/>}      label="Revenue"      active={activeTab === 'revenue'}      onClick={() => setActiveTab('revenue')} />
                <NavButton icon={<Heart size={20}/>}           label="Healing"      active={activeTab === 'healing'}      onClick={() => setActiveTab('healing')} />
                <NavButton icon={<Settings size={20}/>}        label="Settings"     active={activeTab === 'settings'}     onClick={() => setActiveTab('settings')} />
            </nav>
        </div>
        <button onClick={logoutUser} className="logout-btn">
            <LogOut size={18} /> <span>Sign Out</span>
        </button>
      </aside>

      <main className="dashboard-content">
        <div className="content-wrapper">
            <header className="header-section">
                <div className="header-title">
                    <h1>{getHeaderTitle(activeTab)}</h1>
                    <p>Manage your studio presence and availability.</p>
                </div>
                <div className="date-display">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </header>
            <div className="tab-body">
                {activeTab === 'appointments' && <ArtistAppointments />}
                {activeTab === 'schedule'     && <ScheduleSection schedule={artistData.schedule} />}
                {activeTab === 'profile'      && <PortfolioSection portfolio={artistData.portfolio} refreshData={fetchDashboard} />}
                {activeTab === 'settings'     && <SettingsSection userData={artistData} refreshData={fetchDashboard} />}
                {activeTab === 'revenue'      && <RevenueSection />}
                {activeTab === 'healing'      && <HealingNotesSection clients={healingClients} />}
            </div>
        </div>
      </main>
    </div>
  );
};


/* --- 1. SCHEDULE COMPONENT --- */
const ScheduleSection = ({ schedule: initialSchedule }) => {
    const [schedule, setSchedule] = useState(initialSchedule || []);
    const [isSaving, setIsSaving] = useState(false);
    if (!schedule || schedule.length === 0) return <div style={{color:'white'}}>No schedule data.</div>;
    const handleTimeChange = (index, field, value) => {
        const newSchedule = [...schedule]; newSchedule[index][field] = value; setSchedule(newSchedule);
    };
    const toggleActive = (index) => {
        const newSchedule = [...schedule]; newSchedule[index].is_active = !newSchedule[index].is_active; setSchedule(newSchedule);
    };
    const saveSchedule = async () => {
         setIsSaving(true);
         const token = localStorage.getItem('access') || localStorage.getItem('token');
         try {
             const res = await fetch(`${API_BASE_URL}/api/auth/dashboard/schedule/`, {
                 method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(schedule)
             });
             if(res.ok) alert("✅ Schedule Saved!"); else alert("❌ Error saving schedule");
         } catch (e) { alert("Connection Error"); } finally { setIsSaving(false); }
    };
    return (
        <div className="schedule-card">
            <div className="card-header">
                <div><h3 style={{ fontSize: '20px', margin: 0, fontWeight: 'bold', color: 'white' }}>Working Hours</h3><p style={{ color: '#a1a1aa', fontSize: '14px', margin: '4px 0 0' }}>Set your weekly availability.</p></div>
                <button onClick={saveSchedule} disabled={isSaving} className="save-btn-primary"><Save size={18} /> {isSaving ? "Saving..." : "Save Changes"}</button>
            </div>
            <div className="days-list">
                {schedule.map((day, index) => (
                    <div key={index} className={`day-row ${day.is_active ? 'active' : ''}`}>
                        <div className="day-toggle">
                            <input type="checkbox" checked={day.is_active} onChange={() => toggleActive(index)} className="toggle-checkbox" />
                            <span className="day-label">{day.day_name}</span>
                        </div>
                        {day.is_active ? (
                            <div className="time-inputs">
                                <TimeInput label="Start" value={day.start_time} onChange={(v) => handleTimeChange(index, 'start_time', v)} />
                                <TimeInput label="End" value={day.end_time} onChange={(v) => handleTimeChange(index, 'end_time', v)} />
                                <TimeInput label="Lunch In" value={day.break_start} onChange={(v) => handleTimeChange(index, 'break_start', v)} />
                                <TimeInput label="Lunch Out" value={day.break_end} onChange={(v) => handleTimeChange(index, 'break_end', v)} />
                            </div>
                        ) : ( <span className="unavailable-text">Currently Unavailable</span> )}
                    </div>
                ))}
            </div>
        </div>
    );
};

/* --- 2. PORTFOLIO COMPONENT --- */
const PortfolioSection = ({ portfolio, refreshData }) => {
    const fileInputRef = useRef(null);
    const token = localStorage.getItem('access') || localStorage.getItem('token');
    const handleUpload = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        const formData = new FormData(); formData.append('image', file);
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/dashboard/portfolio/`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
            if (res.ok) refreshData(); else alert("Upload failed.");
        } catch (error) { console.error("Upload error:", error); }
    };
    const handleDelete = async (id) => {
        if (!confirm("Delete this image?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/dashboard/portfolio/${id}/`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) refreshData();
        } catch (error) { console.error("Delete error:", error); }
    };
    return (
        <div className="schedule-card">
            <div className="card-header">
                <div><h3 style={{ fontSize: '20px', margin: 0, fontWeight: 'bold', color: 'white' }}>Portfolio Gallery</h3><p style={{ color: '#a1a1aa', fontSize: '14px', margin: '4px 0 0' }}>Showcase your best work.</p></div>
                <button onClick={() => fileInputRef.current.click()} className="save-btn-primary"><Plus size={18} /> Upload New</button>
                <input type="file" ref={fileInputRef} onChange={handleUpload} hidden accept="image/*" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                <div onClick={() => fileInputRef.current.click()} style={{ height: '200px', border: '2px dashed #333', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#666', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <Upload size={32} style={{ marginBottom: '10px' }} /><span>Upload Image</span>
                </div>
                {portfolio && portfolio.map(img => (
                    <div key={img.id} style={{ position: 'relative', height: '200px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #333' }}>
                        <img src={img.image.startsWith('http') ? img.image : `${API_BASE_URL}${img.image}`} alt="Portfolio" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button onClick={() => handleDelete(img.id)} style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(220, 38, 38, 0.9)', border: 'none', color: 'white', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={16} /></button>
                    </div>
                ))}
            </div>
        </div>
    );
};

/* --- 3. SETTINGS COMPONENT --- */
const SettingsSection = ({ userData, refreshData }) => {
    const [formData, setFormData] = useState({ bio: userData.bio || '', styles: userData.styles || '', city: userData.city || '', shop_name: userData.shop_name || '', instagram_link: userData.instagram_link || '' });
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef(null);
    const token = localStorage.getItem('access') || localStorage.getItem('token');
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/dashboard/settings/`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(formData) });
            if (res.ok) { alert("✅ Settings Updated!"); refreshData(); } else alert("❌ Failed to update settings.");
        } catch (e) { console.error(e); alert("Connection Error"); } finally { setIsSaving(false); }
    };
    const handleProfilePicUpload = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        const uploadData = new FormData(); uploadData.append('profile_picture', file);
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/dashboard/settings/`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` }, body: uploadData });
            if (res.ok) refreshData(); else alert("❌ Failed to upload profile picture.");
        } catch (e) { console.error(e); }
    };
    return (
        <div className="schedule-card">
            <div className="card-header">
                <div><h3 style={{ fontSize: '20px', margin: 0, fontWeight: 'bold', color: 'white' }}>Studio Settings</h3><p style={{ color: '#a1a1aa', fontSize: '14px', margin: '4px 0 0' }}>Update your profile details.</p></div>
                <button onClick={handleSave} disabled={isSaving} className="save-btn-primary"><Save size={18} /> {isSaving ? "Saving..." : "Save Changes"}</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '150px', height: '150px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 20px', border: '2px solid #333', backgroundColor: '#111' }}>
                         {userData?.profile_picture ? (
                            <img src={userData.profile_picture.startsWith('http') ? userData.profile_picture : `${API_BASE_URL}${userData.profile_picture}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : ( <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={50} color="#555"/></div> )}
                    </div>
                    <button onClick={() => fileInputRef.current.click()} style={{ background: '#333', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>Change Picture</button>
                    <input type="file" ref={fileInputRef} onChange={handleProfilePicUpload} hidden accept="image/*" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <InputGroup icon={<Type size={16}/>}       label="Bio"                                name="bio"            value={formData.bio}            onChange={handleChange} textarea />
                    <InputGroup icon={<Settings size={16}/>}   label="Styles (e.g. Realism, Traditional)" name="styles"         value={formData.styles}         onChange={handleChange} />
                    <InputGroup icon={<MapPin size={16}/>}     label="City / Location"                    name="city"           value={formData.city}           onChange={handleChange} />
                    <InputGroup icon={<DollarSign size={16}/>} label="Shop Name"                          name="shop_name"      value={formData.shop_name}      onChange={handleChange} />
                    <InputGroup icon={<Instagram size={16}/>}  label="Instagram Link"                     name="instagram_link" value={formData.instagram_link} onChange={handleChange} />
                </div>
            </div>
        </div>
    );
};

/* --- 4. REVENUE COMPONENT --- */
const RevenueSection = () => {
    const [period, setPeriod] = useState('7days');
    const [stats, setStats] = useState({ total_revenue: 0, order_count: 0, paidDeposits: 0, pendingDeposits: 0 });
    const [paidTransactions, setPaidTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    const handleDownloadPDF = () => {
        try {
            const doc = new jsPDF();
            const shopRev = Number(stats?.total_revenue || 0);
            const apptRev = Number(stats?.paidDeposits || 0);
            doc.setFontSize(20); doc.setTextColor(99, 102, 241);
            doc.text("INKSPIRE FINANCIAL REPORT", 14, 22);
            autoTable(doc, {
                startY: 35, head: [['Revenue Stream', 'Total Amount']],
                body: [["Shop Product Sales", `$${shopRev.toFixed(2)}`], ["Appointment Deposits", `$${apptRev.toFixed(2)}`], ["Total Gross Revenue", `$${(shopRev + apptRev).toFixed(2)}`]],
                headStyles: { fillColor: [99, 102, 241] }, theme: 'striped'
            });
            doc.save(`Inkspire_Report_${period}.pdf`);
        } catch (err) { console.error("PDF CRASH DETAILS:", err); alert("PDF Error: " + err.message); }
    };

    useEffect(() => {
        const fetchAllFinancials = async () => {
            setLoading(true);
            const token = localStorage.getItem('access') || localStorage.getItem('token');
            try {
                const shopRes = await fetch(`${API_BASE_URL}/api/shop/revenue/?period=${period}`, { headers: { 'Authorization': `Bearer ${token}` } });
                const shopData = await shopRes.json();
                const apptRes = await fetch(`${API_BASE_URL}/api/appointments/artist/list/`, { headers: { 'Authorization': `Bearer ${token}` } });
                const apptData = await apptRes.json();
                const appts = apptData.appointments || [];
                const paidDeps    = appts.filter(a => a.is_deposit_paid && a.status !== 'cancelled').reduce((sum, a) => sum + parseFloat(a.deposit_amount || 0), 0);
                const pendingDeps = appts.filter(a => a.status === 'confirmed' && !a.is_deposit_paid).reduce((sum, a) => sum + parseFloat(a.deposit_amount || 0), 0);
                setStats({ total_revenue: shopData.total_revenue || 0, order_count: shopData.order_count || 0, paidDeposits: paidDeps, pendingDeposits: pendingDeps });
                setPaidTransactions(appts.filter(a => a.is_deposit_paid));
            } catch (err) { console.error("Financial fetch error:", err); } finally { setLoading(false); }
        };
        fetchAllFinancials();
    }, [period]);

    return (
        <div className="schedule-card">
            <div className="card-header">
                <div><h3 style={{ fontSize: '20px', margin: 0, fontWeight: 'bold', color: 'white' }}>Financial Overview</h3><p style={{ color: '#a1a1aa', fontSize: '14px', margin: '4px 0 0' }}>Track your revenue across shop sales and bookings.</p></div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="save-btn-primary" style={{ background: '#10b981' }} onClick={handleDownloadPDF}><FileText size={18} /> Export PDF</button>
                    <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ background: '#27272a', color: 'white', border: '1px solid #3f3f46', borderRadius: '6px', padding: '5px 10px', outline: 'none' }}>
                        <option value="7days">Last 7 Days</option><option value="month">Last 30 Days</option><option value="year">Last Year</option><option value="all">All Time</option>
                    </select>
                    <button className="save-btn-primary" onClick={() => alert("Payout feature coming soon!")}><DollarSign size={18} /> Withdraw</button>
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <StatCard label="Shop Revenue"       value={`$${stats.total_revenue.toFixed(2)}`}  icon={<TrendingUp size={24} color="#6366f1" />} color="rgba(99, 102, 241, 0.1)" />
                <StatCard label="Deposits Collected" value={`$${stats.paidDeposits.toFixed(2)}`}   icon={<DollarSign size={24} color="#10b981" />}  color="rgba(16, 185, 129, 0.1)" />
                <StatCard label="Pending Deposits"   value={`$${stats.pendingDeposits.toFixed(2)}`} icon={<Clock size={24} color="#f59e0b" />}       color="rgba(245, 158, 11, 0.1)" />
            </div>
            <h4 style={{ color: 'white', marginBottom: '15px' }}>Transaction History</h4>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #27272a', borderRadius: '12px', overflow: 'hidden' }}>
                {paidTransactions.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#a1a1aa' }}><p>No transactions found for this period.</p></div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e4e4e7', fontSize: '14px' }}>
                        <thead><tr style={{ backgroundColor: '#18181b', borderBottom: '1px solid #3f3f46', textAlign: 'left' }}>
                            <th style={{ padding: '12px 16px', color: '#a1a1aa' }}>Client</th>
                            <th style={{ padding: '12px 16px', color: '#a1a1aa' }}>Date</th>
                            <th style={{ padding: '12px 16px', color: '#a1a1aa' }}>Status</th>
                            <th style={{ padding: '12px 16px', color: '#a1a1aa', textAlign: 'right' }}>Amount</th>
                        </tr></thead>
                        <tbody>
                            {paidTransactions.map(t => (
                                <tr key={t.id} style={{ borderBottom: '1px solid #27272a' }}>
                                    <td style={{ padding: '12px 16px' }}>{t.customer_name}</td>
                                    <td style={{ padding: '12px 16px' }}>{new Date(t.appointment_datetime).toLocaleDateString()}</td>
                                    <td style={{ padding: '12px 16px' }}><span style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>Paid</span></td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 'bold', color: '#10b981' }}>+${t.deposit_amount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

/* --- UTILS --- */
const StatCard = ({ label, value, icon, color }) => (
    <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        <div>
            <div style={{ color: '#a1a1aa', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>{value}</div>
        </div>
    </div>
);

const InputGroup = ({ icon, label, name, value, onChange, textarea }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ color: '#a1a1aa', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>{icon} {label}</label>
        {textarea
          ? <textarea name={name} value={value} onChange={onChange} rows="4" style={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: 'white', padding: '10px', fontFamily: 'inherit', outline: 'none' }} />
          : <input type="text" name={name} value={value} onChange={onChange} style={{ background: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: 'white', padding: '10px', outline: 'none' }} />
        }
    </div>
);

const NavButton = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`nav-btn ${active ? 'active' : ''}`}>
    {icon} <span className="nav-label">{label}</span>
  </button>
);

const TimeInput = ({ label, value, onChange }) => (
    <div className="input-group">
        <label className="input-label">{label}</label>
        <input type="time" value={value ? value.slice(0,5) : ""} onChange={(e) => onChange(e.target.value)} className="time-field" />
    </div>
);

const getHeaderTitle = (tab) => {
    const titles = { appointments: 'Appointment Requests', schedule: 'Weekly Schedule', profile: 'Portfolio Gallery', revenue: 'Financial Overview', settings: 'Studio Settings', healing: 'Healing Notes' };
    return titles[tab] || 'Dashboard';
};

export default ArtistDashboard;
