const fs = require('fs');

const pokedex = JSON.parse(fs.readFileSync(`${__dirname}/pokedex.json`));
const typeList = ['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
    'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon'];

const index = fs.readFileSync(`${__dirname}/../client/client.html`);
const documentation = fs.readFileSync(`${__dirname}/../client/documentation.html`);
const style = fs.readFileSync(`${__dirname}/../client/style.css`);

const respond = (request, response, status, object, type) => {
    response.writeHead(status, { 'Content-Type': type });

    if (request.acceptedType !== "HEAD" && status !== 204) {
        response.write(object);
    }

    response.end();
}

const respondJSON = (request, response, status, object) => {
    const content = JSON.stringify(object);
    respond(request, response, status, content, 'application/json');
}

const getIndex = (request, response) => {
    respond(request, response, 200, index, 'text/html');
}

const getStyle = (request, response) => {
    respond(request, response, 200, style, 'text/css');
}

const getDocumentation = (request, response) => {
    respond(request, response, 200, documentation, 'text/html');
}

const getPokemonTypes = (request, response) => {
    respondJSON(request, response, 200, typeList);
}

const getAllPokemon = (request, response) => {
    respondJSON(request, response, 200, pokedex);
}

const getPokemon = (request, response) => {
    const filterStruct = {
        id: request.query.get('id'),
        name: request.query.get('name'),
        type: request.query.getAll('type'),
        weakness: request.query.getAll('weakness'),
    };

    // Were any search params given?
    if ((filterStruct.id === '' && filterStruct.name === '' && filterStruct.type.length <= 0 && filterStruct.weakness.length <= 0)) {
        const responseJSON = {
            id: 'Bad Request',
            message: 'Missing Params: Missing name, id, type, or weakness parameters',
        };
        return respondJSON(request, response, 400, responseJSON);
    }

    const filteredPokemon = filterPokemon(filterStruct);

    // If no pokemon found with given parameters
    if (filteredPokemon.length <= 0) {
        const responseJSON = {
            id: "Not Found",
            message: 'Couldn\'t find pokemon with given parameters'
        }
        return respondJSON(request, response, 404, responseJSON);
    }

    return respondJSON(request, response, 200, filteredPokemon);
}

const getPokemonNames = (request, response) => {
    const filterStruct = {
        id: request.query.get('id'),
        name: request.query.get('name'),
        type: request.query.getAll('type'),
        weakness: request.query.getAll('weakness'),
    };

    // Were any search params given?
    if ((filterStruct.id === '' && filterStruct.name === '' && filterStruct.type.length <= 0 && filterStruct.weakness.length <= 0)) {
        const responseJSON = {
            id: 'Bad Request',
            message: 'Missing Params: Missing name, id, type, or weakness parameters',
        };
        return respondJSON(request, response, 400, responseJSON);
    }

    const filteredPokemon = filterPokemon(filterStruct);

    // If no pokemon found with given parameters
    if (filteredPokemon.length <= 0) {
        const responseJSON = {
            id: "Not Found",
            message: 'Couldn\'t find pokemon with given parameters'
        }
        return respondJSON(request, response, 404, responseJSON);
    }

    return respondJSON(request, response, 200, filteredPokemon.map(pokemon => pokemon.name));
}

const filterPokemon = (filterStruct) => {
    const { name, id, type, weakness } = filterStruct || {};

    // If no filter params
    if (!(name || id || type || weakness)) {
        return [];
    }

    let filter = pokedex.filter(pokemon => {
        let hasName = name ? pokemon.name.toLowerCase().includes(name.toLowerCase()) : true;
        let hasId = id ? pokemon.id === parseInt(id, 10) : true;
        let hasType = true;
        let hasWeakness = true;
        for (let i = 0; i < type.length; i++) {
            if (!pokemon.type.includes(type[i])) {
                hasType = false;
                break;
            }
        };
        for (let i = 0; i < weakness.length; i++) {
            if (!pokemon.weaknesses.includes(weakness[i])) {
                hasWeakness = false;
                break;
            }
        }

        return hasName && hasId && hasType && hasWeakness;
    });

    return filter;
}

// Adds a pokemon to the pokedex
const addPokemon = (request, response) =>
{
    const body = request.body;
    const {name, height, weight, type, weakness} = body || {};
    console.log("ADDING POKEMON");
    // Ensure Necessary data is included
    if(name === '' || height || weight || type == [] || weakness == []){
        const responseJSON = {
            message: 'Must include a name, height, weight, type, and/or weakness',
            id: 'Bad Request'
        }

        return respondJSON(request, response, 400, responseJSON);
    }

    // Check if pokemon name currently exists. If so, update it

    if(name && type && weakness){
        const newPokemon = {
            name:name,
            id: pokedex.length,
            type:type,
            weaknesses:weakness
        }
        pokedex.push(newPokemon);
    }

}

module.exports = {
    getIndex,
    getStyle,
    getDocumentation,
    getPokemon,
    getPokemonNames,
    getAllPokemon,
    getPokemonTypes,
    addPokemon,
}