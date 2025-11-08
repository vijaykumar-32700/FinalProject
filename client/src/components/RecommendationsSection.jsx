"use client"

import { useState, useEffect } from "react"
import "../styles/recommendations.css"

export default function RecommendationsSection({ userId, token, onRegister }) {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [activityEvents, setActivityEvents] = useState([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [userRegisteredEvents, setUserRegisteredEvents] = useState([])

  useEffect(() => {
    fetchRecommendations()
    fetchUserRegisteredEvents()
  }, [userId, token])

  const fetchRecommendations = async () => {
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:5000/api/activities/recommendations/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setRecommendations(data)
    } catch (error) {
      console.error("Error fetching recommendations:", error)
    }
    setLoading(false)
  }

  const fetchUserRegisteredEvents = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}/registered-events`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setUserRegisteredEvents(data.map((event) => event._id))
    } catch (error) {
      console.error("Error fetching user registered events:", error)
    }
  }

  const fetchActivityEvents = async (activityId) => {
    setLoadingEvents(true)
    try {
      const response = await fetch(`http://localhost:5000/api/events/activity/${activityId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      const availableEvents = Array.isArray(data)
        ? data.filter((event) => !userRegisteredEvents.includes(event._id))
        : []
      setActivityEvents(availableEvents)
    } catch (error) {
      console.error("Error fetching events:", error)
      setActivityEvents([])
    }
    setLoadingEvents(false)
  }

  const handleActivityClick = (activity) => {
    setSelectedActivity(activity)
    fetchActivityEvents(activity._id)
  }

  const handleEventRegister = async (eventId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/events/${eventId}/attend`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        alert("Successfully registered for the event!")
        setUserRegisteredEvents([...userRegisteredEvents, eventId])
        fetchActivityEvents(selectedActivity._id)
      } else {
        const error = await response.json()
        alert(error.message || "Error registering for event")
      }
    } catch (error) {
      console.error("Error registering for event:", error)
      alert("Error registering for event. Please try again.")
    }
  }

  if (loading) return <div className="loading">Loading recommendations...</div>

  if (recommendations.length === 0) {
    return (
      <div className="recommendations-section">
        <h2>Recommended For You</h2>
        <p className="no-recommendations">No recommendations available at the moment</p>
      </div>
    )
  }

  return (
    <div className="recommendations-section">
      <h2>Recommended For You</h2>
      <p className="recommendations-subtitle">Based on your interests</p>

      {selectedActivity ? (
        <div className="activity-events-view">
          <button className="btn-back" onClick={() => setSelectedActivity(null)}>
            ← Back to Recommendations
          </button>
          <h3>{selectedActivity.name} - Available Events</h3>
          {loadingEvents ? (
            <p>Loading events...</p>
          ) : activityEvents.length > 0 ? (
            <div className="events-grid">
              {activityEvents.map((event) => (
                <div key={event._id} className="event-card">
                  <h4>{event.title}</h4>
                  <p className="event-description">{event.description}</p>
                  <div className="event-details">
                    <p>
                      <strong>Date:</strong> {new Date(event.date).toLocaleDateString()}
                    </p>
                    {event.time && (
                      <p>
                        <strong>Time:</strong> {event.time}
                      </p>
                    )}
                    {event.location && (
                      <p>
                        <strong>Location:</strong> {event.location}
                      </p>
                    )}
                    <p>
                      <strong>Points:</strong> {event.pointsPerEvent}
                    </p>
                  </div>
                  <button className="btn-register-event" onClick={() => handleEventRegister(event._id)}>
                    Register for Event
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-events">No available events for this activity (you may have registered for all events)</p>
          )}
        </div>
      ) : (
        <div className="recommendations-grid">
          {recommendations.map((activity) => (
            <div key={activity._id} className="recommendation-card">
              <div className="recommendation-header">
                <span className={`category-badge category-${activity.category}`}>{activity.category}</span>
              </div>
              <h3>{activity.name}</h3>
              <p className="description">{activity.description}</p>
              <div className="recommendation-footer">
                <span className="enrollment">
                  {activity.currentEnrollment}/{activity.maxCapacity}
                </span>
                <div className="recommendation-actions">
                  <button className="btn-view-events" onClick={() => handleActivityClick(activity)}>
                    View Events
                  </button>
                  <button className="btn-recommend" onClick={() => onRegister(activity._id)}>
                    Join Activity
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
