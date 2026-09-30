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
    // Format name
    let name = request.query.get('name');
    name = formatText(name);

    const searchStruct = {
        id: request.query.get('id'),
        name: name,
    };

    const pokemonObj =
        pokedex.find(pokemon => pokemon.id === parseInt(searchStruct.id, 10)) ||
        pokedex.find(pokemon => pokemon.name === searchStruct.name);

    if (!pokemonObj) {
        const responseJSON = {
            id: 'Not Found',
        };
        responseJSON.message = 'Can\'t find pokemon' + (searchStruct.id ? ` with id ${id}` : searchStruct.name ? ` with name ${name}` : '.');
        return respondJSON(request, response, 404, responseJSON);
    }
    respondJSON(request, response, 200, [pokemonObj]);
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

    if(pokemon){
        responseCode = 200;
        return respondJSON(request, response, responseCode, pokemon);
    }
    return respondJSON(request, response, responseCode, responseJSON);
}

const formatText = (text) => {
    if (text) {
        let formattedText = text.trim();
        formattedText = `${text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()}`;
        return formattedText;
    }
}
module.exports = {
    getIndex,
    getStyle,
    getDocumentation,
    getPokemon,
    getFilteredPokemon,
    getPokemonTypes,
}