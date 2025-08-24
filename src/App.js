import logo from "./logo.png";
import "./App.css";
import pokemonData from "./pokemonapi.json";
import React, { useState } from "react";

function App() {
  const [pokemonList, setPokemonList] = useState(pokemonData.results);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPokemon, setSelectedPokemon] = useState(null);


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
      </header>

      <main>
        
        <div className="search-container">
          <input
            className="search-box"
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        
        {selectedPokemon && (
          <div className="pokemon-details">
            <h2>{selectedPokemon.name}</h2>
            <img
              src={selectedPokemon.sprites.front_default}
              alt={selectedPokemon.name}
            />

            
            <div className="pokemon-types">
              {selectedPokemon.types.map((t, idx) => (
                <span key={idx} className={`type-badge type-${t.type.name}`}>
                  {t.type.name}
                </span>
              ))}
            </div>

            <p>Height: {selectedPokemon.height}</p>
            <p>Weight: {selectedPokemon.weight}</p>

            
            {selectedPokemon.stats.map((stat, index) => (
              <div key={index}>
                <p>
                  {stat.stat.name}: {stat.base_stat}
                </p>
              </div>
            ))}
          </div>
        )}

        
        <ul>
          {filteredPokemonList.map((pokemon) => (
            <li key={pokemon.name} className="pokemon-item">
              <a href="#" onClick={() => showPokemon(pokemon.url)}>
                {pokemon.name}
              </a>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

export default App;
