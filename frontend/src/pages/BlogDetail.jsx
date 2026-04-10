import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { getFullUrl } from '../utils/api';
import { ArrowLeft, CalendarBlank, BookOpen, ChatCircle, MagnifyingGlass, House } from 'phosphor-react';

const BlogDetail = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recent, setRecent] = useState([]);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    fetchBlog();
    fetchRecent();
    window.scrollTo(0, 0);
  }, [id]);

  const fetchBlog = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/blogs/${id}`);
      setBlog(res.data.data);
    } catch (err) {
      console.error('Failed to fetch blog', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecent = async () => {
    try {
      const res = await api.get('/blogs?limit=5');
      const all = res.data.data || [];
      setRecent(all.filter(b => String(b.id) !== String(id)).slice(0, 4));
    } catch (err) {
      console.error('Failed to fetch recent posts', err);
    }
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      window.location.href = `/blogs?q=${encodeURIComponent(searchInput)}`;
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10 animate-pulse">
          <div className="space-y-6">
            <div className="aspect-[16/9] bg-gray-100 rounded-2xl" />
            <div className="h-8 bg-gray-100 rounded-full w-3/4" />
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => <div key={i} className="h-4 bg-gray-100 rounded-full" />)}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-100 rounded-2xl" />
            <div className="h-64 bg-gray-100 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="text-center py-32 space-y-4">
        <BookOpen size={56} className="mx-auto text-gray-200" />
        <p className="text-gray-400 font-medium text-lg">Article not found.</p>
        <Link to="/blogs" className="inline-flex items-center gap-2 text-[#2B59FF] font-black text-sm hover:gap-3 transition-all">
          <ArrowLeft weight="bold" /> Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-20">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-100 py-10 mb-10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <Link
              to="/blogs"
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-[#2B59FF] transition-colors mb-2"
            >
              <ArrowLeft weight="bold" /> Back to Blog
            </Link>
            <h1 className="text-3xl font-black text-[#111827] tracking-tighter line-clamp-1">{blog.title}</h1>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <Link to="/" className="text-gray-400 hover:text-[#2B59FF] transition-colors flex items-center gap-1">
              <House size={16} /> Home
            </Link>
            <span className="text-gray-200">/</span>
            <Link to="/blogs" className="text-gray-400 hover:text-[#2B59FF] transition-colors">Articles</Link>
            <span className="text-gray-200">/</span>
            <span className="text-gray-900">Current</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">

          {/* ── LEFT: Article Content ── */}
          <article>
            {/* Cover Image */}
            {blog.image_url && (
              <div className="rounded-2xl overflow-hidden aspect-[16/9] mb-8 bg-gray-100">
                <img
                  src={getFullUrl(blog.image_url)}
                  alt={blog.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Meta */}
            <div className="flex items-center gap-5 mb-5">
              <span className="inline-block px-3 py-1 bg-orange-50 text-orange-500 text-xs font-black uppercase tracking-wider rounded-full">
                Article
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                <CalendarBlank size={13} weight="fill" className="text-[#2B59FF]" />
                {formatDate(blog.created_at)}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                <ChatCircle size={13} weight="fill" className="text-[#2B59FF]" />
                0 Comments
              </span>
            </div>

            {/* Excerpt / Intro */}
            {blog.excerpt && (
              <p className="text-lg text-gray-600 font-medium leading-relaxed border-l-4 border-[#2B59FF] pl-5 mb-8 italic">
                {blog.excerpt}
              </p>
            )}

            {/* Body Content */}
            <div className="space-y-5 pb-10 border-b border-gray-100">
              {blog.content.split('\n').map((paragraph, idx) =>
                paragraph.trim() ? (
                  <p key={idx} className="text-base text-gray-600 leading-8 font-medium">
                    {paragraph}
                  </p>
                ) : (
                  <div key={idx} className="h-2" />
                )
              )}
            </div>

            {/* Navigation */}
            <div className="pt-8 flex justify-between items-center">
              <Link
                to="/blogs"
                className="inline-flex items-center gap-2 text-sm font-black text-gray-400 hover:text-[#2B59FF] transition-colors"
              >
                <ArrowLeft weight="bold" /> All Articles
              </Link>
            </div>
          </article>

          {/* ── RIGHT: Sidebar ── */}
          <aside className="space-y-8">

            {/* Search Widget */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-base font-black text-[#111827] mb-4">Search Here</h3>
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Searching..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-[#2B59FF] outline-none transition-all"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#2B59FF] text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <MagnifyingGlass size={18} weight="bold" />
                </button>
              </form>
            </div>

            {/* Recent Posts Widget */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-base font-black text-[#111827] mb-5">Recent Posts</h3>
              <div className="space-y-4">
                {recent.length === 0 ? (
                  <p className="text-sm text-gray-400 font-medium">No other posts yet.</p>
                ) : (
                  recent.map(b => (
                    <Link
                      key={b.id}
                      to={`/blogs/${b.id}`}
                      className="flex gap-3 group items-start"
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        {b.image_url ? (
                          <img
                            src={getFullUrl(b.image_url)}
                            alt={b.title}
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
                          {b.title}
                        </p>
                        <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                          <CalendarBlank size={11} weight="fill" className="text-[#2B59FF]" />
                          {formatDate(b.created_at)}
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

export default BlogDetail;
