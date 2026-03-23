import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import TicketSelection from './pages/TicketSelection';
import Checkout from './pages/Checkout';
import MyTickets from './pages/MyTickets';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/event/:id" element={<TicketSelection />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/my-tickets" element={<MyTickets />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
