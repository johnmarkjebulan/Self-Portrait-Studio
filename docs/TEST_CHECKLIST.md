# Regression Test Checklist

## Setup
- Start XAMPP MySQL.
- Run `SETUP_LOCAL.ps1` once.
- Run `START_LOCAL.ps1`.
- Confirm `/api/health` returns OK.

## Authentication
- Admin demo login succeeds.
- Client demo login succeeds.
- Wrong password returns a clear error.
- Refresh keeps a valid session and rejects an invalid/expired token.

## Booking / availability
- Closed day cannot be booked.
- Full day and full slot cannot be booked.
- Admin schedule block removes that slot from client booking.
- Admin special schedule can open/override a slot.
- Two bookings cannot exceed slot capacity.
- Client receives a tracking number.

## Appointment workflow
- Pending -> Confirmed works.
- Invalid status jumps are rejected by the API.
- Cancellation/reschedule request requires a reason.
- Reschedule uses current availability and capacity rules.
- Scanner/check-in places the appointment in Waiting.
- Waiting -> Now Serving -> Completed works.
- Queue number is not duplicated by repeated scanning.

## Payments
- Client cannot pay someone else's appointment.
- Payment amount cannot exceed remaining balance.
- Duplicate pending submission/reference is rejected.
- Admin verify/reject updates balance and client notification.
- A verified payment cannot be verified twice.

## Feedback / notifications
- Feedback is rejected until appointment is Completed.
- Only one feedback entry is accepted per appointment.
- Admin receives booking/payment/feedback notifications where applicable.
- Notification click opens the related module.
- Mark read / mark all read updates badge count.

## Responsive smoke test
Check at 360, 390, 400, 430, 768, 1024, and desktop widths:
- navigation / sidebar
- dashboard cards
- booking calendar and time slots
- appointments/detail panels
- payments and notifications
- admin schedules/settings/scanner/queue
- tables remain usable without clipping the whole page
