import React, { useState, useEffect } from 'react'
import PetComponent from '../components/Pet/Pet'

const PetPage: React.FC = () => {
  const [activity, setActivity] = useState<any>({ 
    idleTime: 0, 
    idleState: 'active', 
    category: 'Uncategorized',
    petConfig: { scale: 1 } 
  })

  useEffect(() => {
    if (window.api && window.api.onActivityUpdate) {
      const cleanup = window.api.onActivityUpdate((data) => {
        setActivity(data)
      })
      return cleanup
    }
    return () => { }
  }, [])

  const getPetState = () => {
    // 5 second idle triggers 'warning' (Red/Angry) as per user request
    if (activity.idleTime >= 5) return 'warning'

    // Normal Distraction or Break reminder
    if (activity.category === 'Distraction' || activity.category === 'Take a Break!') return 'warning'

    // Default active state
    return 'active'
  }

  return (
    <div className="w-screen h-screen flex items-center justify-center overflow-hidden">
      <PetComponent 
        state={getPetState()} 
        idleTime={activity.idleTime} 
        scale={activity.petConfig?.scale || 1}
        session={activity.session}
      />
    </div>
  )
}

export default PetPage
