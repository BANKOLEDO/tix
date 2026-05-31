import { useState, useEffect } from 'react'

export default function ConfirmToast({ message, onConfirm, onCancel }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  function handleConfirm() {
    setVisible(false)
    setTimeout(onConfirm, 200)
  }

  function handleCancel() {
    setVisible(false)
    setTimeout(onCancel, 200)
  }

  return (
    <div className={`toast-overlay ${visible ? 'toast-show' : ''}`}>
      <div className="toast">
        <p className="toast-msg">{message}</p>
        <div className="toast-actions">
          <button className="btn btn-sm" onClick={handleCancel}>cancel</button>
          <button className="btn btn-sm btn-danger" onClick={handleConfirm}>yes, do it</button>
        </div>
      </div>
    </div>
  )
}
