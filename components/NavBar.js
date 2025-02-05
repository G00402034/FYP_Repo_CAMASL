// components/Navbar.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("loggedInUser");
    setLoggedInUser(user);
  }, [router.pathname]);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleLogout = () => {
    localStorage.removeItem("loggedInUser");
    setLoggedInUser(null);
    router.push('/login');
  };

  return (
    <nav style={styles.navbar}>
      {/* Left side: Link back to Home */}
      <div>
        <Link legacyBehavior href="/">
          <a style={styles.homeLink}>CAMASL - Learn Sign language</a>
        </Link>
      </div>

      {/* Right side: Hamburger menu */}
      <div style={styles.menuContainer}>
        <button onClick={toggleMenu} style={styles.hamburgerButton} aria-label="Menu">
          <div style={styles.bar}></div>
          <div style={styles.bar}></div>
          <div style={styles.bar}></div>
        </button>
        {menuOpen && (
          <div style={styles.dropdown}>
            <ul style={styles.menuList}>
              {loggedInUser ? (
                <>
                  <li style={styles.menuItem}>
                    <Link legacyBehavior href="/scores">
                      <a style={styles.menuLink}>Scores</a>
                    </Link>
                  </li>
                  <li style={styles.menuItem}>
                    <button onClick={handleLogout} style={styles.menuButton}>Logout</button>
                  </li>
                </>
              ) : (
                <>
                  <li style={styles.menuItem}>
                    <Link legacyBehavior href="/login">
                      <a style={styles.menuLink}>Login</a>
                    </Link>
                  </li>
                  <li style={styles.menuItem}>
                    <Link legacyBehavior href="/register">
                      <a style={styles.menuLink}>Register</a>
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    backgroundColor: '#f5f5f5',
    borderBottom: '1px solid #ddd',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  homeLink: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    textDecoration: 'none',
    fontFamily: "'Arial', sans-serif",
  },
  menuContainer: {
    position: 'relative',
  },
  hamburgerButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  bar: {
    width: '25px',
    height: '3px',
    backgroundColor: '#333',
    margin: '4px 0',
  },
  dropdown: {
    position: 'absolute',
    top: '40px',
    right: 0,
    backgroundColor: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    borderRadius: '4px',
    zIndex: 1000,
  },
  menuList: {
    listStyle: 'none',
    margin: 0,
    padding: '10px 0',
  },
  menuItem: {
    padding: '8px 20px',
  },
  menuLink: {
    textDecoration: 'none',
    color: '#333',
  },
  menuButton: {
    background: 'none',
    border: 'none',
    color: '#333',
    cursor: 'pointer',
    padding: 0,
    fontSize: 'inherit',
  },
};
