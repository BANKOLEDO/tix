import { useState, useEffect } from 'react'

export default function Snackbar({ message, type }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  return (
    <div className={`snackbar snackbar-${type} ${visible ? 'snackbar-show' : ''}`}>
      {message}
    </div>
  )
}
