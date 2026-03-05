import { Card, CardContent } from './ui/card';
import { RiskBadge } from './RiskBadge';
import { SocialMediaLinks } from './SocialMediaLinks';
import { User, AlertTriangle, CheckCircle2, Eye, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export function PersonCard({ person, onViewDetails, onUpdateStatus }) {
  const concerningPosts = person.distressPosts ? person.distressPosts.filter(p => p.isConcerning) : [];

  // Get color based on distress score
  const getScoreStroke = (score) => {
    if (score >= 65) return '#dc2626';
    if (score >= 45) return '#ea580c';
    if (score >= 25) return '#ca8a04';
    return '#16a34a';
  };

  const getScoreColor = (score) => {
    if (score >= 65) return 'text-red-600';
    if (score >= 45) return 'text-orange-600';
    if (score >= 25) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-xs font-semibold">Active</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-700 border-green-300 text-xs font-semibold">Resolved</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className={`hover:shadow-xl transition-all duration-300 border-2 bg-white overflow-hidden h-full flex flex-col ${person.status === 'resolved' ? 'border-green-200 bg-green-50/30' : 'border-slate-200'}`}>
      <CardContent className="p-5 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="size-12 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {person.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900">{person.name}</h3>
                {getStatusBadge(person.status)}
              </div>
              <p className="text-xs text-slate-600">
                {person.age}y • {person.location}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Distress Score */}
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-slate-500">Distress:</span>
              <span className="text-lg font-bold text-slate-900">
                {person.distressScore}%
              </span>
            </div>
            <RiskBadge level={person.riskLevel} size="sm" />
          </div>
        </div>

        {/* Warning Banner */}
        {concerningPosts.length > 0 && person.status !== 'resolved' && (
          <div className="mb-4 bg-orange-100 border-l-3 border-orange-600 rounded p-2.5">
            <div className="flex items-center gap-2 text-orange-900">
              <AlertTriangle className="size-3.5 flex-shrink-0" />
              <span className="font-semibold text-xs">
                {concerningPosts.length} signal{concerningPosts.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Resolved Banner */}
        {person.status === 'resolved' && (
          <div className="mb-4 bg-green-100 border-l-3 border-green-600 rounded p-2.5">
            <div className="flex items-center gap-2 text-green-900">
              <CheckCircle2 className="size-3.5 flex-shrink-0" />
              <span className="font-semibold text-xs">
                Case resolved {person.resolvedDate ? `on ${new Date(person.resolvedDate).toLocaleDateString()}` : ''}
              </span>
            </div>
          </div>
        )}

        {/* Key Notes - Main Focus */}
        <div className="mb-4 flex-grow">
          <h4 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2.5">Key Notes</h4>
          <div className="space-y-2">
            {person.notes.slice(0, 3).map((note, index) => (
              <div 
                key={index} 
                className="flex gap-2 text-xs leading-relaxed"
              >
                <div className="size-1 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0" />
                <p className="text-slate-800 line-clamp-2">{note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="pt-3 border-t border-slate-200 space-y-2.5 mt-auto">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-600">
              <User className="size-3" />
              <span className="font-medium">{person.assignedWorker}</span>
            </div>
            <div className="text-slate-500 font-medium">
              {person.caseId}
            </div>
          </div>

          <SocialMediaLinks accounts={person.socialMediaAccounts} />

          <Button 
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all text-xs py-2"
            onClick={() => onViewDetails(person)}
          >
            View Analysis
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
