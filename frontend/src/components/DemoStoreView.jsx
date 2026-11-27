import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  ShoppingCart, 
  Heart, 
  Search, 
  Star, 
  Check, 
  Sparkles, 
  RefreshCw, 
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Truck,
  RotateCcw
} from 'lucide-react';
import { api } from '../api';

const DEMO_PRODUCTS = [
  {
    id: 'headphones',
    title: 'Aura Pro Noise-Cancelling Headphones',
    price: 199.99,
    rating: 4.8,
    reviews: 320,
    category: 'Audio',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
    description: 'Immersive sound with custom 40mm acoustic drivers and active noise cancellation.',
  },
  {
    id: 'smartwatch',
    title: 'Titan Chrono Smartwatch & Fitness Tracker',
    price: 249.50,
    rating: 4.9,
    reviews: 412,
    category: 'Wearables',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80',
    description: 'All-day battery life, ECG heart tracking, and sapphire crystal AMOLED display.',
  },
  {
    id: 'laptop-stand',
    title: 'ErgoLift Aluminum Laptop & Tablet Stand',
    price: 49.00,
    rating: 4.7,
    reviews: 184,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80',
    description: 'Precision CNC-machined aerospace aluminum with 360-degree adjustable tilt angle.',
  },
  {
    id: 'keyboard',
    title: 'CyberKeys Custom Mechanical Keyboard',
    price: 139.99,
    rating: 4.9,
    reviews: 580,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80',
    description: 'Hot-swappable tactile switches, double-shot PBT keycaps, and customizable RGB.',
  }
];

export default function DemoStoreView({ onNavigateToSessions, onNavigateToHeatmap }) {
  const [currentSessionId, setCurrentSessionId] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [wishlist, setWishlist] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [notification, setNotification] = useState(null);
  const [sessionEventsCount, setSessionEventsCount] = useState(0);
  const [currentSubPage, setCurrentSubPage] = useState('store-home');

  // Load tracker and session on mount
  useEffect(() => {
    // Check if tracker script is available
    if (window.CausalTracker) {
      setCurrentSessionId(window.CausalTracker.getSessionId());
      window.CausalTracker.trackPageView(window.location.origin + '/demo/' + currentSubPage);
      setSessionEventsCount((prev) => prev + 1);
    } else {
      // Load dynamically if not already injected
      const script = document.createElement('script');
      script.src = '/tracker.js';
      script.onload = () => {
        if (window.CausalTracker) {
          setCurrentSessionId(window.CausalTracker.getSessionId());
          window.CausalTracker.trackPageView(window.location.origin + '/demo/' + currentSubPage);
          setSessionEventsCount((prev) => prev + 1);
        }
      };
      document.head.appendChild(script);
    }
  }, [currentSubPage]);

  // Handler for custom actions and button clicks
  const handleInteraction = (eventType, targetText, details = {}) => {
    setSessionEventsCount((prev) => prev + 1);
    showNotice(`Tracked: ${eventType.toUpperCase()} on "${targetText}"`);
  };

  const showNotice = (text) => {
    setNotification(text);
    setTimeout(() => setNotification(null), 2500);
  };

  const handleAddToCart = (product, e) => {
    setCartCount((c) => c + 1);
    handleInteraction('click', `Add to Cart (${product.title})`);
  };

  const handleBuyNow = (product, e) => {
    handleInteraction('click', `Buy Now (${product.title})`);
    showNotice(`Instant checkout initiated for ${product.title}!`);
  };

  const handleToggleWishlist = (productId) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
    handleInteraction('click', 'Wishlist Toggle');
  };

  const handleResetSession = () => {
    if (window.CausalTracker && window.CausalTracker.resetSession) {
      const newId = window.CausalTracker.resetSession();
      setCurrentSessionId(newId);
      setSessionEventsCount(1);
      window.CausalTracker.trackPageView(window.location.origin + '/demo/' + currentSubPage);
      showNotice('New session started! ID: ' + newId.slice(0, 16) + '...');
    }
  };

  const filteredProducts = DEMO_PRODUCTS.filter((prod) => {
    const matchesCategory = selectedCategory === 'All' || prod.category === selectedCategory;
    const matchesSearch = prod.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Floating Session Tracker Banner */}
      <div className="bg-gradient-to-r from-sky-900 to-indigo-900 text-white p-4 rounded-xl shadow-lg border border-sky-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm">Live User Tracking Active</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                tracker.js Connected
              </span>
            </div>
            <p className="text-xs text-sky-200 mt-0.5 font-mono">
              Session ID: {currentSessionId || 'Initializing...'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs text-sky-200 bg-sky-800/60 px-3 py-1.5 rounded-lg border border-sky-700">
            {sessionEventsCount} Events Logged
          </span>

          <button
            onClick={handleResetSession}
            id="reset-session-btn"
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-sky-700/80 hover:bg-sky-600 text-white rounded-lg text-xs font-semibold transition-colors"
            title="Start a new visitor session"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Simulate New Visitor</span>
          </button>

          <button
            onClick={onNavigateToSessions}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white text-sky-900 hover:bg-sky-50 rounded-lg text-xs font-bold transition-all shadow-sm"
          >
            <span>Inspect in Sessions</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Mock Store Shell */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Store Navigation Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-lg">
              C
            </div>
            <div>
              <span className="font-bold text-slate-800 text-base">CausalStore Demo</span>
              <span className="ml-2 text-xs text-slate-500">Interactive Tracking Playground</span>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="store-search-input"
              type="text"
              placeholder="Search gadgets, audio, desk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Cart & Wishlist Counters */}
          <div className="flex items-center space-x-3">
            <button
              id="wishlist-btn"
              onClick={() => handleInteraction('click', 'Wishlist Button')}
              className="relative p-2 text-slate-600 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Heart className="h-5 w-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>

            <button
              id="cart-btn"
              onClick={() => handleInteraction('click', 'Shopping Cart')}
              className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Cart ({cartCount})</span>
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="px-6 py-3 border-b border-slate-100 bg-white flex items-center justify-between overflow-x-auto text-xs">
          <div className="flex items-center space-x-2">
            {['All', 'Audio', 'Wearables', 'Accessories'].map((cat) => (
              <button
                key={cat}
                id={`cat-${cat.toLowerCase()}`}
                onClick={() => {
                  setSelectedCategory(cat);
                  handleInteraction('click', `Category: ${cat}`);
                }}
                className={`px-3 py-1 rounded-full font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-4 text-slate-500 hidden md:flex">
            <span className="flex items-center space-x-1"><Truck className="h-3.5 w-3.5" /> <span>Free Shipping</span></span>
            <span className="flex items-center space-x-1"><ShieldCheck className="h-3.5 w-3.5" /> <span>2 Year Warranty</span></span>
            <span className="flex items-center space-x-1"><RotateCcw className="h-3.5 w-3.5" /> <span>30-Day Returns</span></span>
          </div>
        </div>

        {/* Product Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col group"
              >
                {/* Product Image */}
                <div className="relative aspect-square overflow-hidden bg-slate-100">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    id={`fav-${product.id}`}
                    onClick={() => handleToggleWishlist(product.id)}
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full text-slate-500 hover:text-rose-500 shadow-sm transition-colors"
                  >
                    <Heart
                      className={`h-4 w-4 ${wishlist.includes(product.id) ? 'fill-rose-500 text-rose-500' : ''}`}
                    />
                  </button>
                  <span className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                    {product.category}
                  </span>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center space-x-1 text-amber-500 text-xs">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span className="font-bold text-slate-800">{product.rating}</span>
                      <span className="text-slate-400">({product.reviews})</span>
                    </div>

                    <h3 className="font-semibold text-slate-900 text-sm mt-1 line-clamp-1">
                      {product.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                  {/* Pricing and Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-bold text-slate-900">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="text-[11px] text-emerald-600 font-semibold">In Stock</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        id={`add-cart-${product.id}`}
                        onClick={(e) => handleAddToCart(product, e)}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center space-x-1"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        <span>Add to Cart</span>
                      </button>

                      <button
                        id={`buy-now-${product.id}`}
                        onClick={(e) => handleBuyNow(product, e)}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center justify-center space-x-1"
                      >
                        <span>Buy Now</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Tracking Feedback Toast */}
        {notification && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-2 animate-in slide-in-from-bottom-3 duration-200">
            <Check className="h-4 w-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
        )}
      </div>
    </div>
  );
}
