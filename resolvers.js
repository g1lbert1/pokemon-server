import {GraphQLError} from 'graphql'
import axios from 'axios'
import client from './client.js'

export const resolvers = {
  Query: {
    getPokemons: async (_, args) => {
      //make sure page is a valid number
      const pagenum = args.page
      const total = 1328
      const limit = 20
      const offset = (pagenum) * limit
      const maxPage = Math.ceil(total / limit) // 67

      if(pagenum < 0 || pagenum > maxPage || !Number.isInteger(pagenum)){
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

      const results = await Promise.all(
        data.results.map(async (pokemon) => {
          const detail = await axios.get(pokemon.url)
          return {
            name: detail.data.name,
            image: detail.data.sprites.front_default,
            types: detail.data.types.map((t) => t.type.name),
          }
        })
      )
      //store data in cache, expires in one hour
      await client.set(cacheKey, JSON.stringify(results), { EX: 3600 })
      return results
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
        throw new GraphQLError(`Pokemon not found`, {
          extensions: {code: 'NOT_FOUND'}
        })
      }
    }
  }
}
