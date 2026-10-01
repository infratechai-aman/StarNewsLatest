'use client';

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Send,
  Loader2,
  CheckCircle2,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  FileText,
  Sparkles,
  Award
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const MAHARASHTRA_DISTRICTS = [
  'Pune',
  'Mumbai City',
  'Mumbai Suburban',
  'Thane',
  'Nagpur',
  'Nashik',
  'Chhatrapati Sambhajinagar',
  'Solapur',
  'Kolhapur',
  'Amravati',
  'Nanded',
  'Sangli',
  'Jalgaon',
  'Satara',
  'Ahmednagar',
  'Akola',
  'Latur',
  'Dhule',
  'Chandrapur',
  'Parbhani',
  'Raigad',
  'Buldhana',
  'Beed',
  'Yavatmal',
  'Gondia',
  'Wardha',
  'Washim',
  'Gadchiroli',
  'Palghar',
  'Ratnagiri',
  'Sindhudurg',
  'Other / Outside Maharashtra'
];

const BEATS = [
  'General & City News',
  'Crime & Justice',
  'Politics & Governance',
  'Rural & Agriculture',
  'Business & Economy',
  'Civic Issues & Infrastructure',
  'Education & Youth',
  'Sports & Culture'
];

export default function ReporterApplicationModal({ isOpen, onClose }) {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    district: 'Pune',
    beat: 'General & City News',
    experience: 'Fresher / Aspiring Journalist',
    portfolio: '',
    reason: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.email.trim()) {
      setError('Please fill in your name, mobile number, and email.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/reporter-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim().toLowerCase(),
          experience: `${formData.experience} | District: ${formData.district} | Beat: ${formData.beat}`,
          portfolio: formData.portfolio.trim(),
          reason: formData.reason.trim() || `Applied for ${formData.district} bureau (${formData.beat})`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application.');
      }

      setIsSuccess(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setError('');
    setFormData({
      fullName: '',
      phone: '',
      email: '',
      district: 'Pune',
      beat: 'General & City News',
      experience: 'Fresher / Aspiring Journalist',
      portfolio: '',
      reason: ''
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 select-none"
      onClick={handleResetAndClose}
    >
      <div
        className="relative w-full max-w-xl bg-gradient-to-b from-[#141724] via-[#0d101a] to-[#090b12] text-white rounded-3xl border border-white/10 shadow-[0_25px_60px_-15px_rgba(220,38,38,0.3)] overflow-hidden flex flex-col max-h-[92vh] select-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/4 right-1/4 h-24 bg-red-600/20 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-white/10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-red-900/40 border border-white/20 shrink-0">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-950/60 border border-red-500/30 px-2 py-0.5 rounded-full">
                  Accreditation Program
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
                Join StarNews India Reporter Network
              </h2>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 hide-scrollbar">
          {isSuccess ? (
            <div className="py-8 flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-white">Application Received!</h3>
                <p className="text-gray-300 text-xs sm:text-sm max-w-md">
                  Thank you, <strong className="text-white">{formData.fullName}</strong>. Our chief editorial desk will review your details for the <strong className="text-red-400">{formData.district}</strong> bureau and reach out on WhatsApp / Phone within 24–48 hours.
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 w-full max-w-md text-left text-xs text-gray-300 space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Next Steps in Onboarding:</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-gray-400">
                  <li>Credential verification & phone orientation with Senior Editor</li>
                  <li>Digital Press ID card generation with StarNews verification QR</li>
                  <li>Access to StarNews Reporter CMS Workspace for instant ground reporting</li>
                </ul>
              </div>
              <button
                onClick={handleResetAndClose}
                className="mt-4 px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-full shadow-lg shadow-red-900/40 transition-all active:scale-95"
              >
                Close & Return to Home
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-2">
                  <span>⚠️</span> {error}
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-red-400" /> Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patil"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full bg-white/5 border border-white/15 focus:border-red-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
                />
              </div>

              {/* Phone and Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-red-400" /> Mobile / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-white/5 border border-white/15 focus:border-red-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-red-400" /> Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/15 focus:border-red-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
                  />
                </div>
              </div>

              {/* District & Beat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-red-400" /> District / City *
                  </label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full bg-[#181c2e] border border-white/15 focus:border-red-500 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none transition-all"
                  >
                    {MAHARASHTRA_DISTRICTS.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-red-400" /> Reporting Beat *
                  </label>
                  <select
                    value={formData.beat}
                    onChange={(e) => setFormData({ ...formData, beat: e.target.value })}
                    className="w-full bg-[#181c2e] border border-white/15 focus:border-red-500 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none transition-all"
                  >
                    {BEATS.map((beat) => (
                      <option key={beat} value={beat}>
                        {beat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-red-400" /> Media / Journalism Experience
                </label>
                <select
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  className="w-full bg-[#181c2e] border border-white/15 focus:border-red-500 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none transition-all"
                >
                  <option value="Fresher / Aspiring Journalist">Fresher / Citizen Journalist / Student</option>
                  <option value="Freelancer / Stringer (1-2 Years)">Freelancer / Stringer (1–2 Years)</option>
                  <option value="Experienced Reporter (3-5 Years)">Experienced Reporter (3–5 Years)</option>
                  <option value="Senior Bureau Journalist (5+ Years)">Senior Bureau Journalist (5+ Years)</option>
                </select>
              </div>

              {/* Portfolio / Sample Link */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-red-400" /> Social Profile / Sample Work Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://facebook.com/..., youtube, or portfolio"
                  value={formData.portfolio}
                  onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                  className="w-full bg-white/5 border border-white/15 focus:border-red-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
                />
              </div>

              {/* Reason to join */}
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-red-400" /> Why do you want to report for StarNews? (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief note on your ground network or local issues you wish to cover..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full bg-white/5 border border-white/15 focus:border-red-500 rounded-xl p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-red-900/40 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Credentials...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Accreditation Application</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
