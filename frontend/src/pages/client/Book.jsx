import React, { useState } from 'react';
import Navbar from '../../components/public/Navbar';
import Footer from '../../components/public/Footer';

const Book = () => {
  const [step, setStep] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [bookingData, setBookingData] = useState({
    date: '',
    timeSlot: '',
    fullName: '',
    email: '',
    phone: '',
    addOns: []
  });
  const [errors, setErrors] = useState({});

  const packages = [
    { id: 'pkg1', name: 'Solo Express', price: 499, duration: '15 mins', inclusions: '1 Person, 1 Backdrop, 5 Soft Copies' },
    { id: 'pkg2', name: 'Duo Studio Special', price: 899, duration: '25 mins', inclusions: '2 Persons, 2 Backdrops, 10 Soft Copies, 2 Prints' },
    { id: 'pkg3', name: 'Squad Ultimate', price: 1499, duration: '45 mins', inclusions: 'Up to 5 Persons, All Backdrops, All Digital Copies, 5 Prints' }
  ];

  const availableSlots = ['09:00 AM', '10:30 AM', '01:00 PM', '02:30 PM', '04:00 PM'];
  const addOnOptions = [
    { id: 'add1', name: 'Extra Printed Photo', price: 100 },
    { id: 'add2', name: 'Pet Companion Fee', price: 150 },
    { id: 'add3', name: 'Raw Files USB Drive', price: 300 }
  ];

  const handleAddOnToggle = (addOnId) => {
    setBookingData((prev) => {
      const exists = prev.addOns.includes(addOnId);
      return {
        ...prev,
        addOns: exists ? prev.addOns.filter((id) => id !== addOnId) : [...prev.addOns, addOnId]
      };
    });
  };

  const validateStep1 = () => {
    let errs = {};
    if (!selectedPackage) errs.package = 'Please select a package.';
    if (!bookingData.date) errs.date = 'Please select a date.';
    if (!bookingData.timeSlot) errs.timeSlot = 'Please select a time slot.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    let errs = {};
    if (!bookingData.fullName) errs.fullName = 'Full name is required.';
    if (!bookingData.email) errs.email = 'Email address is required.';
    if (!bookingData.phone) errs.phone = 'Phone number is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const calculateTotal = () => {
    const pkgTotal = selectedPackage ? selectedPackage.price : 0;
    const addOnTotal = bookingData.addOns.reduce((sum, id) => {
      const item = addOnOptions.find((a) => a.id === id);
      return sum + (item ? item.price : 0);
    }, 0);
    return pkgTotal + addOnTotal;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto px-6 py-10 w-full">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 text-center">Service Booking</h1>
        <p className="text-slate-600 text-center mb-8">WBS 1.1.1 - Select your studio package and schedule</p>

        {/* Step Indicator */}
        <div className="flex justify-center mb-8 gap-4">
          <span className={`px-4 py-2 rounded-full font-bold text-sm ${step === 1 ? 'bg-amber-500 text-slate-900' : 'bg-slate-200 text-slate-600'}`}>1. Session & Time</span>
          <span className={`px-4 py-2 rounded-full font-bold text-sm ${step === 2 ? 'bg-amber-500 text-slate-900' : 'bg-slate-200 text-slate-600'}`}>2. Client Info</span>
          <span className={`px-4 py-2 rounded-full font-bold text-sm ${step === 3 ? 'bg-amber-500 text-slate-900' : 'bg-slate-200 text-slate-600'}`}>3. Confirmation</span>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800">Choose Package</h2>
            {errors.package && <p className="text-red-500 text-sm">{errors.package}</p>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`p-5 rounded-xl border-2 cursor-pointer transition-all bg-white ${
                    selectedPackage?.id === pkg.id ? 'border-amber-500 shadow-md bg-amber-50/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <h3 className="font-bold text-lg text-slate-900">{pkg.name}</h3>
                  <p className="text-amber-600 font-extrabold text-xl my-2">₱{pkg.price}</p>
                  <p className="text-xs text-slate-500 mb-3">{pkg.duration}</p>
                  <p className="text-sm text-slate-600">{pkg.inclusions}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Select Date</label>
                <input
                  type="date"
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
                  value={bookingData.date}
                  onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                />
                {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Select Time Slot</label>
                <div className="flex flex-wrap gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setBookingData({ ...bookingData, timeSlot: slot })}
                      className={`px-3 py-2 text-sm rounded-lg border font-medium ${
                        bookingData.timeSlot === slot ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
                {errors.timeSlot && <p className="text-red-500 text-xs mt-1">{errors.timeSlot}</p>}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => validateStep1() && setStep(2)}
                className="bg-amber-500 hover:bg-amber-600 font-bold text-slate-900 px-6 py-2.5 rounded-lg"
              >
                Next Step
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 max-w-xl mx-auto bg-white p-6 rounded-xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">Client Details & Add-ons</h2>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                className="w-full border border-slate-300 rounded-lg p-2.5"
                value={bookingData.fullName}
                onChange={(e) => setBookingData({ ...bookingData, fullName: e.target.value })}
              />
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full border border-slate-300 rounded-lg p-2.5"
                  value={bookingData.email}
                  onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  className="w-full border border-slate-300 rounded-lg p-2.5"
                  value={bookingData.phone}
                  onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Optional Add-ons</label>
              <div className="space-y-2">
                {addOnOptions.map((addon) => (
                  <label key={addon.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={bookingData.addOns.includes(addon.id)}
                        onChange={() => handleAddOnToggle(addon.id)}
                      />
                      <span className="text-sm text-slate-800">{addon.name}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-700">+₱{addon.price}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(1)} className="px-5 py-2 text-slate-600 font-medium">Back</button>
              <button
                onClick={() => validateStep2() && setStep(3)}
                className="bg-amber-500 hover:bg-amber-600 font-bold text-slate-900 px-6 py-2.5 rounded-lg"
              >
                Review Summary
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="max-w-xl mx-auto bg-white p-6 rounded-xl border border-slate-200 space-y-4">
            <h2 className="text-xl font-bold text-slate-800 text-center">Booking Summary</h2>
            <div className="divide-y divide-slate-100 text-sm">
              <div className="py-2 flex justify-between"><span className="text-slate-500">Selected Package:</span><span className="font-bold">{selectedPackage?.name} (₱{selectedPackage?.price})</span></div>
              <div className="py-2 flex justify-between"><span className="text-slate-500">Date & Time:</span><span className="font-bold">{bookingData.date} at {bookingData.timeSlot}</span></div>
              <div className="py-2 flex justify-between"><span className="text-slate-500">Client Name:</span><span className="font-bold">{bookingData.fullName}</span></div>
              <div className="py-2 flex justify-between"><span className="text-slate-500">Contact:</span><span className="font-bold">{bookingData.phone} | {bookingData.email}</span></div>
              <div className="py-2 flex justify-between text-amber-600 font-bold text-base"><span>Total Amount:</span><span>₱{calculateTotal()}</span></div>
            </div>
            <button
              onClick={() => alert('Booking session confirmed!')}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl shadow-lg mt-4"
            >
              Confirm Booking
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Book;