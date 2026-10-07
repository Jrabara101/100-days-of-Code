import React from 'react';
import { useBlog } from '../../context/BlogContext';
import { MessageSquare, ArrowUpRight } from 'lucide-react';
import * as storage from '../../services/storageService';

export const ActiveDiscussionsWidget = () => {
  const { posts, navigateToArticle } = useBlog();

  // Collect recent comments from all posts
  const allComments = React.useMemo(() => {
    let list = [];
    posts.forEach(post => {
      const comms = storage.getComments(post.id);
      comms.forEach(c => {
        if (c.status === 'visible') {
          list.push({ ...c, postTitle: post.title, postSlug: post.slug });
        }
      });
    });
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);
  }, [posts]);

  if (allComments.length === 0) return null;

  return (
    <div className="p-5 rounded-2xl border border-[#E5E5DF] dark:border-[#26272C] bg-white dark:bg-[#141518] shadow-xs">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-[#4F46E5]" />
        <h4 className="font-serif font-bold text-base text-[#18181B] dark:text-[#F4F4F6]">
          Active Discussions
        </h4>
      </div>

      <div className="space-y-3.5">
        {allComments.map(c => (
          <div
            key={c.id}
            onClick={() => navigateToArticle(c.postSlug)}
            className="group p-2.5 rounded-xl hover:bg-[#F3F3EE] dark:hover:bg-[#1B1C21] transition-colors cursor-pointer border border-transparent hover:border-[#E5E5DF] dark:hover:border-[#26272C]"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <img
                src={c.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80'}
                alt={c.user?.name}
                className="w-5 h-5 rounded-full object-cover"
              />
              <span className="text-xs font-medium text-[#18181B] dark:text-[#F4F4F6] truncate">
                {c.user?.name}
              </span>
              <span className="text-[10px] text-[#71717A] dark:text-[#9496A1] font-mono">
                ▲ {c.upvotesCount || 0}
              </span>
            </div>

            <p className="text-xs text-[#71717A] dark:text-[#9496A1] line-clamp-2 leading-relaxed mb-1.5 italic font-serif">
              "{c.content.replace(/^>\s+.*$/m, '').trim().slice(0, 110)}..."
            </p>

            <div className="flex items-center gap-1 text-[11px] text-[#18181B] dark:text-[#F4F4F6] font-medium group-hover:text-[#4F46E5] transition-colors">
              <span className="truncate max-w-[200px]">{c.postTitle}</span>
              <ArrowUpRight className="w-3 h-3 shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
