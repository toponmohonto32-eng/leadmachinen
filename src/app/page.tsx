'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  MapPin, 
  Globe, 
  Mail, 
  Phone, 
  Star, 
  TrendingUp, 
  Download,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Users,
  MessageSquare,
  Sparkles,
  Filter,
  Target,
  Flame,
  Zap,
  Shield,
  FileText,
  AlertOctagon,
  CheckCircle
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  county: string | null;
  niche: string | null;
  hasWebsite: boolean;
  rating: number | null;
  reviewCount: number;
  socialFacebook: string | null;
  socialTwitter: string | null;
  socialLinkedIn: string | null;
  category: string | null;
  isEnriched: boolean;
  createdAt: string;
  contacts?: any[];
  reviews?: any[];
  qualityScore?: number | null;
  qualityFactors?: string | null;
  tags?: string | null;
  status?: string | null;
  priority?: string | null;
  isDuplicate?: boolean;
  emailValid?: boolean | null;
  emailDeliverable?: boolean | null;
}

interface SearchJob {
  id: string;
  query: string;
  postalCode: string | null;
  city: string | null;
  county: string | null;
  niche: string | null;
  status: string;
  resultsCount: number;
  createdAt: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('search');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchJobs, setSearchJobs] = useState<SearchJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [totalLeads, setTotalLeads] = useState(0);
  
  // Search form state
  const [searchQuery, setSearchQuery] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [city, setCity] = useState('');
  const [county, setCounty] = useState('');
  const [niche, setNiche] = useState('');
  const [limit, setLimit] = useState(20);

  // Filters
  const [filterHasWebsite, setFilterHasWebsite] = useState<string>('all');
  const [filterCity, setFilterCity] = useState('');
  const [filterPostalCode, setFilterPostalCode] = useState('');
  const [filterNiche, setFilterNiche] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterMinScore, setFilterMinScore] = useState('');
  const [bulkEnriching, setBulkEnriching] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    withoutWebsite: 0,
    withWebsite: 0,
    avgRating: 0,
    avgQualityScore: 0,
    hotLeads: 0,
    warmLeads: 0,
    coldLeads: 0,
    enrichedCount: 0,
  });

  // Enrichment stats
  const [enrichmentStats, setEnrichmentStats] = useState<any>(null);

  // Fetch enrichment stats
  const fetchEnrichmentStats = async () => {
    try {
      const response = await fetch('/api/leads/bulk/enrich');
      const data = await response.json();
      if (data.success) {
        setEnrichmentStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching enrichment stats:', error);
    }
  };

  // Fetch leads
  const fetchLeads = async (offset = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '50',
        offset: offset.toString(),
        sortBy: 'qualityScore',
        sortOrder: 'desc',
      });

      if (filterHasWebsite !== 'all') {
        params.append('hasWebsite', filterHasWebsite);
      }
      if (filterCity) params.append('city', filterCity);
      if (filterPostalCode) params.append('postalCode', filterPostalCode);
      if (filterNiche) params.append('niche', filterNiche);
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      if (filterPriority !== 'all') {
        params.append('priority', filterPriority);
      }
      if (filterMinScore) {
        params.append('minQualityScore', filterMinScore);
      }

      const response = await fetch(`/api/leads?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setLeads(data.leads);
        setTotalLeads(data.total);
        
        // Calculate stats
        const allLeads = data.leads;
        setStats({
          total: data.total,
          withoutWebsite: allLeads.filter((l: Lead) => !l.hasWebsite).length,
          withWebsite: allLeads.filter((l: Lead) => l.hasWebsite).length,
          avgRating: allLeads.reduce((acc: number, l: Lead) => acc + (l.rating || 0), 0) / allLeads.length || 0,
          avgQualityScore: allLeads.reduce((acc: number, l: Lead) => acc + (l.qualityScore || 0), 0) / allLeads.filter((l: Lead) => l.qualityScore !== null).length || 0,
          hotLeads: allLeads.filter((l: Lead) => l.status === 'hot').length,
          warmLeads: allLeads.filter((l: Lead) => l.status === 'warm').length,
          coldLeads: allLeads.filter((l: Lead) => l.status === 'cold').length,
          enrichedCount: allLeads.filter((l: Lead) => l.isEnriched).length,
        });
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch search jobs
  const fetchSearchJobs = async () => {
    try {
      const response = await fetch('/api/scraping/search');
      const data = await response.json();
      if (data.success) {
        setSearchJobs(data.searches);
      }
    } catch (error) {
      console.error('Error fetching search jobs:', error);
    }
  };

  // Start new search
  const handleSearch = async () => {
    if (!searchQuery && !postalCode && !city) {
      alert('Please enter at least a search query, postal code, or city');
      return;
    }

    setSearching(true);
    try {
      const response = await fetch('/api/scraping/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          postalCode,
          city,
          county,
          niche,
          limit,
          extractReviews: true,
          extractEmails: true,
          extractSocialLinks: true,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Poll for status
        pollSearchStatus(data.searchId);
        setActiveTab('leads');
      }
    } catch (error) {
      console.error('Error starting search:', error);
      alert('Failed to start search');
    } finally {
      setSearching(false);
    }
  };

  // Poll search status
  const pollSearchStatus = async (searchId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/scraping/status/${searchId}`);
        const data = await response.json();
        
        if (data.success && data.search.status !== 'running') {
          clearInterval(interval);
          fetchLeads();
          fetchSearchJobs();
        }
      } catch (error) {
        console.error('Error polling status:', error);
        clearInterval(interval);
      }
    }, 2000);

    // Stop polling after 5 minutes
    setTimeout(() => clearInterval(interval), 300000);
  };

  // Score lead with AI
  const scoreLead = async (leadId: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}/score`, {
        method: 'POST',
      });
      
      const data = await response.json();
      if (data.success) {
        fetchLeads();
        fetchEnrichmentStats();
        alert(`Lead scored successfully! Quality Score: ${data.score.score}/100 (${data.score.qualification})`);
      }
    } catch (error) {
      console.error('Error scoring lead:', error);
      alert('Failed to score lead');
    }
  };

  // Enrich lead with AI (legacy - finds contacts)
  const enrichLead = async (leadId: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}/enrich`, {
        method: 'POST',
      });
      
      const data = await response.json();
      if (data.success) {
        fetchLeads();
        alert(`Lead enriched successfully! Found ${data.contactsFound} contacts.`);
      }
    } catch (error) {
      console.error('Error enriching lead:', error);
      alert('Failed to enrich lead');
    }
  };

  // Bulk enrich all leads
  const bulkEnrich = async () => {
    if (!confirm('This will score and enrich up to 50 unenriched leads using AI. Continue?')) {
      return;
    }

    setBulkEnriching(true);
    try {
      const response = await fetch('/api/leads/bulk/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrichAll: true }),
      });
      
      const data = await response.json();
      if (data.success) {
        fetchLeads();
        fetchEnrichmentStats();
        alert(data.message);
      }
    } catch (error) {
      console.error('Error bulk enriching:', error);
      alert('Failed to bulk enrich leads');
    } finally {
      setBulkEnriching(false);
    }
  };

  // Export leads
  const exportLeads = async () => {
    try {
      const params = new URLSearchParams();
      if (filterHasWebsite !== 'all') params.append('hasWebsite', filterHasWebsite);
      if (filterCity) params.append('city', filterCity);
      if (filterPostalCode) params.append('postalCode', filterPostalCode);
      if (filterNiche) params.append('niche', filterNiche);

      window.location.href = `/api/leads/export?${params}`;
    } catch (error) {
      console.error('Error exporting leads:', error);
      alert('Failed to export leads');
    }
  };

  // Delete lead
  const deleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchLeads();
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('Failed to delete lead');
    }
  };

  // Initial load
  useEffect(() => {
    fetchLeads();
    fetchSearchJobs();
    fetchEnrichmentStats();
  }, [filterHasWebsite, filterCity, filterPostalCode, filterNiche, filterStatus, filterPriority, filterMinScore]);

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Google My Business Lead Generator
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                Discover businesses without websites and generate high-quality leads with AI-powered enrichment
              </p>
            </div>
            <Button onClick={() => fetchLeads()} variant="outline" size="icon">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Total Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{stats.total}</div>
                <Building2 className="h-6 w-6 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Avg Quality Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-purple-600">{stats.avgQualityScore.toFixed(0)}</div>
                <Target className="h-6 w-6 text-purple-500 opacity-20" />
              </div>
              <Progress value={stats.avgQualityScore} className="h-1 mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Hot Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-red-500">{stats.hotLeads}</div>
                <Flame className="h-6 w-6 text-red-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Warm Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-orange-500">{stats.warmLeads}</div>
                <Zap className="h-6 w-6 text-orange-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Cold Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-blue-500">{stats.coldLeads}</div>
                <Shield className="h-6 w-6 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Enriched
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-green-500">{stats.enrichedCount}</div>
                <Sparkles className="h-6 w-6 text-green-500 opacity-20" />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {stats.total > 0 ? `${Math.round((stats.enrichedCount / stats.total) * 100)}%` : '0%'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="search">New Search</TabsTrigger>
            <TabsTrigger value="leads">All Leads</TabsTrigger>
            <TabsTrigger value="no-website">
              No Website Hub
            </TabsTrigger>
            <TabsTrigger value="history">Search History</TabsTrigger>
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search">
            <Card>
              <CardHeader>
                <CardTitle>Search Google My Business</CardTitle>
                <CardDescription>
                  Find businesses by location, niche, or postal code
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="searchQuery">Search Query</Label>
                    <Input
                      id="searchQuery"
                      placeholder="e.g., restaurants, plumbers, dentists"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="niche">Business Niche</Label>
                    <Input
                      id="niche"
                      placeholder="e.g., Restaurant, Dental, Automotive"
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      placeholder="e.g., 90001"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="e.g., Los Angeles"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="county">County</Label>
                    <Input
                      id="county"
                      placeholder="e.g., Los Angeles County"
                      value={county}
                      onChange={(e) => setCounty(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="limit">Results Limit</Label>
                    <Input
                      id="limit"
                      type="number"
                      min="1"
                      max="100"
                      value={limit}
                      onChange={(e) => setLimit(parseInt(e.target.value) || 20)}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSearch}
                  disabled={searching}
                  className="w-full md:w-auto"
                  size="lg"
                >
                  {searching ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Start Search
                    </>
                  )}
                </Button>

                {searching && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      Search in progress... Results will appear in the Leads tab when complete.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Leads</CardTitle>
                    <CardDescription>
                      Manage and enrich your business leads
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={exportLeads} variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="space-y-4 mb-6">
                  <div className="flex flex-wrap gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium">Filters:</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Website:</Label>
                      <select
                        value={filterHasWebsite}
                        onChange={(e) => setFilterHasWebsite(e.target.value)}
                        className="px-3 py-1.5 text-sm border rounded-md bg-white dark:bg-slate-700"
                      >
                        <option value="all">All</option>
                        <option value="false">No Website</option>
                        <option value="true">Has Website</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Qualification:</Label>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-1.5 text-sm border rounded-md bg-white dark:bg-slate-700"
                      >
                        <option value="all">All</option>
                        <option value="hot">🔥 Hot</option>
                        <option value="warm">⚡ Warm</option>
                        <option value="cold">❄️ Cold</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Priority:</Label>
                      <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className="px-3 py-1.5 text-sm border rounded-md bg-white dark:bg-slate-700"
                      >
                        <option value="all">All</option>
                        <option value="urgent">🚨 Urgent</option>
                        <option value="high">🔺 High</option>
                        <option value="medium">⬜ Medium</option>
                        <option value="low">⬇️ Low</option>
                      </select>
                    </div>

                    <Input
                      placeholder="Min quality score..."
                      type="number"
                      min="0"
                      max="100"
                      value={filterMinScore}
                      onChange={(e) => setFilterMinScore(e.target.value)}
                      className="w-32"
                    />

                    <Input
                      placeholder="Filter by city..."
                      value={filterCity}
                      onChange={(e) => setFilterCity(e.target.value)}
                      className="w-40"
                    />
                    
                    <Input
                      placeholder="Filter by postal code..."
                      value={filterPostalCode}
                      onChange={(e) => setFilterPostalCode(e.target.value)}
                      className="w-40"
                    />
                    
                    <Input
                      placeholder="Filter by niche..."
                      value={filterNiche}
                      onChange={(e) => setFilterNiche(e.target.value)}
                      className="w-40"
                    />
                  </div>

                  {/* Bulk Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={bulkEnrich}
                      disabled={bulkEnriching}
                      variant="default"
                      size="sm"
                    >
                      {bulkEnriching ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Enriching...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Bulk Enrich (AI Score)
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Leads Table */}
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Business Name</TableHead>
                        <TableHead className="w-[120px]">Score</TableHead>
                        <TableHead className="w-[100px]">Qualification</TableHead>
                        <TableHead className="w-[80px]">Priority</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Website</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : leads.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                            No leads found. Start a new search to generate leads.
                          </TableCell>
                        </TableRow>
                      ) : (
                        leads.map((lead) => (
                          <TableRow key={lead.id}>
                            <TableCell className="font-medium">
                              <div>
                                <div className="font-semibold">{lead.name}</div>
                                {lead.isEnriched && (
                                  <Badge variant="secondary" className="mt-1">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    Enriched
                                  </Badge>
                                )}
                                {lead.isDuplicate && (
                                  <Badge variant="destructive" className="mt-1">
                                    <AlertOctagon className="h-3 w-3 mr-1" />
                                    Duplicate
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {lead.qualityScore !== null && lead.qualityScore !== undefined ? (
                                <div className="flex items-center gap-2">
                                  <div className="text-lg font-bold" style={{
                                    color: (lead.qualityScore ?? 0) >= 70 ? '#ef4444' : 
                                           (lead.qualityScore ?? 0) >= 50 ? '#f97316' : '#3b82f6'
                                  }}>
                                    {lead.qualityScore.toFixed(0)}
                                  </div>
                                  <div className="w-12">
                                    <Progress 
                                      value={lead.qualityScore || 0} 
                                      className="h-2"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-sm">Not scored</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {lead.status ? (
                                <Badge 
                                  variant={lead.status === 'hot' ? 'default' : lead.status === 'warm' ? 'secondary' : 'outline'}
                                  className={
                                    lead.status === 'hot' ? 'bg-red-500' : 
                                    lead.status === 'warm' ? 'bg-orange-500' : ''
                                  }
                                >
                                  {lead.status === 'hot' && <Flame className="h-3 w-3 mr-1" />}
                                  {lead.status === 'warm' && <Zap className="h-3 w-3 mr-1" />}
                                  {lead.status === 'cold' && <Shield className="h-3 w-3 mr-1" />}
                                  {lead.status}
                                </Badge>
                              ) : (
                                <span className="text-slate-400 text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {lead.priority ? (
                                <Badge 
                                  variant={
                                    lead.priority === 'urgent' ? 'destructive' : 
                                    lead.priority === 'high' ? 'default' : 'outline'
                                  }
                                  className={
                                    lead.priority === 'high' ? 'bg-orange-500' : ''
                                  }
                                >
                                  {lead.priority === 'urgent' && <AlertOctagon className="h-3 w-3 mr-1" />}
                                  {lead.priority === 'high' && <TrendingUp className="h-3 w-3 mr-1" />}
                                  {lead.priority}
                                </Badge>
                              ) : (
                                <span className="text-slate-400 text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {lead.city || 'N/A'}
                                </div>
                                <div className="text-slate-500">{lead.postalCode || ''}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1 text-sm">
                                {lead.email && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    <span className="truncate max-w-[120px]">
                                      {lead.email}
                                    </span>
                                    {lead.emailValid !== null && (
                                      lead.emailValid ? (
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                      ) : (
                                        <XCircle className="h-3 w-3 text-red-500" />
                                      )
                                    )}
                                  </div>
                                )}
                                {lead.phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    <span className="truncate max-w-[120px]">{lead.phone}</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                <span className="font-semibold">{lead.rating?.toFixed(1) || 'N/A'}</span>
                                <span className="text-slate-500 text-sm">({lead.reviewCount})</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {lead.hasWebsite ? (
                                <Badge variant="default" className="bg-green-500">
                                  <Globe className="h-3 w-3 mr-1" />
                                  Yes
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-orange-500 text-white">
                                  <Globe className="h-3 w-3 mr-1" />
                                  No
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => scoreLead(lead.id)}
                                  disabled={lead.isEnriched}
                                  title="Score with AI"
                                >
                                  <Target className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => enrichLead(lead.id)}
                                  title="Find contacts"
                                >
                                  <Users className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteLead(lead.id)}
                                  title="Delete"
                                >
                                  ×
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination info */}
                <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
                  <span>Showing {leads.length} of {totalLeads} leads</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* No Website Hub Tab */}
          <TabsContent value="no-website">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-orange-500" />
                      Businesses Without Websites
                    </CardTitle>
                    <CardDescription>
                      High-priority leads: Businesses running without a website but with reviews
                    </CardDescription>
                  </div>
                  <Button onClick={exportLeads} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Alert className="mb-6">
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    These businesses have active Google My Business profiles with reviews but no website.
                    They represent prime opportunities for web development and digital marketing services.
                  </AlertDescription>
                </Alert>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Reviews</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : leads.filter(l => !l.hasWebsite).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                            No businesses without websites found. Start a search to find leads.
                          </TableCell>
                        </TableRow>
                      ) : (
                        leads
                          .filter((lead) => !lead.hasWebsite)
                          .map((lead) => (
                            <TableRow key={lead.id}>
                              <TableCell className="font-medium">
                                <div>
                                  <div className="font-semibold">{lead.name}</div>
                                  {lead.isEnriched && (
                                    <Badge variant="secondary" className="mt-1">
                                      <Sparkles className="h-3 w-3 mr-1" />
                                      Enriched
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {lead.city || 'N/A'}
                                  </div>
                                  <div className="text-slate-500">{lead.postalCode || ''}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1 text-sm">
                                  {lead.email && (
                                    <div className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      <span className="truncate max-w-[150px]">{lead.email}</span>
                                    </div>
                                  )}
                                  {lead.phone && (
                                    <div className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      <span className="truncate max-w-[150px]">{lead.phone}</span>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                  <span className="font-semibold">{lead.rating?.toFixed(1) || 'N/A'}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="h-4 w-4" />
                                  <span className="font-semibold">{lead.reviewCount}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{lead.niche || lead.category || 'N/A'}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => enrichLead(lead.id)}
                                    disabled={lead.isEnriched}
                                    title="Enrich with AI"
                                  >
                                    <Sparkles className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteLead(lead.id)}
                                    title="Delete"
                                  >
                                    ×
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Search History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Search History</CardTitle>
                <CardDescription>
                  Track your past searches and their results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {searchJobs.length === 0 ? (
                    <p className="text-center text-slate-500 py-8">
                      No search history yet. Start a search to see history here.
                    </p>
                  ) : (
                    searchJobs.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          {getStatusIcon(job.status)}
                          <div>
                            <div className="font-semibold">
                              {job.query || `${job.niche || 'Business'} in ${job.city || job.postalCode || 'Unknown'}`}
                            </div>
                            <div className="text-sm text-slate-500">
                              {job.city && <span>{job.city}</span>}
                              {job.postalCode && <span> • {job.postalCode}</span>}
                              {job.niche && <span> • {job.niche}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{job.resultsCount} results</div>
                          <div className="text-sm text-slate-500">
                            {new Date(job.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-slate-500">
          <p>Powered by Multi-Provider AI (Z AI, Together AI, Hugging Face, Ollama) • Custom Scraper (Puppeteer) • Built with Next.js 16 & shadcn/ui</p>
          <p className="mt-1 text-xs">100% Open Source • No Paid Services Required</p>
        </footer>
      </div>
    </div>
  );
}
