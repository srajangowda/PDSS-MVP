import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Specialist, AvailabilitySlot, Child, Screening } from '../types';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import {
  Stethoscope,
  MapPin,
  Calendar,
  Clock,
  Filter,
  CheckCircle2,
  Users,
  Search,
  X,
  Phone,
  Mail,
  Tent,
  ArrowRight,
} from 'lucide-react';

export const SpecialistDirectoryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const preselectedChildId = searchParams.get('childId') || '';
  const preselectedScreeningId = searchParams.get('screeningId') || '';

  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [availabilities, setAvailabilities] = useState<Record<string, AvailabilitySlot[]>>({});
  const [children, setChildren] = useState<Child[]>([]);
  const [screenings, setScreenings] = useState<Record<string, Screening[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Referral Modal State
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [targetSpecialist, setTargetSpecialist] = useState<Specialist | null>(null);
  const [chosenChildId, setChosenChildId] = useState(preselectedChildId);
  const [chosenScreeningId, setChosenScreeningId] = useState(preselectedScreeningId);
  const [chosenAvailabilityId, setChosenAvailabilityId] = useState('');
  const [referralNotes, setReferralNotes] = useState('');
  const [isSubmittingReferral, setIsSubmittingReferral] = useState(false);
  const [referralSuccessMsg, setReferralSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [specData, childData] = await Promise.all([
          api.getSpecialists(),
          api.getChildren(),
        ]);
        setSpecialists(specData);
        setChildren(childData);

        if (!chosenChildId && childData.length > 0) {
          setChosenChildId(childData[0].id);
        }

        // Fetch availabilities for all specialists
        const slotsMap: Record<string, AvailabilitySlot[]> = {};
        for (const s of specData) {
          try {
            const slots = await api.getAvailability(s.id);
            slotsMap[s.id] = slots;
          } catch {
            slotsMap[s.id] = [];
          }
        }
        setAvailabilities(slotsMap);

        // Fetch screenings for children
        const scrMap: Record<string, Screening[]> = {};
        for (const c of childData) {
          try {
            const history = await api.getChildScreeningHistory(c.id);
            scrMap[c.id] = history;
          } catch {
            scrMap[c.id] = [];
          }
        }
        setScreenings(scrMap);
      } catch (err) {
        console.error('Failed to load specialists directory:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleOpenReferralModal = (spec: Specialist) => {
    setTargetSpecialist(spec);
    const slots = availabilities[spec.id] || [];
    if (slots.length > 0) {
      setChosenAvailabilityId(slots[0].id);
    } else {
      setChosenAvailabilityId('');
    }

    // Default screening if child is selected
    const activeChildId = chosenChildId || (children.length > 0 ? children[0].id : '');
    setChosenChildId(activeChildId);
    const childScrs = screenings[activeChildId] || [];
    if (!chosenScreeningId && childScrs.length > 0) {
      setChosenScreeningId(childScrs[0].id);
    }

    setIsReferralModalOpen(true);
  };

  const handleChildSelectionChange = (newChildId: string) => {
    setChosenChildId(newChildId);
    const childScrs = screenings[newChildId] || [];
    setChosenScreeningId(childScrs.length > 0 ? childScrs[0].id : '');
  };

  const handleSubmitReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSpecialist || !chosenChildId) return;
    setIsSubmittingReferral(true);

    try {
      // Find or create placeholder screening ID if child has not been screened yet
      let screeningIdToUse = chosenScreeningId;
      if (!screeningIdToUse) {
        const childScrs = screenings[chosenChildId] || [];
        if (childScrs.length > 0) {
          screeningIdToUse = childScrs[0].id;
        } else {
          // Trigger screening first or create baseline
          alert('Please complete a screening for this child first so the specialist has preliminary observations.');
          setIsSubmittingReferral(false);
          return;
        }
      }

      await api.createReferral({
        child_id: chosenChildId,
        screening_id: screeningIdToUse,
        specialist_id: targetSpecialist.id,
        availability_id: chosenAvailabilityId || undefined,
        notes: referralNotes,
      });

      setIsReferralModalOpen(false);
      setReferralSuccessMsg(`Referral request sent to ${targetSpecialist.name} successfully.`);
      navigate('/referrals');
    } catch (err: any) {
      alert(err.message || 'Failed to submit referral request.');
    } finally {
      setIsSubmittingReferral(false);
    }
  };

  // Filter specialists
  const filteredSpecialists = specialists.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLocation = selectedLocation === 'all' || s.location.toLowerCase() === selectedLocation.toLowerCase();
    const matchesSpecialty =
      selectedSpecialty === 'all' || s.specialization.toLowerCase() === selectedSpecialty.toLowerCase();
    const matchesType = selectedType === 'all' || s.type === selectedType;

    return matchesSearch && matchesLocation && matchesSpecialty && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 pb-16">
      {/* Page Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full w-fit border border-teal-200">
          <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
          Verified Care Network
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Specialist & Screening Camp Directory
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Connect with developmental pediatricians, speech therapists, and free community outreach screening camps
        </p>
      </div>

      {preselectedChildId && (
        <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-xs text-teal-900 flex items-center justify-between">
          <span>
            Connecting child with pre-screening observations. Select a specialist below to book a consultation slot.
          </span>
          <span className="font-bold uppercase tracking-wider text-[11px] bg-white px-2 py-0.5 rounded-md border border-teal-200">
            Pre-screening Linked
          </span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by specialist name, hospital, camp, or clinical expertise..."
            className="w-full text-xs sm:text-sm bg-transparent focus:outline-none text-slate-800 placeholder-slate-400"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            Filters:
          </div>

          {/* Location */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">All Locations</option>
            <option value="Udupi">Udupi</option>
            <option value="Kundapura">Kundapura</option>
            <option value="Mangalore">Mangalore</option>
            <option value="Manipal">Manipal</option>
            <option value="Malpe">Malpe</option>
          </select>

          {/* Specialty */}
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">All Specialties</option>
            <option value="Developmental Pediatrician">Developmental Pediatrician</option>
            <option value="Pediatrician">Pediatrician</option>
            <option value="Child Psychologist">Child Psychologist</option>
            <option value="Speech Therapist">Speech Therapist</option>
            <option value="Occupational Therapist">Occupational Therapist</option>
          </select>

          {/* Type */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">All Providers & Camps</option>
            <option value="individual">Specialist Clinics</option>
            <option value="camp">Community Screening Camps</option>
          </select>

          {(selectedLocation !== 'all' || selectedSpecialty !== 'all' || selectedType !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedLocation('all');
                setSelectedSpecialty('all');
                setSelectedType('all');
                setSearchQuery('');
              }}
              className="text-teal-600 hover:underline font-semibold ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Specialist Cards Grid */}
      {isLoading ? (
        <CardSkeleton count={3} />
      ) : filteredSpecialists.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No providers found"
          description="Try adjusting your filters or search terms to find available providers."
          actionText="Reset Filters"
          onAction={() => {
            setSelectedLocation('all');
            setSelectedSpecialty('all');
            setSelectedType('all');
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpecialists.map((spec) => {
            const slots = availabilities[spec.id] || [];
            const nextSlot = slots.length > 0 ? slots[0] : null;
            const isCamp = spec.type === 'camp';

            return (
              <div
                key={spec.id}
                className={`bg-white rounded-3xl p-6 border shadow-xs hover:border-teal-400 transition flex flex-col justify-between space-y-5 ${
                  isCamp ? 'border-amber-200/90 bg-amber-50/20' : 'border-slate-200'
                }`}
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                          isCamp
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-teal-50 text-teal-600 border-teal-100'
                        }`}
                      >
                        {isCamp ? <Tent className="w-6 h-6" /> : <Stethoscope className="w-6 h-6" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base leading-snug">{spec.name}</h3>
                        <p className="text-xs font-semibold text-teal-700">{spec.specialization}</p>
                      </div>
                    </div>
                  </div>

                  {/* Badge & Organization */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {spec.location}
                    </span>
                    {isCamp ? (
                      <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                        Free Community Camp
                      </span>
                    ) : (
                      <span className="font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                        Clinical Consultation
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 font-normal">
                    {spec.bio}
                  </p>

                  {/* Availability Preview */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      {isCamp ? 'Camp Date & Slot' : 'Next Available Slot'}
                    </span>
                    {nextSlot ? (
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="font-semibold flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-teal-600" />
                          {nextSlot.date}
                        </span>
                        <span className="text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {nextSlot.start_time}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Consultation slots open upon request</span>
                    )}
                  </div>
                </div>

                {/* Request Referral Button */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenReferralModal(spec)}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition shadow-2xs flex items-center justify-center gap-2"
                  >
                    {isCamp ? 'Request Camp Slot' : 'Request Referral'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Referral Request Modal */}
      {isReferralModalOpen && targetSpecialist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Request Referral</h3>
                  <p className="text-xs text-slate-500">{targetSpecialist.name} ({targetSpecialist.specialization})</p>
                </div>
              </div>
              <button
                onClick={() => setIsReferralModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReferral} className="space-y-4 text-xs">
              {/* Select Child */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Select Child Profile *
                </label>
                <select
                  value={chosenChildId}
                  onChange={(e) => handleChildSelectionChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                >
                  {children.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.dob}) - {c.location}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Available Slot */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Select Consultation / Camp Slot *
                </label>
                {(availabilities[targetSpecialist.id] || []).length > 0 ? (
                  <select
                    value={chosenAvailabilityId}
                    onChange={(e) => setChosenAvailabilityId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  >
                    {(availabilities[targetSpecialist.id] || []).map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        {slot.date} • {slot.start_time} - {slot.end_time} ({slot.available_slots} slots open)
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500">
                    Direct coordinator request (clinic will contact guardian with upcoming date).
                  </div>
                )}
              </div>

              {/* Parent/Worker Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Observations / Reasons for Referral (Optional)
                </label>
                <textarea
                  rows={3}
                  value={referralNotes}
                  onChange={(e) => setReferralNotes(e.target.value)}
                  placeholder="e.g. Pre-screening noted speech response delay and caregiver observes child pointing instead of speaking..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 leading-relaxed text-[11px]">
                Upon requesting, PediPulse automatically schedules a 14-day post-referral milestone check-in to track consultation progress.
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsReferralModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReferral}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition disabled:opacity-60"
                >
                  {isSubmittingReferral ? 'Submitting...' : 'Confirm Referral Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

