// Template for React components
import React from 'react'
import { cn } from '@/lib/utils'

interface ComponentNameProps {
  className?: string
  children?: React.ReactNode
  // Add specific props here
}

const ComponentName: React.FC<ComponentNameProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  )
}

export default ComponentName

// Usage example:
// <ComponentName className="custom-class">Content</ComponentName>