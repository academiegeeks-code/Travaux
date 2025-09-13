import React, { useState, useEffect, useRef } from "react";
import "./Navbar.css"; // À adapter selon votre projet
import LogoTracker from "../LogoTracker.png";
import NEW from "../NEW.png";

const navLinks = [
  { label: "Accueil", href: "/" },
  { label: "A propos", href: "/apropos" },
  { label: "Statistiques", href: "/stats" },
  { label: "Blogs", href: "/blogs" },
  { label: "Contact", href: "/contact" },
  { label: "FAQ", href: "/faq" },
  { label: "Se connecter", href: "/login" },
];
export default function Navbar() {
  const [active, setActive] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
   const [isScrolled, setIsScrolled] = useState(false);
  const menuRef = useRef(null);
  const hamburgerRef = useRef(null);
  const navbarRef = useRef(null);


  // Gérer l'effet de défilement
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      // Active l'état scrolled après 100px de défilement
      setIsScrolled(scrollPosition > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  // Gérer le clic sur le hamburger
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Fermer le menu lorsqu'on clique sur un lien
  const handleLinkClick = (idx) => {
    setActive(idx);
    setMenuOpen(false);
  }; 

  // Fermer le menu lorsqu'on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className={`navbar ${isScrolled ? "scrolled" : ""}`} ref={navbarRef}>
      <div className="decorative-shape"></div>
      <div className="navbar-logo">
        <img className="ellipses" src={LogoTracker} alt="BCEF Tracker" />
        <img src={NEW} alt="BCEF Tracker" />
      </div>
      
      {/* Bouton hamburger pour mobile */}
      <button 
        className={`hamburger ${menuOpen ? "active" : ""}`} 
        onClick={toggleMenu}
        ref={hamburgerRef}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      
      <ul className={`navbar-menu ${menuOpen ? "active" : ""}`} ref={menuRef}>

        {navLinks.map((link, idx) => (
      <li
        key={link.label}
        className={`navbar-item ${active === idx ? "active" : ""}`}
        onMouseEnter={() => setActive(idx)}
        onMouseLeave={() => setActive(null)}
        onClick={() => handleLinkClick(idx)}
      >
        <a href={link.href}>{link.label}</a>
        <span className="underline"></span>
        {link.submenu && active === idx && (
          <ul className="submenu">
            {link.submenu.map((sub) => (
              <li key={sub.label}>
                <a href={sub.href}>{sub.label}</a>
              </li>
            ))}
          </ul>
        )}
      </li>


        ))}
      </ul>
    </nav>
  );
}