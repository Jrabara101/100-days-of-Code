import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { DiscoveryStage } from './components/DiscoveryStage';
import { RestaurantStorefrontView } from './components/RestaurantStorefrontView';
import { DishModifierModal } from './components/DishModifierModal';
import { MultiplayerCartDrawer } from './components/MultiplayerCartDrawer';
import { GroupRoomModal } from './components/GroupRoomModal';
import { AddressPinModal } from './components/AddressPinModal';
import { ProvenanceModal } from './components/ProvenanceModal';
import { LiveOrderTrackingCockpit } from './components/LiveOrderTrackingCockpit';
import { INITIAL_RESTAURANTS, MENU_ITEMS } from './data/restaurants';
import { CUSTOMER_DROPOFF_LOCATION } from './data/telemetry';
import { calculateCartTotals } from './services/priceCalculator';
import confetti from 'canvas-confetti';

export function App() {
  // Navigation & View
  const [activeView, setActiveView] = useState('discovery'); // 'discovery' | 'storefront' | 'tracking'
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  // Modals & Drawers
  const [selectedDishForModal, setSelectedDishForModal] = useState(null);
  const [provenanceRestaurant, setProvenanceRestaurant] = useState(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  // Discovery & Display Settings
  const [showTrueCost, setShowTrueCost] = useState(false);
  const [theme, setTheme] = useState('daylight');
  const [addressInfo, setAddressInfo] = useState(CUSTOMER_DROPOFF_LOCATION);

  // Live Toast Notification
  const [liveToast, setLiveToast] = useState(null);

  // Multiplayer Group Room
  const [groupRoom, setGroupRoom] = useState({
    code: 'GRP-4920',
    spendingCapCents: 2500, // $25.00
    lockMinutes: 15,
    participants: [
      { name: 'You (Host)', color: '#8B5CF6', status: 'Host', itemCount: 1 },
      { name: 'Maya Lin', color: '#10B981', status: 'Ready', itemCount: 1 },
      { name: 'Alex Rivera', color: '#3B82F6', status: 'Choosing...', itemCount: 0 }
    ]
  });

  // Cart State (Initialized with sample items from Osteria Mozza to demonstrate multiplayer grouping)
  const [cartItems, setCartItems] = useState([
    {
      cart_item_id: 'cart-item-host-01',
      menu_item_id: 'dish-001',
      title: 'Rigatoni alla Vodka & Crispy Prosciutto',
      image_url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281729?auto=format&fit=crop&w=800&q=80',
      base_price_cents: 2200,
      unit_computed_cents: 2450,
      quantity: 1,
      selected_modifiers: [
        { group_id: 'mod-pasta-shape', option_id: 'opt-shape-2', name: 'Gluten-Free Organic Corn & Rice Penne', price_delta_cents: 250 }
      ],
      substitution_policy: 'chef_choice',
      special_instructions: 'Extra crispy prosciutto on side',
      participant_name: 'You (Host)',
      participant_color: '#8B5CF6'
    },
    {
      cart_item_id: 'cart-item-maya-01',
      menu_item_id: 'dish-002',
      title: 'Burrata, Hot Honey & Soppressata Pizza',
      image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
      base_price_cents: 2450,
      unit_computed_cents: 2600,
      quantity: 1,
      selected_modifiers: [
        { group_id: 'mod-pizza-drizzle', option_id: 'opt-drizzle-1', name: 'Extra Mike\'s Hot Honey Side Cup', price_delta_cents: 150 }
      ],
      substitution_policy: 'refund_item',
      participant_name: 'Maya Lin',
      participant_color: '#10B981'
    }
  ]);

  const [routingTier, setRoutingTier] = useState('standard'); // 'priority_direct' | 'standard' | 'eco_saver'
  const [tipPercentage, setTipPercentage] = useState(18);

  // Active Order State (placed orders)
  const [activeOrder, setActiveOrder] = useState(null);

  // Synchronize Theme with Document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'daylight' ? 'midnight' : 'daylight'));
  };

  // Cart Calculations
  const activeRestaurant = selectedRestaurant || INITIAL_RESTAURANTS[0];
  const cartTotals = useMemo(() => {
    return calculateCartTotals(cartItems, {
      baseDeliveryFeeCents: activeRestaurant.delivery_fee_cents ?? 299,
      freeDeliveryMinCents: activeRestaurant.free_delivery_min_cents ?? 3500,
      serviceFeeBps: activeRestaurant.service_fee_bps ?? 1000,
      routingTier,
      tipPercentage
    });
  }, [cartItems, activeRestaurant, routingTier, tipPercentage]);

  // Add Item to Cart with stable unique ID
  const handleAddToCart = (newItem) => {
    const itemWithId = {
      ...newItem,
      cart_item_id: newItem.cart_item_id || `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    };
    setCartItems((prev) => [...prev, itemWithId]);
    setIsCartDrawerOpen(true);
    triggerToast(`Added ${itemWithId.title} to your bag`);
  };

  const handleUpdateQuantity = (target, newQty) => {
    setCartItems((prev) => {
      return prev.map((item, idx) => {
        if (item.cart_item_id === target || idx === target) {
          return { ...item, quantity: newQty };
        }
        return item;
      });
    });
  };

  const handleRemoveItem = (target) => {
    setCartItems((prev) =>
      prev.filter((item, idx) => item.cart_item_id !== target && idx !== target)
    );
  };

  // Toast Helper
  const triggerToast = (message) => {
    setLiveToast(message);
    setTimeout(() => {
      setLiveToast(null);
    }, 3500);
  };

  // Simulated Peer Action (Multiplayer demo)
  const handleSimulatePeerAction = () => {
    const friendItem = {
      cart_item_id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      menu_item_id: 'dish-010',
      title: 'Trio of Crispy Quesabirria Tacos',
      image_url: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=800&q=80',
      base_price_cents: 1650,
      unit_computed_cents: 1650,
      quantity: 1,
      selected_modifiers: [
        { group_id: 'mod-birria-salsa', option_id: 'opt-salsa-1', name: 'Salsa Verde', price_delta_cents: 0 }
      ],
      substitution_policy: 'chef_choice',
      participant_name: 'Maya Lin',
      participant_color: '#10B981'
    };

    setCartItems((prev) => [...prev, friendItem]);
    triggerToast('🌮 Maya Lin added 1× Trio of Crispy Quesabirria Tacos to the group cart');

    confetti({
      particleCount: 25,
      spread: 50,
      origin: { y: 0.2 }
    });
  };

  // Checkout Handler
  const handleCheckout = () => {
    const placedOrder = {
      id: 'order-9482',
      order_number: 'FD-9482',
      restaurant_id: activeRestaurant.id,
      restaurant_name: activeRestaurant.name,
      items: cartItems.map((item, idx) => ({
        id: `item-${idx}`,
        title: item.title,
        quantity: item.quantity,
        unit_price_cents: item.unit_computed_cents
      })),
      routing_tier: routingTier,
      total_charged_cents: cartTotals.totalChargedCents,
      created_at: new Date().toISOString()
    };

    setActiveOrder(placedOrder);
    setIsCartDrawerOpen(false);
    setActiveView('tracking');

    confetti({
      particleCount: 80,
      spread: 80,
      origin: { y: 0.5 }
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors">
      {/* Top Header */}
      <Header
        addressInfo={addressInfo}
        onOpenAddressModal={() => setIsAddressModalOpen(true)}
        showTrueCost={showTrueCost}
        onToggleTrueCost={() => setShowTrueCost(!showTrueCost)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        cartTotals={cartTotals}
        cartItems={cartItems}
        onOpenCartDrawer={() => setIsCartDrawerOpen(true)}
        hasActiveOrder={Boolean(activeOrder)}
        onOpenTracking={() => setActiveView('tracking')}
        allRestaurants={INITIAL_RESTAURANTS}
        allDishes={MENU_ITEMS}
        onSelectRestaurant={(restaurant) => {
          setSelectedRestaurant(restaurant);
          setActiveView(restaurant ? 'storefront' : 'discovery');
        }}
        onSelectDish={(dish) => setSelectedDishForModal(dish)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
        {activeView === 'discovery' && (
          <DiscoveryStage
            restaurants={INITIAL_RESTAURANTS}
            showTrueCost={showTrueCost}
            onSelectRestaurant={(r) => {
              setSelectedRestaurant(r);
              setActiveView('storefront');
            }}
            onOpenProvenance={(r) => setProvenanceRestaurant(r)}
            onSelectDish={(dish) => setSelectedDishForModal(dish)}
          />
        )}

        {activeView === 'storefront' && selectedRestaurant && (
          <RestaurantStorefrontView
            restaurant={selectedRestaurant}
            onBack={() => {
              setSelectedRestaurant(null);
              setActiveView('discovery');
            }}
            showTrueCost={showTrueCost}
            cartItems={cartItems}
            onSelectDish={(dish) => setSelectedDishForModal(dish)}
            onOpenGroupModal={() => setIsGroupModalOpen(true)}
            onOpenProvenance={(r) => setProvenanceRestaurant(r)}
            groupRoom={groupRoom}
          />
        )}

        {activeView === 'tracking' && (
          <LiveOrderTrackingCockpit
            order={activeOrder}
            restaurant={activeRestaurant}
            addressInfo={addressInfo}
            theme={theme}
            onBackToDiscovery={() => setActiveView('discovery')}
          />
        )}
      </main>

      {/* Live Multiplayer Peer Pop Toast */}
      {liveToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="px-4 py-3 rounded-2xl bg-purple-900/95 text-white border border-purple-400/40 shadow-2xl text-xs font-semibold flex items-center gap-2.5 backdrop-blur-md">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{liveToast}</span>
          </div>
        </div>
      )}

      {/* Dish Customization Modal */}
      <DishModifierModal
        isOpen={Boolean(selectedDishForModal)}
        onClose={() => setSelectedDishForModal(null)}
        dish={selectedDishForModal}
        restaurant={activeRestaurant}
        onAddToCart={handleAddToCart}
      />

      {/* Multiplayer Group Cart Slide-Over Drawer */}
      <MultiplayerCartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        restaurant={activeRestaurant}
        cartItems={cartItems}
        cartTotals={cartTotals}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        routingTier={routingTier}
        onChangeRoutingTier={setRoutingTier}
        tipPercentage={tipPercentage}
        onChangeTipPercentage={setTipPercentage}
        groupRoom={groupRoom}
        onOpenGroupModal={() => setIsGroupModalOpen(true)}
        onCheckoutOrder={handleCheckout}
      />

      {/* Group Room Controls Modal */}
      <GroupRoomModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        groupRoom={groupRoom}
        onUpdateGroupRoom={(updates) => setGroupRoom((prev) => ({ ...prev, ...updates }))}
        onSimulatePeerAction={handleSimulatePeerAction}
      />

      {/* Precision Drop-off Pin & Gate Vault Modal */}
      <AddressPinModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        addressInfo={addressInfo}
        onSave={(updated) => setAddressInfo(updated)}
      />

      {/* Storefront Provenance & Health Audit Modal */}
      <ProvenanceModal
        isOpen={Boolean(provenanceRestaurant)}
        onClose={() => setProvenanceRestaurant(null)}
        restaurant={provenanceRestaurant}
      />
    </div>
  );
}
