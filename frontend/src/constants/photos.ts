export interface CuratedPhoto {
  url: string;
  alt: string;
  credit: string;
  fallbackGradient: string;
}

export const PHOTOS: Record<string, CuratedPhoto> = {
  heroCanopy: {
    url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1600&q=80',
    alt: 'Sunlight filtering through a lush green tree canopy',
    credit: 'Unsplash · Green Canopy',
    fallbackGradient: 'linear-gradient(135deg, #173F35 0%, #2D6A57 55%, #A9BFA8 100%)',
  },
  morningForest: {
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=80',
    alt: 'Morning sunbeams shining through tall forest trees',
    credit: 'Unsplash · Morning Forest',
    fallbackGradient: 'linear-gradient(135deg, #173F35 0%, #3E6B5C 60%, #E5EFE7 100%)',
  },
  mistyHills: {
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=80',
    alt: 'Clean misty mountain landscape at dawn',
    credit: 'Unsplash · Fresh Horizon',
    fallbackGradient: 'linear-gradient(135deg, #26332E 0%, #4E7266 60%, #A9BFA8 100%)',
  },
  sunlitTrail: {
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=80',
    alt: 'Sunlit woodland trail surrounded by fresh green foliage',
    credit: 'Unsplash · Woodland Path',
    fallbackGradient: 'linear-gradient(135deg, #173F35 0%, #52796F 100%)',
  },
  smogSkyline: {
    url: 'https://images.unsplash.com/photo-1573371564784-c8e76987555a?auto=format&fit=crop&w=1200&q=80',
    alt: 'Urban skyline shrouded in atmospheric haze and smog',
    credit: 'Unsplash · Urban Haze',
    fallbackGradient: 'linear-gradient(135deg, #26332E 0%, #7A8780 65%, #C98268 100%)',
  },
  livingRoomPlants: {
    url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80',
    alt: 'Minimalist warm living room with natural light and indoor greenery',
    credit: 'Unsplash · Calm Living',
    fallbackGradient: 'linear-gradient(135deg, #F0EDE3 0%, #A9BFA8 100%)',
  },
  cleanBedroom: {
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    alt: 'Serene minimalist bedroom with soft daylight',
    credit: 'Unsplash · Clean Bedroom',
    fallbackGradient: 'linear-gradient(135deg, #F0EDE3 0%, #E5EFE7 100%)',
  },
  indoorPlantsShelf: {
    url: 'https://images.unsplash.com/photo-1463320898484-cdee8141c787?auto=format&fit=crop&w=1200&q=80',
    alt: 'Potted indoor houseplants in warm natural light',
    credit: 'Unsplash · Botanical Home',
    fallbackGradient: 'linear-gradient(135deg, #E5EFE7 0%, #A9BFA8 100%)',
  },
  pottedFoliage: {
    url: 'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=1200&q=80',
    alt: 'Lush green indoor plant leaves in ceramic pot',
    credit: 'Unsplash · Indoor Foliage',
    fallbackGradient: 'linear-gradient(135deg, #173F35 0%, #A9BFA8 100%)',
  },
  modernKitchen: {
    url: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1200&q=80',
    alt: 'Clean modern kitchen interior with bright ventilation',
    credit: 'Unsplash · Clean Kitchen',
    fallbackGradient: 'linear-gradient(135deg, #F0EDE3 0%, #DCE3DC 100%)',
  },
  cyclingCity: {
    url: 'https://images.unsplash.com/photo-1568849676085-51415703900f?auto=format&fit=crop&w=1200&q=80',
    alt: 'Bicycle parked in a calm sunlit neighborhood',
    credit: 'Unsplash · Urban Cycling',
    fallbackGradient: 'linear-gradient(135deg, #173F35 0%, #A9BFA8 100%)',
  },
  activeCycling: {
    url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80',
    alt: 'Outdoor cycling in fresh morning air',
    credit: 'Unsplash · Active Mobility',
    fallbackGradient: 'linear-gradient(135deg, #26332E 0%, #52796F 100%)',
  },
  publicTransit: {
    url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
    alt: 'Sustainable urban public transport commute',
    credit: 'Unsplash · Public Transit',
    fallbackGradient: 'linear-gradient(135deg, #173F35 0%, #3B82A6 100%)',
  },
  urbanPark: {
    url: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=1200&q=80',
    alt: 'Green city park with shade trees and walking paths',
    credit: 'Unsplash · Urban Park',
    fallbackGradient: 'linear-gradient(135deg, #173F35 0%, #749C82 100%)',
  },
  communityGarden: {
    url: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=1200&q=80',
    alt: 'Community gardening and planting greenery outdoors',
    credit: 'Unsplash · Community Garden',
    fallbackGradient: 'linear-gradient(135deg, #173F35 0%, #C98268 100%)',
  },
  ecoHabits: {
    url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1200&q=80',
    alt: 'Sustainable waste sorting and eco-conscious living',
    credit: 'Unsplash · Eco Habits',
    fallbackGradient: 'linear-gradient(135deg, #26332E 0%, #A9BFA8 100%)',
  },
  outdoorLake: {
    url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80',
    alt: 'Crisp clear outdoor air over calm water and greenery',
    credit: 'Unsplash · Crisp Air',
    fallbackGradient: 'linear-gradient(135deg, #173F35 0%, #3B82A6 100%)',
  },
};
