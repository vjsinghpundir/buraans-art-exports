import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf/dist/jspdf.es.min.js';
import BillingPanel from './BillingPanel';

const API_URL = 'http://localhost:8000/api/items';
const BULK_ORDER_API_URL = 'http://localhost:8000/api/bulk-orders';

function AdminPanel({ admin, onLogout }) {
  const [items, setItems] = useState([]);
  const [bulkOrders, setBulkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bulkOrdersLoading, setBulkOrdersLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bulkOrdersError, setBulkOrdersError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [categoryList, setCategoryList] = useState([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catError, setCatError] = useState('');
  const [showCatManager, setShowCatManager] = useState(false);
  const [catFormName, setCatFormName] = useState('');
  const [catEditId, setCatEditId] = useState(null);
  const [catFormError, setCatFormError] = useState('');
  const [catFormSuccess, setCatFormSuccess] = useState('');
  const [formData, setFormData] = useState({ name: '', sku: '', description: '', price: '', category: 'General', stock: '100' });
  const [imageFile, setImageFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const token = sessionStorage.getItem('bae_admin_token');

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Failed to fetch items');
      const data = await res.json();
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const fetchCategories = async () => {
    try {
      setCatLoading(true);
      const res = await fetch('http://localhost:8000/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      setCategoryList(data.map(c => ({ id: c._id, name: c.name })));
      setCatError('');
    } catch (err) {
      setCatError(err.message);
    } finally {
      setCatLoading(false);
    }
  };

  const fetchBulkOrders = async () => {
    try {
      setBulkOrdersLoading(true);
      const res = await fetch(BULK_ORDER_API_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch bulk orders');
      const data = await res.json();
      setBulkOrders(Array.isArray(data) ? data : []);
      setBulkOrdersError('');
    } catch (err) {
      setBulkOrdersError(err.message);
    } finally {
      setBulkOrdersLoading(false);
    }
  };

  useEffect(() => { fetchItems(); fetchCategories(); fetchBulkOrders(); }, []);

  const normalizeItem = (item) => ({
    id: item._id,
    name: item.name || item.Item || 'Unnamed Item',
    sku: item.sku || `BAE-${item._id?.slice(-5).toUpperCase()}`,
    description: item.description || '—',
    price: item.price || 0,
    category: item.category || 'General',
    stock: item.stock !== undefined ? item.stock : 100,
    image: item.image || '',
    images: Array.isArray(item.images) ? item.images : [],
    createdAt: item.createdAt,
  });

  // Auto-generate SKU based on category and item count
  const generateSKU = async (name) => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) return '';
      const allItems = await res.json();
      const itemCount = allItems.length + 1;
      const formattedName = name
        ? name.trim().replace(/\s+/g, '-').toUpperCase()
        : 'PRODUCT';
      return `BAE-${formattedName}-${itemCount}`;
    } catch (err) {
      console.error('Error generating SKU:', err);
      return '';
    }
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    
    if (name === 'name') {
      const newSKU = await generateSKU(value);
      setFormData(prev => ({ ...prev, [name]: value, sku: newSKU }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setFormData({ name: '', sku: '', description: '', price: '', category: 'General', stock: '100' });
    setImageFile(null);
    setGalleryFiles([]);
    setFormError('');
    setFormSuccess('');
    setEditItem(null);
    setShowAddForm(false);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    const { name, sku, price, category, description, stock } = formData;
    if (!name || !sku || !price) {
      setFormError('Name, SKU, and Price are required fields.');
      return;
    }
    try {
      const isEdit = !!editItem;
      const url = isEdit ? `${API_URL}/${editItem}` : API_URL;
      const method = isEdit ? 'PUT' : 'POST';

      const formPayload = new FormData();
      formPayload.append('name', name);
      formPayload.append('sku', sku);
      formPayload.append('price', Number(price));
      formPayload.append('stock', Number(stock));
      formPayload.append('category', category);
      formPayload.append('description', description || '');

      if (imageFile) {
        formPayload.append('mainImage', imageFile);
      }

      galleryFiles.forEach(file => {
        formPayload.append('galleryImages', file);
      });

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formPayload,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Operation failed');
      if (isEdit) {
        setItems(items.map(it => it._id === editItem ? data : it));
        setFormSuccess('Product updated successfully!');
      } else {
        setItems([data, ...items]);
        setFormSuccess('Product added successfully!');
      }
      setTimeout(resetForm, 1500);
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleEdit = (rawItem) => {
    const item = normalizeItem(rawItem);
    setEditItem(item.id);
    setFormData({ name: item.name, sku: item.sku, description: item.description === '—' ? '' : item.description, price: String(item.price), category: item.category, stock: String(item.stock || 100) });
    setImageFile(null);
    setGalleryFiles([]);
    setShowAddForm(true);
    setActiveTab('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (itemId) => {
    try {
      const res = await fetch(`${API_URL}/${itemId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setItems(items.filter(it => it._id !== itemId));
      setDeleteConfirmId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleBulkOrderStatus = async (orderId, status) => {
    try {
      const res = await fetch(`${BULK_ORDER_API_URL}/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Status update failed');
      setBulkOrders(prev => prev.map(order => order._id === orderId ? data : order));
    } catch (err) {
      alert(err.message);
    }
  };

  // Stats
  const totalItems = items.length;
  const totalStock = items.reduce((sum, it) => sum + (it.stock || 0), 0);
  const totalValue = items.reduce((sum, it) => sum + ((it.price || 0) * (it.stock || 0)), 0);
  const categories = [...new Set(items.map(it => it.category || 'General'))];
  const outOfStock = items.filter(it => (it.stock || 0) === 0).length;
  const newBulkOrders = bulkOrders.filter(order => order.status === 'New').length;

  const allCategories = ['All', ...categories];
  const filteredItems = items.filter(rawItem => {
    const item = normalizeItem(rawItem);
    const q = searchQuery.toLowerCase();
    const matchSearch = item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
    const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-logo">B</div>
          <div>
            <span className="sidebar-brand-name">Buraans</span>
            <span className="sidebar-brand-sub">Admin Panel</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className={`sidebar-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            Dashboard
          </button>
          <button className={`sidebar-nav-item ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
            Products
          </button>

          <button className={`sidebar-nav-item ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => setActiveTab('billing')}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 10h16M4 14h9" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 18h12" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Billing
          </button>

          <button className={`sidebar-nav-item ${activeTab === 'bulkOrders' ? 'active' : ''}`} onClick={() => setActiveTab('bulkOrders')}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3 3L22 4"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
            Bulk Orders
          </button>
        </nav>

        <div className="sidebar-admin-info">
          <div className="sidebar-admin-avatar">{admin?.username?.[0]?.toUpperCase() || 'A'}</div>
          <div className="sidebar-admin-details">
            <span className="sidebar-admin-name">{admin?.username || 'Admin'}</span>
            <span className="sidebar-admin-role">Administrator</span>
          </div>
          <button className="sidebar-logout-btn" onClick={onLogout} title="Logout">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Top Header */}
        <div className="admin-topbar">
          <div>
            <h1 className="admin-page-title">
              {activeTab === 'dashboard' && 'Dashboard Overview'}
              {activeTab === 'products' && 'Product Management'}
              {activeTab === 'inventory' && 'Stock & Inventory'}
              {activeTab === 'billing' && 'Billing & Invoices'}
              {activeTab === 'bulkOrders' && 'Bulk Order Requests'}
            </h1>
            <p className="admin-page-subtitle">Buraans Art Exports — Admin Control Panel</p>
          </div>
          {activeTab === 'products' && (
            <>
            <button className="admin-add-btn" onClick={() => { resetForm(); setShowAddForm(true); }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
              Add Product
            </button>
            <button className="admin-add-btn" style={{ marginLeft: '8px', background: '#444', color: '#ffffff' }} onClick={() => { setShowCatManager(true); setCatFormError(''); setCatFormSuccess(''); setCatFormName(''); setCatEditId(null); }}>
              <span style={{ marginRight: '6px' }}>📁</span>
              Manage Categories
            </button>
            </>
          )}
        </div>

        {/* ───── DASHBOARD TAB ───── */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-content">
            <div className="stats-grid">
              <div className="stat-card accent-gold">
                <div className="stat-icon">📦</div>
                <div className="stat-data">
                  <span className="stat-number">{totalItems}</span>
                  <span className="stat-label">Total Products</span>
                </div>
              </div>
              <div className="stat-card accent-green">
                <div className="stat-icon">🧾</div>
                <div className="stat-data">
                  <span className="stat-number">{newBulkOrders}</span>
                  <span className="stat-label">New Bulk Orders</span>
                </div>
              </div>

            </div>

            {/* Category Breakdown */}
            <div className="dashboard-section">
              <h3 className="section-title">Category Breakdown</h3>
              <div className="category-breakdown-grid">
                {categories.map(cat => {
                  const count = items.filter(it => (it.category || 'General') === cat).length;
                  const pct = totalItems > 0 ? Math.round((count / totalItems) * 100) : 0;
                  return (
                    <div key={cat} className="cat-breakdown-card">
                      <div className="cat-breakdown-header">
                        <span className="cat-breakdown-name">{cat}</span>
                        <span className="cat-breakdown-count">{count} items</span>
                      </div>
                      <div className="cat-progress-bar-bg">
                        <div className="cat-progress-bar-fill" style={{ width: `${pct}%` }}></div>
                      </div>
                      <span className="cat-pct-label">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Products */}
            <div className="dashboard-section">
              <h3 className="section-title">Recent Products</h3>
              <div className="recent-products-list">
                {items.slice(0, 6).map(rawItem => {
                  const item = normalizeItem(rawItem);
                  return (
                    <div key={item.id} className="recent-product-row">
                      <div className="recent-product-icon">🪑</div>
                      <div className="recent-product-info">
                        <span className="recent-product-name">{item.name}</span>
                        <span className="recent-product-sku">{item.sku}</span>
                      </div>
                      <span className="recent-product-cat">{item.category}</span>
                      <span className="recent-product-price">₹{item.price.toFixed(2)}</span>

                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ───── PRODUCTS TAB ───── */}
        {activeTab === 'products' && (
          <div className="products-content">
            {/* Add / Edit Form */}
            {showAddForm && (
              <div className="admin-form-card">
                <div className="admin-form-card-header">
                  <h3>{editItem ? '✏️ Edit Product' : '➕ Add New Product'}</h3>
                  <button className="close-form-btn" onClick={resetForm}>&times;</button>
                </div>
                <form onSubmit={handleFormSubmit} className="admin-product-form">
                  {formError && <div className="admin-form-error">{formError}</div>}
                  {formSuccess && <div className="admin-form-success">{formSuccess}</div>}
                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label>Furniture Name *</label>
                      <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Wooden Dining Table" required />
                    </div>
                    <div className="admin-form-group">
                      <label>SKU Code * (Auto-generated)</label>
                      <input type="text" name="sku" value={formData.sku} readOnly className="admin-input-readonly" placeholder="e.g. BAE-DIN-001" />
                    </div>
                  </div>
                  <div className="admin-form-row">
                    <div className="admin-form-group">
                      <label>Price (₹) *</label>
                      <input type="number" name="price" value={formData.price} onChange={handleInputChange} placeholder="299.00" min="0" step="0.01" required />
                    </div>
                    <input type="hidden" name="stock" value={formData.stock} />
                    <div className="admin-form-group">
                      <label>Category</label>
                      <select name="category" value={formData.category} onChange={handleInputChange} required>
                        {(categoryList && categoryList.length > 0 ? categoryList.map(c => c.name) : ['General','Sofa','Dining','Bedroom','Chair','Storage','Stool','Table']).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="admin-form-group full-width">
                    <label>Description</label>
                    <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Material, dimensions, finish details..." rows="2" />
                  </div>
                  <div className="admin-form-group full-width">
                    <label>Main Photo (shown on home page)</label>
                    <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0] || null)} style={{ background: 'transparent', border: '1px dashed #2c2825', padding: '10px', width: '100%', color: '#a5a198' }} />
                    {imageFile && <span className="admin-file-help">Selected: {imageFile.name}</span>}
                  </div>
                  <div className="admin-form-group full-width">
                    <label>Other Photos (gallery)</label>
                    <input type="file" accept="image/*" multiple onChange={(e) => setGalleryFiles(Array.from(e.target.files || []))} style={{ background: 'transparent', border: '1px dashed #2c2825', padding: '10px', width: '100%', color: '#a5a198' }} />
                    <span className="admin-file-help">
                      {galleryFiles.length > 0 ? `${galleryFiles.length} gallery photo${galleryFiles.length > 1 ? 's' : ''} selected` : 'Select multiple photos for the product details page.'}
                    </span>
                  </div>
                  <div className="admin-form-actions">
                    <button type="button" className="admin-cancel-btn" onClick={resetForm}>Cancel</button>
                    <button type="submit" className="admin-submit-btn">{editItem ? 'Save Changes' : 'Publish Product'}</button>
                  </div>
                </form>
              </div>
            )}

            {/* Category Manager Modal */}
            {showCatManager && (
              <div className="admin-form-card">
                <div className="admin-form-card-header">
                  <h3 style={{ color: 'var(--admin-gold)' }}>📁 Manage Categories</h3>
                  <button className="close-form-btn" onClick={() => setShowCatManager(false)}>&times;</button>
                </div>
                <div style={{ padding: '16px' }}>
                  {catFormError && <div className="admin-form-error">{catFormError}</div>}
                  {catFormSuccess && <div className="admin-form-success">{catFormSuccess}</div>}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input type="text" placeholder="Category name" value={catFormName} onChange={(e) => setCatFormName(e.target.value)} />
                    <button onClick={async () => {
                      setCatFormError(''); setCatFormSuccess('');
                      const name = (catFormName || '').trim();
                      if (!name) { setCatFormError('Name required'); return; }
                      try {
                        const method = catEditId ? 'PUT' : 'POST';
                        const url = catEditId ? `http://localhost:8000/api/categories/${catEditId}` : 'http://localhost:8000/api/categories';
                        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ name }) });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.message || 'Category operation failed');
                        await fetchCategories();
                        setCatFormSuccess(catEditId ? 'Category updated' : 'Category added');
                        setCatFormName(''); setCatEditId(null);
                      } catch (err) { setCatFormError(err.message); }
                    }} className="admin-submit-btn">{catEditId ? 'Save' : 'Add'}</button>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                      {catLoading ? <div>Loading categories...</div> : catError ? <div>{catError}</div> : (
                      <div className="category-list">
                        {categoryList.length === 0 ? (
                          <div style={{ color: 'var(--admin-muted)', fontStyle: 'italic', padding: '8px 0' }}>No categories found</div>
                        ) : categoryList.map(cat => (
                          <div key={cat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderBottom: '1px solid var(--admin-border)', borderRadius: '6px', marginBottom: '4px', background: 'rgba(212,163,115,0.06)', transition: 'background 0.15s' }}>
                            <span style={{ color: 'var(--admin-gold)', fontWeight: '600', fontSize: '0.92rem', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--admin-gold)', display: 'inline-block', flexShrink: 0 }}></span>
                              {cat.name}
                            </span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button className="table-edit-btn" onClick={() => { setCatEditId(cat.id); setCatFormName(cat.name); setCatFormError(''); setCatFormSuccess(''); }}>Edit</button>
                              <button className="table-delete-btn" onClick={async () => {
                                if (!confirm(`Delete category "${cat.name}"?`)) return;
                                try {
                                  const res = await fetch(`http://localhost:8000/api/categories/${cat.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                                  const data = await res.json();
                                  if (!res.ok) throw new Error(data.message || 'Delete failed');
                                  await fetchCategories();
                                  setCatFormSuccess('Category deleted');
                                } catch (err) { setCatFormError(err.message); }
                              }}>Delete</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Search & Filter */}
            <div className="admin-controls-bar">
              <div className="admin-search-box">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <input type="text" placeholder="Search products by name, SKU, category..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <div className="admin-cat-filters">
                {allCategories.map(cat => (
                  <button key={cat} className={`admin-cat-tag ${selectedCategory === cat ? 'active' : ''}`} onClick={() => setSelectedCategory(cat)}>{cat}</button>
                ))}
              </div>
            </div>

            {/* Products Table */}
            {loading ? (
              <div className="admin-loading"><div className="admin-spinner"></div><p>Loading products...</p></div>
            ) : error ? (
              <div className="admin-error-box"><p>{error}</p><button onClick={fetchItems}>Retry</button></div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-products-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Product Name</th>
                      <th>SKU</th>
                      <th>Category</th>
                      <th>Price</th>

                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.length === 0 ? (
                      <tr><td colSpan="7" className="table-empty-row">No products found matching your search.</td></tr>
                    ) : filteredItems.map((rawItem, idx) => {
                      const item = normalizeItem(rawItem);
                      return (
                        <tr key={item.id}>
                          <td className="table-idx">{idx + 1}</td>
                          <td className="table-name" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {item.image ? (
                              <img 
                                src={`http://localhost:8000${item.image}`} 
                                alt={item.name} 
                                className="table-product-thumbnail" 
                                style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                              />
                            ) : (
                              <span className="table-product-icon">🪑</span>
                            )}
                            <span>{item.name}</span>
                          </td>
                          <td><code className="sku-code">{item.sku}</code></td>
                          <td><span className="table-cat-badge">{item.category}</span></td>
                          <td className="table-price">₹{item.price.toFixed(2)}</td>

                          <td className="table-actions">
                            <button className="table-edit-btn" onClick={() => handleEdit(rawItem)} title="Edit">
                              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            </button>
                            {deleteConfirmId === item.id ? (
                              <div className="delete-confirm-inline">
                                <span>Sure?</span>
                                <button className="confirm-yes-btn" onClick={() => handleDelete(item.id)}>Yes</button>
                                <button className="confirm-no-btn" onClick={() => setDeleteConfirmId(null)}>No</button>
                              </div>
                            ) : (
                              <button className="table-delete-btn" onClick={() => setDeleteConfirmId(item.id)} title="Delete">
                                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ───── INVENTORY TAB ───── */}
        {activeTab === 'inventory' && (
          <div className="inventory-content">
            <div className="inventory-summary-cards">
              <div className="inv-summary-card">
                <h4>Total SKUs</h4>
                <span>{totalItems}</span>
              </div>
              <div className="inv-summary-card">
                <h4>Total Units</h4>
                <span>{totalStock}</span>
              </div>
              <div className="inv-summary-card highlight">
                <h4>Inventory Value</h4>
                <span>₹{totalValue.toLocaleString()}</span>
              </div>
              <div className="inv-summary-card danger">
                <h4>Out of Stock</h4>
                <span>{outOfStock}</span>
              </div>
            </div>

            <div className="dashboard-section">
              <h3 className="section-title">Full Stock List</h3>
              <div className="admin-table-wrapper">
                <table className="admin-products-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>SKU</th>
                      <th>Category</th>
                      <th>Unit Price</th>
                      <th>Stock Qty</th>
                      <th>Total Value</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((rawItem, idx) => {
                      const item = normalizeItem(rawItem);
                      return (
                        <tr key={item.id}>
                          <td className="table-idx">{idx + 1}</td>
                          <td className="table-name" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {item.image ? (
                              <img 
                                src={`http://localhost:8000${item.image}`} 
                                alt={item.name} 
                                className="table-product-thumbnail" 
                                style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                              />
                            ) : (
                              <span className="table-product-icon">🪑</span>
                            )}
                            <span>{item.name}</span>
                          </td>
                          <td><code className="sku-code">{item.sku}</code></td>
                          <td><span className="table-cat-badge">{item.category}</span></td>
                          <td className="table-price">₹{item.price.toFixed(2)}</td>
                          <td className="table-price">{item.stock}</td>
                          <td className="table-price">₹{(item.price * item.stock).toFixed(2)}</td>
                          <td>
                            <span className={`table-stock-pill ${item.stock > 5 ? 'pill-in' : item.stock > 0 ? 'pill-low' : 'pill-out'}`}>
                              {item.stock > 5 ? 'Good' : item.stock > 0 ? 'Low' : 'Out'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ───── BULK ORDERS TAB ───── */}
        {activeTab === 'bulkOrders' && (
          <div className="products-content">
            <div className="admin-controls-bar">
              <div>
                <h3 className="section-title" style={{ marginBottom: 0, borderBottom: 0 }}>Customer Bulk Order Requests</h3>
                <p className="admin-page-subtitle">Photo, quantity, wood type, mobile number, and parcel address from the home page form.</p>
              </div>
              <button className="admin-add-btn" onClick={fetchBulkOrders}>Refresh</button>
            </div>

            {bulkOrdersLoading ? (
              <div className="admin-loading"><div className="admin-spinner"></div><p>Loading bulk orders...</p></div>
            ) : bulkOrdersError ? (
              <div className="admin-error-box"><p>{bulkOrdersError}</p><button onClick={fetchBulkOrders}>Retry</button></div>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-products-table bulk-orders-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Photo</th>
                      <th>Customer</th>
                      <th>Mobile</th>
                      <th>Qty</th>
                      <th>Wood Type</th>
                      <th>Parcel Address</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkOrders.length === 0 ? (
                      <tr><td colSpan="9" className="table-empty-row">No bulk order requests yet.</td></tr>
                    ) : bulkOrders.map((order, idx) => (
                      <tr key={order._id}>
                        <td className="table-idx">{idx + 1}</td>
                        <td>
                          {order.photo ? (
                            <a href={`http://localhost:8000${order.photo}`} target="_blank" rel="noreferrer">
                              <img
                                src={`http://localhost:8000${order.photo}`}
                                alt={order.customerName}
                                className="bulk-order-thumb"
                              />
                            </a>
                          ) : (
                            <span className="table-product-icon">🪵</span>
                          )}
                        </td>
                        <td className="table-name">{order.customerName}</td>
                        <td><a className="admin-phone-link" href={`tel:${order.mobileNo}`}>{order.mobileNo}</a></td>
                        <td className="table-price">{order.quantity}</td>
                        <td><span className="table-cat-badge">{order.woodType}</span></td>
                        <td className="bulk-address-cell">
                          <span>{order.parcelAddress}</span>
                          {order.notes && <small>{order.notes}</small>}
                        </td>
                        <td>
                          <select
                            className="bulk-status-select"
                            value={order.status || 'New'}
                            onChange={(e) => handleBulkOrderStatus(order._id, e.target.value)}
                          >
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </td>
                        <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'billing' && <BillingPanel token={token} />}
      </main>
    </div>
  );
}

export default AdminPanel;
