import { Card, CardContent } from './ui/card';
import { RiskBadge } from './RiskBadge';
import { SocialMediaLinks } from './SocialMediaLinks';
import { User, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

export function PersonCard({ person, onViewDetails, onUpdateStatus }) {
  const concerningPosts = person.distressPosts ? person.distressPosts.filter(p => p.isConcerning) : [];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-xs font-semibold px-2 py-0.5">Active</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-700 border-green-300 text-xs font-semibold px-2 py-0.5">Resolved</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className={`hover:shadow-xl transition-all duration-300 border-2 bg-white overflow-hidden h-full flex flex-col ${person.status === 'resolved' ? 'border-green-200 bg-green-50/30' : 'border-slate-200'}`}>
      <CardContent className="p-6 flex flex-col h-full gap-4">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          {/* Avatar + name */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-11 shrink-0 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-base shadow-lg">
              {person.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-slate-900 leading-tight">{person.name}</h3>
                {getStatusBadge(person.status)}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{person.age}y • {person.location}</p>
            </div>
          </div>

          {/* Distress + risk badge stacked */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-400">Distress:</span>
              <span className="text-base font-bold text-slate-900">{person.distressScore}%</span>
            </div>
            <RiskBadge level={person.riskLevel} size="sm" />
          </div>
        </div>

        {/* Signal banner */}
        {concerningPosts.length > 0 && person.status !== 'resolved' && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 flex items-center gap-2">
            <AlertTriangle className="size-3.5 text-orange-500 shrink-0" />
            <span className="text-xs font-semibold text-orange-800">
              {concerningPosts.length} signal{concerningPosts.length !== 1 ? 's' : ''} detected
            </span>
          </div>
        )}

        {/* Resolved banner */}
        {person.status === 'resolved' && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-green-500 shrink-0" />
            <span className="text-xs font-semibold text-green-800">
              Case resolved{person.resolvedDate ? ` on ${new Date(person.resolvedDate).toLocaleDateString()}` : ''}
            </span>
          </div>
        )}

        {/* Key Notes */}
        <div className="flex-grow">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Key Notes</p>
          <div className="space-y-1.5">
            {person.notes.slice(0, 3).map((note, index) => (
              <div key={index} className="flex gap-2 text-xs leading-relaxed">
                <div className="size-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <p className="text-slate-700 line-clamp-2">{note}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 pt-4 flex flex-col gap-3 mt-auto">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <User className="size-3 text-slate-400" />
              <span className="font-medium text-slate-700">{person.assignedWorker}</span>
            </div>
            <span className="font-medium">{person.caseId}</span>
          </div>

          <SocialMediaLinks accounts={person.socialMediaAccounts} />

          <Button
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all text-sm h-9"
            onClick={() => onViewDetails(person)}
          >
            View Analysis
          </Button>
        </div>

      </CardContent>
    </Card>
  );
}