const express = require('express')
const Reservation = require('../models/Reservation')
const Table = require('../models/Table')

const router = express.Router()

router.get('/', async (req, res) => {
  const { email, tableNumber } = req.query
  const filter = {}

  if (email) filter.email = String(email)
  if (tableNumber) filter.tableNumber = Number(tableNumber)

  const reservations = await Reservation.find(filter).sort({ reservationDate: 1, reservationTime: 1 })
  res.json(reservations)
})

router.post('/', async (req, res) => {
  const { guestName, email, phone, tableNumber, partySize, reservationDate, reservationTime, notes } = req.body

  if (!guestName || !reservationDate || !reservationTime || !partySize) {
    return res.status(400).json({ message: 'Guest name, date, time, and party size are required.' })
  }

  const parsedTableNumber = tableNumber !== undefined && tableNumber !== null && tableNumber !== '' ? Number(tableNumber) : null
  const parsedPartySize = Number(partySize)

  if (!Number.isInteger(parsedPartySize) || parsedPartySize < 1) {
    return res.status(400).json({ message: 'Party size must be at least 1.' })
  }

  if (parsedTableNumber) {
    const tableExists = await Table.findOne({ number: parsedTableNumber })
    if (!tableExists) {
      return res.status(400).json({ message: 'Selected table does not exist.' })
    }

    const conflictingReservation = await Reservation.findOne({
      tableNumber: parsedTableNumber,
      reservationDate,
      reservationTime,
      status: { $in: ['pending', 'confirmed', 'arrived', 'seated'] }
    })

    if (conflictingReservation) {
      return res.status(400).json({ message: 'That table is already reserved for the selected time.' })
    }
  }

  const reservation = await Reservation.create({
    guestName,
    email: email || '',
    phone: phone || '',
    tableNumber: parsedTableNumber,
    partySize: parsedPartySize,
    reservationDate,
    reservationTime,
    notes: notes || '',
    status: 'pending'
  })

  res.status(201).json(reservation)
})

module.exports = router
