import { FC } from "react";
import { Swiper, SwiperSlide } from "swiper/react";

import { TrackCard } from "@/components/ui/TrackCard";
import { ITrack } from "@/types";
import { useAudioPlayerContext } from "@/context/audioPlayerContext";

interface MusicSlidesProps {
  tracks: ITrack[];
  category: string;
  useModernCards?: boolean;
}

const MusicSlides: FC<MusicSlidesProps> = ({ tracks, category, useModernCards: _useModernCards = true }) => {
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

  return (
    <Swiper slidesPerView="auto" spaceBetween={15} className="mySwiper">
      {tracks.map((track) => {
        const trackId = track.spotify_id || track.id;

        return (
          <SwiperSlide
            key={trackId}
            className="flex mt-1 flex-col xs:gap-[14px] gap-2 max-w-[170px] rounded-lg"
          >
            <TrackCard
              track={track}
              category={category}
              isPlaying={isPlaying && currentTrackId === trackId}
              isFavorite={isTrackFavorite(trackId)}
              onPlay={handlePlay}
              onToggleFavorite={toggleTrackFavorite}
              variant="detailed"
            />
          </SwiperSlide>
        );
      })}
    </Swiper>
  );
};

export default MusicSlides;
