import { Outlet, useLocation } from 'react-router-dom';
import TopAppBar from './TopAppBar';
import BottomNavBar from './BottomNavBar';

export default function Layout() {
  const location = useLocation();
  const isCheckout = location.pathname.includes('/checkout');
  const isDetail = location.pathname.includes('/event');
  const isMyTickets = location.pathname.includes('/my-tickets');

  let title = '';
  let showBack = false;
  let transparentTop = false;

  if (isCheckout) {
    title = 'Checkout';
    showBack = true;
  } else if (isDetail) {
    title = 'The Digital Pulse';
    showBack = true;
    transparentTop = true;
  } else if (isMyTickets) {
    title = 'My Tickets';
    transparentTop = true;
  }

  return (
    <div className="bg-background text-on-surface min-h-screen font-body selection:bg-primary-container selection:text-on-primary-container">
      <TopAppBar title={title} showBack={showBack} transparent={transparentTop} />
      <Outlet />
      {(!isCheckout && !isDetail && !isMyTickets) && <BottomNavBar />}
    </div>
  );
}
