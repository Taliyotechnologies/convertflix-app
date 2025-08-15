import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';

// Pages
import Home from './pages/Home/Home';

// Tool Pages
import CompressImage from './pages/Tools/CompressImage/CompressImage';
import CompressVideo from './pages/Tools/CompressVideo/CompressVideo';
import CompressPDF from './pages/Tools/CompressPDF/CompressPDF';
import CompressAudio from './pages/Tools/CompressAudio/CompressAudio';
import ConvertImage from './pages/Tools/ConvertImage/ConvertImage';
import ConvertVideo from './pages/Tools/ConvertVideo/ConvertVideo';
import ConvertPDF from './pages/Tools/ConvertPDF/ConvertPDF';
import ConvertAudio from './pages/Tools/ConvertAudio/ConvertAudio';

// Company Pages
import About from './pages/Company/About/About';
import Contact from './pages/Company/Contact/Contact';
import Owner from './pages/Company/Owner/Owner';
import Terms from './pages/Company/Terms/Terms';
import Privacy from './pages/Company/Privacy/Privacy';

// Auth Pages
import Login from './pages/Auth/Login/Login';
import Signup from './pages/Auth/Signup/Signup';
import ForgotPassword from './pages/Auth/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword/ResetPassword';

// Import styles
import './styles/global.css';
import './App.css';

function App() {
  return (
    <GoogleOAuthProvider clientId="your-google-client-id">
      <ThemeProvider>
        <AuthProvider>
          <Router>
          <div className="App">
            <Navbar />
            <main>
              <Routes>
                {/* Home */}
                <Route path="/" element={<Home />} />
                
                {/* Tool Pages */}
                <Route path="/tools/compress-image" element={<CompressImage />} />
                <Route path="/tools/compress-video" element={<CompressVideo />} />
                <Route path="/tools/compress-pdf" element={<CompressPDF />} />
                <Route path="/tools/compress-audio" element={<CompressAudio />} />
                <Route path="/tools/convert-image" element={<ConvertImage />} />
                <Route path="/tools/convert-video" element={<ConvertVideo />} />
                <Route path="/tools/convert-pdf" element={<ConvertPDF />} />
                <Route path="/tools/convert-audio" element={<ConvertAudio />} />
                
                {/* Company Pages */}
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/owner" element={<Owner />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                
                {/* Auth Pages */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                
                {/* 404 - Redirect to home for now */}
                <Route path="*" element={<Home />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
