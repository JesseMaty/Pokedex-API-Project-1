const http = require('http');
const responseHandler = require('./responses.js');

const port = process.env.PORT || process.env.NODEPORT || 3000;

const urlStruct = {
    '/': responseHandler.getIndex,
    '/style.css': responseHandler.getStyle,
    '/documentation': responseHandler.getDocumentation,
    '/getPokemon': responseHandler.getPokemon,
    '/getFilteredPokemon': responseHandler.getFilteredPokemon,
    '/getPokemonTypes': responseHandler.getPokemonTypes,
    default: responseHandler.getIndex,
};

const onRequest = (request, response) => {
    const protocol = request.connection.encrypted ? 'https' : 'http';
    const parsedUrl = new URL(request.url, `${protocol}://${request.headers.host}`);

    console.log(request.url);

    request.query = parsedUrl.searchParams;
    request.acceptedTypes = request.headers.accept ? request.headers.accept.split(',') : [];

    const handler = urlStruct[parsedUrl.pathname];

    if(handler){
        return handler(request, response);
    }
    else {
        urlStruct.default(request, response);
    }
}

http.createServer(onRequest).listen(port, () => {
    console.log(`Listening on 127:0:0:${port}`);
})