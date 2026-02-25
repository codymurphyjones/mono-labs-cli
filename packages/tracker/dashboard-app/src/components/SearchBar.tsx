import { cn } from '@/lib/utils'
import { Input } from './ui/input'
import { Button } from './ui/button'

export type ScanStatus = 'idle' | 'scanning' | 'success' | 'error'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onScan: () => void
  scanStatus?: ScanStatus
  scanMessage?: string
}

export function SearchBar({ value, onChange, onScan, scanStatus = 'idle', scanMessage }: SearchBarProps) {
  const isScanning = scanStatus === 'scanning'

  const label = isScanning ? 'Scanning...' : scanMessage || 'Re-scan'

  return (
    <div className="flex gap-2 mb-4">
      <Input
        type="text"
        placeholder="Search notations..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1"
      />
      <Button
        onClick={onScan}
        disabled={isScanning}
        variant={scanStatus === 'error' ? 'destructive' : 'default'}
        className={cn(
          scanStatus === 'success' && 'bg-emerald-600 hover:bg-emerald-600/90 text-white',
          isScanning && 'opacity-70',
        )}
      >
        {label}
      </Button>
    </div>
  )
}
