"use client"

import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BlockchainBadgeProps {
  txHash: string;
  etherscanUrl: string;
  orderId?: number;
  className?: string;
}

export function BlockchainBadge({ txHash, etherscanUrl, orderId, className }: BlockchainBadgeProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        <span className="flex items-center gap-1">
          🔗 Blockchain
          {orderId && <span className="ml-1">#{orderId}</span>}
        </span>
      </Badge>
      <a 
        href={etherscanUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs"
        title="View on Etherscan"
      >
        {txHash.slice(0, 8)}...{txHash.slice(-6)}
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
