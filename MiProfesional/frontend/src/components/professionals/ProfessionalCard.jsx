import { Link } from 'react-router-dom';
import { Star, Phone, MapPin } from 'lucide-react';

const StarRating = ({ rating = 0, size = 12 }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} size={size}
        className={i <= Math.floor(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
      />
    ))}
  </div>
);

const avatarUrl = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'P')}&background=0f7a5a&color=fff&bold=true`;

const ProfessionalCard = ({ pro, showDistance = true }) => {
  const distance = pro.distance
    ? (typeof pro.distance === 'number' ? pro.distance.toFixed(1) : pro.distance)
    : null;

  return (
    <Link to={`/service/${pro._id}`}
      className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-primary-200 transition-all group"
    >
      <div className="flex items-start gap-3">
        <img
          src={pro.avatar || avatarUrl(pro.businessName || pro.profession)}
          alt=""
          className="w-12 h-12 rounded-xl object-cover shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 text-sm truncate group-hover:text-primary-600 transition-colors">
            {pro.businessName || pro.profession}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">{pro.profession}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <StarRating rating={pro.stats?.rating || 0} size={11} />
            <span className="text-[11px] text-gray-400">{(pro.stats?.rating || 0).toFixed(1)}</span>
            {showDistance && distance && (
              <span className="text-[11px] text-gray-400 ml-auto flex items-center gap-0.5">
                <MapPin size={10} /> {distance} km
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 w-full py-2 bg-primary-50 text-primary-700 text-xs font-semibold rounded-lg hover:bg-primary-100 transition-all flex items-center justify-center gap-1.5">
        <Phone size={13} /> Contactar
      </div>
    </Link>
  );
};

export { ProfessionalCard, StarRating };
