import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';


function App() {
    return (
        <Router>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                backgroundColor: '#ffffff',
                color: '#2d3748',
                margin: 0,
                padding: 0
            }}>

                <Header />

                <main style={{ flex: 1, backgroundColor: '#ffffff' }}>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                    </Routes>
                </main>

                <Footer />

            </div>
        </Router>
    );
}

export default App;