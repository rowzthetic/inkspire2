import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
import '../App.css'; 

export default function Navbar() {
  const { user, logOut } = useAuth();

  return (
    <header className="navbar">
      <div className="logo">INKSPIRE</div>
      <nav>
        <ul className="nav-links">
           {!user ? (
             <li><Link to="/">HOME</Link></li>
           ) : (
             <li><Link to={user.is_artist ? "/artist-dashboard" : "/dashboard"}>DASHBOARD</Link></li>
           )}
           <li><Link to="/about">ABOUT</Link></li>
           <li><Link to="/gallery">GALLERY</Link></li>
           <li><Link to="/artists">ARTISTS</Link></li>
           <li><Link to="/shop">OUR SHOP</Link></li>
           <li><Link to="/explore">EXPLORE</Link></li>
          
          
          {!user ? (
            <>
              <li>
                <Link to="/login" className="btn" style={{padding: '5px 15px', marginRight: '10px'}}>
                  LOGIN
                </Link>
              </li>
              <li>
                <Link to="/signup" style={{fontWeight: 'bold'}}>SIGNUP</Link>
              </li>
            </>
          ) : (
            <>
              <li style={{ color: '#e63946', fontWeight: 'bold' }}>
                Hello, {user.username || 'User'}
              </li>
              <li style={{ marginTop: '-20px' }}>
                <button 
                  onClick={logOut} 
                  className="btn" 
                  style={{
                    padding: '5px 15px', 
                    cursor: 'pointer', 
                    background: 'transparent', 
                    border: '1px solid currentColor'
                  }}
                >
                  LOGOUT
                </button>
              </li>
            </>
          )}

        </ul>
      </nav>
    </header>
  );
}
