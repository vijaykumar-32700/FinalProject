"use client"

import { useState, useEffect, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"
import ActivityManagement from "../components/ActivityManagement"
import EventManagement from "../components/EventManagement"
import AnalyticsDashboard from "../components/AnalyticsDashboard"
import AttendanceManagement from "../components/AttendanceManagement"
import "../styles/dashboard.css"

export default function AdminDashboard() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("activities")
  const { token, user, logout } = useContext(AuthContext)
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) {
      navigate("/")
    } else {
      fetchActivities()
    }
  }, [token])

  const fetchActivities = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/activities", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setActivities(data)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching activities:", error)
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  if (loading) return <div className="loading">Loading...</div>

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Admin Dashboard</h1>
          <p>Welcome, {user?.name}</p>
        </div>
        <div className="header-right">
          <div className="header-actions">
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === "activities" ? "active" : ""}`}
          onClick={() => setActiveTab("activities")}
        >
          Manage Activities
        </button>
        <button className={`tab-btn ${activeTab === "events" ? "active" : ""}`} onClick={() => setActiveTab("events")}>
          Manage Events
        </button>
        <button
          className={`tab-btn ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          Analytics
        </button>
        <button
          className={`tab-btn ${activeTab === "attendance" ? "active" : ""}`}
          onClick={() => setActiveTab("attendance")}
        >
          Attendance
        </button>
      </div>

      <div className="admin-content">
        {activeTab === "activities" && (
          <ActivityManagement activities={activities} onActivityChange={fetchActivities} token={token} />
        )}
        {activeTab === "events" && <EventManagement activities={activities} token={token} />}
        {activeTab === "analytics" && <AnalyticsDashboard activities={activities} token={token} />}
        {activeTab === "attendance" && <AttendanceManagement activities={activities} token={token} />}
      </div>
    </div>
  )
}
