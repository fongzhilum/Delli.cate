import { Instagram } from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

export function SocialMediaLinks({ accounts }) {
  // Filter to only show Instagram and TikTok
  const filteredAccounts = accounts.filter(account => 
    account.platform === 'instagram' || account.platform === 'tiktok'
  );

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="size-4" />;
      case 'tiktok':
        return (
          <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const getPlatformColor = (platform) => {
    switch (platform) {
      case 'instagram':
        return 'hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 hover:text-pink-600 border-pink-200';
      case 'tiktok':
        return 'hover:bg-slate-50 hover:text-slate-900 border-slate-200';
      default:
        return '';
    }
  };

  const getPlatformLabel = (platform) => {
    switch (platform) {
      case 'instagram':
        return 'Instagram';
      case 'tiktok':
        return 'TikTok';
      default:
        return platform;
    }
  };

  if (filteredAccounts.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="flex gap-2 flex-wrap">
        {filteredAccounts.map((account, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={`size-9 ${getPlatformColor(account.platform)}`}
                onClick={() => window.open(account.url, '_blank')}
              >
                {getPlatformIcon(account.platform)}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                <div className="font-medium">{getPlatformLabel(account.platform)}</div>
                <div className="text-muted-foreground">{account.username}</div>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
