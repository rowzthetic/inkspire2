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
  { id: 1, range: [1, 3], label: "Initial Healing", days: "Days 1–3", color: "#E24B4A", bg: "rgba(226,75,74,0.08)" },
  { id: 2, range: [4, 7], label: "Peeling Phase", days: "Days 4–7", color: "#EF9F27", bg: "rgba(239,159,39,0.08)" },
  { id: 3, range: [8, 14], label: "Itching & Settling", days: "Days 8–14", color: "#1D9E75", bg: "rgba(29,158,117,0.08)" },
  { id: 4, range: [15, 28], label: "Full Surface Heal", days: "Days 15–28", color: "#378ADD", bg: "rgba(55,138,221,0.08)" },
];

function getStageColor(day) {
  const s = STAGES.find(s => day >= s.range[0] && day <= s.range[1]);
  return s ? s.color : "#666";
}
function getStage(day) {
  return STAGES.find(s => day >= s.range[0] && day <= s.range[1]);
}
function exactDaysSince(dateStr) {
  if (!dateStr) return 1;
  return Math.floor((new Date() - new Date(dateStr)) / 86400000) + 1;
}

function daysSince(dateStr) {
  if (!dateStr) return 1;
  return Math.min(exactDaysSince(dateStr), 28);
}

// ─── Healing Notes Section ────────────────────────────────────────────────────

const HealingNotesSection = ({ clients }) => {
  const navigate = useNavigate();

  if (!clients || clients.length === 0) {
    return (
      <div className="schedule-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Heart size={40} color="#444" style={{ marginBottom: 16 }} />
        <p style={{ color: '#a1a1aa' }}>No completed tattoo sessions found.</p>
      </div>
    );
  }

  return (
    <div className="schedule-card">
      <div className="card-header" style={{ marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '20px', margin: 0, fontWeight: 'bold', color: 'white' }}>Completed Sessions</h3>
          <p style={{ color: '#a1a1aa', fontSize: '14px', margin: '4px 0 0' }}>History of finished tattoo sessions and their healing progress.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {clients.map(client => {
          const totalDays = exactDaysSince(client.appointment_datetime);
          const sessionDate = new Date(client.appointment_datetime).toLocaleDateString();
          const initials = client.customer_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CL';
          const stageColor = '#378ADD';

          return (
            <div 
              key={client.id}
              className="healing-client-card"
              onClick={() => navigate(`/explore/healing?appt=${client.id}&day=${totalDays}`)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px', 
                padding: '16px', 
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '12px',
                border: '1px solid #27272a',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.borderColor = stageColor + '44';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                e.currentTarget.style.borderColor = '#27272a';
              }}
            >
              <div 
                className="healing-client-avatar" 
                style={{ 
                  background: stageColor + '22', 
                  color: stageColor, 
                  border: `1.5px solid ${stageColor}44`,
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}
              >
                {initials}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: 'white', fontWeight: '600', margin: 0, fontSize: '16px' }}>{client.customer_name}</p>
                <p style={{ color: '#1D9E75', margin: '4px 0 0', fontSize: '14px', fontWeight: '500' }}>
                  Session Date: {sessionDate}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ 
                  background: 'rgba(55, 138, 221, 0.1)', 
                  color: stageColor, 
                  padding: '4px 12px', 
                  borderRadius: '20px', 
                  fontSize: '13px', 
                  fontWeight: '700' 
                }}>
                  Day {totalDays}
                </span>
                <p style={{ color: '#555', fontSize: '12px', margin: '6px 0 0' }}>Healing Status</p>
              </div>
            </div>
          );
        })}
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
        const completedSessions = (data.appointments || []).filter(
          a => a.status === 'completed' && a.appointment_datetime
        );
        setHealingClients(completedSessions);
      })
      .catch(() => setHealingClients([]));
  }, [activeTab]);

  useEffect(() => { fetchDashboard(); }, []);

  if (loading) return <div className="loading-screen">LOADING STUDIO...</div>;
  if (error || !artistData) return (
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
      <h2 style={{ color: 'white' }}>Unable to load Dashboard</h2>
      <button onClick={() => window.location.reload()} className="save-btn-primary">Retry Connection</button>
      <button onClick={logoutUser} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Log Out</button>
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
            <NavButton icon={<LayoutDashboard size={20} />} label="Appointments" active={activeTab === 'appointments'} onClick={() => setActiveTab('appointments')} />
            <NavButton icon={<Clock size={20} />} label="Schedule" active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} />
            <NavButton icon={<Camera size={20} />} label="Portfolio" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
            <NavButton icon={<DollarSign size={20} />} label="Revenue" active={activeTab === 'revenue'} onClick={() => setActiveTab('revenue')} />
            <NavButton icon={<Heart size={20} />} label="Healing" active={activeTab === 'healing'} onClick={() => setActiveTab('healing')} />
            <NavButton icon={<Settings size={20} />} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
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
            {activeTab === 'schedule' && <ScheduleSection schedule={artistData.schedule} />}
            {activeTab === 'profile' && <PortfolioSection portfolio={artistData.portfolio} refreshData={fetchDashboard} />}
            {activeTab === 'settings' && <SettingsSection userData={artistData} refreshData={fetchDashboard} />}
            {activeTab === 'revenue' && <RevenueSection />}
            {activeTab === 'healing' && <HealingNotesSection clients={healingClients} />}
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
  if (!schedule || schedule.length === 0) return <div style={{ color: 'white' }}>No schedule data.</div>;
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
      if (res.ok) alert("✅ Schedule Saved!"); else alert("❌ Error saving schedule");
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
            ) : (<span className="unavailable-text">Currently Unavailable</span>)}
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
            ) : (<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={50} color="#555" /></div>)}
          </div>
          <button onClick={() => fileInputRef.current.click()} style={{ background: '#333', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}>Change Picture</button>
          <input type="file" ref={fileInputRef} onChange={handleProfilePicUpload} hidden accept="image/*" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <InputGroup icon={<Type size={16} />} label="Bio" name="bio" value={formData.bio} onChange={handleChange} textarea />
          <InputGroup icon={<Settings size={16} />} label="Styles (e.g. Realism, Traditional)" name="styles" value={formData.styles} onChange={handleChange} />
          <InputGroup icon={<MapPin size={16} />} label="City / Location" name="city" value={formData.city} onChange={handleChange} />
          <InputGroup icon={<DollarSign size={16} />} label="Shop Name" name="shop_name" value={formData.shop_name} onChange={handleChange} />
          <InputGroup icon={<Instagram size={16} />} label="Instagram Link" name="instagram_link" value={formData.instagram_link} onChange={handleChange} />
        </div>
      </div>
    </div>
  );
};

/* --- 4. REVENUE COMPONENT --- */
const RevenueSection = () => {
  const [period, setPeriod] = useState('7days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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
        let url = `${API_BASE_URL}/api/shop/revenue/?period=${period}`;
        if (period === 'custom' && startDate) {
           url += `&start=${startDate}`;
           if (endDate) url += `&end=${endDate}`;
        }

        const shopRes = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        const shopData = await shopRes.json();
        
        const apptRes = await fetch(`${API_BASE_URL}/api/appointments/artist/list/`, { headers: { 'Authorization': `Bearer ${token}` } });
        const apptData = await apptRes.json();
        let appts = apptData.appointments || [];

        // Apply Filtering in JS for Appointments
        if (period !== 'all') {
            const now = new Date();
            let start = null;
            let end = null;

            if (period === '7days') start = new Date(now.setDate(now.getDate() - 7));
            else if (period === 'month') start = new Date(now.setDate(now.getDate() - 30));
            else if (period === 'year') start = new Date(now.setFullYear(now.getFullYear() - 1));
            else if (period === 'custom' && startDate) {
                start = new Date(startDate);
                if (endDate) end = new Date(endDate);
            }

            if (start) {
              appts = appts.filter(a => {
                const date = new Date(a.appointment_datetime);
                if (end) return date >= start && date <= end;
                return date >= start;
              });
            }
        }

        const paidDeps = appts.filter(a => a.is_deposit_paid && a.status !== 'cancelled').reduce((sum, a) => sum + parseFloat(a.deposit_amount || 0), 0);
        const pendingDeps = appts.filter(a => a.status === 'confirmed' && !a.is_deposit_paid).reduce((sum, a) => sum + parseFloat(a.deposit_amount || 0), 0);
        
        setStats({ total_revenue: shopData.total_revenue || 0, order_count: shopData.order_count || 0, paidDeposits: paidDeps, pendingDeposits: pendingDeps });
        setPaidTransactions(appts.filter(a => a.is_deposit_paid));
      } catch (err) { console.error("Financial fetch error:", err); } finally { setLoading(false); }
    };
    fetchAllFinancials();
  }, [period, startDate, endDate]);

  return (
    <div className="schedule-card">
      <div className="card-header">
        <div><h3 style={{ fontSize: '20px', margin: 0, fontWeight: 'bold', color: 'white' }}>Financial Overview</h3><p style={{ color: '#a1a1aa', fontSize: '14px', margin: '4px 0 0' }}>Track your revenue across shop sales and bookings.</p></div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          
          {period === 'custom' && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ background: '#27272a', color: 'white', border: '1px solid #3f3f46', borderRadius: '4px', padding: '4px 8px', fontSize: '12px' }} />
                  <span style={{ color: '#555' }}>to</span>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ background: '#27272a', color: 'white', border: '1px solid #3f3f46', borderRadius: '4px', padding: '4px 8px', fontSize: '12px' }} />
              </div>
          )}

          <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ background: '#27272a', color: 'white', border: '1px solid #3f3f46', borderRadius: '6px', padding: '5px 10px', outline: 'none' }}>
            <option value="7days">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
            <option value="custom">Custom Range</option>
            <option value="all">All Time</option>
          </select>

          <button className="save-btn-primary" style={{ background: '#10b981' }} onClick={handleDownloadPDF}><FileText size={18} /> Export PDF</button>
          <button className="save-btn-primary" onClick={() => alert("Payout feature coming soon!")}><DollarSign size={18} /> Withdraw</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <StatCard label="Shop Revenue" value={`$${stats.total_revenue.toFixed(2)}`} icon={<TrendingUp size={24} color="#6366f1" />} color="rgba(99, 102, 241, 0.1)" />
        <StatCard label="Deposits Collected" value={`$${stats.paidDeposits.toFixed(2)}`} icon={<DollarSign size={24} color="#10b981" />} color="rgba(16, 185, 129, 0.1)" />
        <StatCard label="Pending Deposits" value={`$${stats.pendingDeposits.toFixed(2)}`} icon={<Clock size={24} color="#f59e0b" />} color="rgba(245, 158, 11, 0.1)" />
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
    <input type="time" value={value ? value.slice(0, 5) : ""} onChange={(e) => onChange(e.target.value)} className="time-field" />
  </div>
);

const getHeaderTitle = (tab) => {
  const titles = { appointments: 'Appointment Requests', schedule: 'Weekly Schedule', profile: 'Portfolio Gallery', revenue: 'Financial Overview', settings: 'Studio Settings', healing: 'Healing Notes' };
  return titles[tab] || 'Dashboard';
};

export default ArtistDashboard;
