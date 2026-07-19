import { useState } from 'react'

function CalculatorModal({ onClose }) {
  const [display, setDisplay] = useState('0')
  const [memory, setMemory] = useState(0)
  const [freshValue, setFreshValue] = useState(true)

  const append = (value) => {
    setDisplay((current) => {
      if (current === 'Error' || freshValue) return value === '.' ? '0.' : value
      if (value === '.' && current.split(/[+\-*/]/).at(-1).includes('.')) return current
      return `${current}${value}`
    })
    setFreshValue(false)
  }

  const operate = (operator) => {
    setDisplay((current) => `${current.replace(/[+\-*/.]$/, '')}${operator}`)
    setFreshValue(false)
  }

  const result = () => {
    try {
      if (!/^[\d+\-*/().\s]+$/.test(display)) return
      const value = Function(`"use strict"; return (${display})`)()
      setDisplay(Number.isFinite(value) ? String(Number(value.toPrecision(10))) : 'Error')
      setFreshValue(true)
    } catch {
      setDisplay('Error')
      setFreshValue(true)
    }
  }

  const numericValue = () => {
    const value = Number(display)
    return Number.isFinite(value) ? value : 0
  }

  const unary = (transform) => {
    setDisplay(String(Number(transform(numericValue()).toPrecision(10))))
    setFreshValue(true)
  }

  const clear = () => {
    setDisplay('0')
    setFreshValue(true)
  }

  const keys = [
    { label: '+/−', action: () => unary((value) => -value), tone: 'red' },
    { label: '√', action: () => unary((value) => Math.sqrt(value)), tone: 'red' },
    { label: '%', action: () => unary((value) => value / 100), tone: 'red' },
    { label: '÷', action: () => operate('/'), tone: 'red' },
    { label: 'MRC', action: () => { setDisplay(String(memory)); setFreshValue(true) }, tone: 'red', small: true },
    { label: 'M−', action: () => setMemory((value) => value - numericValue()), tone: 'red' },
    { label: 'M+', action: () => setMemory((value) => value + numericValue()), tone: 'red' },
    { label: '×', action: () => operate('*'), tone: 'red' },
    { label: '7', action: () => append('7') }, { label: '8', action: () => append('8') }, { label: '9', action: () => append('9') },
    { label: '−', action: () => operate('-'), tone: 'red' },
    { label: '4', action: () => append('4') }, { label: '5', action: () => append('5') }, { label: '6', action: () => append('6') },
    { label: '+', action: () => operate('+'), tone: 'red' },
    { label: '1', action: () => append('1') }, { label: '2', action: () => append('2') }, { label: '3', action: () => append('3') },
    { label: '=', action: result, tone: 'red', tall: true },
    { label: 'ON/C', action: clear, tone: 'red', small: true }, { label: '0', action: () => append('0') }, { label: '•', action: () => append('.') },
  ]

  return (
    <div className="calculator-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="ti-window" role="dialog" aria-modal="true" aria-label="Texas Instruments TI-108 calculator">
        <header className="ti-window-bar">
          <span className="ti-window-icon" aria-hidden="true" />
          <span>Calculator</span>
          <button type="button" aria-label="Close calculator" onClick={onClose}>×</button>
        </header>
        <div className="ti-window-strip" />
        <div className="ti-calculator">
          <output className="ti-display" aria-live="polite">{display}</output>
          <div className="ti-brand-row">
            <span className="ti-brand"><b>TI</b> TEXAS INSTRUMENTS</span>
            <strong>TI-108</strong>
          </div>
          <div className="ti-key-bed">
            {keys.map((key) => (
              <button
                className={`ti-key ${key.tone === 'red' ? 'ti-key-red' : 'ti-key-white'}${key.tall ? ' ti-key-tall' : ''}${key.small ? ' ti-key-small' : ''}`}
                key={key.label}
                type="button"
                onClick={key.action}
              >
                {key.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default CalculatorModal
