import React, { useState } from 'react';
import { useImageInView } from '../../hooks/useImageInView';
import { cn } from '../../utils/cn';

interface CardHeaderProps {
  src?: string;
  alt?: string;
  name?: string;
  className?: string;
}

const CardHeader: React.FC<CardHeaderProps> = ({ src, alt = 'Profile image', name, className }) => {
  const [imageError, setImageError] = useState(false);
  const { ref, isInView } = useImageInView({ threshold: 0.1 });

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className={cn('flex flex-col items-center space-y-4', className)}>
      <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200">
        {src && !imageError && isInView ? (
          <img
            ref={ref}
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500 text-white font-bold text-xl">
            {getInitials(name)}
          </div>
        )}
      </div>
      {name && (
        <h2 id="profile-card-title" className="text-xl font-semibold text-center">
          {name}
        </h2>
      )}
    </div>
  );
};

export default CardHeader;
