import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Upload, FileCheck, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { createNotification } from '@/lib/notifications';
import type { Item, Claim } from '@/types';
import { VERIFICATION_QUESTIONS } from '@/types';

export default function ClaimPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useToast();

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [existingClaim, setExistingClaim] = useState<Claim | null>(null);

  useEffect(() => {
    async function load() {
      const { data: itemData } = await supabase.from('items').select('*').eq('id', id).maybeSingle();
      if (!itemData) {
        setLoading(false);
        return;
      }
      setItem(itemData as Item);

      if (user) {
        const { data: claimData } = await supabase
          .from('claims')
          .select('*')
          .eq('item_id', id)
          .eq('claimer_id', user.id)
          .maybeSingle();
        setExistingClaim(claimData as Claim | null);
      }
      setLoading(false);
    }
    load();
  }, [id, user]);

  const handleProofUpload = (file: File | null) => {
    if (!file) return;
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !item) return;

    const requiredAnswers = VERIFICATION_QUESTIONS.filter((q) => !q.id.includes('optional'));
    for (const q of requiredAnswers) {
      if (!answers[q.id]?.trim()) {
        notify('Please answer all required verification questions', 'error');
        return;
      }
    }

    setSubmitting(true);
    try {
      let proofUrl: string | null = null;
      if (proofFile) {
        const ext = proofFile.name.split('.').pop();
        const path = `${user.id}/proof-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('item-photos').upload(path, proofFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('item-photos').getPublicUrl(path);
        proofUrl = data.publicUrl;
      }

      const { data: claimData, error } = await supabase
        .from('claims')
        .insert({
          item_id: item.id,
          claimer_id: user.id,
          verification_answers: answers,
          proof_url: proofUrl,
        })
        .select('*')
        .maybeSingle();

      if (error) throw error;

      await createNotification(
        item.user_id,
        'claim',
        'New claim on your item',
        `Someone has claimed your ${item.type} item "${item.title}". Review their verification answers.`,
        `/app/item/${item.id}`
      );

      notify('Claim submitted! The item owner and an admin will review it.');
      navigate(`/app/item/${item.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit claim';
      notify(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="h-6 w-32 shimmer-bg rounded animate-pulse mb-6" />
        <div className="h-8 shimmer-bg rounded w-1/2 animate-pulse mb-4" />
        <div className="h-40 shimmer-bg rounded animate-pulse" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Item not found</h2>
        <Link to="/app/browse" className="text-brand-600 font-medium">Back to browse</Link>
      </div>
    );
  }

  if (item.user_id === user?.id) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <h2 className="text-xl font-bold text-slate-900 mb-2">This is your item</h2>
        <p className="text-slate-500 mb-4">You can't claim your own item</p>
        <Link to={`/app/item/${item.id}`} className="text-brand-600 font-medium">Back to item</Link>
      </div>
    );
  }

  if (existingClaim) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            existingClaim.status === 'approved' ? 'bg-brand-100' :
            existingClaim.status === 'rejected' ? 'bg-rose-100' :
            'bg-amber-100'
          }`}>
            {existingClaim.status === 'approved' ? <CheckCircle2 className="w-8 h-8 text-brand-600" /> :
             existingClaim.status === 'rejected' ? <XCircle className="w-8 h-8 text-rose-600" /> :
             <Clock className="w-8 h-8 text-amber-600" />}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Claim {existingClaim.status === 'pending' ? 'under review' : existingClaim.status}
          </h2>
          <p className="text-slate-500 mb-6">
            {existingClaim.status === 'pending' && 'Your claim is being reviewed by the item owner and an administrator. We\'ll notify you when there\'s an update.'}
            {existingClaim.status === 'approved' && 'Your claim has been approved! Please coordinate with the item owner to arrange the handover.'}
            {existingClaim.status === 'rejected' && 'Your claim was not approved. If you believe this is an error, you can contact support.'}
            {existingClaim.status === 'completed' && 'This claim has been completed. The item has been returned.'}
          </p>
          <Link
            to={`/app/item/${item.id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold hover:shadow-lg hover:shadow-brand-500/30 transition-all"
          >
            Back to item
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center shadow-md shadow-accent-500/30">
          <FileCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Claim this item</h1>
          <p className="text-slate-500">Verify your ownership to start the claim process</p>
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-gray-50 border border-gray-200 p-5 mb-6 mt-4">
        <p className="text-sm text-slate-500 mb-1">You're claiming:</p>
        <p className="font-bold text-slate-900 text-lg">{item.title}</p>
        <p className="text-sm text-slate-600">{item.category} · {item.color}{item.brand && ` · ${item.brand}`}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="font-bold text-slate-900 mb-4">Verification questions</h2>
          <p className="text-sm text-slate-500 mb-4">
            Answer these questions so the item owner and admin can verify the item belongs to you.
          </p>
          <div className="space-y-4">
            {VERIFICATION_QUESTIONS.map((q) => (
              <div key={q.id}>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {q.question}
                  {!q.id.includes('optional') && <span className="text-rose-500 ml-1">*</span>}
                </label>
                <textarea
                  value={answers[q.id] ?? ''}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 outline-none transition-all resize-none"
                  placeholder="Your answer..."
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Proof of ownership (optional)</label>
          <p className="text-sm text-slate-500 mb-3">
            Upload a photo of a receipt, warranty card, or any document proving ownership.
          </p>
          {proofPreview ? (
            <div className="relative inline-block">
              <img src={proofPreview} alt="Proof preview" className="w-32 h-32 rounded-xl object-cover border border-gray-200" />
              <button
                type="button"
                onClick={() => { setProofFile(null); setProofPreview(null); }}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl py-8 cursor-pointer hover:border-accent-400 hover:bg-accent-50/30 transition-all">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-slate-500 font-medium">Click to upload proof</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleProofUpload(e.target.files?.[0] ?? null)}
              />
            </label>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 text-white font-semibold hover:shadow-lg hover:shadow-accent-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
            {submitting ? 'Submitting...' : 'Submit claim'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-xl border border-gray-200 text-slate-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
