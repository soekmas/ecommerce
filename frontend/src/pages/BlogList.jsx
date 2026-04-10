import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { getFullUrl } from '../utils/api';
import { BookOpen, MagnifyingGlass, CalendarBlank, ChatCircle, ArrowRight, House, Newspaper } from 'phosphor-react';

const BlogList = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('q') || '';
  const [search, setSearch] = useState(initialSearch);
  const [searchInput, setSearchInput] = useState(initialSearch);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/blogs?limit=50');
      setBlogs(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch blogs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const filtered = blogs.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    (b.excerpt || '').toLowerCase().includes(search.toLowerCase())
  );

  const recent = blogs.slice(0, 4);

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="animate-fade-in pb-20">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-100 py-10 mb-10 overflow-hidden relative">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/20 animate-pulse">
              <Newspaper size={32} weight="fill" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-[#111827] tracking-tighter">Blog &amp; Stories</h1>
              <p className="text-orange-500 text-[10px] font-black uppercase tracking-[0.2em]">Latest Tech Insights</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <Link to="/" className="text-gray-400 hover:text-[#2B59FF] transition-colors flex items-center gap-1">
              <House size={16} /> Home
            </Link>
            <span className="text-gray-200">/</span>
            <span className="text-gray-900 font-bold">Articles</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">

          {/* ── LEFT: Main Posts Column ── */}
          <div className="space-y-12">
            {loading ? (
              <>
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse space-y-4">
                    <div className="aspect-[16/9] bg-gray-100 rounded-2xl" />
                    <div className="h-5 bg-gray-100 rounded-full w-3/4" />
                    <div className="h-4 bg-gray-100 rounded-full w-full" />
                    <div className="h-4 bg-gray-100 rounded-full w-2/3" />
                  </div>
                ))}
              </>
            ) : filtered.length === 0 ? (
              <div className="text-center py-24 space-y-4">
                <BookOpen size={56} className="mx-auto text-gray-200" />
                <p className="text-gray-400 font-medium text-lg">No articles found.</p>
              </div>
            ) : (
              filtered.map((blog, idx) => (
                <article
                  key={blog.id}
                  className={`group animate-fade-in-up stagger-${(idx % 4) + 1}`}
                >
                  {/* Cover Image */}
                  <Link to={`/blogs/${blog.id}`} className="block overflow-hidden rounded-xl mb-5 aspect-[16/9] bg-gray-100">
                    {blog.image_url ? (
                      <img
                        src={getFullUrl(blog.image_url)}
                        alt={blog.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-200">
                        <BookOpen size={48} weight="thin" />
                      </div>
                    )}
                  </Link>
                  
                  {/* Category Badge */}
                  <span className="inline-block px-3 py-1 bg-orange-50 text-orange-500 text-xs font-black uppercase tracking-wider rounded-lg mb-3">
                    Article
                  </span>

                  {/* Title */}
                  <Link to={`/blogs/${blog.id}`}>
                    <h2 className="text-2xl font-black text-[#111827] leading-tight mb-3 group-hover:text-[#2B59FF] transition-colors">
                      {blog.title}
                    </h2>
                  </Link>

                  {/* Excerpt */}
                  <p className="text-gray-500 text-sm font-medium leading-relaxed line-clamp-3 mb-4">
                    {blog.excerpt || blog.content}
                  </p>

                  {/* Meta & Read More */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-5 text-xs text-gray-400 font-medium">
                      <span className="flex items-center gap-1.5">
                        <CalendarBlank size={13} weight="fill" className="text-[#2B59FF]" />
                        {formatDate(blog.created_at)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <ChatCircle size={13} weight="fill" className="text-[#2B59FF]" />
                        0 Comments
                      </span>
                    </div>
                    <Link
                      to={`/blogs/${blog.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-black text-[#2B59FF] hover:gap-2.5 transition-all"
                    >
                      Read More <ArrowRight weight="bold" size={14} />
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <aside className="space-y-8">

            {/* Search Widget */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-base font-black text-[#111827] mb-4">Search Here</h3>
              <form onSubmit={handleSearch} className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Searching..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:border-[#2B59FF] focus:bg-white outline-none transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 w-9 h-9 bg-[#2B59FF] text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center shadow-lg shadow-blue-500/20"
                >
                  <MagnifyingGlass size={18} weight="bold" />
                </button>
              </form>
              {search && (
                <button
                  onClick={() => { setSearch(''); setSearchInput(''); }}
                  className="mt-2 text-xs text-gray-400 hover:text-red-500 transition-colors font-medium"
                >
                  ✕ Clear search
                </button>
              )}
            </div>

            {/* Recent Posts Widget */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-base font-black text-[#111827] mb-5">Recent Posts</h3>
              <div className="space-y-4">
                {loading ? (
                  [1,2,3].map(i => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-16 h-16 bg-gray-100 rounded-xl flex-shrink-0" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-3 bg-gray-100 rounded-full" />
                        <div className="h-3 bg-gray-100 rounded-lg" />
                        <div className="h-3 bg-gray-100 rounded-lg w-2/3" />
                      </div>
                    </div>
                  ))
                ) : recent.length === 0 ? (
                  <p className="text-sm text-gray-400 font-medium">No posts yet.</p>
                ) : (
                  recent.map(blog => (
                    <Link
                      key={blog.id}
                      to={`/blogs/${blog.id}`}
                      className="flex gap-3 group items-start"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {blog.image_url ? (
                          <img
                            src={getFullUrl(blog.image_url)}
                            alt={blog.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-200">
                            <BookOpen size={20} weight="thin" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#111827] leading-tight line-clamp-2 group-hover:text-[#2B59FF] transition-colors mb-1.5">
                          {blog.title}
                        </p>
                        <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                          <CalendarBlank size={11} weight="fill" className="text-[#2B59FF]" />
                          {formatDate(blog.created_at)}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
};

export default BlogList;
