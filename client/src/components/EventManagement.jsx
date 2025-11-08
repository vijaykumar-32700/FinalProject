"use client"

import { useState, useEffect } from "react"
import "../styles/components.css"

export default function EventManagement({ activities, token }) {
  const [formData, setFormData] = useState({
    activityId: "",
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    capacity: "",
    pointsPerEvent: 10,
  })

  const [createdEvents, setCreatedEvents] = useState([])

  useEffect(() => {
    fetchAllEvents()
  }, [])

  const fetchAllEvents = async () => {
    try {
      const allEvents = []
      for (const activity of activities) {
        const response = await fetch(`http://localhost:5000/api/events/activity/${activity._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (response.ok) {
          const events = await response.json()
          allEvents.push(...events)
        }
      }
      setCreatedEvents(allEvents)
    } catch (error) {
      console.error("Error fetching events:", error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: name === "pointsPerEvent" ? Number.parseInt(value) : value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const response = await fetch("http://localhost:5000/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const eventData = await response.json()
        setCreatedEvents([eventData, ...createdEvents])

        setFormData({
          activityId: "",
          title: "",
          description: "",
          date: "",
          time: "",
          location: "",
          capacity: "",
          pointsPerEvent: 10,
        })
        alert("Event created successfully")
      }
    } catch (error) {
      console.error("Error creating event:", error)
    }
  }

  return (
    <div className="management-container">
      <h2>Create New Event</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Select Activity</label>
          <select name="activityId" value={formData.activityId} onChange={handleInputChange} required>
            <option value="">Choose an activity</option>
            {activities.map((activity) => (
              <option key={activity._id} value={activity._id}>
                {activity.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Event Title</label>
          <input type="text" name="title" value={formData.title} onChange={handleInputChange} required />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea name="description" value={formData.description} onChange={handleInputChange} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Date</label>
            <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
          </div>

          <div className="form-group">
            <label>Time</label>
            <input type="time" name="time" value={formData.time} onChange={handleInputChange} />
          </div>
        </div>

        <div className="form-group">
          <label>Location</label>
          <input type="text" name="location" value={formData.location} onChange={handleInputChange} />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Capacity</label>
            <input type="number" name="capacity" value={formData.capacity} onChange={handleInputChange} />
          </div>

          <div className="form-group">
            <label>Points for Attendance</label>
            <input
              type="number"
              name="pointsPerEvent"
              value={formData.pointsPerEvent}
              onChange={handleInputChange}
              min="1"
            />
          </div>
        </div>

        <button type="submit" className="btn-primary">
          Create Event
        </button>
      </form>

      {createdEvents.length > 0 && (
        <div className="events-list-section">
          <h2>Created Events</h2>
          <div className="events-list-grid">
            {createdEvents.map((event) => (
              <div key={event._id} className="event-card">
                <div className="event-info">
                  <h3>{event.title}</h3>
                  <p className="event-date">
                    {new Date(event.date).toLocaleDateString()} {event.time && `at ${event.time}`}
                  </p>
                  <p className="event-location">{event.location}</p>
                  <p className="event-points">Points: {event.pointsPerEvent}</p>
                  <p className="event-capacity">Capacity: {event.capacity || "Unlimited"}</p>
                  <p className="event-registered">Registered: {event.attendees?.length || 0}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
