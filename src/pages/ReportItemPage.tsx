import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, ArrowLeft, Image as ImageIcon, Loader2, Building } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { computeImageHash } from '@/lib/imageHash';
import { CATEGORIES, COLORS, type ItemType } from '@/types';

export default function ReportItemPage() {
  const { user } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [type, setType] = useState<ItemType>('lost');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [dateEvent, setDateEvent] = useState('');
  const [location, setLocation] = useState('');
  const [building, setBuilding] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles = Array.from(fileList).slice(0, 5 - files.length);
    setFiles((prev) => [...prev, ...newFiles]);
    setPreviews((prev) => [...prev, ...newFiles.map((f) => URL.createObjectURL(f))]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (): Promise<{ urls: string[]; hash: string | null }> => {
    const urls: string[] = [];
    let firstPublicUrl = '';
    for (const file of files) {
      const ext = file.name.split('.').pop();
      const path = `${user!.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('item-photos').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('item-photos').getPublicUrl(path);
      urls.push(data.publicUrl);
      if (!firstPublicUrl) firstPublicUrl = data.publicUrl;
    }
    let hash: string | null = null;
    if (firstPublicUrl) {
      hash = await computeImageHash(firstPublicUrl);
    }
    return { urls, hash };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !category || !color || !dateEvent || !location || !description) {
      notify('Please fill in all required fields', 'error');
      return;
    }
    setSubmitting(true);
    setUploading(true);
    try {
      let photoUrls: string[] = [];
      let imageHash: string | null = null;
      if (files.length > 0) {
        const result = await uploadPhotos();
        photoUrls = result.urls;
        imageHash = result.hash;
      }
      setUploading(false);

      const { error } = await supabase.from('items').insert({
        user_id: user!.id,
        type,
        title,
        category,
        color,
        brand: brand || null,
        date_event: dateEvent,
        location,
        building: building || null,
        description,
        photo_urls: photoUrls,
        image_hash: imageHash,
      });

      if (error) throw error;
      notify('Item reported successfully!');
      navigate('/app');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to report item';
      notify(msg, 'error');
    } finally {
      setUploading(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <button
        onClick={() => navigate('/app')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </button>

      <h1 className="text-3xl font-bold text-slate-900 mb-2">Report an item</h1>
      <p className="text-slate-500 mb-8">Tell us about the item you lost or found</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">What happened?</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setType('lost')}
              className={`py-4 rounded-xl border-2 font-semibold transition-all ${
                type === 'lost'
                  ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-md shadow-rose-500/10'
                  : 'border-gray-200 bg-white text-slate-500 hover:border-gray-300'
              }`}
            >
              I lost something
            </button>
            <button
              type="button"
              onClick={() => setType('found')}
              className={`py-4 rounded-xl border-2 font-semibold transition-all ${
                type === 'found'
                  ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-md shadow-brand-500/10'
                  : 'border-gray-200 bg-white text-slate-500 hover:border-gray-300'
              }`}
            >
              I found something
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Item name *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Black HP Laptop"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
            >
              <option value="">Select category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Color *</label>
            <select
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
            >
              <option value="">Select color</option>
              {COLORS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Brand (optional)</label>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g. HP, Apple, Nike"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {type === 'lost' ? 'Date lost *' : 'Date found *'}
            </label>
            <input
              type="date"
              value={dateEvent}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDateEvent(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {type === 'lost' ? 'Location lost *' : 'Location found *'}
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Central Park, NYC"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Building (optional)</label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              placeholder="e.g. Science Library, Room 101"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
            />
          </div>
          <p className="text-xs text-slate-400 mt-1.5 ml-1">Helps others find items reported in the same building</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Describe the item in detail — distinguishing features, contents, condition, etc."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Photos (up to 5)</label>
          {previews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-3">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                  <img src={src} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {files.length < 5 && (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl py-8 cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition-all">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-slate-500 font-medium">Click to upload photos</span>
              <span className="text-xs text-slate-400 mt-1">Photos are used for AI image similarity matching</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold hover:shadow-lg hover:shadow-brand-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {uploading ? 'Uploading photos...' : 'Submitting...'}
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4" />
                Report {type === 'lost' ? 'lost' : 'found'} item
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/app')}
            className="px-6 py-3 rounded-xl border border-gray-200 text-slate-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
