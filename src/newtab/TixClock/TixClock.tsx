import { useState, useEffect, memo } from 'react'
import './TixClock.css'

const TixSquare = memo(({ isLit }: { isLit: boolean }) => (
  <div className={`square ${isLit ? 'lit' : ''}`} />
))
TixSquare.displayName = 'TixSquare'

const TixDigit = memo(({ squares, index }: { squares: boolean[]; index: number }) => (
  <div className={`digitContainer digit${index + 1}`}>
    {squares.map((isLit, squareIndex) => (
      <TixSquare key={squareIndex} isLit={isLit} />
    ))}
  </div>
))
TixDigit.displayName = 'TixDigit'

interface TixClockProps extends React.HTMLAttributes<HTMLDivElement> {}

export const TixClock: React.FC<TixClockProps> = (props) => {
  const [tixMatrix, setTixMatrix] = useState<boolean[][]>([])

  const getRandomPositions = (count: number, total: number): number[] => {
    const positions: number[] = []
    const available = Array.from({ length: total }, (_, i) => i)

    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * available.length)
      positions.push(available.splice(randomIndex, 1)[0])
    }

    return positions
  }

  const createTixDisplay = (digit: number, maxSquares: number): boolean[] => {
    const squares = new Array(maxSquares).fill(false)
    if (digit > 0) {
      const positions = getRandomPositions(digit, maxSquares)
      for (let i = 0; i < positions.length; i++) squares[positions[i]] = true
    }
    return squares
  }

  const updateTixDisplay = () => {
    const now = new Date()
    const hours = now.getHours()
    const minutes = now.getMinutes()

    const h1 = Math.floor(hours / 10)
    const h2 = hours % 10
    const m1 = Math.floor(minutes / 10)
    const m2 = minutes % 10

    setTixMatrix([
      createTixDisplay(h1, 3),
      createTixDisplay(h2, 9),
      createTixDisplay(m1, 6),
      createTixDisplay(m2, 9),
    ])
  }

  useEffect(() => {
    updateTixDisplay()
    const tixInterval = setInterval(updateTixDisplay, 10 * 1000)
    return () => clearInterval(tixInterval)
  }, [])

  return (
    <div {...props}>
      {tixMatrix.map((digit, index) => (
        <div key={index} className={`digitContainer digit${index + 1}`}>
          {digit.map((isLit, squareIndex) => (
            <div key={squareIndex} className={`square ${isLit ? 'lit' : ''}`} />
          ))}
        </div>
      ))}
    </div>
  )
}
