const express = require("express")
const { auth, adminAuth } = require("../middleware/auth")
const Event = require("../models/Event")
const Activity = require("../models/Activity")
const User = require("../models/User")
const { generateQRCode } = require("../utils/qrCodeGenerator")

const router = express.Router()

// Get events for an activity
router.get("/activity/:activityId", async (req, res) => {
  try {
    const events = await Event.find({ activityId: req.params.activityId })
      .populate("attendees", "name email")
      .populate("activityId", "name")
      .populate("attendance.studentId", "name email")
    res.json(events)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Create event (admin or coordinator)
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "coordinator") {
      return res.status(403).json({ message: "Only admin or coordinator can create events" })
    }

    const { activityId, title, description, date, time, location, capacity, pointsPerEvent } = req.body

    const event = new Event({
      activityId,
      title,
      description,
      date,
      time,
      location,
      capacity,
      pointsPerEvent: Number(pointsPerEvent) || 10,
    })

    await event.save()

    await Activity.findByIdAndUpdate(activityId, {
      $push: { upcomingEvents: event._id },
    })

    res.status(201).json(event)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get("/analytics/:activityId", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "coordinator") {
      return res.status(403).json({ message: "Only admin or coordinator can view analytics" })
    }

    const events = await Event.find({ activityId: req.params.activityId })
    const activity = await Activity.findById(req.params.activityId).populate("enrolledStudents")

    const analytics = {
      totalRegistrations: activity.currentEnrollment || 0,
      totalEvents: events.length,
      eventDetails: events.map((event) => ({
        eventId: event._id,
        title: event.title,
        date: event.date,
        attendanceCount: event.attendance.length,
        registeredCount: event.attendees.length,
        attendanceRate:
          event.attendees.length > 0 ? ((event.attendance.length / event.attendees.length) * 100).toFixed(2) : 0,
      })),
    }

    res.json(analytics)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Mark attendance for a student
router.post("/:id/attendance", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "coordinator") {
      return res.status(403).json({ message: "Only admin or coordinator can mark attendance" })
    }

    const { studentId, status } = req.body
    const event = await Event.findById(req.params.id)

    if (!event) {
      return res.status(404).json({ message: "Event not found" })
    }

    const existingAttendance = event.attendance.find((a) => a.studentId.toString() === studentId)
    if (existingAttendance) {
      return res.status(400).json({ message: "Attendance already marked for this student" })
    }

    const pointsToAward = status === "present" ? event.pointsPerEvent : 0

    event.attendance.push({
      studentId,
      status: status || "present",
      presentDate: new Date(),
      pointsAwarded: pointsToAward,
    })

    await event.save()

    if (status === "present") {
      const user = await User.findById(studentId)
      user.points = Number(user.points || 0) + Number(pointsToAward)
      user.attendanceRecords.push({
        eventId: event._id,
        activityId: event.activityId,
        date: new Date(),
        pointsEarned: pointsToAward,
      })
      await user.save()
    }

    res.json({ message: `Attendance marked as ${status}`, event })
  } catch (error) {
    console.error("Error marking attendance:", error)
    res.status(500).json({ message: error.message })
  }
})

// Register for an event
router.post("/:id/attend", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)

    if (!event) {
      return res.status(404).json({ message: "Event not found" })
    }

    if (event.attendees.includes(req.user.userId)) {
      return res.status(400).json({ message: "Already registered" })
    }

    event.attendees.push(req.user.userId)
    await event.save()

    res.json({ message: "Registered for event", event })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Register via QR code
router.post("/register-qr/:qrToken", auth, async (req, res) => {
  try {
    const event = await Event.findOne({ qrCode: req.params.qrToken })

    if (!event) {
      return res.status(404).json({ message: "Invalid QR code" })
    }

    if (event.attendees.includes(req.user.userId)) {
      return res.status(400).json({ message: "Already registered for this event" })
    }

    event.attendees.push(req.user.userId)
    await event.save()

    res.json({ message: "Successfully registered via QR code", event })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
