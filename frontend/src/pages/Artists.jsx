import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Search, Filter, Star, X } from 'lucide-react';
import './Artists.css';

const API_BASE_URL = 'http://localhost:8000';

// Common tattoo styles for filter
const TATTOO_STYLES = [
  'All Styles',
  'Traditional',
  'Neo-Traditional',
  'Japanese',
  'Realism',
  'Blackwork',
  'Minimalist',
  'Watercolor',
  'Geometric',
  'Tribal',
  'New School',
  'Dotwork',
  'Script',
  'Portrait',
];

const Artists = () => {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('All Styles');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('name'); // name, newest, rating

  // Fetch artists on mount
  useEffect(() => {
    const fetchArtists = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE_URL}/api/artists/`);
        if (!res.ok) {
          throw new Error('Failed to fetch artists');
        }
        const data = await res.json();
        setArtists(data);
      } catch (error) {
        console.error('Error fetching artists:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchArtists();
  }, []);

  // Get unique cities from artists
  const availableCities = useMemo(() => {
    const cities = new Set(artists.map((a) => a.city).filter(Boolean));
    return ['All Cities', ...Array.from(cities).sort()];
  }, [artists]);

  // Filter and sort artists
  const filteredArtists = useMemo(() => {
    let result = [...artists];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (artist) =>
          artist.username?.toLowerCase().includes(query) ||
          artist.bio?.toLowerCase().includes(query) ||
          artist.styles?.toLowerCase().includes(query) ||
          artist.shop_name?.toLowerCase().includes(query)
      );
    }

    // Style filter
    if (selectedStyle !== 'All Styles') {
      result = result.filter((artist) =>
        artist.styles?.toLowerCase().includes(selectedStyle.toLowerCase())
      );
    }

    // City filter
    if (selectedCity !== 'All Cities') {
      result = result.filter((artist) => artist.city === selectedCity);
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.username || '').localeCompare(b.username || '');
        case 'newest':
          return (b.id || 0) - (a.id || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [artists, searchQuery, selectedStyle, selectedCity, sortBy]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedStyle('All Styles');
    setSelectedCity('All Cities');
    setSortBy('name');
  };

  // Check if any filter is active
  const hasActiveFilters =
    searchQuery || selectedStyle !== 'All Styles' || selectedCity !== 'All Cities';

  if (loading) {
    return (
      <div className="artists-page">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Discovering amazing artists...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="artists-page">
        <div className="error-screen">
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="artists-page">
      {/* Header Section */}
      <div className="artists-header">
        <div className="artists-header-content">
          <h1>Find Your Perfect Artist</h1>
          <p>Browse talented tattoo artists and find the one who matches your vision.</p>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="search-section">
        <div className="search-container">
          {/* Search Bar */}
          <div className="search-bar-wrapper">
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Search by name, style, or studio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Filter Toggle Button */}
          <button
            className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            Filters
            {hasActiveFilters && <span className="filter-badge"></span>}
          </button>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filter-group">
              <label>Style</label>
              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                className="filter-select"
              >
                {TATTOO_STYLES.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>City</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="filter-select"
              >
                {availableCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="name">Name (A-Z)</option>
                <option value="newest">Newest First</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button className="clear-filters-btn" onClick={clearFilters}>
                Clear All
              </button>
            )}
          </div>
        )}

        {/* Results Count */}
        <div className="results-info">
          <span className="results-count">
            {filteredArtists.length} artist{filteredArtists.length !== 1 ? 's' : ''} found
          </span>
          {hasActiveFilters && (
            <span className="active-filters-text">
              {searchQuery && ` matching "${searchQuery}"`}
              {selectedStyle !== 'All Styles' && ` in ${selectedStyle}`}
              {selectedCity !== 'All Cities' && ` in ${selectedCity}`}
            </span>
          )}
        </div>
      </div>

      {/* Artists Grid */}
      <div className="artists-grid-container">
        {filteredArtists.length > 0 ? (
          <div className="artists-grid">
            {filteredArtists.map((artist) => (
              <Link
                key={artist.id}
                to={`/artists/${artist.id}`}
                className="artist-card"
              >
                {/* Image Section */}
                <div className="card-image-wrapper">
                  <img
                    src={
                      artist.profile_picture
                        ? artist.profile_picture.startsWith('http')
                          ? artist.profile_picture
                          : `${API_BASE_URL}${artist.profile_picture}`
                        : '/images/artist2.jpg'
                    }
                    alt={artist.username}
                    loading="lazy"
                  />
                  <div className="card-overlay">
                    <span className="view-profile-text">
                      View Profile <ArrowRight size={16} />
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="card-content">
                  <div className="card-header">
                    <h3>{artist.username}</h3>
                    {artist.is_verified && (
                      <span className="verified-badge" title="Verified Artist">
                        <Star size={14} fill="currentColor" />
                      </span>
                    )}
                  </div>

                  {artist.styles && (
                    <p className="artist-style">{artist.styles}</p>
                  )}

                  <div className="card-details">
                    {artist.shop_name && (
                      <span className="shop-name">{artist.shop_name}</span>
                    )}
                    {artist.city && (
                      <div className="artist-location">
                        <MapPin size={14} />
                        <span>{artist.city}</span>
                      </div>
                    )}
                  </div>

                  {artist.bio && (
                    <p className="artist-bio-preview">
                      {artist.bio.length > 100
                        ? `${artist.bio.substring(0, 100)}...`
                        : artist.bio}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="no-results">
            <div className="no-results-icon">
              <Search size={48} />
            </div>
            <h3>No artists found</h3>
            <p>Try adjusting your search or filters to find what you're looking for.</p>
            {hasActiveFilters && (
              <button className="clear-filters-btn" onClick={clearFilters}>
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Artists;
