import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { bookingService } from '../services/bookingService';
import { paymentService } from '../services/paymentService';
import { hotelService } from '../services/hotelService';
import { Hotel, RoomType, PricingBreakdown } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  ShieldCheck,
  Calendar,
  Bed,
  Tag,
  CreditCard,
  Lock,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  X,
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const hotelId = searchParams.get('hotelId') || '';
  const roomTypeId = searchParams.get('roomTypeId') || '';
  const checkInDate = searchParams.get('checkInDate') || '';
  const checkOutDate = searchParams.get('checkOutDate') || '';
  const roomQuantity = Number(searchParams.get('roomQuantity') || '1');
  const numAdults = Number(searchParams.get('guests') || '2');

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [roomType, setRoomType] = useState<RoomType | null>(null);
  const [pricing, setPricing] = useState<PricingBreakdown | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Guest details form state
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [specialRequests, setSpecialRequests] = useState('');

  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulatedPayment, setSimulatedPayment] = useState<{
    booking: any;
    orderData: any;
  } | null>(null);

  // If user changes or logs in, sync names
  useEffect(() => {
    if (user) {
      if (!firstName) setFirstName(user.firstName);
      if (!lastName) setLastName(user.lastName);
      if (!email) setEmail(user.email);
    }
  }, [user]);

  // Load hotel and initial pricing
  useEffect(() => {
    async function loadData() {
      if (!hotelId || !roomTypeId || !checkInDate || !checkOutDate) {
        navigate('/hotels');
        return;
      }

      setLoading(true);
      try {
        const hotelRes = await hotelService.getHotelDetails(hotelId);
        setHotel(hotelRes.data.hotel);

        const targetRt = hotelRes.data.hotel.roomTypes.find((r) => r.id === roomTypeId);
        if (targetRt) setRoomType(targetRt);

        const priceRes = await bookingService.calculatePrice({
          hotelId,
          roomTypeId,
          checkInDate,
          checkOutDate,
          roomQuantity,
        });
        setPricing(priceRes.data.pricing);
      } catch (err: any) {
        setError(err?.message || 'Failed to initialize booking price.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [hotelId, roomTypeId, checkInDate, checkOutDate, roomQuantity]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError(null);

    try {
      const priceRes = await bookingService.calculatePrice({
        hotelId,
        roomTypeId,
        checkInDate,
        checkOutDate,
        roomQuantity,
        couponCode: couponCode.trim(),
      });
      setPricing(priceRes.data.pricing);
      setAppliedCoupon(priceRes.data.pricing.appliedCoupon);
    } catch (err: any) {
      setCouponError(err?.message || 'Invalid coupon.');
    }
  };

  const handleCreateBookingAndPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isAuthenticated) {
      // Direct user to login, preserving checkout URL
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    setProcessingPayment(true);
    try {
      // 1. Create temporary hold with 15-minute expiration
      const holdRes = await bookingService.createHold({
        hotelId,
        roomTypeId,
        checkInDate,
        checkOutDate,
        roomQuantity,
        numAdults,
        numChildren: 0,
        couponCode: appliedCoupon?.code,
        specialRequests,
        guests: [
          {
            firstName,
            lastName,
            email,
            phone,
            isPrimary: true,
          },
        ],
      });

      const booking = holdRes.data.booking;

      // 2. Generate Razorpay / Simulator order
      const orderRes = await paymentService.createOrder(booking.id);
      const orderData = orderRes.data;

      // 3. Process payment
      if (orderData.isSimulated) {
        // Open safe interactive simulation modal for development testing
        setSimulatedPayment({ booking, orderData });
        setProcessingPayment(false);
      } else {
        // Live Razorpay test mode
        const options = {
          key: orderData.keyId,
          amount: orderData.amountInSubunits,
          currency: orderData.currency,
          name: 'StayEase Luxury Hospitality',
          description: `Booking Reference ${booking.bookingReference}`,
          order_id: orderData.orderId,
          handler: async function (response: any) {
            try {
              await paymentService.verifyPayment({
                bookingId: booking.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              navigate(`/booking-confirmation/${booking.id}`);
            } catch (vErr: any) {
              setError(vErr?.message || 'Payment signature verification failed.');
              setProcessingPayment(false);
            }
          },
          prefill: {
            name: `${firstName} ${lastName}`,
            email: email,
            contact: phone,
          },
          theme: {
            color: '#0f2438',
          },
        };

        const razorpayWindow = (window as any).Razorpay;
        if (razorpayWindow) {
          const rzp = new razorpayWindow(options);
          rzp.open();
        } else {
          // If script tag not loaded, fallback to simulated completion for test environment
          await paymentService.verifyPayment({
            bookingId: booking.id,
            razorpay_order_id: orderData.orderId,
            razorpay_payment_id: `pay_test_${Date.now()}`,
            razorpay_signature: 'sig_test',
            isSimulated: true,
          });
          navigate(`/booking-confirmation/${booking.id}`);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Reservation creation or payment failed.');
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-brand-900 animate-spin mx-auto"></div>
        <p className="text-sm font-semibold text-slate-500">Preparing your reservation folio...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-brand-900">
          Confirm Your Stay
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review your details and finalize your reservation with instant confirmation.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Guest Details & Payment Form */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleCreateBookingAndPay} className="space-y-6">
            {/* Guest Information */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-subtle space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-serif text-lg font-bold text-slate-800">Primary Guest Details</h3>
                {!isAuthenticated && (
                  <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-semibold">
                    Sign in recommended
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-900/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-900/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-900/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-900/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Special Requests (Optional)
                </label>
                <textarea
                  rows={2}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="e.g. Quiet room, high floor, feather-free pillows..."
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-900/20"
                />
              </div>
            </div>

            {/* Payment Gateway Box */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-subtle space-y-4">
              <div className="flex items-center space-x-2 text-brand-900 pb-3 border-b border-slate-100">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="font-serif text-lg font-bold">Secure Payment Gateway</h3>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span className="font-semibold text-slate-700">256-bit Encrypted Transaction</span>
                </div>
                <span className="font-bold text-slate-900">Razorpay Test Mode / Simulator</span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed font-light">
                By selecting &ldquo;Complete Reservation&rdquo;, you agree to the hotel&rsquo;s check-in guidelines, cancellation terms, and verified guest privacy safeguards.
              </p>

              <button
                type="submit"
                disabled={processingPayment}
                className="w-full py-4 rounded-2xl bg-brand-900 hover:bg-brand-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>
                  {processingPayment
                    ? 'Processing Reservation & Payment...'
                    : `Confirm & Pay ${formatCurrency(pricing?.grandTotal || 0)}`}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Reservation Folio & Pricing Breakdown */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-card space-y-6 sticky top-28">
            <h3 className="font-serif text-xl font-bold text-brand-900 border-b border-slate-100 pb-3">
              Booking Summary
            </h3>

            {/* Hotel & Room Preview */}
            <div className="flex space-x-4 pb-4 border-b border-slate-100">
              <img
                src={hotel?.coverImage || hotel?.images?.[0]?.url}
                alt={hotel?.name}
                className="w-20 h-20 rounded-2xl object-cover shrink-0"
              />
              <div className="flex flex-col justify-center">
                <h4 className="font-bold text-sm text-slate-900">{hotel?.name}</h4>
                <p className="text-xs text-slate-500">{hotel?.city}, {hotel?.country}</p>
                <span className="text-xs font-semibold text-emerald-700 mt-1">{roomType?.name}</span>
              </div>
            </div>

            {/* Dates & Guests */}
            <div className="bg-slate-50 p-4 rounded-2xl grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Check-In</span>
                <span className="font-bold text-slate-800">{formatDate(checkInDate)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Check-Out</span>
                <span className="font-bold text-slate-800">{formatDate(checkOutDate)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Stay Length</span>
                <span className="font-bold text-slate-800">{pricing?.totalNights} Nights</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Guests & Rooms</span>
                <span className="font-bold text-slate-800">{numAdults} Guests &bull; {roomQuantity} Room</span>
              </div>
            </div>

            {/* Coupon Code Input */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Promotional Coupon Code
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="e.g. WELCOME10 or LUXURY50"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold uppercase focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
                >
                  Apply
                </button>
              </div>
              {appliedCoupon && (
                <div className="text-[11px] text-emerald-700 font-semibold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Coupon {appliedCoupon.code} applied successfully!</span>
                </div>
              )}
              {couponError && (
                <p className="text-[11px] text-rose-600 font-medium">{couponError}</p>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Room Charges ({pricing?.totalNights} nights x {roomQuantity} room)</span>
                <span className="font-medium text-slate-900">{formatCurrency(pricing?.baseTotal || 0)}</span>
              </div>

              {Number(pricing?.discountTotal) > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Special Coupon Savings</span>
                  <span>-{formatCurrency(pricing?.discountTotal || 0)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Accommodation Tax (10%)</span>
                <span>{formatCurrency(pricing?.taxTotal || 0)}</span>
              </div>

              <div className="flex justify-between">
                <span>Hospitality & Resort Service Fee</span>
                <span>{formatCurrency(pricing?.serviceFeeTotal || 0)}</span>
              </div>

              <div className="pt-3 border-t-2 border-slate-900 flex justify-between items-baseline">
                <span className="text-sm font-bold text-brand-900">Total Price</span>
                <span className="text-2xl font-black text-brand-900">
                  {formatCurrency(pricing?.grandTotal || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulated Payment Gateway Interactive Modal */}
      {simulatedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                <h3 className="font-serif text-xl font-bold text-slate-900">Payment Simulator</h3>
              </div>
              <button
                type="button"
                onClick={() => setSimulatedPayment(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-2xl text-xs text-amber-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                Development Test Mode Active
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Live Razorpay credentials are not configured. You can simulate transaction outcomes safely.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Booking Reference:</span>
                <span className="font-mono font-bold text-slate-800">{simulatedPayment.booking.bookingReference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Order ID:</span>
                <span className="font-mono text-slate-700">{simulatedPayment.orderData.orderId}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-200">
                <span className="text-slate-900">Total Payable:</span>
                <span className="text-brand-900">{formatCurrency(simulatedPayment.orderData.amount)}</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={async () => {
                  setProcessingPayment(true);
                  try {
                    await paymentService.verifyPayment({
                      bookingId: simulatedPayment.booking.id,
                      razorpay_order_id: simulatedPayment.orderData.orderId,
                      razorpay_payment_id: `pay_sim_${Date.now()}`,
                      razorpay_signature: 'signature_sim_test_passed',
                      isSimulated: true,
                    });
                    setSimulatedPayment(null);
                    navigate(`/booking-confirmation/${simulatedPayment.booking.id}`);
                  } catch (vErr: any) {
                    setError(vErr?.message || 'Simulated payment verification failed.');
                    setProcessingPayment(false);
                    setSimulatedPayment(null);
                  }
                }}
                disabled={processingPayment}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simulate Successful Payment</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setError('Simulated payment declined by user or test gateway.');
                  setSimulatedPayment(null);
                }}
                disabled={processingPayment}
                className="w-full py-3 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 font-semibold text-xs transition-colors"
              >
                Simulate Payment Failure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
