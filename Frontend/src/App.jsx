import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8000/api/items';
const BULK_ORDER_API_URL = 'http://localhost:8000/api/bulk-orders';

function App() {
  // State variables
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Hero carousel state
  const [heroIndex, setHeroIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState('');
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showBulkOrderPopup, setShowBulkOrderPopup] = useState(false);
  const [bulkOrderData, setBulkOrderData] = useState({
    customerName: '',
    mobileNo: '',
    parcelAddress: '',
    quantity: '1',
    woodType: 'Sheesham Wood',
    notes: '',
  });
  const [bulkOrderPhoto, setBulkOrderPhoto] = useState(null);
  const [bulkOrderSuccess, setBulkOrderSuccess] = useState('');
  const [bulkOrderError, setBulkOrderError] = useState('');
  const [bulkOrderSubmitting, setBulkOrderSubmitting] = useState(false);



  // Form State for Adding Product
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    category: 'General',
    stock: '100',
  });
  const [imageFile, setImageFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  // Countdown timer state (hours, minutes, seconds)
  const [timeLeft, setTimeLeft] = useState({
    days: 4,
    hours: 1,
    minutes: 42,
    seconds: 12
  });

  // Countdown Timer Effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        } else {
          clearInterval(timer);
          return prev;
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Items from Backend
  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      if (!res.ok) {
        throw new Error('Failed to fetch items from backend');
      }
      const data = await res.json();
      setItems(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not connect to the backend server. Make sure it is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Categories from Backend
  const fetchCategories = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      const names = Array.isArray(data) ? data.map(c => c.name) : [];
      setCategoriesList(['All', ...names.filter(Boolean)]);
    } catch (err) {
      console.error('Error fetching categories:', err.message);
      // keep default list on error
    }
  };

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, []);

  // Hero carousel auto slide
  useEffect(() => {
    if (items.length === 0) return;
    const slideCount = Math.min(items.length, 6);
    const slideTimer = setInterval(() => {
      setHeroIndex(prevIndex => (prevIndex + 1) % slideCount);
    }, 3000);
    return () => clearInterval(slideTimer);
  }, [items.length]);



  // Helper: Normalize item structure (handles existing DB records)
  const normalizeItem = (item) => {
    return {
      id: item._id || item.id,
      name: item.name || item.Item || 'Unnamed Furniture',
      sku: item.sku || `BAE-FUR-${item._id?.slice(-5).toUpperCase() || 'XXX'}`,
      description: item.description || 'Premium handcrafted wooden furniture by Buraans Art Exports, built with high-quality wood and iron framework.',
      price: item.price || 149.99,
      category: item.category || 'General',
      stock: item.stock !== undefined ? item.stock : 5,
      image: item.image || '',
      images: Array.isArray(item.images) ? item.images : [],
    };
  };

  const getProductPhotos = (item) => {
    const photos = [item.image, ...(item.images || [])].filter(Boolean);
    return [...new Set(photos)];
  };

  const openProductDetails = (rawItem) => {
    const item = normalizeItem(rawItem);
    setSelectedProduct(item);
    setSelectedPhoto(getProductPhotos(item)[0] || '');
  };

  const closeProductDetails = () => {
    setSelectedProduct(null);
    setSelectedPhoto('');
  };



  // Handle Delete Product (Admin Function)
  const handleDeleteProduct = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const res = await fetch(`${API_URL}/${itemId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        throw new Error('Failed to delete item');
      }
      setItems(items.filter((item) => item._id !== itemId));
    } catch (err) {
      alert(`Error deleting item: ${err.message}`);
    }
  };

  // Auto-generate SKU based on product name and item count
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

  // Handle Form Input Changes
  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    if (name === 'name') {
      const newSKU = await generateSKU(value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        sku: newSKU
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle Form Submission (Add Product)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const { name, sku, description, price, category, stock } = formData;

    if (!name || !sku || !price || !stock) {
      setFormError('Please fill in all required fields (Name, SKU, Price, Stock)');
      return;
    }

    try {
      const formPayload = new FormData();
      formPayload.append('name', name);
      formPayload.append('sku', sku);
      formPayload.append('description', description || '');
      formPayload.append('price', Number(price));
      formPayload.append('category', category);
      formPayload.append('stock', Number(stock));

      if (imageFile) {
        formPayload.append('mainImage', imageFile);
      }

      galleryFiles.forEach(file => {
        formPayload.append('galleryImages', file);
      });

      const res = await fetch(API_URL, {
        method: 'POST',
        body: formPayload,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create product');
      }

      setItems([data, ...items]);
      setFormSuccess('Product added successfully!');

      setFormData({
        name: '',
        sku: '',
        description: '',
        price: '',
        category: 'General',
        stock: '100',
      });
      setImageFile(null);
      setGalleryFiles([]);

      setTimeout(() => {
        setShowAddForm(false);
        setFormSuccess('');
      }, 2000);

    } catch (err) {
      setFormError(err.message || 'Something went wrong');
    }
  };

  const resetBulkOrderForm = () => {
    setBulkOrderData({
      customerName: '',
      mobileNo: '',
      parcelAddress: '',
      quantity: '1',
      woodType: 'Sheesham Wood',
      notes: '',
    });
    setBulkOrderPhoto(null);
    setBulkOrderSuccess('');
    setBulkOrderError('');
    setBulkOrderSubmitting(false);
  };

  const closeBulkOrderPopup = () => {
    setShowBulkOrderPopup(false);
    resetBulkOrderForm();
  };

  const handleBulkOrderChange = (e) => {
    const { name, value } = e.target;
    setBulkOrderData(prev => ({ ...prev, [name]: value }));
  };

  const handleBulkOrderSubmit = async (e) => {
    e.preventDefault();
    setBulkOrderSuccess('');
    setBulkOrderError('');

    const { customerName, mobileNo, parcelAddress, quantity, woodType, notes } = bulkOrderData;

    if (!customerName || !mobileNo || !parcelAddress || !quantity || !woodType) {
      setBulkOrderError('Please fill customer name, mobile number, address, quantity, and wood type.');
      return;
    }

    try {
      setBulkOrderSubmitting(true);

      const payload = new FormData();
      payload.append('customerName', customerName);
      payload.append('mobileNo', mobileNo);
      payload.append('parcelAddress', parcelAddress);
      payload.append('quantity', Number(quantity));
      payload.append('woodType', woodType);
      payload.append('notes', notes || '');

      if (bulkOrderPhoto) {
        payload.append('photo', bulkOrderPhoto);
      }

      const res = await fetch(BULK_ORDER_API_URL, {
        method: 'POST',
        body: payload,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Bulk order request failed');
      }

      setBulkOrderSuccess('Bulk order request sent successfully. Our team will contact the customer soon.');
      setBulkOrderPhoto(null);
      setBulkOrderData({
        customerName: '',
        mobileNo: '',
        parcelAddress: '',
        quantity: '1',
        woodType: 'Sheesham Wood',
        notes: '',
      });
    } catch (err) {
      setBulkOrderError(err.message || 'Something went wrong');
    } finally {
      setBulkOrderSubmitting(false);
    }
  };



  // Helper formatting for countdown digits
  const formatTimeDigit = (num) => String(num).padStart(2, '0');

  // Filter Categories (populated from DB; falls back to defaults)
  const [categoriesList, setCategoriesList] = useState(['All', 'Sofa', 'Dining', 'Bedroom', 'Chair', 'Storage', 'Stool', 'Table', 'General']);

  const heroSlideCount = Math.min(items.length, 6);
  const heroProduct = heroSlideCount > 0 ? normalizeItem(items[heroIndex % heroSlideCount]) : null;

  const goToPreviousHero = () => {
    if (!heroSlideCount) return;
    setHeroIndex(prevIndex => (prevIndex - 1 + heroSlideCount) % heroSlideCount);
  };

  const goToNextHero = () => {
    if (!heroSlideCount) return;
    setHeroIndex(prevIndex => (prevIndex + 1) % heroSlideCount);
  };

  const filteredItems = items.filter((rawItem) => {
    const item = normalizeItem(rawItem);
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesCategory = true;
    if (selectedCategory !== 'All') {
      matchesCategory = item.category.toLowerCase().includes(selectedCategory.toLowerCase());
    }

    return matchesSearch && matchesCategory;
  });



  return (
    <div className="app-container">
      {/* 1. Top Utility Header */}
      <div className="top-utility-bar">
        <div className="top-bar-left">
          <span className="active-tag">Furniture</span>
          <span>Home Interiors</span>
          <button type="button" className="top-bar-action-btn" onClick={() => setShowBulkOrderPopup(true)}>Bulk Order</button>
        </div>
        <div className="top-bar-right">
          <a href="tel:+91-9314444747" className="phone-link">
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '5px' }}>
              <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328z" />
            </svg>
            +91-9929982159
          </a>
          <span>Help Center</span>
        </div>
      </div>

      {/* 2. Main Brand Navbar */}
      <header className="main-navbar">
        <div className="brand-logo-container">
          <span className="brand-title">BURAANS ART EXPORTS</span>
          <span className="brand-subtitle">Furniture... bonded with love</span>
        </div>

        <div className="center-search-bar">
          <input
            type="text"
            placeholder="Search Products, Color & More..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="search-submit-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>

        <div className="navbar-user-actions">
          <div className="nav-action-item">
            <span className="nav-action-icon">🏢</span>
            <span className="nav-action-label">Factory</span>
          </div>
          <button
            type="button"
            className="nav-action-item nav-action-button"
            onClick={() => setShowProfilePopup(true)}
          >
            <span className="nav-action-icon">👤</span>
            <span className="nav-action-label">Profile</span>
          </button>
        </div>
      </header>

      {/* 3. Sub-Navbar Categories */}
      <nav className="sub-navbar">
        <div className="categories-wrapper">
          {categoriesList.map((category) => (
            <button
              key={category}
              className={`category-nav-link ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}s
            </button>
          ))}
        </div>
      </nav>

      {/* 4. Single Product Slider */}
      <section className="hero-banners-grid">
        <div className="hero-banner-main">
          <div className="hero-banner-image-wrapper">
            <img
              src={heroProduct?.image ? `http://localhost:8000${heroProduct.image}` : 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=1200&q=80'}
              alt={heroProduct?.name || 'Premium Furniture'}
              className="hero-banner-image"
            />
          </div>
          <div className="banner-overlay-gradient"></div>
          <div className="banner-content">
            <div className="banner-topline">
              <span className="banner-badge">{heroProduct?.category.toUpperCase() || 'SUMMER SEASON SALE'}</span>
              {heroSlideCount > 1 && <span className="banner-count">{String((heroIndex % heroSlideCount) + 1).padStart(2, '0')} / {String(heroSlideCount).padStart(2, '0')}</span>}
            </div>
            <h2>{heroProduct?.name || 'Premium Dining Sets'}</h2>
            <p className="banner-price-lead">Starting From <strong>₹{heroProduct?.price?.toFixed(2) || '399.00'}</strong></p>
            <span className="banner-tnc">{heroProduct?.description || '*T&C Apply'}</span>
            <div className="banner-actions">
              {/* <a href="#catalog-section" className="banner-shop-btn">Shop Now</a> */}
              {heroProduct && (
                <button type="button" className="banner-detail-btn" onClick={() => openProductDetails(heroProduct)}>
                  View Details
                </button>
              )}
            </div>
          </div>
          {heroSlideCount > 1 && (
            <>
              <div className="hero-slider-controls">
                <button type="button" className="hero-slider-btn" onClick={goToPreviousHero} aria-label="Previous product">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button type="button" className="hero-slider-btn" onClick={goToNextHero} aria-label="Next product">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
              <div className="hero-slider-dots">
                {Array.from({ length: heroSlideCount }).map((_, idx) => (
                  <button
                    type="button"
                    key={idx}
                    className={`hero-slider-dot ${idx === heroIndex % heroSlideCount ? 'active' : ''}`}
                    onClick={() => setHeroIndex(idx)}
                    aria-label={`Show product ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>



      {/* 6. Product Catalog */}
      <main className="catalog-container" id="catalog-section">
        <div className="catalog-header">
          <h2>Trending Furniture Deals</h2>
          <p>Explore hot deals on solid wood wardrobes, bookshelves, coffee tables, and chairs</p>
        </div>

        {/* Loading and Errors */}
        {loading && (
          <div className="loading-container">
            <div className="loading-ring"></div>
            <p>Connecting to Buraans inventory database...</p>
          </div>
        )}

        {error && (
          <div className="error-card-container">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
            <button onClick={fetchItems} className="retry-connection-btn">Retry Connection</button>
          </div>
        )}

        {/* Product Cards Grid */}
        {!loading && !error && (
          <>
            {filteredItems.length === 0 ? (
              <div className="empty-catalog-state">
                <p>No products found matching your search. Browse other categories above.</p>
              </div>
            ) : (
              <div className="furniture-products-grid">
                {filteredItems.map((rawItem) => {
                  const item = normalizeItem(rawItem);
                  return (
                    <div key={item.id} className="furniture-product-card">
                      <button className="product-card-view-trigger" onClick={() => openProductDetails(rawItem)}>
                        <div className="product-image-container" style={{ position: 'relative', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1c1816', overflow: 'hidden' }}>
                          {item.image ? (
                            <img
                              src={`http://localhost:8000${item.image}`}
                              alt={item.name}
                              className="product-catalog-image"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <span className="furniture-icon-stamp" style={{ fontSize: '3rem' }}>🪑</span>
                          )}
                          <span className="product-badge-category">{item.category}</span>
                        </div>
                      </button>
                      <div className="product-details-body">
                        <h3 className="product-title-text">{item.name}</h3>
                        <p className="product-desc-snippet">{item.description}</p>

                        <div className="pricing-stock-row">
                          <span className="product-price-display">₹{item.price.toFixed(2)}</span>
                        </div>

                        <div className="sku-label-row">
                          <span>SKU: {item.sku}</span>
                        </div>

                        <div className="product-card-button-actions">
                          <button
                            className="secondary-details-btn"
                            onClick={() => openProductDetails(rawItem)}
                          >
                            Show Details
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Bulk Order Popup */}
      {showBulkOrderPopup && (
        <div className="fullscreen-modal-overlay bulk-order-overlay" onClick={closeBulkOrderPopup}>
          <div className="bulk-order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bulk-order-header">
              <div>
                <span>Custom Furniture Request</span>
                <h3>Bulk Order Form</h3>
              </div>
              <button className="close-checkout-modal-btn" onClick={closeBulkOrderPopup}>&times;</button>
            </div>

            <form className="bulk-order-form" onSubmit={handleBulkOrderSubmit}>
              {bulkOrderError && <div className="form-error-toast">{bulkOrderError}</div>}
              {bulkOrderSuccess && <div className="form-success-toast">{bulkOrderSuccess}</div>}

              <div className="bulk-form-grid">
                <div className="modal-form-group">
                  <label>Customer Name *</label>
                  <input
                    type="text"
                    name="customerName"
                    value={bulkOrderData.customerName}
                    onChange={handleBulkOrderChange}
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                <div className="modal-form-group">
                  <label>Mobile Number *</label>
                  <input
                    type="tel"
                    name="mobileNo"
                    value={bulkOrderData.mobileNo}
                    onChange={handleBulkOrderChange}
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>
                <div className="modal-form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    value={bulkOrderData.quantity}
                    onChange={handleBulkOrderChange}
                    required
                  />
                </div>
                <div className="modal-form-group">
                  <label>Wood Type *</label>
                  <select name="woodType" value={bulkOrderData.woodType} onChange={handleBulkOrderChange} required>
                    <option value="Sheesham Wood">Sheesham Wood</option>
                    <option value="Mango Wood">Mango Wood</option>
                    <option value="Acacia Wood">Acacia Wood</option>
                    <option value="Teak Wood">Teak Wood</option>
                    <option value="Pine Wood">Pine Wood</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="modal-form-group">
                <label>Parcel Address *</label>
                <textarea
                  name="parcelAddress"
                  value={bulkOrderData.parcelAddress}
                  onChange={handleBulkOrderChange}
                  placeholder="Full delivery address for parcel"
                  rows="3"
                  required
                />
              </div>

              <div className="modal-form-group">
                <label>Reference Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setBulkOrderPhoto(e.target.files[0] || null)}
                  className="bulk-photo-input"
                />
                <span className="bulk-form-help">
                  {bulkOrderPhoto ? `Selected: ${bulkOrderPhoto.name}` : 'Upload a photo of the furniture design or reference.'}
                </span>
              </div>

              <div className="modal-form-group">
                <label>Order Notes</label>
                <textarea
                  name="notes"
                  value={bulkOrderData.notes}
                  onChange={handleBulkOrderChange}
                  placeholder="Size, polish, finish, packing, or any custom requirement"
                  rows="3"
                />
              </div>

              <div className="form-action-buttons-row">
                <button type="button" className="cancel-product-upload-btn" onClick={closeBulkOrderPopup}>Cancel</button>
                <button type="submit" className="confirm-product-publish-btn" disabled={bulkOrderSubmitting}>
                  {bulkOrderSubmitting ? 'Submitting...' : 'Submit Bulk Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Resume Popup */}
      {showProfilePopup && (
        <div className="fullscreen-modal-overlay profile-resume-overlay" onClick={() => setShowProfilePopup(false)}>
          <div className="profile-resume-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="profile-resume-close"
              onClick={() => setShowProfilePopup(false)}
              aria-label="Close profile"
            >
              &times;
            </button>

            <aside className="profile-resume-identity">
              <div className="profile-resume-photo-wrap">
                <img src="/jeet singh chouhan.jpg" alt="Jeet Singh Chouhan" />
              </div>
              <div className="profile-resume-name-card">
                <h2>Jeet Singh Chouhan</h2>
                <p>Founder & Export Director</p>
              </div>
              <div className="profile-resume-contact">
                <div>
                  <span>Contact</span>
                  <a href="tel:+919929982159">+91 99299 82159</a>
                </div>
                <div>
                  <span>Email</span>
                  <a href="mailto:exports@buraans.com">exports@buraans.com</a>
                </div>
                <div>
                  <span>Factory</span>
                  <p>Salawas Station Road, Jodhpur, Rajasthan</p>
                </div>
              </div>
            </aside>

            <section className="profile-resume-main">
              <div className="profile-resume-section">
                <h3>Profile</h3>
                <p>
                  Dedicated furniture export professional leading Buraans Art Exports with a focus on handcrafted wooden furniture,
                  custom production, reliable finishing, and buyer-friendly service for domestic and international clients.
                </p>
              </div>

              <div className="profile-resume-section">
                <h3>Education</h3>
                <div className="profile-timeline-item">
                  <span>Business</span>
                  <strong>Furniture Manufacturing & Export Management</strong>
                  <p>Jodhpur, Rajasthan</p>
                </div>
                <div className="profile-timeline-item">
                  <span>Craft</span>
                  <strong>Solid Wood, Iron Framework & Custom Finishing</strong>
                  <p>Buraans Art Exports Workshop</p>
                </div>
              </div>
            </section>

            <section className="profile-resume-accent">
              <div className="profile-resume-section">
                <h3>Work Experience</h3>
                <div className="profile-work-item">
                  <strong>Founder & Export Director <span>(Present)</span></strong>
                  <p>Buraans Art Exports, Jodhpur</p>
                  <small>Oversees product selection, buyer coordination, export-ready quality checks, and custom furniture development.</small>
                </div>
                <div className="profile-work-item">
                  <strong>Furniture Business Lead</strong>
                  <p>Handcrafted Wood & Iron Furniture</p>
                  <small>Builds collections across tables, storage, seating, and bespoke furniture for homes, retailers, and bulk orders.</small>
                </div>
              </div>

              <div className="profile-resume-section">
                <h3>Skills</h3>
                <div className="profile-skill-row">
                  <div className="profile-skill-meter" style={{ '--skill': '92%' }}>
                    <span>92%</span>
                    <small>Export</small>
                  </div>
                  <div className="profile-skill-meter" style={{ '--skill': '88%' }}>
                    <span>88%</span>
                    <small>Quality</small>
                  </div>
                  <div className="profile-skill-meter" style={{ '--skill': '84%' }}>
                    <span>84%</span>
                    <small>Custom</small>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}


      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fullscreen-modal-overlay product-detail-overlay" onClick={closeProductDetails}>
          <div className="product-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="product-detail-header">
              <div>
                <span className="product-detail-category">{selectedProduct.category}</span>
                <h3>{selectedProduct.name}</h3>
              </div>
              <button className="close-checkout-modal-btn" onClick={closeProductDetails}>&times;</button>
            </div>

            <div className="product-detail-grid">
              <div className="product-detail-gallery">
                <div className="product-detail-main-photo">
                  {selectedPhoto ? (
                    <img src={`http://localhost:8000${selectedPhoto}`} alt={selectedProduct.name} />
                  ) : (
                    <span className="furniture-icon-stamp">🪑</span>
                  )}
                </div>
                {getProductPhotos(selectedProduct).length > 1 && (
                  <div className="product-detail-thumbs">
                    {getProductPhotos(selectedProduct).map(photo => (
                      <button
                        key={photo}
                        className={`product-detail-thumb ${selectedPhoto === photo ? 'active' : ''}`}
                        onClick={() => setSelectedPhoto(photo)}
                      >
                        <img src={`http://localhost:8000${photo}`} alt={selectedProduct.name} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="product-detail-info">
                <p className="product-detail-desc">{selectedProduct.description}</p>
                <div className="product-detail-meta">
                  <div>
                    <span>Price</span>
                    <strong>₹{selectedProduct.price.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span>SKU</span>
                    <strong>{selectedProduct.sku}</strong>
                  </div>
                </div>

              </div>
            </div>

            <div className="related-category-section">
              <h4>More From {selectedProduct.category}</h4>
              <div className="related-category-grid">
                {items
                  .map(normalizeItem)
                  .filter(item => item.id !== selectedProduct.id && item.category === selectedProduct.category)
                  .slice(0, 6)
                  .map(item => (
                    <button key={item.id} className="related-category-card" onClick={() => { setSelectedProduct(item); setSelectedPhoto(getProductPhotos(item)[0] || ''); }}>
                      {item.image ? (
                        <img src={`http://localhost:8000${item.image}`} alt={item.name} />
                      ) : (
                        <span className="furniture-icon-stamp">🪑</span>
                      )}
                      <span>{item.name}</span>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}



      {/* 9. Add New Product Modal Form */}
      {showAddForm && (
        <div className="fullscreen-modal-overlay">
          <div className="add-product-content-card">
            <div className="checkout-modal-header">
              <h3>Upload New Furniture Product</h3>
              <button className="close-checkout-modal-btn" onClick={() => setShowAddForm(false)}>&times;</button>
            </div>
            <form onSubmit={handleFormSubmit} className="add-furniture-product-form">
              {formError && <div className="form-error-toast">{formError}</div>}
              {formSuccess && <div className="form-success-toast">{formSuccess}</div>}

              <div className="modal-form-group">
                <label>Furniture Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Wooden Street Solid Wood Dining Table"
                  required
                />
              </div>

              <div className="modal-form-row">
                <div className="modal-form-group">
                  <label>SKU Code *</label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    placeholder="e.g. BAE-TAB-309"
                    required
                  />
                </div>
                <div className="modal-form-group">
                  <label>Category</label>
                  <select name="category" value={formData.category} onChange={handleInputChange}>
                    <option value="General">General</option>
                    <option value="Sofa">Sofa</option>
                    <option value="Dining">Dining</option>
                    <option value="Bedroom">Bedroom</option>
                    <option value="Chair">Chair</option>
                    <option value="Storage">Storage</option>
                    <option value="Stool">Stool</option>
                    <option value="Table">Table</option>
                  </select>
                </div>
              </div>

              <div className="modal-form-row">
                <div className="modal-form-group">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="e.g. 450.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <input
                  type="hidden"
                  name="stock"
                  value={formData.stock}
                />
              </div>

              <div className="modal-form-group">
                <label>Description / Specification Details</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Crafted with solid Sheesham wood in teak finish. Built for long-lasting robustness."
                  rows="3"
                ></textarea>
              </div>

              <div className="modal-form-group">
                <label>Main Photo (shown on home page)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0] || null)}
                  style={{ background: 'transparent', border: '1px dashed #2c2825', padding: '10px', width: '100%', color: '#a5a198', cursor: 'pointer' }}
                />
              </div>

              <div className="modal-form-group">
                <label>Other Photos (gallery)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setGalleryFiles(Array.from(e.target.files || []))}
                  style={{ background: 'transparent', border: '1px dashed #2c2825', padding: '10px', width: '100%', color: '#a5a198', cursor: 'pointer' }}
                />
              </div>

              <div className="form-action-buttons-row">
                <button type="button" className="cancel-product-upload-btn" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="confirm-product-publish-btn">Publish Deal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. Footer Section */}
      <footer className="website-footer">
        <div className="footer-layout-grid">
          <div className="footer-company-info">
            <h3>BURAANS ART EXPORTS</h3>
            <p>Premium export-quality furniture, custom crafted with Sheesham and mango wood bonded with high grade wrought iron structures.</p>
          </div>
          <div className="footer-quick-links-column">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#catalog-section">Shop Collection</a></li>
              {/* <li><button onClick={() => setShowAddForm(true)}>Sell Furniture</button></li> */}
              <li>Become a Dealer</li>
            </ul>
          </div>
          <div className="footer-contact-info-column">
            <h4>Contact Headquarters</h4>
            <p>📞 Call: +91-9929982159</p>
            <p>📧 Email: exports@buraans.com</p>
            <p>📍 Factory: Plot No. 12, khasra No. 297/2,
              Salawas Station Road, Jodhpur, Rajasthan, India</p>
          </div>
        </div>
        <div className="footer-copyright-row">
          <span>© 2026 Buraans Art Exports. All Rights Reserved. Bonded with love.</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
