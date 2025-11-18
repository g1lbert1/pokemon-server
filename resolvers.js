import {GraphQLError} from 'graphql'
import axios from 'axios'
import client from './client.js'

export const resolvers = {
  Query: {
    getPokemons: async (_, args) => {
      //make sure page is a valid number
      const pagenum = args.page
      const limit = 20
      const offset = pagenum * limit //=== 0 when pagenum = 0

      if(pagenum < 0 || !Number.isInteger(pagenum)){
        throw new GraphQLError(`Invalid page number`, {
          extensions: {code: 'BAD_USER_INPUT'}
        })
      }
      //check cache first
      const cacheKey = `pokemon_page_${pagenum}`
      const cached = await client.get(cacheKey)
      if(cached){
        console.log(`Returning cached data for page ${pagenum}`)
        return JSON.parse(cached)
      }
      
      //query the api
   
      const { data } = await axios.get(
        `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`
      )
      //total number of pokemon that the api will return
      const total = data.count
      //max number of pages based on limit=20
      const maxPage = Math.ceil(total / limit) - 1
      // if(pagenum > maxPage){
      //   throw new GraphQLError(`Error 404: Invalid Page`, {
      //     extensions: {code: 'BAD_USER_INPUT'}
      //   })
      // }

      if(!data.results || data.results.length === 0){
        throw new GraphQLError(`Error 404: Page not Found`, {
          extensions: {code: 'NOT_FOUND'}
        })
      }

      const results = await Promise.all(
        data.results.map(async (pokemon) => {
          const detail = await axios.get(pokemon.url)
          return {
            name: detail.data.name,
            image: detail.data.sprites.front_default,
            types: detail.data.types.map((t) => t.type.name),
            //extracting id from url ex: "https://pokeapi.co/api/v2/pokemon/1/"
            id: Number(pokemon.url.split("/").filter(Boolean).pop()) 
          }
        })
      )
      //building PokemonsPage
      const response = {pokemons: results, maxPage}
      //store data in cache, expires in one hour
      await client.set(cacheKey, JSON.stringify(response), { EX: 3600 })
      return response
    },

    getPokemonById: async (_, args) => {
      const pokeid = args.id
      if(pokeid < 0 || !Number.isInteger(pokeid)){
        throw new GraphQLError(`Invalid ID`, {
          extensions: {code: 'BAD_USER_INPUT'}
        })
      }
      //check cache
      const cacheKey = `pokemon_${pokeid}`
      const cached = await client.get(cacheKey)
      if(cached){
         console.log(`Returning cached data for id ${pokeid}`)
        return JSON.parse(cached)
      } 

      try{
        const { data } = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokeid}`)
        const formatted = {
          name: data.name,
          image: data.sprites.front_default,
          types: data.types.map(t => t.type.name)
        }
        await client.set(cacheKey, JSON.stringify(formatted), { EX: 3600 })
        return formatted
      }catch(e){
        throw new GraphQLError(`Error 404: Pokemon not found`, {
          extensions: {code: 'NOT_FOUND'}
        })
      }
    }
  }
}
