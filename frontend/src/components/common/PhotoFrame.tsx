import React, { useState } from 'react';
import { Leaf } from 'lucide-react';
import { CuratedPhoto } from '../../constants/photos';

interface PhotoFrameProps {
  photo: CuratedPhoto;
  className?: string;
  imgClassName?: string;
  overlayClassName?: string;
  children?: React.ReactNode;
}

export const PhotoFrame: React.FC<PhotoFrameProps> = ({
  photo,
  className = '',
  imgClassName = '',
  overlayClassName = '',
  children,
}) => {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: photo.fallbackGradient }}
    >
      {!failed ? (
        <img
          src={photo.url}
          alt={photo.alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${imgClassName}`}
        />
      ) : (
        <div
          className="absolute inset-0 w-full h-full flex items-center justify-center opacity-30"
          aria-label={photo.alt}
        >
          <Leaf size={36} className="text-white" />
        </div>
      )}

      {overlayClassName && (
        <div className={`absolute inset-0 pointer-events-none ${overlayClassName}`} />
      )}

      {children}
    </div>
  );
};
