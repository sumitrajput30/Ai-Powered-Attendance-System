import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import { logout } from '../store/store';
import { LogOut, Home, Camera, Clock, Users, MessageSquare, Shield } from 'lucide-react';
import WebcamCapture from '../components/WebcamCapture';
import AIAssistant from '../components/AIAssistant';
import api from '../api';

const API_BASE = '';
const axios = api;

const DashboardOverview = () => <div className="animate-in"><h2>Welcome to your Dashboard</h2></div>;

const Overtime = () => {
  const [hours, setHours] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const token = useSelector(state => state.auth.token);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/overtime/request`, 
        { date: new Date().toISOString().split('T')[0], hours: parseFloat(hours), reason, user_id: 'auto' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Overtime requested successfully!');
    } catch (err) {
      setMessage('Failed to request overtime.');
    }
  };

  return (
    <div className="animate-in">
      <h2>Overtime Request</h2>
      {message && <div style={{ color: 'var(--primary-color)', margin: '1rem 0' }}>{message}</div>}
      <form onSubmit={handleSubmit} className="card">
        <input className="input-field" type="number" placeholder="Hours" value={hours} onChange={e=>setHours(e.target.value)} required />
        <textarea className="input-field" style={{marginTop: '1rem', height: '100px'}} placeholder="Reason" value={reason} onChange={e=>setReason(e.target.value)} required />
        <button className="btn" style={{marginTop: '1rem'}}>Submit Request</button>
      </form>
    </div>
  );
};

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [otRequests, setOtRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(false);
  const token = useSelector(state => state.auth.token);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const res = await axios.get(`${API_BASE}/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
        setUsers(res.data);
      } else if (activeTab === 'attendance') {
        const res = await axios.get(`${API_BASE}/admin/attendance`, { headers: { Authorization: `Bearer ${token}` } });
        setAttendance(res.data);
      } else if (activeTab === 'overtime') {
        const res = await axios.get(`${API_BASE}/overtime/requests`, { headers: { Authorization: `Bearer ${token}` } });
        setOtRequests(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  const handleToggleActive = async (userId) => {
    await axios.put(`${API_BASE}/admin/users/${userId}/toggle-active`, {}, { headers: { Authorization: `Bearer ${token}` } });
    fetchData();
  };

  const handleInvalidate = async (recordId) => {
    await axios.put(`${API_BASE}/admin/attendance/${recordId}/invalidate`, {}, { headers: { Authorization: `Bearer ${token}` } });
    fetchData();
  };

  const handleHandleOT = async (requestId, status) => {
    await axios.put(`${API_BASE}/overtime/approve/${requestId}?status=${status}`, {}, { headers: { Authorization: `Bearer ${token}` } });
    fetchData();
  };

  return (
    <div className="animate-in">
      <h2>Admin Panel</h2>
      <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0' }}>
        <button onClick={() => setActiveTab('users')} className={`btn ${activeTab === 'users' ? '' : 'btn-outline'}`} style={{ width: 'auto' }}>Users</button>
        <button onClick={() => setActiveTab('attendance')} className={`btn ${activeTab === 'attendance' ? '' : 'btn-outline'}`} style={{ width: 'auto' }}>Attendance</button>
        <button onClick={() => setActiveTab('overtime')} className={`btn ${activeTab === 'overtime' ? '' : 'btn-outline'}`} style={{ width: 'auto' }}>OT Requests</button>
        <button onClick={() => setActiveTab('reports')} className={`btn ${activeTab === 'reports' ? '' : 'btn-outline'}`} style={{ width: 'auto' }}>Reports</button>
      </div>

      <div className="card">
        {loading ? <p>Loading...</p> : (
          <div>
            {activeTab === 'users' && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={{textAlign:'left'}}>Name</th><th style={{textAlign:'left'}}>Email</th><th style={{textAlign:'left'}}>Role</th><th style={{textAlign:'left'}}>Status</th><th style={{textAlign:'left'}}>Action</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} style={{ borderTop: '1px solid var(--border-color)' }}>
                      <td>{u.full_name}</td><td>{u.email}</td><td>{u.role}</td>
                      <td>{u.is_active ? 'Active' : 'Disabled'}</td>
                      <td><button onClick={() => handleToggleActive(u._id)} className="btn btn-sm" style={{ padding: '0.2rem 0.5rem', width: 'auto' }}>{u.is_active ? 'Disable' : 'Enable'}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {activeTab === 'attendance' && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={{textAlign:'left'}}>Date</th><th style={{textAlign:'left'}}>User</th><th style={{textAlign:'left'}}>Status</th><th style={{textAlign:'left'}}>Valid</th><th style={{textAlign:'left'}}>Action</th></tr></thead>
                <tbody>
                  {attendance.map(a => (
                    <tr key={a._id} style={{ borderTop: '1px solid var(--border-color)' }}>
                      <td>{a.date}</td><td>{a.user_name}</td><td>{a.status}</td>
                      <td>{a.is_valid ? 'Yes' : 'No'}</td>
                      <td>{a.is_valid && <button onClick={() => handleInvalidate(a._id)} className="btn btn-sm" style={{ padding: '0.2rem 0.5rem', width: 'auto' }}>Invalidate</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {activeTab === 'overtime' && (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={{textAlign:'left'}}>Date</th><th style={{textAlign:'left'}}>User</th><th style={{textAlign:'left'}}>Hours</th><th style={{textAlign:'left'}}>Status</th><th style={{textAlign:'left'}}>Actions</th></tr></thead>
                <tbody>
                  {otRequests.map(r => (
                    <tr key={r._id} style={{ borderTop: '1px solid var(--border-color)' }}>
                      <td>{r.date}</td><td>{r.user_name}</td><td>{r.hours}</td><td>{r.status}</td>
                      <td>
                        {r.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => handleHandleOT(r._id, 'approved')} className="btn btn-sm" style={{ padding: '0.2rem 0.5rem', backgroundColor: 'var(--success-color)', width: 'auto' }}>Approve</button>
                            <button onClick={() => handleHandleOT(r._id, 'rejected')} className="btn btn-sm" style={{ padding: '0.2rem 0.5rem', backgroundColor: 'var(--danger-color)', width: 'auto' }}>Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {activeTab === 'reports' && (
              <div>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label">User Filter</label>
                    <input type="text" className="input-field" placeholder="Search name..." onChange={(e) => {
                      const val = e.target.value.toLowerCase();
                      setAttendance(attendance.filter(a => a.user_name.toLowerCase().includes(val)));
                    }} />
                  </div>
                  <button onClick={() => {
                    const csvContent = "data:text/csv;charset=utf-8," 
                      + "Date,User,Status,Valid\n"
                      + attendance.map(a => `${a.date},${a.user_name},${a.status},${a.is_valid}`).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "attendance_report.csv");
                    document.body.appendChild(link);
                    link.click();
                  }} className="btn btn-outline" style={{ height: '38px', width: 'auto' }}>Export CSV</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={{textAlign:'left'}}>Date</th><th style={{textAlign:'left'}}>User</th><th style={{textAlign:'left'}}>Punch In</th><th style={{textAlign:'left'}}>Punch Out</th><th style={{textAlign:'left'}}>Status</th></tr></thead>
                  <tbody>
                    {attendance.map(a => (
                      <tr key={a._id} style={{ borderTop: '1px solid var(--border-color)' }}>
                        <td>{a.date}</td><td>{a.user_name}</td>
                        <td>{a.punch_in_time ? new Date(a.punch_in_time).toLocaleTimeString() : '-'}</td>
                        <td>{a.punch_out_time ? new Date(a.punch_out_time).toLocaleTimeString() : '-'}</td>
                        <td>{a.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const SmartAttendance = () => {
  const token = useSelector(state => state.auth.token);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState('punch'); // 'punch' or 'onboard'

  const handleCapture = async (base64Image) => {
    setLoading(true);
    setMessage('');
    try {
      const endpoint = mode === 'punch' ? '/attendance/punch' : '/attendance/onboard-face';
      const payload = mode === 'punch' ? { base64_image: base64Image, location: "0,0" } : { base64_image: base64Image };
      
      const res = await axios.post(`${API_BASE}${endpoint}`, 
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message || 'Action successful');
      if (mode === 'onboard') setMode('punch'); // Switch back to punch after successful onboarding
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2>{mode === 'punch' ? 'Smart Attendance' : 'Face Registration'}</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            {mode === 'punch' ? 'Align your face and capture to punch in/out.' : 'Register your face for the first time.'}
          </p>
        </div>
        <button 
          onClick={() => setMode(mode === 'punch' ? 'onboard' : 'punch')} 
          className="btn" 
          style={{ backgroundColor: 'var(--panel-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', width: 'auto' }}
        >
          {mode === 'punch' ? 'Switch to Registration' : 'Switch to Punch In/Out'}
        </button>
      </div>
      
      {message && <div style={{ padding: '1rem', backgroundColor: 'rgba(59, 130, 246, 0.2)', color: 'var(--primary-color)', borderRadius: '8px', marginBottom: '1rem' }}>{message}</div>}
      
      <WebcamCapture onCapture={handleCapture} loading={loading} />
    </div>
  );
};

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(state => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="dashboard-layout">
      <div className="sidebar">
        <div style={{ padding: '0 1rem', marginBottom: '2rem' }}>
          <h2 style={{ color: 'var(--primary-color)' }}>AI Attend</h2>
        </div>

        {user && (
          <div style={{ padding: '0 1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
              {user.full_name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)' }}>{user.full_name}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user.role}</div>
          </div>
        )}
        
        <div style={{ flex: 1 }}>
          <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
            <Home size={20} /> Overview
          </Link>
          <Link to="/dashboard/attendance" className={`nav-link ${location.pathname === '/dashboard/attendance' ? 'active' : ''}`}>
            <Camera size={20} /> Punch In/Out
          </Link>
          <Link to="/dashboard/overtime" className={`nav-link ${location.pathname === '/dashboard/overtime' ? 'active' : ''}`}>
            <Clock size={20} /> Overtime
          </Link>
          <Link to="/dashboard/admin" className={`nav-link ${location.pathname === '/dashboard/admin' ? 'active' : ''}`}>
            <Shield size={20} /> Admin Panel
          </Link>
          <Link to="/dashboard/ai" className={`nav-link ${location.pathname === '/dashboard/ai' ? 'active' : ''}`}>
            <MessageSquare size={20} /> AI Assistant
          </Link>
        </div>
        
        <button onClick={handleLogout} className="nav-link" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: 'var(--danger-color)' }}>
          <LogOut size={20} /> Logout
        </button>
      </div>
      
      <div className="main-content">
        <Routes>
          <Route path="/" element={<DashboardOverview />} />
          <Route path="/attendance" element={<SmartAttendance />} />
          <Route path="/overtime" element={<Overtime />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/ai" element={<AIAssistant />} />
        </Routes>
      </div>
    </div>
  );
};

export default Dashboard;
