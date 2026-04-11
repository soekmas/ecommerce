import React, { useState, useEffect, useRef } from 'react';
import api, { getFullUrl } from '../utils/api';
import { Plus, PencilSimple, Trash, X, FloppyDisk, ImageSquare, Warning, CheckCircle } from 'phosphor-react';

const AdminBlogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    image_url: '',
    is_active: true
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const modalRef = useRef(null);

  const showErrorAndScrollUp = (msg) => {
    setError(msg);
    requestAnimationFrame(() => {
      if (modalRef.current) {
        modalRef.current.scrollTop = 0;
      }
    });
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/blogs');
      setBlogs(res.data.data || []);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch blogs');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleFileChange = async (e) => {
    if (!e.target.files.length) return;
    const file = e.target.files[0];
    
    // 5MB Validation
    if (file.size > 5 * 1024 * 1024) {
      showErrorAndScrollUp(`File ${file.name} is too large. Max 5MB allowed.`);
      return;
    }

    const fd = new FormData();
    fd.append('images', file);

    setUploading(true);
    setError(null);
    try {
      const res = await api.post('/admin/upload', fd); // Let Axios handle boundary
      if (res.data.data && res.data.data.length > 0) {
        setFormData(prev => ({ ...prev, image_url: res.data.data[0] }));
      }
    } catch (err) {
      console.error(err);
      showErrorAndScrollUp(err.response?.data?.message || err.response?.data?.debug_error || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const openModal = (blog = null) => {
    if (blog) {
      setFormData(blog);
    } else {
      setFormData({
        id: null,
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        image_url: '',
        is_active: true
      });
    }
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (formData.id) {
        await api.put(`/admin/blogs/${formData.id}`, formData);
      } else {
        await api.post('/admin/blogs', formData);
      }
      closeModal();
      fetchBlogs();
    } catch (err) {
      console.error(err);
      showErrorAndScrollUp(err.response?.data?.message || err.response?.data?.debug_error || 'Failed to save blog. Please check your data.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await api.delete(`/admin/blogs/${id}`);
      fetchBlogs();
    } catch (err) {
      console.error(err);
      alert('Failed to delete blog');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50">
        <div>
          <h1 className="text-2xl font-black text-[#111827]">Blog Management</h1>
          <p className="text-sm text-gray-500 font-medium">Create and manage your articles.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 px-6 py-3 bg-[#111827] text-white rounded-xl text-sm font-bold hover:bg-[#2B59FF] transition-colors"
        >
          <Plus weight="bold" /> New Blog
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Image</th>
                <th className="px-6 py-4 font-bold">Title</th>
                <th className="px-6 py-4 font-bold">Slug</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="5" className="text-center py-10 font-bold text-gray-400">Loading...</td></tr>
              ) : blogs.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-10 font-bold text-gray-400">No blogs found</td></tr>
              ) : blogs.map(blog => (
                <tr key={blog.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    {blog.image_url ? (
                      <img src={getFullUrl(blog.image_url)} alt={blog.title} className="w-16 h-12 object-cover rounded-lg" />
                    ) : (
                      <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400"><ImageSquare size={20} /></div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-[#111827]">{blog.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{blog.slug}</td>
                  <td className="px-6 py-4">
                    {blog.is_active ? 
                      <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold">Active</span> :
                      <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold">Hidden</span>
                    }
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <button onClick={() => openModal(blog)} className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"><PencilSimple weight="bold" /></button>
                       <button onClick={() => handleDelete(blog.id)} className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors"><Trash weight="bold" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div ref={modalRef} className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto w-full animate-fade-in-up">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-5 flex justify-between items-center z-10">
              <h2 className="text-xl font-black text-[#111827]">{formData.id ? 'Edit Article' : 'Compose Article'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-[#111827] bg-gray-50 p-2 rounded-full"><X weight="bold" size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold animate-shake">
                    <Warning size={20} weight="fill" />
                    <span>{error}</span>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Title</label>
                <input required name="title" value={formData.title} onChange={handleChange} className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-xl text-sm font-bold focus:border-[#2B59FF] focus:bg-white outline-none transition-all" />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Slug (Optional)</label>
                <input name="slug" value={formData.slug} onChange={handleChange} placeholder="auto-generated-if-empty" className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-xl text-sm font-bold focus:border-[#2B59FF] focus:bg-white outline-none transition-all" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Short Excerpt (Intro)</label>
                <textarea name="excerpt" value={formData.excerpt} onChange={handleChange} rows="2" className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-xl text-sm font-bold focus:border-[#2B59FF] focus:bg-white outline-none transition-all" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Content (Main Body)</label>
                <textarea required name="content" value={formData.content} onChange={handleChange} rows="6" className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-xl text-sm font-bold focus:border-[#2B59FF] focus:bg-white outline-none transition-all" />
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Cover Image</label>
                 <div className="flex gap-4 items-end">
                    {formData.image_url && (
                        <img src={getFullUrl(formData.image_url)} className="w-24 h-24 object-cover rounded-xl border border-gray-100" alt="Preview"/>
                    )}
                    <div className="flex-1">
                      <input type="file" onChange={handleFileChange} className="w-full text-sm font-medium text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#111827] file:text-white hover:file:bg-[#2B59FF] transition-colors" />
                    </div>
                 </div>
                 {uploading && <p className="text-xs text-blue-500 font-bold mt-2">Uploading image...</p>}
                 {/* OR enter URL explicitly */}
                 <input name="image_url" placeholder="Or enter direct image URL" value={formData.image_url} onChange={handleChange} className="mt-2 w-full px-5 py-3 bg-gray-50 border border-transparent rounded-xl text-sm font-bold focus:border-[#2B59FF] focus:bg-white outline-none transition-all" />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="w-5 h-5 accent-[#2B59FF] rounded" />
                <span className="text-sm font-bold text-[#111827]">Publish Immediately</span>
              </label>

              <button type="submit" disabled={uploading} className="w-full py-4 bg-[#2B59FF] text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                <FloppyDisk size={20} weight="bold" /> {formData.id ? 'Save Changes' : 'Create Blog'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBlogs;
