

export const typeDefs = `#graphql
  type Query {
    getPokemons(page: Int!): PokemonPage
    
    getPokemonById(id: Int!): Pokemon

  }

  type Pokemon {
    name: String!
    image: String
    types: [String!]!
    id: Int!
  
  }

  type PokemonPage {
    pokemons: [Pokemon]
    maxPage: Int!
  }

`;
