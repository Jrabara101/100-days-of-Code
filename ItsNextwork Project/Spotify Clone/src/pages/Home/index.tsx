import { FiClock, FiHeart, FiTrash2 } from "react-icons/fi";

import { Loader, Error, Section } from "@/common";
import MusicGrid from "@/common/Section/MusicGrid";
import { useAudioPlayerContext } from "@/context/audioPlayerContext";
import { Hero } from "./components";

import { useGetTracksQuery } from "@/services/MusicAPI";
import { maxWidth } from "@/styles";
import { sections } from "@/constants";
import { cn } from "@/utils/helper";

const Home = () => {
  const { favoriteTracks, recentlyPlayed, clearRecentlyPlayed } = useAudioPlayerContext();

  const { data: heroData, isLoading: heroLoading, isError: heroError } = useGetTracksQuery({
    category: "tracks",
    type: "latest",
    page: 1,
    cacheKey: "hero"
  });

  const { data, isLoading, isError } = useGetTracksQuery({
    category: "tracks",
    type: "popular",
    page: 1,
  });

  if (isLoading || heroLoading) {
    return <Loader />;
  }

  if (isError || heroError) {
    return <Error error="Unable to fetch the music tracks! " />;
  }

  const heroTracks = heroData?.results || data?.results || [];
  const hasPersonalizedContent = favoriteTracks.length > 0 || recentlyPlayed.length > 0;

  return (
    <>
      <Hero tracks={heroTracks} />

      <div className={cn(maxWidth, "lg:mt-12 md:mt-8 sm:mt-6 xs:mt-4 mt-2") }>
        {hasPersonalizedContent && (
          <section className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-gradient-to-br from-white to-emerald-50/40 dark:from-card-dark dark:to-slate-900/80 p-5 mb-6">
            <div className="mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50">Your Music Hub</h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">
                Favorites and recently played tracks are saved automatically.
              </p>
            </div>

            {favoriteTracks.length > 0 && (
              <div className="mb-8 last:mb-0">
                <div className="flex items-center gap-2 mb-4">
                  <FiHeart className="text-red-500" />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Favorite Tracks</h4>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{favoriteTracks.length}</span>
                </div>
                <MusicGrid
                  tracks={favoriteTracks}
                  category="tracks"
                  initialDisplayCount={6}
                  loadMoreCount={6}
                />
              </div>
            )}

            {recentlyPlayed.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4 gap-4">
                  <div className="flex items-center gap-2">
                    <FiClock className="text-blue-500" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recently Played</h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{recentlyPlayed.length}</span>
                  </div>
                  <button
                    type="button"
                    onClick={clearRecentlyPlayed}
                    className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:text-red-600 hover:border-red-400 dark:hover:text-red-400 transition-colors duration-200"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                    Clear
                  </button>
                </div>
                <MusicGrid
                  tracks={recentlyPlayed}
                  category="tracks"
                  initialDisplayCount={6}
                  loadMoreCount={6}
                />
              </div>
            )}
          </section>
        )}

        {sections.map(({ title, category, type }) => (
          <Section title={title} category={category} type={type} key={title} />
        ))}
      </div>
    </>
  );
};

export default Home;
