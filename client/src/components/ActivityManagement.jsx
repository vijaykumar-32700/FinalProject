"use client"

import { useState } from "react"
import "../styles/components.css"

export default function ActivityManagement({ activities, onActivityChange, token }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "sports",
    maxCapacity: "",
    schedule: {
      dayOfWeek: "",
      time: "",
      location: "",
    },
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith("schedule_")) {
      const fieldName = name.replace("schedule_", "")
      setFormData({
        ...formData,
        schedule: {
          ...formData.schedule,
          [fieldName]: value,
        },
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const response = await fetch("http://localhost:5000/api/activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setFormData({
          name: "",
          description: "",
          category: "sports",
          maxCapacity: "",
          schedule: {
            dayOfWeek: "",
            time: "",
            location: "",
          },
        })
        onActivityChange()
      }
    } catch (error) {
      console.error("Error creating activity:", error)
    }
  }

  const handleDelete = async (activityId) => {
    if (!window.confirm("Are you sure you want to delete this activity?")) return

    try {
      const response = await fetch(`http://localhost:5000/api/activities/${activityId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        onActivityChange()
      }
    } catch (error) {
      console.error("Error deleting activity:", error)
    }
  }

  return (
    <div className="management-container">
      <div className="form-section">
        <h2>Create New Activity</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Activity Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange} required />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select name="category" value={formData.category} onChange={handleInputChange}>
              <option value="sports">Sports</option>
              <option value="club">Club</option>
              <option value="cultural">Cultural</option>
              <option value="academic">Academic</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Max Capacity</label>
            <input
              type="number"
              name="maxCapacity"
              value={formData.maxCapacity}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Day of Week</label>
              <input
                type="text"
                name="schedule_dayOfWeek"
                value={formData.schedule.dayOfWeek}
                onChange={handleInputChange}
                placeholder="Monday"
              />
            </div>

            <div className="form-group">
              <label>Time</label>
              <input type="time" name="schedule_time" value={formData.schedule.time} onChange={handleInputChange} />
            </div>
          </div>

          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              name="schedule_location"
              value={formData.schedule.location}
              onChange={handleInputChange}
            />
          </div>

          <button type="submit" className="btn-primary">
            Create Activity
          </button>
        </form>
      </div>

      <div className="activities-list">
        <h2>Existing Activities</h2>
        {activities.map((activity) => (
          <div key={activity._id} className="activity-item">
            <div className="activity-info">
              <h3>{activity.name}</h3>
              <p>{activity.description}</p>
              <p>
                Enrolled: {activity.currentEnrollment} / {activity.maxCapacity}
              </p>
            </div>
            <button className="btn-danger" onClick={() => handleDelete(activity._id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
