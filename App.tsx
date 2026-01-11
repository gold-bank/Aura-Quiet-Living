/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductGrid from './components/ProductGrid';
import About from './components/About';
import Journal from './components/Journal';
import Assistant from './components/Assistant';
import Footer from './components/Footer';
import ProductDetail from './components/ProductDetail';
import JournalDetail from './components/JournalDetail';
import CartDrawer from './components/CartDrawer';
import Checkout from './components/Checkout';
import { Product, JournalArticle, ViewState } from './types';
import { PRODUCTS, JOURNAL_ARTICLES } from './constants';

function App() {
  // Helper to parse URL hash into ViewState
  const parseHash = (): ViewState => {
    const hash = window.location.hash;
    if (hash.startsWith('#product-')) {
      const id = hash.replace('#product-', '');
      const product = PRODUCTS.find(p => p.id === id);
      if (product) return { type: 'product', product };
    }
    if (hash.startsWith('#journal-')) {
      const id = parseInt(hash.replace('#journal-', ''));
      const article = JOURNAL_ARTICLES.find(a => a.id === id);
      if (article) return { type: 'journal', article };
    }
    if (hash === '#checkout') return { type: 'checkout' };
    return { type: 'home' };
  };

  const [view, setView] = useState<ViewState>(parseHash());

  // Listen for browser back/forward buttons
  React.useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      setView(parseHash());

      // Restore scroll position if it exists in the history state
      if (event.state && typeof event.state.scrollY === 'number') {
        // Use a small timeout to ensure React has finished rendering the view change
        setTimeout(() => {
          window.scrollTo({
            top: event.state.scrollY,
            behavior: 'auto' // Use 'auto' for immediate jump on back/forward
          });
        }, 50);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [view.type]);
  const [cartItems, setCartItems] = useState<Product[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Handle navigation (clicks on Navbar or Footer links)
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();

    // If we are not home, go home first
    if (view.type !== 'home') {
      setView({ type: 'home' });
      // Allow state update to render Home before scrolling
      setTimeout(() => scrollToSection(targetId), 0);
    } else {
      scrollToSection(targetId);
    }
  };

  const scrollToSection = (targetId: string) => {
    if (!targetId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const element = document.getElementById(targetId);
    if (element) {
      // Manual scroll calculation to account for fixed header
      const headerOffset = 85;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });

      try {
        // Save current scroll position before pushing new state
        window.history.replaceState({ scrollY: window.scrollY }, '');
        window.history.pushState(null, '', `#${targetId}`);
      } catch (err) {
        // Ignore SecurityError in restricted environments
      }
    }
  };

  const addToCart = (product: Product) => {
    setCartItems([...cartItems, product]);
    setIsCartOpen(true);
  };

  const removeFromCart = (index: number) => {
    const newItems = [...cartItems];
    newItems.splice(index, 1);
    setCartItems(newItems);
  };

  return (
    <div className="min-h-screen bg-[#F5F2EB] font-sans text-[#2C2A26] selection:bg-[#D6D1C7] selection:text-[#2C2A26]">
      {view.type !== 'checkout' && (
        <Navbar
          onNavClick={handleNavClick}
          cartCount={cartItems.length}
          onOpenCart={() => setIsCartOpen(true)}
        />
      )}

      <main>
        {view.type === 'home' && (
          <>
            <Hero />
            <ProductGrid onProductClick={(p) => {
              // Save current scroll position before navigating
              window.history.replaceState({ scrollY: window.scrollY }, '');
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setView({ type: 'product', product: p });
              window.history.pushState(null, '', `#product-${p.id}`);
            }} />
            <About />
            <Journal onArticleClick={(a) => {
              // Save current scroll position before navigating
              window.history.replaceState({ scrollY: window.scrollY }, '');
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setView({ type: 'journal', article: a });
              window.history.pushState(null, '', `#journal-${a.id}`);
            }} />
          </>
        )}

        {view.type === 'product' && (
          <ProductDetail
            product={view.product}
            onBack={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                setView({ type: 'home' });
                window.history.pushState(null, '', '#products');
              }
            }}
            onAddToCart={addToCart}
          />
        )}

        {view.type === 'journal' && (
          <JournalDetail
            article={view.article}
            onBack={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                setView({ type: 'home' });
                window.history.pushState(null, '', '#journal');
              }
            }}
          />
        )}

        {view.type === 'checkout' && (
          <Checkout
            items={cartItems}
            onBack={() => {
              if (window.history.length > 1) {
                window.history.back();
              } else {
                setView({ type: 'home' });
                window.history.pushState(null, '', '#');
              }
            }}
          />
        )}
      </main>

      {view.type !== 'checkout' && <Footer onLinkClick={handleNavClick} />}

      <Assistant />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onRemoveItem={removeFromCart}
        onCheckout={() => {
          setIsCartOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setView({ type: 'checkout' });
          window.history.pushState(null, '', '#checkout');
        }}
      />
    </div>
  );
}

export default App;
