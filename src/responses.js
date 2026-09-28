const fs = require('fs');
const { json } = require('stream/consumers');

const pokedex = JSON.parse(fs.readFileSync(`${__dirname}/pokedex.json`));
const index = fs.readFileSync(`${__dirname}/../client/client.html`);
const documentation = fs.readFileSync(`${__dirname}/../client/documentation.html`);
const style = fs.readFileSync(`${__dirname}/../client/style.css`);

const respond = (request, response, status, object, type) => {
    response.writeHead(status, {'Content-Type': type} );

    if(request.acceptedType !== "HEAD" && status !== 204){
    response.write(object);
    }

    response.end();
}

const respondJSON = (request, response, status, object) => {
    const content = JSON.stringify(object);
    respond(request, response, 200, content, 'application/json');
}

const getIndex = (request, response) =>
{
    respond(request, response, 200, index, 'text/html');
}

const getStyle = (request, response) => {
    respond(request, response, 200, style, 'text/css');
}

const getDocumentation = (request, response) => {
    respond(request, response, 200, documentation, 'text/html');
}

const getPokemon = (request, response) => {
    const searchStruct = {
        id: request.query.id,
        name: request.query.name,
    }

    const pokemonObj = 
        pokedex.find(pokemon => pokemon.id === parseInt(searchStruct.id, 10)) ||
        pokedex.find(pokemon => pokemon.name === searchStruct.name);
    
    if(!pokemonObj)
    {
        responseJSON = {
            message: `Can\'t find a pokemon with id ${searchStruct.id}`,
            id: 'Not Found',
        };
        return respondJSON(request, response, 404, responseJSON);
    }
    respondJSON(request, response, 200, pokemonObj);
}

const getPokemonByFilter = (request, response) => {
    const filter = request.query.filter || {};
    console.log("FILTER: " + filter.type);
    
    const pokemon = pokedex.filter(pokemon => pokemon.type === filter.type);

    respondJSON(request, response, 200, pokemon);
}
module.exports = {
    getIndex,
    getStyle,
    getDocumentation,
    getPokemon,
    getPokemonByFilter,
}