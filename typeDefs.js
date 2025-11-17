

export const typeDefs = `#graphql
  type Query {
    getPokemons(page: Int!): [Pokemon]
    
    getPokemonById(id: Int!): Pokemon

  }

  type Pokemon {
    name: String!
    image: String
    types: [String!]!
  
  }

`;
