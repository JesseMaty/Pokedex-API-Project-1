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

const getPokemon = (request, response) => {
    const filterStruct = {
        id: request.query.get('id'),
        name: request.query.get('name'),
        type: request.query.getAll('type'),
        weakness: request.query.getAll('weakness'),
    };

    console.log(`Filter Struct: ${filterStruct}`);

    // Were any search params given?
    if ((filterStruct.id === '' && filterStruct.name === '' && filterStruct.type.length >= 0 && filterStruct.weakness.length >= 0)) {
        const responseJSON = {
            id: 'Bad Request',
            message: 'Missing Params: Missing name, id, type, or weakness parameters',
        };
        return respondJSON(request, response, 400, responseJSON);
    }

    const filteredPokemon = filterPokemon(filterStruct);

    if (filteredPokemon.length <= 0) {
        const responseJSON = {
            id: "Not Found",
            message: 'Couldn\'t find pokemon with given parameters'
        }
        return respondJSON(request, response, 404, responseJSON);
    }

    respondJSON(request, response, 200, filteredPokemon);
}

const filterPokemon = (filterStruct) => {
    const { name, id, type, weakness } = filterStruct || {};

    console.log(filterStruct);
    // If no filter params
    if (!(name || id || type || weakness)) {
        return [];
    }

    let filter = pokedex.filter(pokemon => {
        let hasName = name ? pokemon.name.toLowerCase().includes(name.toLowerCase()) : true;
        let hasId = id ? pokemon.id === parseInt(id, 10) : true;
        let hasType = type;
        let hasWeakness = weakness;
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

        console.log(`${pokemon.name} has name ${name}: ${hasName}
            has id ${id}: ${hasId}
            has type ${type}: ${hasType}
            has weakness ${weakness}: ${hasWeakness}`)

        return hasName && hasId && hasType && hasWeakness;
    });

    return filter;
}



const getFilteredPokemon = (request, response) => {
    // Format types query
    let type = request.query.getAll('type');
    if (type) {
        type = type.map(t => formatText(t));
    }

    // Format weaknesses query
    let weakness = request.query.getAll('weakness');
    if (weakness) {
        weakness = weakness.map(w => formatText(w));
    }

    let responseCode = 404;

    const responseJSON = {
        id: 'Not Found',
        message: 'Couldn\'t find Pokemon with type or weakness',
    };

    const pokemon = pokedex.filter(pokemon => {
        if (type) {
            for (let i = 0; i < type.length; i++) {
                if (!pokemon.type.includes(type[i])) {
                    return false;
                }
            };
        }
        if (weakness) {
            for (let j = 0; j < weakness.length; j++) {
                if (!pokemon.weaknesses.includes(weakness[j])) {
                    return false;
                }
            }
        }
        return true;
    })

    if (pokemon) {
        responseCode = 200;
        return respondJSON(request, response, responseCode, pokemon);
    }
    return respondJSON(request, response, responseCode, responseJSON);
}

module.exports = {
    getIndex,
    getStyle,
    getDocumentation,
    getPokemon,
    getFilteredPokemon,
    getPokemonTypes,
}