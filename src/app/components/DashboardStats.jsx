export function DashboardStats({ totalCases, criticalCases, highRiskCases, mediumRiskCases, lowRiskCases, activeCases, resolvedCases, filterRisk, onRiskClick }) {
  const riskStats = [
    { 
      label: 'Critical', 
      value: criticalCases, 
      gradient: 'from-red-600 to-pink-600',
      shadow: 'shadow-red-100',
      border: 'border-red-200',
      description: 'Active cases only',
      riskLevel: 'critical'
    },
    { 
      label: 'High', 
      value: highRiskCases, 
      gradient: 'from-orange-600 to-amber-600',
      shadow: 'shadow-orange-100',
      border: 'border-orange-200',
      description: 'Active cases only',
      riskLevel: 'high'
    },
    { 
      label: 'Medium', 
      value: mediumRiskCases, 
      gradient: 'from-yellow-500 to-orange-500',
      shadow: 'shadow-yellow-100',
      border: 'border-yellow-200',
      description: 'Active cases only',
      riskLevel: 'medium'
    },
    { 
      label: 'Low', 
      value: lowRiskCases, 
      gradient: 'from-green-600 to-emerald-600',
      shadow: 'shadow-green-100',
      border: 'border-green-200',
      description: 'Active cases only',
      riskLevel: 'low'
    }
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Risk Levels</h3>
        <div className="text-xs text-slate-500 font-semibold">
          Total: {totalCases} cases ({activeCases} active, {resolvedCases} resolved)
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {riskStats.map((stat, index) => {
          const isActive = filterRisk === stat.riskLevel;
          return (
            <button
              key={index}
              onClick={() => onRiskClick(stat.riskLevel)}
              className={`bg-white border ${stat.border} rounded-xl p-4 shadow-sm ${stat.shadow} hover:shadow-md transition-all cursor-pointer transform hover:scale-105 text-left ${
                isActive ? 'ring-2 ring-offset-2 ring-indigo-500 shadow-lg scale-105' : ''
              }`}
            >
              <div className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-1`}>
                {stat.value}
              </div>
              <div className="text-sm font-bold text-slate-700">{stat.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
