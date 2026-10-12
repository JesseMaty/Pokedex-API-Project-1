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
        weaknesses: request.query.getAll('weaknesses'),
    };

    // Were any search params given?
    if ((filterStruct.id === '' && filterStruct.name === '' && filterStruct.type.length <= 0 && filterStruct.weaknesses.length <= 0)) {
        const responseJSON = {
            id: 'Bad Request',
            message: 'Missing Params: Missing name, id, type, or weaknessesparameters',
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
        weaknesses: request.query.getAll('weaknesses'),
    };

    // Were any search params given?
    if ((filterStruct.id === '' && filterStruct.name === '' && filterStruct.type.length <= 0 && filterStruct.weaknesses.length <= 0)) {
        const responseJSON = {
            id: 'Bad Request',
            message: 'Missing Params: Missing name, id, type, or weaknessesparameters',
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
    const { name, id, type, weaknesses} = filterStruct || {};

    // If no filter params
    if (!(name || id || type || weaknesses)) {
        return [];
    }

    let filter = pokedex.filter(pokemon => {
        let hasName = name ? pokemon.name.toLowerCase().includes(name.toLowerCase()) : true;
        let hasId = id ? pokemon.id === parseInt(id, 10) : true;
        let hasType = true;
        let hasWeaknesses= true;
        for (let i = 0; i < type.length; i++) {
            if (!pokemon.type.includes(type[i])) {
                hasType = false;
                break;
            }
        };
        for (let i = 0; i < weaknesses.length; i++) {
            if (!pokemon.weaknesses.includes(weaknesses[i])) {
                hasWeaknesses= false;
                break;
            }
        }

        return hasName && hasId && hasType && hasWeaknesses;
    });

    return filter;
}

// Adds a pokemon to the pokedex
const addPokemon = (request, response) => {
    if (request.method === 'POST') {
        let chunks = [];

        request.on('data', (chunk) => {
            chunks.push(chunk);
        }).on('end', () => {
            const body = Buffer.concat(chunks).toString(); // MDN DOCS
            const pokemon = JSON.parse(body);
            const { name, height, weight, img } = pokemon;
            const type = !pokemon.type ? undefined : Array.isArray(pokemon.type) ? pokemon.type : [pokemon.type];
            const weaknesses = !pokemon.weaknesses ? undefined : Array.isArray(pokemon.weaknesses) ? pokemon.weaknesses : [pokemon.weaknesses];

            const responseJSON = {
                id: 'Updated',
            };

            // If pokemon currently exists, update it
            const existingPokemon = pokedex.find(pokemon => pokemon.name === name)
            if (existingPokemon) {
                existingPokemon.height = height || existingPokemon.height;
                existingPokemon.weight = weight || existingPokemon.weight;
                existingPokemon.type = [type] || existingPokemon.type;
                existingPokemon.weaknesses = [weaknesses] || existingPokemon.weaknesses;
                existingPokemon.img = img || existingPokemon.img;

                return respondJSON(request, response, 204, responseJSON);
            }

            // Ensure Necessary data is included
            if (name === '' || height === '' || weight === '' || !type) {
                responseJSON.message = 'Must include a name, height, weight, and type(s)';
                responseJSON.id = 'Bad Request';

                return respondJSON(request, response, 400, responseJSON);
            }

            // Create and add pokemon
            const newPokemon = {
                name: name,
                id: pokedex.length + 1,
                num: (pokedex.length + 1).toString().padStart(3, '0'),
                height: `${Number(height).toFixed(2)} m`,
                weight: `${Number(weight).toFixed(1)} kg`,
                img: img,
                type: type,
                weaknesses: weaknesses || [],
            }

            pokedex.push(newPokemon);
            responseJSON.id = 'Created';
            responseJSON.message = 'Created new pokemon!';
            return respondJSON(request, response, 201, responseJSON);

        })
    }
}

const removePokemon = (request, response) => {
    if (request.method === 'POST') {
        let chunks = [];

        request.on('data', (chunk) => {
            chunks.push(chunk);
        }).on('end', () => {
            const body = Buffer.concat(chunks).toString(); // MDN DOCS
            const pokemon = JSON.parse(body);
            const { name, id } = pokemon;

            const responseJSON = {
                message: 'Couldn\'t find Pokemon with given name or id',
                id: 'Not Found',
            }

            // Make sure name or id exists
            if (!name && !id) {
                return respondJSON(request, response, 400, responseJSON);
            }

            responseJSON.message = 'Couldn\'t find Pokemon with given name or id';
            responseJSON.id = 'Not Found';

            // Filter pokemon and remove pokemon with same id/name
            const index = pokedex.findIndex(pokemon => pokemon.name.toLowerCase() === name.toLowerCase() || parseInt(pokemon.id) === parseInt(id));

            if(index < 0) return respondJSON(request, response, 404, responseJSON);
            
            pokedex.splice(index, 1);

            responseJSON.message = '';
            responseJSON.id = 'Removed';

            return respondJSON(request, response, 204, responseJSON);
        });
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
    removePokemon,
}