import logo from "./logo.png";
import "./App.css";
import pokemonData from "./pokemonapi.json";
import React, { useState } from "react";

function App() {
  const [pokemonList, setPokemonList] = useState(pokemonData.results);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPokemon, setSelectedPokemon] = useState(null);

<<<<<<< HEAD
=======

>>>>>>> 283b676 (Pokemon Website)
  const filteredPokemonList = pokemonList.filter((pokemon) =>
    pokemon.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showPokemon = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Error fetching Pokemon: ${response.statusText}`);
        return;
      }

      const data = await response.json();
      setSelectedPokemon(data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  return (
    <div className="App">
      <header>
        <img alt="react logo" className="logo" src={logo} />
<<<<<<< HEAD
        <h1>Pokédex</h1>
      </header>

      <main>
        {/* Search Box */}
=======
      </header>

      <main>
        
>>>>>>> 283b676 (Pokemon Website)
        <div className="search-container">
          <input
            className="search-box"
            type="text"
<<<<<<< HEAD
            placeholder="Search Pokémon..."
=======
            placeholder="Search..."
>>>>>>> 283b676 (Pokemon Website)
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

<<<<<<< HEAD
        {/* Selected Pokemon Details */}
=======
        
>>>>>>> 283b676 (Pokemon Website)
        {selectedPokemon && (
          <div className="pokemon-details">
            <h2>{selectedPokemon.name}</h2>
            <img
              src={selectedPokemon.sprites.front_default}
              alt={selectedPokemon.name}
            />

<<<<<<< HEAD
=======
            
>>>>>>> 283b676 (Pokemon Website)
            <div className="pokemon-types">
              {selectedPokemon.types.map((t, idx) => (
                <span key={idx} className={`type-badge type-${t.type.name}`}>
                  {t.type.name}
                </span>
              ))}
            </div>

            <p>Height: {selectedPokemon.height}</p>
            <p>Weight: {selectedPokemon.weight}</p>

<<<<<<< HEAD
=======
            
>>>>>>> 283b676 (Pokemon Website)
            {selectedPokemon.stats.map((stat, index) => (
              <div key={index}>
                <p>
                  {stat.stat.name}: {stat.base_stat}
                </p>
              </div>
            ))}
          </div>
        )}

<<<<<<< HEAD
        {/* Pokemon List */}
        <ul>
          {filteredPokemonList.map((pokemon) => (
            <li key={pokemon.name} className="pokemon-item">
              <button onClick={() => showPokemon(pokemon.url)}>
                {pokemon.name}
              </button>
=======
        
        <ul>
          {filteredPokemonList.map((pokemon) => (
            <li key={pokemon.name} className="pokemon-item">
              <a href="#" onClick={() => showPokemon(pokemon.url)}>
                {pokemon.name}
              </a>
>>>>>>> 283b676 (Pokemon Website)
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

export default App;
