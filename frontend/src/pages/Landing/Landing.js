import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from '../../components/Auth/AuthModal';
import Button from '../../components/UI/Button';
import styles from './Landing.module.css';

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleGetStarted = () => {
    setShowAuthModal(true);
  };

  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Cleaning',
      description: 'Advanced machine learning algorithms automatically detect and suggest data quality improvements',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      icon: '⚡',
      title: 'Lightning Fast',
      description: 'Process millions of rows in seconds with our optimized data processing engine',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      icon: '🎨',
      title: 'Interactive Canvas',
      description: 'Edit your data directly with our intuitive spreadsheet-like interface',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      icon: '📊',
      title: 'Smart Analytics',
      description: 'Get deep insights into your data quality with interactive visualizations',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    },
    {
      icon: '🔒',
      title: 'Enterprise Security',
      description: 'Bank-level security with encrypted data processing and secure authentication',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    },
    {
      icon: '🚀',
      title: 'Cloud Native',
      description: 'Built for scale with modern cloud architecture and real-time collaboration',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    }
  ];

  return (
    <div className={styles.landing}>
      {/* Animated Background */}
      <div 
        className={styles.backgroundGradient}
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)`
        }}
      />
      
      {/* Floating Elements */}
      <div className={styles.floatingElements}>
        <div className={styles.floatingElement} style={{ '--delay': '0s' }}>✨</div>
        <div className={styles.floatingElement} style={{ '--delay': '2s' }}>🔮</div>
        <div className={styles.floatingElement} style={{ '--delay': '4s' }}>⚡</div>
        <div className={styles.floatingElement} style={{ '--delay': '6s' }}>🚀</div>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navContent}>
          <button 
            onClick={() => navigate('/')}
            className={styles.logo}
          >
            <span className={styles.logoIcon}>✨</span>
            <span className={styles.logoText}>SmartScrub</span>
          </button>
          <div className={styles.navActions}>
            {!isAuthenticated && (
              <Button variant="ghost" onClick={() => setShowAuthModal(true)}>
                Sign In
              </Button>
            )}
            <Button variant="primary" onClick={handleGetStarted}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>
              Transform Your Data with
              <span className={styles.gradientText}> AI-Powered Precision</span>
            </h1>
            <p className={styles.heroDescription}>
              The most advanced data cleaning platform that combines artificial intelligence 
              with intuitive design. Clean, analyze, and perfect your datasets in minutes, not hours.
            </p>
            <div className={styles.heroActions}>
              <Button 
                variant="primary" 
                size="large" 
                onClick={handleGetStarted}
                className={styles.primaryCta}
              >
                Get Started
              </Button>
            </div>
            <div className={styles.heroStats}>
              <div className={styles.stat}>
                <span className={styles.statNumber}>10M+</span>
                <span className={styles.statLabel}>Rows Processed</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>99.9%</span>
                <span className={styles.statLabel}>Accuracy Rate</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>50x</span>
                <span className={styles.statLabel}>Faster Cleaning</span>
              </div>
            </div>
          </div>
          
          <div className={styles.heroVisual}>
            <div className={styles.dataCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardDots}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className={styles.cardTitle}>data_analysis.csv</span>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.dataRow}>
                  <span className={styles.dataCell}>John Doe</span>
                  <span className={styles.dataCell}>28</span>
                  <span className={styles.dataCell}>Engineer</span>
                </div>
                <div className={styles.dataRow}>
                  <span className={styles.dataCell}>Jane Smith</span>
                  <span className={styles.dataCell}>NULL</span>
                  <span className={styles.dataCell}>Designer</span>
                </div>
                <div className={styles.dataRow}>
                  <span className={styles.dataCell}>Bob Johnson</span>
                  <span className={styles.dataCell}>45</span>
                  <span className={styles.dataCell}>Manager</span>
                </div>
              </div>
              <div className={styles.aiSuggestion}>
                <div className={styles.suggestionIcon}>🤖</div>
                <div className={styles.suggestionText}>
                  AI detected missing age value. Suggest filling with median: 36.5
                </div>
                <div className={styles.suggestionActions}>
                  <button className={styles.acceptBtn}>✓</button>
                  <button className={styles.rejectBtn}>✗</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.featuresContent}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Powerful Features for Modern Data Teams</h2>
            <p className={styles.sectionDescription}>
              Everything you need to transform messy data into clean, analysis-ready datasets
            </p>
          </div>
          
          <div className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={styles.featureCard}
                style={{ '--delay': `${index * 0.1}s` }}
              >
                <div 
                  className={styles.featureIcon}
                  style={{ background: feature.gradient }}
                >
                  {feature.icon}
                </div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Ready to Transform Your Data?</h2>
          <p className={styles.ctaDescription}>
            Join thousands of data professionals who trust SmartScrub for their data cleaning needs
          </p>
          <Button 
            variant="primary" 
            size="large" 
            onClick={handleGetStarted}
            className={styles.ctaButton}
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>
  );
};

export default Landing;