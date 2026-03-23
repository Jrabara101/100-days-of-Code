import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <main className="pb-24 pt-20">
      {/* High-Impact Hero Section */}
      <section className="relative w-full h-[618px] md:h-[751px] flex items-end overflow-hidden -mt-20">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover"
            alt="Massive electronic music festival stage with neon lights"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsGuKurSOTMu3Duzn2E6_7VLbmW6jW9QGoowqYmicLSo2SeILxjJ5CU-LxPRA3kSv96GieHDeX3rIbe88_TY7UEKnvQPSlTZmR2Wl0bQl5qS-AFmpjC-NgLYmI-1PtoL5DzhYULs_nAswrQK8pfnKpzRAULwUJUhFYpSRilbJ0o-EGq7DgM-GU4pECW5lTGGRXtN9RMT00n2GOW-NA5Iu9r2vDfAUpq6p-VBWn-sPda5ko-44esZ_GvCZbnzsFWYq88IbPOjGMPSM"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent opacity-60"></div>
        </div>
        <div className="relative z-10 px-6 md:px-12 pb-16 max-w-5xl">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-secondary text-on-secondary text-[11px] font-bold uppercase tracking-widest mb-6 gap-2">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              local_fire_department
            </span>
            Trending Now
          </div>
          <h1 className="font-headline text-5xl md:text-8xl font-extrabold tracking-tighter text-on-surface mb-4 leading-tight">
            Neon Pulse <br />
            <span className="text-primary italic">2024</span>
          </h1>
          <p className="text-on-surface-variant text-lg md:text-xl max-w-xl mb-8 font-medium">
            Experience the world's premier electronic gathering. Tickets are moving fast.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/event/neon-pulse" className="gradient-primary text-black px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:shadow-[0_0_20px_rgba(186,158,255,0.3)] transition-all active:scale-95">
              Get Tickets
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
            <button className="bg-surface-variant/40 backdrop-blur-xl text-on-surface px-8 py-4 rounded-xl font-bold border border-outline-variant/20 hover:bg-surface-variant/60 transition-all active:scale-95">
              View Details
            </button>
          </div>
        </div>
      </section>

      {/* Search and Filter Tray */}
      <section className="px-6 -mt-8 relative z-20">
        <div className="max-w-4xl mx-auto glass-morphism p-4 rounded-2xl shadow-2xl border border-outline-variant/10">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                search
              </span>
              <input
                className="w-full bg-surface-container-highest text-on-surface border-none rounded-xl pl-12 py-4 focus:ring-2 focus:ring-primary/50 placeholder:text-slate-500 font-medium"
                placeholder="Find your next vibe"
                type="text"
              />
            </div>
            <div className="flex gap-4">
              <button className="flex items-center gap-2 bg-surface-container-highest text-on-surface px-6 py-4 rounded-xl font-bold border-b-2 border-transparent focus:border-primary-dim transition-all">
                <span className="material-symbols-outlined">calendar_month</span>
                Date
              </button>
              <button className="flex items-center gap-2 bg-surface-container-highest text-on-surface px-6 py-4 rounded-xl font-bold border-b-2 border-transparent focus:border-primary-dim transition-all">
                <span className="material-symbols-outlined">tune</span>
                Filters
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mt-16 overflow-hidden">
        <div className="px-6 mb-6 flex justify-between items-end">
          <h2 className="font-headline text-3xl font-extrabold tracking-tight">Explore Categories</h2>
          <a className="text-primary font-bold text-sm flex items-center gap-1 hover:underline" href="#">
            See all
          </a>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar px-6 pb-4">
          {[
            {
              name: 'Concerts',
              img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbvCXv0kdJLEk_xvNTlPN7Acd6x0nbG3qTW95cFX2Fls3lHFBu-O36oQ7RrAfybJhCH0zev3qzpeMJOdqrekXbdZ569OcGJhS9YyMgSxAEGHTwyRahQn6Oartq6E5GTd0B5SSRsZALcJ2z5e5WBe5Wefkv6Pch0buX6gnituquoWwviJB76_QiE9nzOW7ZMQIfNRKiNk_C6eqcOWcuqQBulDJmst8rkn0p1vMFnTiIxkVpUoB9ckil2G2ccxehBqM6IRKMcQmCVWQ',
            },
            {
              name: 'Sports',
              img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBE1poAgtVUG0ccGhT3DBbl9SnLs7SVyrehY0aQMBySJPbguHXy6BuOqkSv7A3OdWRznG1Ea_ux-0igNudz0y9w2TI0pCCvan9JZvuq3M0nYGp2m0hYaDE5FxLUk7ZVykBT77iV5uk-IWSD_QiFB165yvC17546R2hb3WDbwLUmaSW_wdQ1i_J9NMwi8Rcg-Ti9OzBcTzBuBB2_i4apXC-qESyeTm5Uzx8sv48bIgyge5sXrb42J-jKp2hqVsCZ845haOAp-aHeENA',
            },
            {
              name: 'Theater',
              img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBF5ovnq8zWwPgIP2A7Qk8_FV8MGwSWzFoqNRJy3qoEuUb44SD0ELtw3jfWKbFsmtu2slcsG1I5hwJHARQe3FpnEFUrtMe3lVoaSrQ2YqzVvTyL-aBDo0sPcnFD6RQlFvx5nNaqdfyz0BU-i8JtfuHGvssA5VIP_TCxD9ByXq-tukRpHCsPaaujq42xjn7-dCDybJ7S9_gLYxmsnyp6uCVnh0pj5fvHi8j5KN4kPu19wfXf2V8sUFxaFl1n3uk4WWQqfsINeRxfEk4',
            },
            {
              name: 'Nightlife',
              img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD_c7CkwNapyUrGySbwYIpOERL2fmsodWPe3D-ZcHQ34WJaSYkmfmw-JmCQLE9dCqrwNYem1VJHVsXZB5tJpA5BjIM0NwVuXh-pVspTzivVgd7qcjyIWVIcpC61nkhTYB535OGijTW7Ul-aOS4CBd89WTmZGa_pM5Q2BbYNMgzJLKuwq5W38o68JegECDAdWyp8Xd1n-1LiY9sV4YqxXRM36fCTPTR44KIq-4PDybEN2yw1mpg141iUlhIllkHIMoH-arrm5ztgzXQ',
            },
            {
              name: 'Arts',
              img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDw2cCu6n6N5xy2_PgaesKCOy3Cf0eNpZb6R-4ANUnTJ2quF_YlnA05jr7L0dOj7L3f94FCpxintzOebWx1hno1No_YJNtgy1kU_RRrIayPT6PUB3RYr4Px-f6-kBq6mrQpA887SJgY6g7M0XeFoTh_v5_ZcGbFiWLa_EHwNL8Xp-IzrIsCSiD-Zp-N4c7H-ULU6ezYB_v1nyGUjtsMbpkMxEI39VxYxezwNpD-K8A_KSYaJtMGjnBohi_2CdNQrvOfO-lKh7vpZY8',
            },
          ].map((cat, i) => (
            <div key={i} className="flex-shrink-0 group cursor-pointer">
              <div className="w-48 h-28 rounded-2xl overflow-hidden relative mb-2">
                <img
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  alt={cat.name}
                  src={cat.img}
                />
                {i === 0 && <div className="absolute inset-0 bg-primary/20 mix-blend-overlay"></div>}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                  <span className="text-white font-bold">{cat.name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* For You Grid */}
      <section className="mt-16 px-6">
        <div className="mb-8 flex flex-col md:flex-row md:items-center gap-2">
          <h2 className="font-headline text-3xl font-extrabold tracking-tight">For You</h2>
          <p className="text-on-surface-variant text-sm font-medium opacity-70">Personalized based on your vibe</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-surface-container-low rounded-[1.5rem] overflow-hidden group hover:bg-surface-container-high transition-colors duration-300">
            <div className="h-64 relative overflow-hidden">
              <img
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                alt="DJ spinning"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDpNYudWmXUDOIFR5JgGxzg_z5d8gq5lSZbDB5GPUKuUvKMMnZN8POCeyJ9ZQfcRGwhgk5YuYkqTOiiWNgwM7Jdm3CdaSMbLZ4AfF-0iPCmq2YpKECEw85w3Sw0gCy7BA_PWBIu52KZ5jqOOaMiQZn_6iCQwtIKTnelnYfncbZI18KcyFItHcU1sakj5h0X-zI5MI1-_xx_VD6J0oFXNkaNS7pXW2TNiWKfIbygZ8lGGmc18-uyCmqBbX6KECziwyhytimkeTr1Gxg"
              />
              <div className="absolute top-4 right-4 bg-secondary text-on-secondary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest z-10">
                Selling Fast
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent"></div>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-on-surface font-headline leading-tight group-hover:text-primary transition-colors">
                  Midnight Sessions: House & Soul
                </h3>
                <button className="text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">favorite</span>
                </button>
              </div>
              <div className="flex flex-col gap-3 mb-6 text-sm text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  Friday, Oct 24 • 10:00 PM
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  The Warehouse, Brooklyn
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-extrabold text-on-surface">From $45.00</span>
                <Link to="/event/midnight-sessions" className="bg-surface-variant/60 text-primary px-4 py-2 rounded-xl font-bold text-sm hover:bg-primary hover:text-black transition-all">
                  Select
                </Link>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-low rounded-[1.5rem] overflow-hidden group hover:bg-surface-container-high transition-colors duration-300">
            <div className="h-64 relative overflow-hidden">
              <img
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                alt="Jazz performance"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2gK_KeXu9CUAr5qWRFNbOu54XHEP-adIvOCXmwM14sEQQmNXL4jEx4tjjAspkY2wIX0bE2r8WRNNf8_LpZb5AeqrK2TRbOCGjEPvjZXm1hUOL0-P89nY0V670MR1dfLtWE1Ka5dpFXpXi-RNUkF2UfOYiOO8DxwUUSZ_tcAIH-fXNoNg_E2DoMpmHJ7zco1aX5BNeNNXLpeRgNdSj8I3eeh7oysEJ3c5AW5NpXIw8GyS4M9WLOuUfO7RM-t72aU7YQ_TlY2EGHms"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent"></div>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-on-surface font-headline leading-tight group-hover:text-primary transition-colors">
                  Blue Note Jazz Residency
                </h3>
                <button className="text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">favorite</span>
                </button>
              </div>
              <div className="flex flex-col gap-3 mb-6 text-sm text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  Sunday, Oct 26 • 7:30 PM
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  Downtown Jazz Lounge
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-extrabold text-on-surface">$28.00</span>
                <Link to="/event/blue-note" className="bg-surface-variant/60 text-primary px-4 py-2 rounded-xl font-bold text-sm hover:bg-primary hover:text-black transition-all">
                  Select
                </Link>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-low rounded-[1.5rem] overflow-hidden group hover:bg-surface-container-high transition-colors duration-300">
            <div className="h-64 relative overflow-hidden">
              <img
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                alt="Indie band"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDEi22FqcCnd495ve1VfTu7BTYnZIxZIdLInYzgkaWjf2G_oAhtrFjjGmWPSXWNuaGnD8pUDOjDfhCXxgAzNTUFiKuR_yJ9iy6MZaOzKg3_mMAIS0eLzj1rMT6AEnDvSh6N4hXzqHIcNK04bVAHuA7v4Q0gBCw5OAJD4S3ARnimtlaXmOFf8tmamd_4dD76395rzYyRqxLA1EP2Ty8q_SDshIgpxoxw7EKLqitR5yOr_ZmieYkwFb9x2g2hU_J5lIRsgYOHEw5idDA"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent"></div>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-on-surface font-headline leading-tight group-hover:text-primary transition-colors">
                  Echo & The Vibe Tour
                </h3>
                <button className="text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">favorite</span>
                </button>
              </div>
              <div className="flex flex-col gap-3 mb-6 text-sm text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  Wed, Oct 29 • 8:00 PM
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  Sonic Hall, Manhattan
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-extrabold text-on-surface">From $62.00</span>
                <Link to="/event/echo" className="bg-surface-variant/60 text-primary px-4 py-2 rounded-xl font-bold text-sm hover:bg-primary hover:text-black transition-all">
                  Select
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section className="mt-20 px-6">
        <h2 className="font-headline text-3xl font-extrabold tracking-tight mb-8">Trending events in your area</h2>
        <div className="space-y-4">
          <Link to="/event/stellar" className="flex items-center gap-6 p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container-high transition-colors group cursor-pointer block">
            <span className="text-3xl font-black text-outline/30 font-headline italic min-w-[3rem]">01</span>
            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
              <img className="w-full h-full object-cover" alt="Pop concert" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCawbd-mxKWLE5VIQPf2tLgmkMOL7oGPTObq7GYjRGuYpFxcUJdJJqU2D3FKVDMNpDoyb_-pgccPyojRlZBI_jwHcoUxRFQTzMDYqJ7o_7nc3HdTLl9CWNMB9WQrj_NfEAXrg9yvFwCQUIqHHtXXjNsDydNW72iiborUZn92C16Z6UZY_ES6b66BxnqtaCZJKk6MqKoyed-GzBkosjjCPQDD1eBz0EORsXEE4Z5ixYopV20g74pTdpFTct1R52tkOkXlvckXxcRMf0" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-on-surface group-hover:text-primary transition-colors">Stellar Pop World Tour</h4>
              <p className="text-sm text-on-surface-variant">Oct 31 • Madison Square Garden</p>
            </div>
            <div className="text-right">
              <p className="font-black text-on-surface">Sold Out</p>
              <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">Resale available</p>
            </div>
          </Link>
          <Link to="/event/cityfc" className="flex items-center gap-6 p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container-high transition-colors group cursor-pointer block">
            <span className="text-3xl font-black text-outline/30 font-headline italic min-w-[3rem]">02</span>
            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
              <img className="w-full h-full object-cover" alt="Soccer match" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBs5aGuTu5uMUQQ0eKSIV_RFivyVaD4bStwvB-y1TGUGVW89kNcFsSFyrqFEyHlhr6I0y6A4ewkUqMMQJMSSag3FXz6svcyA5TiR2YV3Z_ps3g3pM-OWllKIQ-JsdQ8HqYKCLBo8lVly8oyz0Gnj0LdYSLXwhi8CdLaKFeCzPgEQYT4nBSSHLCg6wbe72ZVNwMqikWfHDHcg-8lo-YmC2QjzKmHqLmCuanCn-p-RqxI0wUiWNRhy7Ds1n2-te0Se50nBbme2pH8wF8" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-on-surface group-hover:text-primary transition-colors">City FC vs United</h4>
              <p className="text-sm text-on-surface-variant">Nov 02 • East Park Stadium</p>
            </div>
            <div className="text-right">
              <p className="font-black text-on-surface">$120+</p>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Last few seats</p>
            </div>
          </Link>
          <Link to="/event/comedy" className="flex items-center gap-6 p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container-high transition-colors group cursor-pointer block">
            <span className="text-3xl font-black text-outline/30 font-headline italic min-w-[3rem]">03</span>
            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
              <img className="w-full h-full object-cover" alt="Comedy" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDeLYJsxV7ix3WSkG_uOE6-jooDKPXCAc0hPklrgySZF8VW8PbwTDG5rmFsblL7CdmJXSlz1sGehD_1lX-ZQ-2Y2G9Tg1rIgp-BM1JEQk-pWFdbcKyaKXdO_GaTypwlEHzOdGam5s5hNcc_ywFhzBAf3-La5B72EznHGErwcAAg3g-EcZPteqPZ5gAWY48qqkcQMY6rVw-Fk2UJzHsTj5D-hMVVn9x5_HWz1Z3o0tBPQu3NSQLJmHohormoC2lT2nfm1alJHMkzlc" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-on-surface group-hover:text-primary transition-colors">Underground Comedy Night</h4>
              <p className="text-sm text-on-surface-variant">Tomorrow • Laugh Attic</p>
            </div>
            <div className="text-right">
              <p className="font-black text-on-surface">$15.00</p>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">General Entry</p>
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}
