import React from 'react'
import Svg, { Path } from 'react-native-svg'

interface LineSquiggleIconProps {
  size?: number
  color?: string
}

export function LineSquiggleIcon({ size = 18, color = '#ffffff' }: LineSquiggleIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <Path
        d="M7 3.5c5-2 7 2.5 3 4C1.5 10 2 15 5 16c5 2 9-10 14-7s.5 13.5-4 12c-5-2.5.5-11 6-2"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
