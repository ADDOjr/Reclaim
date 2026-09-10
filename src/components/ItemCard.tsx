import { Link } from 'react-router-dom';
import { MapPin, Calendar, Tag, Package } from 'lucide-react';
import type { Item } from '@/types';

interface ItemCardProps {
  item: Item;
  matchScore?: number;
  showStatus?: boolean;
}

export default function ItemCard({ item, matchScore, showStatus }: ItemCardProps) {
  const photo = item.photo_urls?.[0];
  const typeLabel = item.type === 'lost' ? 'Lost' : 'Found';
  const typeColor = item.type === 'lost'
    ? 'bg-rose-100 text-rose-700'
    : 'bg-brand-100 text-brand-700';

  const scoreColor = matchScore !== undefined
    ? matchScore >= 85 ? 'from-brand-500 to-brand-600'
      : matchScore >= 70 ? 'from-green-500 to-green-600'
      : matchScore >= 50 ? 'from-amber-500 to-orange-500'
      : 'from-slate-400 to-slate-500'
    : '';

  return (
    <Link
      to={`/app/item/${item.id}`}
      className="group block rounded-2xl border border-gray-200 bg-white overflow-hidden hover:shadow-xl hover:-translate-y-1 hover:border-brand-300 transition-all duration-300"
    >
      <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
        {photo ? (
          <img
            src={photo}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <Package className="w-12 h-12 text-gray-300 group-hover:text-brand-300 transition-colors" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${typeColor} shadow-sm`}>
            {typeLabel}
          </span>
          {showStatus && item.status === 'resolved' && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 text-white shadow-sm flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
              Resolved
            </span>
          )}
        </div>
        {matchScore !== undefined && (
          <div className="absolute top-3 right-3">
            <div className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${scoreColor} shadow-md`}>
              {matchScore}% match
            </div>
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-bold text-slate-900 text-lg mb-1 group-hover:text-brand-600 transition-colors">
          {item.title}
        </h3>
        <div className="flex items-center gap-3 text-sm text-slate-500 mb-3">
          <span className="flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" />
            {item.category}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: item.color.toLowerCase() }} />
            {item.color}
          </span>
          {item.brand && <span className="truncate">· {item.brand}</span>}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {item.location}
          </span>
          {item.building && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {item.building}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(item.date_event).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>
    </Link>
  );
}
