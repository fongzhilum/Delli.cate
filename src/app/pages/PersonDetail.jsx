import { useParams, useNavigate } from 'react-router';
import { useData } from '../context/DataContext';
import { RiskBadge } from '../components/RiskBadge';
import { SocialMediaLinks } from '../components/SocialMediaLinks';
import { Calendar, MapPin, User, FileText, Clock, AlertCircle, MessageSquare, Brain, ArrowLeft, TrendingUp, TrendingDown, Minus, Edit2, Trash2, Save, X, Plus, CheckCircle2, Eye, RotateCcw, RefreshCw } from 'lucide-react';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

export default function PersonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { persons, updatePerson, workers } = useData();
  const person = persons.find(p => p.id === id);
  
  // Calculate default date range (last 30 days)
  const getDefaultDates = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };
  
  const defaultDates = getDefaultDates();
  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);
  
  // Case notes state management
  const [notes, setNotes] = useState(person ? person.notes : []);
  const [editingNoteIndex, setEditingNoteIndex] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  
  // Case status management
  const [caseStatus, setCaseStatus] = useState(person ? person.status : 'active');
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');
  const [reopenNotes, setReopenNotes] = useState('');
  
  // Edit person details
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    name: person?.name || '',
    age: person?.age || '',
    location: person?.location || '',
    assignedWorker: person?.assignedWorker || '',
    instagram: person?.socialMediaAccounts?.find(a => a.platform === 'instagram')?.username || '',
    tiktok: person?.socialMediaAccounts?.find(a => a.platform === 'tiktok')?.username || ''
  });
  
  // Last contact update dialog
  const [showLastContactDialog, setShowLastContactDialog] = useState(false);
  const [lastContactPreset, setLastContactPreset] = useState('now');
  const [customContactDate, setCustomContactDate] = useState('');

  // Update local state when person changes
  useEffect(() => {
    if (person) {
      setNotes(person.notes);
      setCaseStatus(person.status);
      setEditForm({
        name: person.name,
        age: person.age,
        location: person.location,
        assignedWorker: person.assignedWorker,
        instagram: person.socialMediaAccounts?.find(a => a.platform === 'instagram')?.username || '',
        tiktok: person.socialMediaAccounts?.find(a => a.platform === 'tiktok')?.username || ''
      });
    }
  }, [person]);

  // Auto-generate AI summary when case is opened
  const summaryGeneratedRef = useRef(false);
  useEffect(() => {
    if (!person || summaryGeneratedRef.current) return;
    summaryGeneratedRef.current = true;

    const generateSummary = async () => {
      try {
        const storyText = (person.distressPosts ?? [])
          .slice(0, 10)
          .map(p => `- "${p.content}" (distress: ${p.distressScore}/100)`)
          .join('\n');

        const notesText = (person.notes ?? []).join('\n- ');

        const prompt = `You are a clinical youth welfare analyst. Summarise this case in 2-3 sentences for a social worker dashboard.

Case: ${person.name}, ${person.age}y, ${person.location}
Risk level: ${person.riskLevel}
Overall distress: ${person.distressScore}%
Assigned worker: ${person.assignedWorker}

Recent Instagram story content:
${storyText || 'No story data yet.'}

Case notes:
${notesText || 'No notes yet.'}

Write a concise clinical summary highlighting key concerns and recommended actions. Be direct and professional.`;

        const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + import.meta.env.VITE_GEMINI_API_KEY, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        const data = await res.json();
        const summary = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (!summary) return;

        await supabase.from('cases').update({ ai_summary: summary }).eq('id', person.id);
      } catch (err) {
        console.error('[AI Summary]', err);
      }
    };

    generateSummary();
  }, [person?.id]);

  // Save notes to context when they change

  if (!person) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Person not found</h2>
          <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  const formatDateTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getDistressColor = (score) => {
    if (score >= 65) return 'bg-red-50 border-red-200 text-red-900';
    if (score >= 45) return 'bg-orange-50 border-orange-200 text-orange-900';
    if (score >= 25) return 'bg-yellow-50 border-yellow-200 text-yellow-900';
    return 'bg-green-50 border-green-200 text-green-900';
  };

  const getDistressLabel = (score) => {
    if (score >= 65) return 'Critical';
    if (score >= 45) return 'High';
    if (score >= 25) return 'Moderate';
    return 'Low';
  };

  const getScoreColor = (score) => {
    if (score >= 65) return 'text-red-600';
    if (score >= 45) return 'text-orange-600';
    if (score >= 25) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getScoreBadgeColor = (score) => {
    if (score >= 65) return 'bg-red-100 text-red-700 border-red-200';
    if (score >= 45) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (score >= 25) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  const getProgressBarColor = (score) => {
    if (score >= 65) return 'bg-red-500';
    if (score >= 45) return 'bg-orange-500';
    if (score >= 25) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const concerningPosts = person.distressPosts ? person.distressPosts.filter(p => p.isConcerning).sort((a, b) => b.distressScore - a.distressScore) : [];

  // Filter posts by date range
  const getFilteredPosts = () => {
    if (!person.distressPosts) return [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return person.distressPosts.filter(post => new Date(post.timestamp) >= start && new Date(post.timestamp) <= end);
  };

  const filteredPosts = getFilteredPosts();

  // Prepare timeline data for chart - aggregate by date to avoid duplicate keys
  const timelineData = filteredPosts
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .reduce((acc, post) => {
      // Use full date including year to ensure uniqueness across years
      const postDate = new Date(post.timestamp);
      const dateKey = new Intl.DateTimeFormat('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }).format(postDate);
      const existing = acc.find(item => item.date === dateKey);
      
      if (existing) {
        // Average the scores if multiple posts on same date
        existing.count += 1;
        existing.distress = Math.round((existing.distress * (existing.count - 1) + post.distressScore) / existing.count);
        existing.intensity = Math.round((existing.intensity * (existing.count - 1) + post.emotionalIntensity) / existing.count);
      } else {
        acc.push({
          id: `${postDate.getTime()}-${acc.length}`, // Add unique ID
          date: dateKey,
          distress: post.distressScore,
          intensity: post.emotionalIntensity,
          time: new Date(post.timestamp),
          count: 1
        });
      }
      return acc;
    }, []);

  // Prepare time of day distribution
  const timeOfDayData = person.distressPosts ? person.distressPosts.reduce((acc, post) => {
    const hour = new Date(post.timestamp).getHours();
    let period;
    if (hour >= 6 && hour < 12) period = 'Morning (6am-12pm)';
    else if (hour >= 12 && hour < 18) period = 'Afternoon (12pm-6pm)';
    else if (hour >= 18 && hour < 24) period = 'Evening (6pm-12am)';
    else period = 'Night (12am-6am)';
    
    const existing = acc.find(item => item.period === period);
    if (existing) {
      existing.posts += 1;
      existing.avgDistress = (existing.avgDistress + post.distressScore) / 2;
    } else {
      acc.push({ period, posts: 1, avgDistress: post.distressScore });
    }
    return acc;
  }, []) : [];

  // Order time periods correctly
  const orderedPeriods = ['Morning (6am-12pm)', 'Afternoon (12pm-6pm)', 'Evening (6pm-12am)', 'Night (12am-6am)'];
  const sortedTimeOfDayData = orderedPeriods
    .map(period => timeOfDayData.find(d => d.period === period) || { period, posts: 0, avgDistress: 0 })
    .filter(d => d.posts > 0);
  
  // Handle resolve case
  const handleResolve = () => {
    setShowResolveDialog(true);
  };
  
  // Handle resolve confirmation
  const handleResolveConfirm = () => {
    const noteText = `🔒 Case resolved: ${resolveNotes}`;
    const updatedNotes = [...notes, noteText];
    updatePerson(person.id, { 
      status: 'resolved',
      notes: updatedNotes,
      resolvedDate: new Date().toISOString(),
      resolvedNotes: resolveNotes
    });
    setCaseStatus('resolved');
    setNotes(updatedNotes);
    setShowResolveDialog(false);
    setResolveNotes('');
  };

  // Handle reopen case
  const handleReopen = () => {
    setShowReopenDialog(true);
  };

  // Handle reopen confirmation
  const handleReopenConfirm = () => {
    const noteText = `🔄 Case reopened: ${reopenNotes}`;
    const updatedNotes = [...notes, noteText];
    updatePerson(person.id, { 
      status: 'active',
      notes: updatedNotes,
      resolvedDate: null,
      resolvedNotes: null
    });
    setCaseStatus('active');
    setNotes(updatedNotes);
    setShowReopenDialog(false);
    setReopenNotes('');
  };
  
  // Handle edit person details
  const handleEditSave = () => {
    // Build social media accounts array
    const socialMediaAccounts = [];
    
    if (editForm.instagram?.trim()) {
      const username = editForm.instagram.trim();
      socialMediaAccounts.push({
        platform: 'instagram',
        username,
        url: `https://instagram.com/${username.replace('@', '')}`,
        lastChecked: new Date()
      });
    }
    
    if (editForm.tiktok?.trim()) {
      const username = editForm.tiktok.trim();
      socialMediaAccounts.push({
        platform: 'tiktok',
        username,
        url: `https://tiktok.com/@${username.replace('@', '')}`,
        lastChecked: new Date()
      });
    }
    
    updatePerson(person.id, {
      name: editForm.name,
      age: parseInt(editForm.age) || 0,
      location: editForm.location,
      assignedWorker: editForm.assignedWorker,
      socialMediaAccounts: socialMediaAccounts
    });
    setShowEditDialog(false);
  };
  
  // Handle update last contact
  const handleUpdateLastContact = () => {
    setShowLastContactDialog(true);
  };
  
  // Handle last contact save
  const handleLastContactSave = () => {
    let contactDate;
    
    switch (lastContactPreset) {
      case 'now':
        contactDate = new Date();
        break;
      case '1hour':
        contactDate = new Date(Date.now() - 60 * 60 * 1000);
        break;
      case 'today':
        contactDate = new Date();
        contactDate.setHours(9, 0, 0, 0); // 9 AM today
        break;
      case 'yesterday':
        contactDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        contactDate.setHours(14, 0, 0, 0); // 2 PM yesterday
        break;
      case 'custom':
        if (!customContactDate) {
          alert('Please select a date');
          return;
        }
        contactDate = new Date(`${customContactDate}T12:00`);
        break;
      default:
        contactDate = new Date();
    }
    
    // Update person with new last contact date
    updatePerson(person.id, {
      lastContact: contactDate.toISOString()
    });
    
    // Reset and close dialog
    setShowLastContactDialog(false);
    setLastContactPreset('now');
    setCustomContactDate('');
  };
  
  // Check if a note is a special note (resolved or reopened)
  const isSpecialNote = (note) => {
    return note.startsWith('🔒 Case resolved:') || note.startsWith('🔄 Case reopened:');
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-300 font-semibold">Active</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-700 border-green-300 font-semibold">Resolved</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Back + Person Info */}
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')}
                className="text-slate-600 hover:text-slate-900 -ml-2"
              >
                <ArrowLeft className="size-4 mr-1.5" />
                Back
              </Button>
              
              <Separator orientation="vertical" className="h-8" />
              
              <div className="size-10 rounded-lg bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {person.name.split(' ').map(n => n[0]).join('')}
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-slate-900">{person.name}</h1>
                  {getStatusBadge(caseStatus)}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEditDialog(true)}
                    className="h-7 px-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  >
                    <Edit2 className="size-3.5" />
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  {person.caseId} • {person.age} years • {person.location}
                </p>
              </div>
            </div>

            {/* Right: Stats & Actions */}
            <div className="flex items-center gap-6">
              <div className="flex flex-col justify-center">
                <div className="text-xs text-slate-500 mb-1">Assigned Worker</div>
                <div className="text-sm font-bold text-slate-900">{person.assignedWorker}</div>
              </div>
              
              <Separator orientation="vertical" className="h-8" />
              
              <div 
                onClick={handleUpdateLastContact}
                className="flex flex-col justify-center cursor-pointer hover:bg-indigo-50 px-3 py-1 rounded-lg transition-colors group"
                title="Click to update last contact"
              >
                <div className="text-xs text-slate-500 mb-1 group-hover:text-indigo-600 transition-colors">Last Contact</div>
                <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{formatDate(person.lastContact)}</div>
              </div>
              
              <Separator orientation="vertical" className="h-8" />
              
              <div className="flex items-center gap-3">
                <div className="flex flex-col justify-center">
                  <div className="text-xs text-slate-500 mb-1">Distress</div>
                  <div className="text-sm font-bold text-slate-900">{person.distressScore}%</div>
                </div>
                <RiskBadge level={person.riskLevel} size="sm" />
              </div>
              
              <Separator orientation="vertical" className="h-8" />
              
              {caseStatus === 'active' && (
                <Button
                  size="sm"
                  onClick={handleResolve}
                  className="h-[34px] px-2.5 text-xs bg-green-600 hover:bg-green-700 font-bold"
                >
                  <CheckCircle2 className="size-3.5 mr-1.5" />
                  Resolve Case
                </Button>
              )}
              {caseStatus === 'resolved' && (
                <Button
                  size="sm"
                  onClick={handleReopen}
                  className="h-[34px] px-2.5 text-xs bg-amber-600 hover:bg-amber-700 font-bold"
                >
                  <RotateCcw className="size-3.5 mr-1.5" />
                  Reopen Case
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-6">
        {/* Analytics Charts Section */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Distress Timeline Chart */}
          <div className="bg-gradient-to-br from-white to-blue-50/20 rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <div className="size-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                  <TrendingUp className="size-4 text-white" />
                </div>
                Distress Level Timeline
              </h3>
              
              {/* Date Range Inputs */}
              <div className="flex items-center gap-2">
                <Calendar className="size-3.5 text-slate-500" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs font-medium bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-500 font-medium">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs font-medium bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={timelineData} key={`chart-${person.id}-${startDate}-${endDate}`}>
                <defs>
                  <linearGradient id={`colorDistress-${person.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="id"
                  tickFormatter={(value, index) => timelineData[index]?.date || ''}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  stroke="#cbd5e1"
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  stroke="#cbd5e1"
                />
                <Tooltip 
                  labelFormatter={(value, payload) => payload?.[0]?.payload?.date || value}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="distress" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  fill={`url(#colorDistress-${person.id})`}
                  name="Distress Score"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* AI Summary */}
          {person.aiSummary && (
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50/50 to-white rounded-xl border border-indigo-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm">
                <div className="size-8 rounded-lg bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-sm">
                  <Brain className="size-4 text-white" />
                </div>
                AI Analysis Summary
              </h3>
              <div className="bg-white/80 rounded-lg p-4 border border-indigo-100">
                <p className="text-sm text-slate-700 leading-relaxed">{person.aiSummary}</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Case Notes & Social Media */}
          <div className="col-span-4 space-y-5">
            {/* Case Notes */}
            <div className="bg-gradient-to-br from-white to-slate-50/30 rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm">
                <div className="size-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                  <FileText className="size-4 text-white" />
                </div>
                Case Notes
              </h3>
              <div className="space-y-2">
                {notes.map((note, index) => (
                  <div key={index}>
                    {editingNoteIndex === index ? (
                      /* Edit Mode */
                      <div className="relative flex items-start gap-3 text-sm bg-white rounded-lg p-3 border-2 border-indigo-300">
                        <div className="size-2 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 mt-1.5 flex-shrink-0" />
                        <input
                          type="text"
                          value={editingNoteText}
                          onChange={(e) => setEditingNoteText(e.target.value)}
                          className="flex-1 text-slate-700 leading-relaxed bg-transparent focus:outline-none"
                          placeholder="Edit note..."
                          autoFocus
                        />
                        <div className="flex items-center gap-1.5 ml-2">
                          <button
                            onClick={() => {
                              if (editingNoteText.trim()) {
                                const updatedNotes = notes.map((n, i) => i === index ? editingNoteText : n);
                                setNotes(updatedNotes);
                                setEditingNoteIndex(null);
                                setEditingNoteText('');
                              }
                            }}
                            className="p-1 hover:bg-green-50 rounded transition-colors"
                          >
                            <Save className="size-3.5 text-green-600 hover:text-green-700" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingNoteIndex(null);
                              setEditingNoteText('');
                            }}
                            className="p-1 hover:bg-slate-50 rounded transition-colors"
                          >
                            <X className="size-3.5 text-slate-500 hover:text-slate-700" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display Mode */
                      <div className={`group relative flex items-start gap-3 text-sm rounded-lg p-3 border transition-colors ${
                        isSpecialNote(note)
                          ? note.startsWith('🔒')
                            ? 'bg-green-50/80 border-green-300 hover:border-green-400'
                            : 'bg-blue-50/80 border-blue-300 hover:border-blue-400'
                          : 'bg-white/60 border-slate-100 hover:border-slate-200'
                      }`}>
                        <div className={`size-2 rounded-full mt-1.5 flex-shrink-0 ${
                          isSpecialNote(note)
                            ? note.startsWith('🔒')
                              ? 'bg-gradient-to-br from-green-600 to-emerald-600'
                              : 'bg-gradient-to-br from-blue-600 to-indigo-600'
                            : 'bg-gradient-to-br from-indigo-600 to-purple-600'
                        }`} />
                        <span className={`flex-1 leading-relaxed ${
                          isSpecialNote(note)
                            ? note.startsWith('🔒')
                              ? 'text-green-900 font-semibold'
                              : 'text-blue-900 font-semibold'
                            : 'text-slate-700'
                        }`}>{note}</span>
                        {!isSpecialNote(note) && (
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                            <button
                              onClick={() => {
                                setEditingNoteIndex(index);
                                setEditingNoteText(note);
                              }}
                              className="p-1 hover:bg-indigo-50 rounded transition-colors"
                            >
                              <Edit2 className="size-3.5 text-indigo-600 hover:text-indigo-700" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Delete this note?')) {
                                  const updatedNotes = notes.filter((_, i) => i !== index);
                                  setNotes(updatedNotes);
                                }
                              }}
                              className="p-1 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="size-3.5 text-red-500 hover:text-red-700" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Add New Note */}
                {isAddingNote ? (
                  <div className="relative flex items-start gap-3 text-sm bg-white rounded-lg p-3 border-2 border-indigo-300">
                    <div className="size-2 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 mt-1.5 flex-shrink-0" />
                    <input
                      type="text"
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      className="flex-1 text-slate-700 leading-relaxed bg-transparent focus:outline-none"
                      placeholder="Add a new note..."
                      autoFocus
                    />
                    <div className="flex items-center gap-1.5 ml-2">
                      <button
                        onClick={() => {
                          if (newNoteText.trim()) {
                            setNotes([...notes, newNoteText]);
                            setNewNoteText('');
                            setIsAddingNote(false);
                          }
                        }}
                        className="p-1 hover:bg-green-50 rounded transition-colors"
                      >
                        <Save className="size-3.5 text-green-600 hover:text-green-700" />
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingNote(false);
                          setNewNoteText('');
                        }}
                        className="p-1 hover:bg-slate-50 rounded transition-colors"
                      >
                        <X className="size-3.5 text-slate-500 hover:text-slate-700" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingNote(true)}
                    className="w-full flex items-center gap-3 text-sm bg-white/40 hover:bg-white/60 rounded-lg p-3 border border-dashed border-slate-300 hover:border-indigo-300 transition-all text-slate-600 hover:text-indigo-600"
                  >
                    <Plus className="size-4" />
                    <span className="font-medium">Add a note</span>
                  </button>
                )}
              </div>
            </div>

            {/* Social Media Accounts */}
            <div className="bg-gradient-to-br from-white to-indigo-50/20 rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm">
                <div className="size-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <FileText className="size-4 text-white" />
                </div>
                Social Media
              </h3>
              <div className="space-y-2.5">
                {person.socialMediaAccounts && person.socialMediaAccounts.length > 0 ? (
                  person.socialMediaAccounts.map((account, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 border border-slate-100 hover:border-indigo-200 transition-colors">
                      <div className="font-semibold text-sm capitalize text-slate-900 mb-1">{account.platform}</div>
                      <div className="text-xs text-indigo-600 font-medium mb-2">{account.username}</div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="size-3" />
                        <span className="text-xs">{formatDateTime(account.lastChecked)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-500 text-center py-4">No social media accounts linked</div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Concerning Quotes */}
          <div className="col-span-8">
            <div className="bg-gradient-to-br from-white to-orange-50/20 rounded-xl border border-orange-200 p-5 shadow-md">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                  <div className="size-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-sm">
                    <AlertCircle className="size-4 text-white" />
                  </div>
                  Concerning Quotes
                </h3>
                <Badge className="bg-orange-100 text-orange-700 border-orange-300 font-bold shadow-sm">
                  {concerningPosts.length} signals detected
                </Badge>
              </div>
              
              {concerningPosts.length > 0 ? (
                <div className="space-y-4">
                  {concerningPosts.map((post) => (
                    <div 
                      key={post.id}
                      className={`border-2 rounded-xl p-5 shadow-sm hover:shadow-md transition-all ${getDistressColor(post.distressScore)}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs capitalize border-current font-semibold shadow-sm">
                            {post.platform}
                          </Badge>
                          <span className="text-xs font-medium opacity-60">
                            {formatDateTime(post.timestamp)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Highlighted quote */}
                      <div className="bg-white rounded-lg p-4 mb-4 border-2 border-current/20 shadow-sm">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="size-4 mt-0.5 opacity-40 flex-shrink-0" />
                          <span className="text-sm leading-relaxed font-medium text-slate-800">
                            "{post.content}"
                          </span>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold opacity-70 uppercase tracking-wide">Emotional Intensity</span>
                          <span className="font-bold text-sm">{post.emotionalIntensity}%</span>
                        </div>
                        <div className="h-2.5 bg-white/80 rounded-full overflow-hidden border-2 border-current/20 shadow-inner">
                          <div 
                            className={`h-full ${getProgressBarColor(post.emotionalIntensity)} shadow-sm transition-all`}
                            style={{ width: `${post.emotionalIntensity}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <AlertCircle className="size-12 mx-auto mb-3 opacity-30" />
                  <p>No concerning posts detected</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Resolve Case Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-2">
              <CheckCircle2 className="size-5 text-green-600" />
              Mark Case as Resolved
            </DialogTitle>
            <DialogDescription>
              Add notes about the resolution of this case. This information will be saved to the case history.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter resolution notes..."
              value={resolveNotes}
              onChange={(e) => setResolveNotes(e.target.value)}
              className="min-h-[120px] border-slate-300"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowResolveDialog(false);
                setResolveNotes('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResolveConfirm}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="size-4 mr-2" />
              Resolve Case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reopen Case Dialog */}
      <Dialog open={showReopenDialog} onOpenChange={setShowReopenDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent flex items-center gap-2">
              <RotateCcw className="size-5 text-amber-600" />
              Reopen Case
            </DialogTitle>
            <DialogDescription>
              Add notes about why this case is being reopened. The case will return to active status.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter reason for reopening..."
              value={reopenNotes}
              onChange={(e) => setReopenNotes(e.target.value)}
              className="min-h-[120px] border-slate-300"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReopenDialog(false);
                setReopenNotes('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReopenConfirm}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <RotateCcw className="size-4 mr-2" />
              Reopen Case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Person Details Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
              <Edit2 className="size-5 text-indigo-600" />
              Edit Person Details
            </DialogTitle>
            <DialogDescription>
              Update the personal information and social media accounts for this case.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm font-semibold text-slate-700">Full Name</Label>
              <Input
                id="edit-name"
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Enter full name"
                className="border-slate-300"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-age" className="text-sm font-semibold text-slate-700">Age</Label>
                <Input
                  id="edit-age"
                  type="number"
                  value={editForm.age}
                  onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                  placeholder="Enter age"
                  className="border-slate-300"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-location" className="text-sm font-semibold text-slate-700">Location</Label>
                <Input
                  id="edit-location"
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  placeholder="City, State"
                  className="border-slate-300"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-worker" className="text-sm font-semibold text-slate-700">Assigned Social Worker</Label>
              <Select
                value={editForm.assignedWorker}
                onValueChange={(value) => setEditForm({ ...editForm, assignedWorker: value })}
              >
                <SelectTrigger className="border-slate-300">
                  <SelectValue placeholder="Select a social worker" />
                </SelectTrigger>
                <SelectContent>
                  {workers.map((worker) => (
                    <SelectItem key={worker} value={worker}>
                      {worker}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="pt-3 border-t border-slate-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Social Media Accounts</h4>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-instagram" className="text-xs font-medium text-slate-600 flex items-center gap-2">
                    <span className="size-5 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[10px]">IG</span>
                    Instagram Username
                  </Label>
                  <Input
                    id="edit-instagram"
                    value={editForm.instagram}
                    onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })}
                    placeholder="@username"
                    className="border-slate-300 text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-tiktok" className="text-xs font-medium text-slate-600 flex items-center gap-2">
                    <span className="size-5 rounded bg-black flex items-center justify-center text-white text-[10px]">TT</span>
                    TikTok Username
                  </Label>
                  <Input
                    id="edit-tiktok"
                    value={editForm.tiktok}
                    onChange={(e) => setEditForm({ ...editForm, tiktok: e.target.value })}
                    placeholder="@username"
                    className="border-slate-300 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                // Reset form to current person data
                if (person) {
                  setEditForm({
                    name: person.name,
                    age: person.age,
                    location: person.location,
                    assignedWorker: person.assignedWorker,
                    instagram: person.socialMediaAccounts?.find(a => a.platform === 'instagram')?.username || '',
                    tiktok: person.socialMediaAccounts?.find(a => a.platform === 'tiktok')?.username || ''
                  });
                }
              }}
            >
              <X className="size-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              <Save className="size-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Update Last Contact Dialog */}
      <Dialog open={showLastContactDialog} onOpenChange={setShowLastContactDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
              <Clock className="size-5 text-indigo-600" />
              Update Last Contact
            </DialogTitle>
            <DialogDescription>
              Log when you last contacted {person?.name}. You can choose a preset or enter a custom date/time.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="contact-preset">When did you last contact this person?</Label>
              <Select value={lastContactPreset} onValueChange={setLastContactPreset}>
                <SelectTrigger id="contact-preset">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="now">Just Now</SelectItem>
                  <SelectItem value="custom">Custom Date/Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {lastContactPreset === 'custom' && (
              <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="space-y-2">
                  <Label htmlFor="custom-date">Date</Label>
                  <Input
                    id="custom-date"
                    type="date"
                    value={customContactDate}
                    onChange={(e) => setCustomContactDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowLastContactDialog(false);
                setLastContactPreset('now');
                setCustomContactDate('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLastContactSave}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              <Clock className="size-4 mr-2" />
              Update Last Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}