import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import styles from '../styles/Nav.module.css';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const user = Cookies.get("loggedInUser");
    console.log('Navbar: Cookie loggedInUser:', user);
    setLoggedInUser(user);
  }, [router.pathname]);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleLogout = () => {
    Cookies.remove("loggedInUser");
    setLoggedInUser(null);
    setMenuOpen(false);
    router.push('/login');
  };

  return (
    <nav className={styles.navbar}>
      <div>
        <Link legacyBehavior href="/">
          <a className={styles.homeLink}>CAMASL - Learn Sign Language</a>
        </Link>
      </div>

      <div className={styles.menuContainer}>
        <button onClick={toggleMenu} className={styles.hamburgerButton} aria-label="Menu">
          <div className={styles.bar}></div>
          <div className={styles.bar}></div>
          <div className={styles.bar}></div>
        </button>
        {menuOpen && (
          <div className={styles.dropdown}>
            <ul className={styles.menuList}>
              {loggedInUser ? (
                <>
                  <li className={styles.menuItem}>
                    <Link legacyBehavior href="/scores">
                      <a className={styles.menuLink} onClick={() => setMenuOpen(false)}>Scores</a>
                    </Link>
                  </li>
                  <li className={styles.menuItem}>
                    <button onClick={handleLogout} className={styles.menuButton}>Logout</button>
                  </li>
                </>
              ) : (
                <>
                  <li className={styles.menuItem}>
                    <Link legacyBehavior href="/login">
                      <a className={styles.menuLink} onClick={() => setMenuOpen(false)}>Login</a>
                    </Link>
                  </li>
                  <li className={styles.menuItem}>
                    <Link legacyBehavior href="/register">
                      <a className={styles.menuLink} onClick={() => setMenuOpen(false)}>Register</a>
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