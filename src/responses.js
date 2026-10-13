const fs = require('fs');

const pokedex = JSON.parse(fs.readFileSync(`${__dirname}/pokedex.json`));
const typeList = ['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
    'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon'];

const index = fs.readFileSync(`${__dirname}/../client/client.html`);
const documentation = fs.readFileSync(`${__dirname}/../client/documentation.html`);
const style = fs.readFileSync(`${__dirname}/../client/style.css`);

const respond = (request, response, status, object, type) => {
    const headers = {
        'Content-Type': type,
        'Content-Length': Buffer.byteLength(object, 'utf-8'),
    }

    response.writeHead(status, headers);

    if (request.method !== "HEAD" && status !== 204) {
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

const notFound = (request, response) => {
    const responseJSON = {
        message: 'Could not find the page you are looking for.',
        id: 'Not Found',
    };
    return respondJSON(request, response, 404, responseJSON);
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
    const { name, id, type, weaknesses } = filterStruct || {};

    // If no filter params
    if (!(name || id || type || weaknesses)) {
        return [];
    }

    let filter = pokedex.filter(pokemon => {
        let hasName = name ? pokemon.name.toLowerCase().includes(name.toLowerCase()) : true;
        let hasId = id ? pokemon.id === parseInt(id, 10) : true;
        let hasType = true;
        let hasWeaknesses = true;
        for (let i = 0; i < type.length; i++) {
            if (!pokemon.type.includes(type[i])) {
                hasType = false;
                break;
            }
        };
        for (let i = 0; i < weaknesses.length; i++) {
            if (!pokemon.weaknesses.includes(weaknesses[i])) {
                hasWeaknesses = false;
                break;
            }
        }

        return hasName && hasId && hasType && hasWeaknesses;
    });

    return filter;
}

// Parses and chunks request data
const parseData = (request, callback) => {
    if (request.method === 'POST') {
        let chunks = [];

        request.on('data', (chunk) => {
            chunks.push(chunk);
        }).on('end', () => {
            const body = Buffer.concat(chunks).toString(); // MDN DOCS
            let parsedObject = {};

            if (request.headers['content-type'] === 'application/json') {
                parsedObject = JSON.parse(body);
            }
            else if (request.headers['content-type'] === 'application/x-www-form-urlencoded') {
                const params = new URLSearchParams(body);

                ['name', 'id', 'height', 'weight', 'img'].forEach((key) => {
                    if (params.has(key)) parsedObject[key] = params.get(key);
                })

                ['type', 'weaknesses'].forEach((key) => {
                    if (params.has(key)) parsedObject[key] = params.getAll(key);
                })
            }

            callback(parsedObject);
        });
    }
}

// Adds a pokemon to the pokedex
const addPokemon = (request, response) => {
    parseData(request, (pokemon) => {
        const name = pokemon.name ? pokemon.name.trim() : '';
        const { height, weight, img } = pokemon;
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
            existingPokemon.type = type || existingPokemon.type;
            existingPokemon.weaknesses = weaknesses || existingPokemon.weaknesses;
            existingPokemon.img = img || existingPokemon.img;

            return respondJSON(request, response, 204, responseJSON);
        }

        // Ensure Necessary data is included
        if (name === '' || height === '' || weight === '' || type.length <= 0) {
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
        responseJSON.message = 'Created ' + JSON.stringify(newPokemon);
        return respondJSON(request, response, 201, responseJSON);
    })
}

const removePokemon = (request, response) => {
    parseData(request, (pokemon) => {
        const { name, id } = pokemon;

        const responseJSON = {
            message: 'Include a corresponding name or id',
            id: 'Bad Request',
        }

        // Make sure name or id exists
        if (!name && !id) {
            return respondJSON(request, response, 400, responseJSON);
        }

        // If name and id, make sure they match
        // Filter pokemon and remove pokemon with same id/name
        const nameIndex = pokedex.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
        const idIndex = pokedex.findIndex(p => parseInt(p.id) === parseInt(id));
        
        // Make sure name and id match if both included
        if(!(name && id && nameIndex === idIndex)){
            responseJSON.mesesage = 'Name and Id must match to the corresponding pokemon'
            return respondJSON(request, response, 400, responseJSON);
        }
        const index = (nameIndex < 0) ? (idIndex < 0) ? -1 : idIndex : nameIndex;

        responseJSON.message = 'Couldn\'t find Pokemon with given name or id';
        responseJSON.id = 'Not Found';
        if (index < 0) return respondJSON(request, response, 404, responseJSON);

        pokedex.splice(index, 1);

        responseJSON.message = '';
        responseJSON.id = 'Removed';

        return respondJSON(request, response, 204, responseJSON);
    })
}

module.exports = {
    getIndex,
    getStyle,
    getDocumentation,
    notFound,
    getPokemon,
    getPokemonNames,
    getAllPokemon,
    getPokemonTypes,
    addPokemon,
    removePokemon,
}