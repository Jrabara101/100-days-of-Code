import React from 'react';
import ContactForm from './components/ContactForm';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-white selection:bg-primary selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 p-6 flex justify-between items-center z-50 bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col leading-none">
          <span className="font-bold text-xl tracking-tighter">SA</span>
          <span className="font-bold text-xl tracking-tighter">VEE</span>
        </div>
        <div>
          <a href="#" className="text-sm font-medium hover:text-gray-300 transition-colors">
            Join / Log In
          </a>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-32 pb-20 min-h-screen flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl">
          <header className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4 tracking-tight">Contact us</h1>
            <p className="text-gray-400 text-lg">
              We'll get back to you as soon as we're ready for you!
            </p>
          </header>

          <ContactForm />
        </div>
      </main>

      {/* Footer Decoration (optional, matches dark aesthetic) */}
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </div>
  );
};

export default App;