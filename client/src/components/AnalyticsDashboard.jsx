"use client"

import { useState, useEffect } from "react"
import "../styles/analytics.css"

export default function AnalyticsDashboard({ activities = [], token }) {
  const [analytics, setAnalytics] = useState({})
  const [selectedActivityId, setSelectedActivityId] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (selectedActivityId) {
      fetchAnalytics(selectedActivityId)
    }
  }, [selectedActivityId])

  const fetchAnalytics = async (activityId) => {
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:5000/api/events/${activityId}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setAnalytics(data)
    } catch (error) {
      console.error("Error fetching analytics:", error)
    }
    setLoading(false)
  }

  if (!selectedActivityId) {
    return (
      <div className="analytics-selector">
        <h2>Select Activity for Analytics</h2>
        <div className="activity-selector-grid">
          {activities.map((activity) => (
            <button
              key={activity._id}
              className="activity-selector-btn"
              onClick={() => setSelectedActivityId(activity._id)}
            >
              <h3>{activity.name}</h3>
              <p>{activity.category}</p>
              <p className="enrollment">Enrolled: {activity.currentEnrollment}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <button className="back-btn" onClick={() => setSelectedActivityId(null)}>
          ← Back
        </button>
        <h2>Activity Analytics</h2>
      </div>

      {loading ? (
        <div className="loading">Loading analytics...</div>
      ) : (
        <>
          <div className="analytics-summary">
            <div className="summary-card">
              <h3>Total Registrations</h3>
              <p className="big-number">{analytics.totalRegistrations || 0}</p>
            </div>
            <div className="summary-card">
              <h3>Total Events</h3>
              <p className="big-number">{analytics.totalEvents || 0}</p>
            </div>
            <div className="summary-card">
              <h3>Avg Attendance Rate</h3>
              <p className="big-number">
                {analytics.eventDetails
                  ? (
                      analytics.eventDetails.reduce((sum, e) => sum + Number.parseFloat(e.attendanceRate), 0) /
                      analytics.eventDetails.length
                    ).toFixed(1)
                  : 0}
                %
              </p>
            </div>
          </div>

          <div className="events-analytics">
            <h3>Event Details</h3>
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Event Title</th>
                  <th>Date</th>
                  <th>Registered</th>
                  <th>Attended</th>
                  <th>Attendance Rate</th>
                </tr>
              </thead>
              <tbody>
                {analytics.eventDetails && analytics.eventDetails.length > 0 ? (
                  analytics.eventDetails.map((event) => (
                    <tr key={event.eventId}>
                      <td>{event.title}</td>
                      <td>{new Date(event.date).toLocaleDateString()}</td>
                      <td>{event.registeredCount}</td>
                      <td>{event.attendanceCount}</td>
                      <td>
                        <span className="attendance-badge">{event.attendanceRate}%</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">No events yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
