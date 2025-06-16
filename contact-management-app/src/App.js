import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form states
  const [authForm, setAuthForm] = useState({
    name: '',
    email:'',
    password:''
  });
  
  const [userForm, setUserForm] = useState({
    name: '',
    mobile: '',
    email: ''
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Auto-hide error/success message after 4 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Check for existing token on app load
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    console.log('Initial saved token:', savedToken);
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
      fetchCurrentUser(savedToken);
      fetchUsers(savedToken); // Also fetch users on app load
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch current user profile
  const fetchCurrentUser = async (authToken) => {
    console.log('Fetching user profile with token:', authToken);
    try {
      const res = await axios.get("http://localhost:5000/contacts/profile", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setCurrentUser(res.data.contact);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  };

  // Authentication functions
  const register = async () => {
    setLoading(true);
    setError('');

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = emailRegex.test(authForm.email);
    const isPasswordValid = authForm.password.length >= 6;

    let errorMessage = '';
    if (!isEmailValid && !isPasswordValid) {
      errorMessage = 'Please enter a valid email address and password must be at least 6 characters long';
    } else if (!isEmailValid) {
      errorMessage = 'Please enter a valid email address';
    } else if (!isPasswordValid) {
      errorMessage = 'Password must be at least 6 characters long';
    }

    if (errorMessage) {
      setError(errorMessage);
      setLoading(false);
      return;
    }

    try {
      await axios.post("http://localhost:5000/auth/register", {
        name: authForm.name,
        email: authForm.email,
        password: authForm.password
      });
      setError('Registration successful! Please login.');
      setIsRegistering(false);
      setAuthForm({ name: '', email: '', password: '' });
    } catch (error) {
      setError(error.response?.data?.error || error.message);
    }
    setLoading(false);
  };

  const login = async () => {
    setLoading(true);
    setError('');

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = emailRegex.test(authForm.email);
    const isPasswordValid = authForm.password.length >= 6;

    let errorMessage = '';
    if (!isEmailValid && !isPasswordValid) {
      errorMessage = 'Please enter a valid email address and password must be at least 6 characters long';
    } else if (!isEmailValid) {
      errorMessage = 'Please enter a valid email address';
    } else if (!isPasswordValid) {
      errorMessage = 'Password must be at least 6 characters long';
    }

    if (errorMessage) {
      setError(errorMessage);
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/auth/login", {
        email: authForm.email,
        password: authForm.password
      });
      const newToken = res.data.token;
      console.log('New token received from login:', newToken);
      setToken(newToken);
      setIsAuthenticated(true);
      localStorage.setItem('token', newToken);
      // Store user data
      setCurrentUser(res.data.user);
      await fetchUsers(newToken);
      setAuthForm({ email: '', password: '', name: '' });
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.error || error.message);
    }
    setLoading(false);
  };

  const logout = () => {
    setToken('');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUsers([]);
    localStorage.removeItem('token');
    setAuthForm({ email: '', password: '', name: '' });
    setUserForm({ name: '', mobile: '', email: '' });
    setEditingUser(null);
    setError('');
  };

  // CRUD functions
  const fetchUsers = async (authToken = token, suppressErrors = false) => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/contacts", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setUsers(res.data.data || []);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('Authentication failed when fetching users');
      }
      // Don't set error if suppressErrors is true (called from createUser)
      if (!suppressErrors) {
        setError(error.response?.data?.error || error.message);
      }
    }
    setLoading(false);
  };

  const createUser = async () => {
    setLoading(true);
    setError('');

    // Mobile number validation
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(userForm.mobile)) {
      setError('Mobile number must be exactly 10 digits');
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userForm.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/contacts", userForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Check if the response contains a message about duplicate contact
      if (response.data.error === 'Contact with this mobile number or email already exists') {
        setError('This contact already exists in your contacts list.');
        setLoading(false);
        return;
      }
      
      setUserForm({name: '', mobile: '', email: ''});
      await fetchUsers(token, true);
      setError('Contact created successfully!');
    } catch (error) {
      console.error('Create contact error:', error);
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        setError('Network Error: Backend server is not running. Please start the backend server on port 5000.');
      } else if (error.response) {
        // Handle duplicate contact error from backend
        if (error.response.status === 409) {
          setError('This contact already exists in your contacts list.');
        } else {
          setError(error.response.data?.error || error.response.data?.message || `Server Error: ${error.response.status}`);
        }
      } else {
        setError(error.message);
      }
    }
    setLoading(false);
  };

  const updateUser = async () => {
    setLoading(true);
    setError('');

    // Mobile number validation
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(userForm.mobile)) {
      setError('Mobile number must be exactly 10 digits');
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userForm.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      await axios.put(`http://localhost:5000/contacts/${editingUser._id}`, userForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserForm({name: '', mobile: '', email: ''});
      setEditingUser(null);
      await fetchUsers();
      setError('Contact updated successfully!');
    } catch (error) {
      setError(error.response?.data?.error || error.message);
    }
    setLoading(false);
  };

  const deleteUser = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) {
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await axios.delete(`http://localhost:5000/contacts/${contactId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchUsers();
      setError('Contact deleted successfully!');
    } catch (error) {
      setError(error.response?.data?.error || error.message);
    }
    setLoading(false);
  };

  const startEdit = (contact) => {
    setEditingUser(contact);
    setUserForm({
      name: contact.name,
      mobile: contact.mobile,
      email: contact.email
    });
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setUserForm({name: '', mobile: '', email: ''});
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render authentication form
  const renderAuthForm = () => (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isRegistering ? 'Register' : 'Login'}</h2>
        
        {error && (
          <div className={`message ${error.includes('successful') ? 'success' : 'error'}`}>
            {error}
          </div>
        )}
        
        <form onSubmit={(e) => e.preventDefault()}>
          {isRegistering && (
            <input
              type="text"
              placeholder="Full Name"
              value={authForm.name}
              onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
              className="form-input"
            />
          )}
          
          <input
            type="email"
            placeholder="Email"
            value={authForm.email}
            onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
            required
            className="form-input"
          />
          
          <input
            type="password"
            placeholder="Password"
            value={authForm.password}
            onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
            required
            className="form-input"
          />
          
          <button
            onClick={isRegistering ? register : login}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Processing...' : (isRegistering ? 'Register' : 'Login')}
          </button>
        </form>
        
        <p className="auth-switch">
          {isRegistering ? 'Already have an account?' : "Don't have an account?"}
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
              setAuthForm({ name: '', email: '', password: '' });
            }}
            className="link-button"
          >
            {isRegistering ? 'Login' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );

  // Render main dashboard
  const renderDashboard = () => (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Contact Management Dashboard</h1>
          <div className="user-info">
            <span>Welcome, {currentUser?.name}</span>
            <button onClick={logout} className="btn btn-secondary">Logout</button>
          </div>
        </div>
      </header>

      {error && (
        <div className={`message ${error.includes('successful') ? 'success' : 'error'}`}>
          {error}
        </div>
      )}

      <div className="dashboard-content">
        <div className="form-section">
          <h3>{editingUser ? 'Edit Contact' : 'Add New Contact'}</h3>
          <form className="user-form" onSubmit={(e) => e.preventDefault()}>
            <input
              type="text"
              placeholder="Full Name"
              value={userForm.name}
              onChange={(e) => setUserForm({...userForm, name: e.target.value})}
              className="form-input"
              required
            />
            
            <input
              type="tel"
              placeholder="Mobile Number"
              value={userForm.mobile}
              onChange={(e) => setUserForm({...userForm, mobile: e.target.value})}
              className="form-input"
              required
            />
            
            <input
              type="email"
              placeholder="Email"
              value={userForm.email}
              onChange={(e) => setUserForm({...userForm, email: e.target.value})}
              className="form-input"
              required
            />
            
            <div className="form-buttons">
              <button
                onClick={editingUser ? updateUser : createUser}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Processing...' : (editingUser ? 'Update Contact' : 'Create Contact')}
              </button>
              
              {editingUser && (
                <button onClick={cancelEdit} className="btn btn-secondary">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="users-section">
          <div className="section-header">
            <h3>Contacts ({filteredUsers.length})</h3>
            <div className="search-container">
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button onClick={() => fetchUsers(token)} disabled={loading} className="btn btn-secondary">
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
          
          <div className="users-grid">
            {filteredUsers.map((contact) => (
              <div key={contact._id} className="user-card">
                <div className="user-info">
                  <h4>{contact.name || 'No Name'}</h4>
                  <p className='email'>{contact.email}</p>
                  <p className='mobile'>{contact.mobile}</p>
                </div>
                <div className="user-actions">
                  <button
                    onClick={() => startEdit(contact)}
                    className="btn btn-secondary"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteUser(contact._id)}
                    className="btn btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {filteredUsers.length === 0 && !loading && (
            <div className="empty-state">
              <p>{searchQuery ? 'No contacts found matching your search.' : 'No contacts found. Add your first contact above!'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="App">
      {isAuthenticated ? renderDashboard() : renderAuthForm()}
    </div>
  );
}

export default App; 