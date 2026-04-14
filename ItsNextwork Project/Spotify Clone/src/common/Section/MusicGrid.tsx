import { FC, useState } from "react";
import { TrackCard } from "@/components/ui/TrackCard";
import { ITrack } from "@/types";
import { useAudioPlayerContext } from "@/context/audioPlayerContext";

interface MusicGridProps {
  tracks: ITrack[];
  category: string;
  initialDisplayCount?: number;
  loadMoreCount?: number;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  hasMoreContent?: boolean;
}

const MusicGrid: FC<MusicGridProps> = ({
  tracks,
  category,
  initialDisplayCount = 18,
  loadMoreCount = 18,
  onLoadMore,
  isLoadingMore = false,
  hasMoreContent = false
}) => {
  const [visibleCount, setVisibleCount] = useState(initialDisplayCount);
  const {
    currentTrack,
    isPlaying,
    playTrack,
    toggleTrackFavorite,
    isTrackFavorite,
  } = useAudioPlayerContext();

  const currentTrackId = currentTrack ? (currentTrack.spotify_id || currentTrack.id) : "";

  const handlePlay = (track: ITrack) => {
    playTrack(track, tracks);
  };

  const handleLoadMoreClick = () => {
    if (tracks.length > visibleCount) {
      setVisibleCount((prev) => Math.min(prev + loadMoreCount, tracks.length));
    } else if (onLoadMore && hasMoreContent) {
      onLoadMore();
      setVisibleCount((prev) => prev + loadMoreCount);
    }
  };

  const displayedTracks = tracks.slice(0, visibleCount);
  const showLoadMoreButton =
    tracks.length > visibleCount ||
    (hasMoreContent && !isLoadingMore);

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-6">
        {displayedTracks.map((track) => {
          const trackId = track.spotify_id || track.id;

          return (
            <div key={trackId} className="flex flex-col">
              <TrackCard
                track={track}
                category={category}
                isPlaying={isPlaying && currentTrackId === trackId}
                isFavorite={isTrackFavorite(trackId)}
                onPlay={handlePlay}
                onToggleFavorite={toggleTrackFavorite}
                variant="detailed"
              />
            </div>
          );
        })}
      </div>

      {showLoadMoreButton && (
        <div className="flex justify-center">
          <button
            onClick={handleLoadMoreClick}
            disabled={isLoadingMore}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            {isLoadingMore ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Loading...
              </div>
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}

      {isLoadingMore && !showLoadMoreButton && (
        <div className="flex justify-center py-4">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            Loading more tracks...
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicGrid;
