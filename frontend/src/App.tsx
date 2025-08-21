import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import {lazy, useEffect, useState, Suspense} from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { publicAPI } from './services/api';

// Lazy load components
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import VisitTracker from './components/VisitTracker/VisitTracker';
import BackToTop from './components/BackToTop/BackToTop';
const Maintenance = lazy(() => import('./pages/Maintenance/Maintenance'));

// Lazy load pages
import Home from './pages/Home/Home';
// Lazy load tool pages
const CompressImage = lazy(() => import('./pages/Tools/CompressImage/CompressImage'));
const CompressVideo = lazy(() => import('./pages/Tools/CompressVideo/CompressVideo'));
const CompressPDF = lazy(() => import('./pages/Tools/CompressPDF/CompressPDF'));
const CompressAudio = lazy(() => import('./pages/Tools/CompressAudio/CompressAudio'));
const ConvertImage = lazy(() => import('./pages/Tools/ConvertImage/ConvertImage'));
const ConvertVideo = lazy(() => import('./pages/Tools/ConvertVideo/ConvertVideo'));
const ConvertPDF = lazy(() => import('./pages/Tools/ConvertPDF/ConvertPDF'));
const ConvertAudio = lazy(() => import('./pages/Tools/ConvertAudio/ConvertAudio'));

// Lazy load company pages
const About = lazy(() => import('./pages/Company/About/About'));
const Contact = lazy(() => import('./pages/Company/Contact/Contact'));
const Owner = lazy(() => import('./pages/Company/Owner/Owner'));
const Terms = lazy(() => import('./pages/Company/Terms/Terms'));
const Privacy = lazy(() => import('./pages/Company/Privacy/Privacy'));

// Loading component
// Auth Pages
import Login from './pages/Auth/Login/Login';
import Signup from './pages/Auth/Signup/Signup';
import ForgotPassword from './pages/Auth/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword/ResetPassword';

// Import styles
import './styles/global.css';
import './App.css';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';


function App() {
  const [maintenance, setMaintenance] = useState(false);
  const [ready, setReady] = useState(true);
  const [siteName, setSiteName] = useState('ConvertFlix');

  useEffect(() => {
    let mounted = true;
    const fetchStatus = async () => {
      try {
        const res = await publicAPI.getStatus();
        if (!mounted) return;
        setMaintenance(!!res.maintenanceMode);
        if (res.siteName) setSiteName(res.siteName);
      } catch (_) {}
      finally {
        if (mounted) setReady(true);
      }
    };
    fetchStatus();
    const t = setInterval(fetchStatus, 10000);
    const onVis = () => {
      if (document.visibilityState === 'visible') fetchStatus();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      mounted = false;
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <GoogleOAuthProvider clientId="your-google-client-id">
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <ScrollToTop />
            <VisitTracker />
            <div className="App">
              {!ready ? (
                <div style={{ minHeight: '100vh' }} />
              ) : maintenance ? (
                <Suspense fallback={null}><Maintenance siteName={siteName} /></Suspense>
              ) : (
                <>
                  <Navbar />
                  <main>
                  <Suspense fallback={null}>
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
                  </Suspense>
                  </main>
                  <Footer />
                </>
              )}
            </div>
            <BackToTop />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;










