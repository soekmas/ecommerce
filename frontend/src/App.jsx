import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import AdminProducts from './pages/AdminProducts';
import AdminVouchers from './pages/AdminVouchers';
import AdminOrders from './pages/AdminOrders';
import AdminSettings from './pages/AdminSettings';
import VerifyEmail from './pages/VerifyEmail';
import AdminCategories from './pages/AdminCategories';
import AdminUsers from './pages/AdminUsers';
import AdminSalesReport from './pages/AdminSalesReport';
import AdminBlogs from './pages/AdminBlogs';
import Profile from './pages/Profile';
import Footer from './components/Footer';
import Shop from './pages/Shop';
import Contact from './pages/Contact';
import FlashSales from './pages/FlashSales';
import BlogList from './pages/BlogList';
import BlogDetail from './pages/BlogDetail';
import ContentPage from './pages/ContentPage';

import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';

// Layout wrapper for full-width pages (blog, flash-sales, etc.)
const FullWidthLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col font-sans bg-white">
    <Navbar />
    <main className="flex-1 w-full">
      {children}
    </main>
    <Footer />
  </div>
);

// Layout wrapper for standard padded pages
const StandardLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col font-sans bg-gray-50/50">
    <Navbar />
    <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
      {children}
    </main>
    <Footer />
  </div>
);

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute adminOnly={true}><AdminLayout><AdminUsers /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/products" element={<ProtectedRoute adminOnly={true}><AdminLayout><AdminProducts /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/vouchers" element={<ProtectedRoute adminOnly={true}><AdminLayout><AdminVouchers /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute adminOnly={true}><AdminLayout><AdminOrders /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute adminOnly={true}><AdminLayout><AdminCategories /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/reports/sales" element={<ProtectedRoute adminOnly={true}><AdminLayout><AdminSalesReport /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/blogs" element={<ProtectedRoute adminOnly={true}><AdminLayout><AdminBlogs /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute adminOnly={true}><AdminLayout><AdminSettings /></AdminLayout></ProtectedRoute>} />

        {/* Full-Width User Routes (Blog, Flash Sales) */}
        <Route path="/blogs" element={<FullWidthLayout><BlogList /></FullWidthLayout>} />
        <Route path="/blogs/:id" element={<FullWidthLayout><BlogDetail /></FullWidthLayout>} />
        <Route path="/flash-sales" element={<FullWidthLayout><FlashSales /></FullWidthLayout>} />
        <Route path="/contact" element={<FullWidthLayout><Contact /></FullWidthLayout>} />
        <Route path="/shop" element={<FullWidthLayout><Shop /></FullWidthLayout>} />
        <Route path="/p/:slug" element={<FullWidthLayout><ContentPage /></FullWidthLayout>} />

        {/* Standard User Routes */}
        <Route path="*" element={
          <StandardLayout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify" element={<VerifyEmail />} />
              <Route path="/product/:slug" element={<ProductDetail />} />
              <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </StandardLayout>
        } />
      </Routes>
    </Router>
  );
}

export default App;
