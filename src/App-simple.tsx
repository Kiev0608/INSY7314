import { BrowserRouter as Router } from 'react-router-dom';

function AppSimple() {
  return (
    <Router>
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>Secure International Payments Portal</h1>
        <p>React app is working correctly!</p>
        
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f8ff', border: '1px solid #007bff', borderRadius: '5px' }}>
          <h3>✅ Status Check:</h3>
          <ul>
            <li>React is rendering</li>
            <li>React Router is working</li>
            <li>TypeScript compilation successful</li>
            <li>Development server is running</li>
          </ul>
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <h3>Navigation Test:</h3>
          <p>
            <a href="/login" style={{ marginRight: '10px', padding: '8px 16px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
              Go to Login
            </a>
            <a href="/register" style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
              Go to Register
            </a>
          </p>
        </div>
        
        <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          <p>If you can see this page, the React app is working correctly.</p>
          <p>Current time: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </Router>
  );
}

export default AppSimple;
