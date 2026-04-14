import { memo } from 'react';
import { m } from "framer-motion";
import { FiPlay, FiPause, FiHeart } from "react-icons/fi";

import { Poster } from "@/common";
import { mainHeading, maxWidth, paragraph, watchBtn } from "@/styles";
import { ITrack } from "@/types";
import { cn } from "@/utils/helper";
import { useMotion } from "@/hooks/useMotion";
import { useAudioPlayerContext } from "@/context/audioPlayerContext";

const HeroSlide = ({ track }: { track: ITrack }) => {
  const { fadeDown, staggerContainer } = useMotion();
  const {
    currentTrack,
    isPlaying,
    playTrack,
    toggleTrackFavorite,
    isTrackFavorite,
  } = useAudioPlayerContext();

  const {
    overview,
    original_title: title,
    poster_path: posterPath,
  } = track;
  const trackId = track.spotify_id || track.id;
  const isCurrentTrack = currentTrack && (currentTrack.spotify_id || currentTrack.id) === trackId;
  const isCurrentTrackPlaying = !!isCurrentTrack && isPlaying;
  const isFavorite = isTrackFavorite(trackId);

  return (
    <div
      className={cn(
        maxWidth,
        ` mx-auto flex items-center h-full  flex-row lg:gap-32 sm:gap-20`
      )}
    >
      <m.div
        variants={staggerContainer(0.2, 0.3)}
        initial="hidden"
        animate="show"
        className="text-gray-300 sm:max-w-[80vw] max-w-[90vw]  md:max-w-[420px] font-nunito flex flex-col sm:gap-5 xs:gap-3 gap-[10px] sm:mb-8"
      >
        <m.h2 variants={fadeDown} className={cn(mainHeading)}>
          {title}
        </m.h2>
        <m.p variants={fadeDown} className={paragraph}>
          {overview.length > 180 ? `${overview.substring(0, 180)}...` : overview}
        </m.p>
        <m.div variants={fadeDown} className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => playTrack(track, [track])}
            className={cn(
              watchBtn,
              "inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors duration-200"
            )}
          >
            {isCurrentTrackPlaying ? <FiPause className="w-4 h-4" /> : <FiPlay className="w-4 h-4" />}
            {isCurrentTrackPlaying ? "Pause Preview" : "Play Preview"}
          </button>
          <button
            type="button"
            onClick={() => toggleTrackFavorite(track)}
            className={cn(
              "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border transition-colors duration-200",
              isFavorite
                ? "border-red-300 bg-red-50 text-red-600"
                : "border-white/40 bg-white/10 text-white hover:bg-white/20"
            )}
          >
            <FiHeart className={cn("w-4 h-4", isFavorite && "fill-current")} />
            {isFavorite ? "Saved" : "Save"}
          </button>
        </m.div>
      </m.div>

      <Poster title={title} posterPath={posterPath} className="mr-auto" />
    </div>
  );
};

export default memo(HeroSlide);
