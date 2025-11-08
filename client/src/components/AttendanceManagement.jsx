"use client"

import { useState, useEffect } from "react"
import "../styles/attendance.css"

export default function AttendanceManagement({ activities = [], token }) {
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [attendees, setAttendees] = useState([])
  const [loading, setLoading] = useState(false)
  const [attendanceStatus, setAttendanceStatus] = useState({})

  useEffect(() => {
    if (selectedActivity) {
      fetchEvents(selectedActivity)
    }
  }, [selectedActivity])

  const fetchEvents = async (activityId) => {
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:5000/api/events/activity/${activityId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      console.log("[v0] Fetched events:", data)
      setEvents(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching events:", error)
      setEvents([])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (selectedEvent) {
      const event = events.find((e) => e._id === selectedEvent)
      console.log("[v0] Selected event:", event)
      if (event) {
        const eventAttendees = Array.isArray(event.attendees) ? event.attendees : []
        console.log("[v0] Event attendees:", eventAttendees)
        setAttendees(eventAttendees)

        const statusMap = {}
        if (Array.isArray(event.attendance)) {
          event.attendance.forEach((att) => {
            statusMap[att.studentId._id || att.studentId] = att.status
          })
        }
        setAttendanceStatus(statusMap)
      }
    }
  }, [selectedEvent, events])

  const markAttendance = async (studentId, status) => {
    if (attendanceStatus[studentId] !== undefined) {
      alert("Attendance already marked for this student")
      return
    }

    try {
      const response = await fetch(`http://localhost:5000/api/events/${selectedEvent}/attendance`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ studentId, status }),
      })

      if (response.ok) {
        setAttendanceStatus({ ...attendanceStatus, [studentId]: status })
        await fetchEvents(selectedActivity)

        const event = events.find((e) => e._id === selectedEvent)
        const pointsAwarded = status === "present" ? event?.pointsPerEvent || 10 : 0

        alert(status === "present" ? `✅ Marked as Present! ${pointsAwarded} points awarded.` : `❌ Marked as Absent.`)
      } else {
        const error = await response.json()
        alert(error.message || "Error marking attendance")
      }
    } catch (error) {
      console.error("Error marking attendance:", error)
      alert("Error marking attendance. Please try again.")
    }
  }

  const downloadCSV = () => {
    if (attendees.length === 0) {
      alert("No attendees to download")
      return
    }

    const event = events.find((e) => e._id === selectedEvent)
    const csvHeaders = ["Name", "Email", "Attendance Status"]
    const csvRows = attendees.map((student) => {
      const status = attendanceStatus[student._id] || "Not Marked"
      return [student.name || "N/A", student.email || "N/A", status.charAt(0).toUpperCase() + status.slice(1)]
    })

    const csvContent = [csvHeaders.join(","), ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join(
      "\n",
    )

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)

    link.setAttribute("href", url)
    link.setAttribute("download", `${event?.title || "event"}_attendees_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="attendance-management">
      <h2>📋 Manage Attendance</h2>

      <div className="attendance-selector">
        <div className="selector-group">
          <label>Select Activity:</label>
          <select value={selectedActivity || ""} onChange={(e) => setSelectedActivity(e.target.value)}>
            <option value="">-- Choose Activity --</option>
            {activities.map((activity) => (
              <option key={activity._id} value={activity._id}>
                {activity.name}
              </option>
            ))}
          </select>
        </div>

        {selectedActivity && (
          <div className="selector-group">
            <label>Select Event:</label>
            <select value={selectedEvent || ""} onChange={(e) => setSelectedEvent(e.target.value)}>
              <option value="">-- Choose Event --</option>
              {Array.isArray(events) && events.length > 0 ? (
                events.map((event) => (
                  <option key={event._id} value={event._id}>
                    {event.title} - {new Date(event.date).toLocaleDateString()}
                  </option>
                ))
              ) : (
                <option disabled>No events available</option>
              )}
            </select>
          </div>
        )}
      </div>

      {selectedEvent && (
        <div className="attendance-list">
          <div className="attendance-header">
            <h3>✓ Mark Attendance</h3>
            {attendees.length > 0 && (
              <button className="btn-download-csv" onClick={downloadCSV}>
                📥 Download CSV
              </button>
            )}
          </div>

          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading attendees...</p>
            </div>
          ) : attendees.length > 0 ? (
            <div className="table-container">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attendees.map((student) => {
                    const studentId = student._id || student
                    const studentName = student.name || "Unknown"
                    const studentEmail = student.email || "N/A"
                    const currentStatus = attendanceStatus[studentId]

                    return (
                      <tr key={studentId} className={currentStatus ? "marked" : ""}>
                        <td>
                          <div className="student-name">
                            <span className="avatar">{studentName.charAt(0).toUpperCase()}</span>
                            {studentName}
                          </div>
                        </td>
                        <td>{studentEmail}</td>
                        <td>
                          {currentStatus === "present" ? (
                            <span className="status-present">✓ Present</span>
                          ) : currentStatus === "absent" ? (
                            <span className="status-absent">✗ Absent</span>
                          ) : (
                            <span className="status-pending">⏳ Not Marked</span>
                          )}
                        </td>
                        <td>
                          <div className="attendance-actions">
                            <button
                              className="btn-mark-present"
                              onClick={() => markAttendance(studentId, "present")}
                              disabled={currentStatus !== undefined}
                              title="Mark as Present"
                            >
                              ✓ Present
                            </button>
                            <button
                              className="btn-mark-absent"
                              onClick={() => markAttendance(studentId, "absent")}
                              disabled={currentStatus !== undefined}
                              title="Mark as Absent"
                            >
                              ✗ Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-attendees">
              <div className="empty-state">
                <span className="empty-icon">📭</span>
                <p>No attendees registered for this event</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
