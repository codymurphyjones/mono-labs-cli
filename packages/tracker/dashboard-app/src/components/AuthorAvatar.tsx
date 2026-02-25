import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar'

interface AuthorAvatarProps {
  name: string
  email?: string
  size?: number
}

// Simple hash for deterministic color
function hashColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const colors = ['#6f7dff', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']
  return colors[Math.abs(hash) % colors.length]
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

// Simple MD5-like hash for gravatar (basic implementation)
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + chr
    hash |= 0
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}

export function AuthorAvatar({ name, email, size = 24 }: AuthorAvatarProps) {
  const bgColor = hashColor(name)
  const initials = getInitials(name)
  const sizeClass = size <= 24 ? 'size-6' : size <= 32 ? 'size-8' : 'size-10'
  const fontSize = size * 0.4

  if (email) {
    const hash = simpleHash(email.trim().toLowerCase())
    const gravatarUrl = `https://gravatar.com/avatar/${hash}?d=identicon&s=${size * 2}`

    return (
      <Avatar className={sizeClass} title={name}>
        <AvatarImage src={gravatarUrl} alt={name} />
        <AvatarFallback
          className="text-white font-bold"
          style={{ backgroundColor: bgColor, fontSize }}
        >
          {initials}
        </AvatarFallback>
      </Avatar>
    )
  }

  return (
    <Avatar className={sizeClass} title={name}>
      <AvatarFallback
        className="text-white font-bold"
        style={{ backgroundColor: bgColor, fontSize }}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
