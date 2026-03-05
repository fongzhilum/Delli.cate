import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useData } from '../context/DataContext';
import { PersonCard } from '../components/PersonCard';
import { DashboardStats } from '../components/DashboardStats';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, Shield, Plus, X, Save, Settings, Edit2, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';

export default function Dashboard() {
  const navigate = useNavigate();
  const { persons, addPerson, workers, addWorker, updateWorker, deleteWorker } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const [filterWorker, setFilterWorker] = useState('all');
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'resolved'
  const [isAddCaseOpen, setIsAddCaseOpen] = useState(false);
  const [isManageWorkersOpen, setIsManageWorkersOpen] = useState(false);
  
  // Worker management state
  const [newWorkerName, setNewWorkerName] = useState('');
  const [editingWorker, setEditingWorker] = useState(null);
  const [editingWorkerName, setEditingWorkerName] = useState('');
  
  // Form state for new case
  const [newCase, setNewCase] = useState({
    name: '',
    age: '',
    location: '',
    assignedWorker: '',
    instagram: '',
    tiktok: ''
  });

  // Get unique workers - now from the workers list in context
  const uniqueWorkers = useMemo(() => {
    return workers.sort();
  }, [workers]);

  // Filter persons based on active tab
  const filteredPersons = useMemo(() => {
    return persons.filter(person => {
      const matchesSearch = person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          person.caseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          person.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRisk = filterRisk === 'all' || person.riskLevel === filterRisk;
      const matchesWorker = filterWorker === 'all' || person.assignedWorker === filterWorker;
      const matchesTab = person.status === activeTab;
      
      return matchesSearch && matchesRisk && matchesWorker && matchesTab;
    });
  }, [persons, searchQuery, filterRisk, filterWorker, activeTab]);

  // Calculate stats - only for active cases, filtered by worker
  const stats = useMemo(() => {
    // First filter by worker if selected
    const workerFilteredPersons = filterWorker === 'all' 
      ? persons 
      : persons.filter(p => p.assignedWorker === filterWorker);
    
    const activeCases = workerFilteredPersons.filter(p => p.status === 'active');
    
    return {
      total: workerFilteredPersons.length,
      critical: activeCases.filter(p => p.riskLevel === 'critical').length,
      high: activeCases.filter(p => p.riskLevel === 'high').length,
      medium: activeCases.filter(p => p.riskLevel === 'medium').length,
      low: activeCases.filter(p => p.riskLevel === 'low').length,
      active: workerFilteredPersons.filter(p => p.status === 'active').length,
      resolved: workerFilteredPersons.filter(p => p.status === 'resolved').length
    };
  }, [persons, filterWorker]);

  // Handle form change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewCase(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submit
  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    // Generate unique ID based on timestamp
    const newId = Date.now().toString();
    
    // Generate case ID
    const caseId = `CASE-${String(persons.length + 1).padStart(4, '0')}`;
    
    // Build social media accounts array
    const socialMediaAccounts = [];
    if (newCase.instagram) {
      socialMediaAccounts.push({
        platform: 'instagram',
        username: newCase.instagram,
        url: `https://instagram.com/${newCase.instagram}`,
        lastChecked: new Date().toISOString()
      });
    }
    if (newCase.tiktok) {
      socialMediaAccounts.push({
        platform: 'tiktok',
        username: newCase.tiktok,
        url: `https://tiktok.com/@${newCase.tiktok}`,
        lastChecked: new Date().toISOString()
      });
    }
    
    // Create new person object with complete structure
    const newPerson = {
      id: newId,
      caseId: caseId,
      name: newCase.name,
      age: parseInt(newCase.age) || 0,
      location: newCase.location,
      assignedWorker: newCase.assignedWorker,
      riskLevel: 'low',
      distressScore: 15,
      lastContact: new Date().toISOString(),
      status: 'active',
      socialMediaAccounts: socialMediaAccounts,
      notes: ['Case recently added to system'],
      distressPosts: [],
      aiSummary: 'New case - no data collected yet.'
    };
    
    addPerson(newPerson);
    setIsAddCaseOpen(false);
    
    // Reset form
    setNewCase({
      name: '',
      age: '',
      location: '',
      assignedWorker: '',
      instagram: '',
      tiktok: ''
    });
  };
  
  // Worker management functions
  const handleAddWorker = () => {
    if (newWorkerName.trim()) {
      addWorker(newWorkerName.trim());
      setNewWorkerName('');
    }
  };
  
  const handleEditWorker = (workerName) => {
    setEditingWorker(workerName);
    setEditingWorkerName(workerName);
  };
  
  const handleSaveWorker = () => {
    if (editingWorkerName.trim() && editingWorker) {
      updateWorker(editingWorker, editingWorkerName.trim());
      setEditingWorker(null);
      setEditingWorkerName('');
    }
  };
  
  const handleDeleteWorker = (workerName) => {
    if (window.confirm(`Delete worker "${workerName}"? This will not delete their cases.`)) {
      deleteWorker(workerName);
      // Reset filter if the deleted worker was selected
      if (filterWorker === workerName) {
        setFilterWorker('all');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-5">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="size-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                <Shield className="size-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-indigo-600">
                  Delli<span className="text-purple-600">.cate</span>
                </h1>
                <p className="text-xs text-slate-600 font-medium">AI Risk Assessment</p>
              </div>
            </div>

            {/* Filters - Without Status Filter */}
            <div className="flex-1 grid grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                <Input
                  placeholder="Search by name, case ID, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-slate-300 text-slate-900 placeholder:text-slate-500 h-9 text-sm"
                />
              </div>
              <Select value={filterRisk} onValueChange={(value) => setFilterRisk(value)}>
                <SelectTrigger className="border-slate-300 text-slate-900 h-9 text-sm">
                  <SelectValue placeholder="Filter by risk level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Select value={filterWorker} onValueChange={setFilterWorker}>
                  <SelectTrigger className="border-slate-300 text-slate-900 h-9 text-sm flex-1">
                    <SelectValue placeholder="Filter by worker" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Workers</SelectItem>
                    {uniqueWorkers.map(worker => (
                      <SelectItem key={worker} value={worker}>{worker}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsManageWorkersOpen(true)}
                  className="h-9 px-3 border-slate-300 hover:bg-slate-50"
                  title="Manage Workers"
                >
                  <Settings className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Stats */}
        <DashboardStats
          totalCases={stats.total}
          criticalCases={stats.critical}
          highRiskCases={stats.high}
          mediumRiskCases={stats.medium}
          lowRiskCases={stats.low}
          activeCases={stats.active}
          resolvedCases={stats.resolved}
          filterRisk={filterRisk}
          onRiskClick={(riskLevel) => {
            // Toggle filter: if clicking the same level, reset to 'all', otherwise set to that level
            setFilterRisk(filterRisk === riskLevel ? 'all' : riskLevel);
          }}
        />

        {/* Tabs for Status Filtering */}
        <div className="flex items-center justify-between mt-6 mb-6">
          <div className="flex gap-2 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === 'active'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Active ({stats.active})
            </button>
            <button
              onClick={() => setActiveTab('resolved')}
              className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === 'resolved'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Resolved ({stats.resolved})
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-600 font-semibold">
              Showing {filteredPersons.length} of {activeTab === 'active' ? stats.active : stats.resolved} cases
            </div>
            <Button
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
              onClick={() => setIsAddCaseOpen(true)}
            >
              <Plus className="size-4 mr-2" />
              Add New Case
            </Button>
          </div>
        </div>

        {/* Person Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPersons.map(person => (
            <PersonCard
              key={person.id}
              person={person}
              onViewDetails={(person) => navigate(`/person/${person.id}`)}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredPersons.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="size-20 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Shield className="size-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No cases found</h3>
            <p className="text-slate-600">Try adjusting your filters or search query</p>
          </div>
        )}
      </div>

      {/* Add Case Dialog */}
      <Dialog open={isAddCaseOpen} onOpenChange={setIsAddCaseOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Add New Case
            </DialogTitle>
            <DialogDescription>
              Enter the details of the new case to begin active monitoring.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-slate-700">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={newCase.name}
                onChange={handleFormChange}
                placeholder="Enter full name"
                required
                className="border-slate-300"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age" className="text-sm font-semibold text-slate-700">
                  Age <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  value={newCase.age}
                  onChange={handleFormChange}
                  placeholder="Age"
                  required
                  className="border-slate-300"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-semibold text-slate-700">
                  Location <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="location"
                  name="location"
                  value={newCase.location}
                  onChange={handleFormChange}
                  placeholder="City, State"
                  required
                  className="border-slate-300"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="assignedWorker" className="text-sm font-semibold text-slate-700">
                Assigned Worker <span className="text-red-500">*</span>
              </Label>
              <Select
                value={newCase.assignedWorker}
                onValueChange={value => setNewCase(prev => ({ ...prev, assignedWorker: value }))}
                required
              >
                <SelectTrigger className="border-slate-300">
                  <SelectValue placeholder="Select a social worker" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueWorkers.map(worker => (
                    <SelectItem key={worker} value={worker}>{worker}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="pt-3 border-t border-slate-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Social Media Accounts</h4>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="instagram" className="text-xs font-medium text-slate-600 flex items-center gap-2">
                    <span className="size-5 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[10px]">IG</span>
                    Instagram Username
                  </Label>
                  <Input
                    id="instagram"
                    name="instagram"
                    value={newCase.instagram}
                    onChange={handleFormChange}
                    placeholder="@username"
                    className="border-slate-300 text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tiktok" className="text-xs font-medium text-slate-600 flex items-center gap-2">
                    <span className="size-5 rounded bg-black flex items-center justify-center text-white text-[10px]">TT</span>
                    TikTok Username
                  </Label>
                  <Input
                    id="tiktok"
                    name="tiktok"
                    value={newCase.tiktok}
                    onChange={handleFormChange}
                    placeholder="@username"
                    className="border-slate-300 text-sm"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddCaseOpen(false)}
                className="flex-1"
              >
                <X className="size-4 mr-2" />
                Cancel
              </Button>
              <Button 
                type="submit"
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                <Save className="size-4 mr-2" />
                Add Case
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Manage Workers Dialog */}
      <Dialog open={isManageWorkersOpen} onOpenChange={setIsManageWorkersOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
              <Settings className="size-5 text-indigo-600" />
              Manage Social Workers
            </DialogTitle>
            <DialogDescription>
              Add, edit, or remove social workers from the system.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Add New Worker */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Add New Worker</Label>
              <div className="flex gap-2">
                <Input
                  value={newWorkerName}
                  onChange={(e) => setNewWorkerName(e.target.value)}
                  placeholder="Enter worker name..."
                  className="border-slate-300"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddWorker();
                    }
                  }}
                />
                <Button
                  onClick={handleAddWorker}
                  disabled={!newWorkerName.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="size-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
            
            {/* Existing Workers List */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">
                Current Workers ({uniqueWorkers.length})
              </Label>
              <div className="max-h-[300px] overflow-y-auto space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50">
                {uniqueWorkers.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No workers added yet</p>
                ) : (
                  uniqueWorkers.map((worker) => (
                    <div
                      key={worker}
                      className="flex items-center justify-between bg-white rounded-lg p-3 border border-slate-200 hover:border-indigo-300 transition-colors"
                    >
                      {editingWorker === worker ? (
                        <>
                          <Input
                            value={editingWorkerName}
                            onChange={(e) => setEditingWorkerName(e.target.value)}
                            className="flex-1 mr-2 h-8 text-sm border-indigo-300"
                            autoFocus
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveWorker();
                              }
                            }}
                          />
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleSaveWorker}
                              className="h-8 px-2 hover:bg-green-50"
                            >
                              <Save className="size-3.5 text-green-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingWorker(null);
                                setEditingWorkerName('');
                              }}
                              className="h-8 px-2 hover:bg-slate-100"
                            >
                              <X className="size-3.5 text-slate-600" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 flex-1">
                            <div className="size-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                              {worker.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="text-sm font-medium text-slate-900">{worker}</span>
                            <span className="text-xs text-slate-500">
                              ({persons.filter(p => p.assignedWorker === worker).length} cases)
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditWorker(worker)}
                              className="h-8 px-2 hover:bg-indigo-50"
                            >
                              <Edit2 className="size-3.5 text-indigo-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteWorker(worker)}
                              className="h-8 px-2 hover:bg-red-50"
                            >
                              <Trash2 className="size-3.5 text-red-600" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-2 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsManageWorkersOpen(false);
                setEditingWorker(null);
                setEditingWorkerName('');
                setNewWorkerName('');
              }}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
