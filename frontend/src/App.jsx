import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';
import Home from './pages/Home';
import Shop from './pages/Shop';
import Product from './pages/Product';
import Cart from './pages/Cart';
import Admin from './pages/Admin';
import AdminUpload from './pages/AdminUpload';

function App() {
  const [loading, setLoading] = useState(true);

  return (
    <>
      {loading && (
        <LoadingScreen onFinish={() => setLoading(false)} />
      )}
      {!loading && (
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<Product />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/upload" element={<AdminUpload />} />
          </Routes>
        </Layout>
      )}
    </>
  );
}

export default App;
