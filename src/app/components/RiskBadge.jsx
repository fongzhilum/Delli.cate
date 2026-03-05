import { Badge } from './ui/badge';

export function RiskBadge({ level, size = 'md' }) {
  const getRiskStyles = (riskLevel) => {
    switch (riskLevel) {
      case 'low':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0';
      case 'medium':
        return 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0';
      case 'high':
        return 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-0';
      case 'critical':
        return 'bg-gradient-to-r from-red-600 to-pink-600 text-white border-0 shadow-lg shadow-red-200';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'px-2.5 py-1 text-xs';
      case 'md':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-4 py-2 text-base';
    }
  };

  return (
    <Badge 
      className={`${getRiskStyles(level)} ${getSizeClass()} font-bold uppercase tracking-wide`}
    >
      {level}
    </Badge>
  );
}
