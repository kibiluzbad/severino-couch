/*

WHAT IS THIS?

This module demonstrates simple uses of Botkit's conversation system.

In this example, Botkit hears a keyword, then asks a question. Different paths
through the conversation are chosen based on the user's response.

*/
const CouchAPI = require('../lib/couchpotato.js');

module.exports = function (controller) {

    controller.hears(['hi'], 'direct_message,direct_mention', function (bot, message) {
        bot.reply(message, 'Hey ;)');
    });

    controller.hears(['download movie\s(.*)'], 'direct_message,direct_mention', function (bot, message) {
        bot.log('Dowload movie...');
        let match = message.match[1];
        if (match) {
            bot.log(`Movie name or id ${match}`);
            couch.addMovie(imdbId, (err, result) => {
                if (err) {
                    sayMessage = `This is not an IMDB id.. Don't play with me!`;
                } else {
                    const movie = result.movie;
                    const title = movie.title;
                    const movieInfo = movie.info;
                    const year = `(${(movieInfo && movieInfo.year) ? movieInfo.year : 'x'})`;
                    const rating = `${(movieInfo && movieInfo.rating) ? movieInfo.rating.imdb[0] : ''}`;

                    if (title) {
                        sayMessage = `Added ${title} ${year} with IMDB rating: ${rating} to wanted list.`;
                    } else {
                        sayMessage = `Can't add this movie to wanted list. Check my console/logs..`;
                    }
                }
                bot.reply(message, sayMessage);
            });
        }
    });

    controller.hears(['^search movie (.*)'], 'direct_message,direct_mention', function (bot, message) {
        controller.log('Search movie...');
        let match = message.match[1];
        if (match) {
            let couchOptions = {
                "host": process.env.COUCH_POTATO_HOST || '127.0.0.1',
                "port": process.env.COUCH_POTATO_PORT || '5050',
                "key": process.env.COUCH_POTATO_KEY,
            };

            controller.log(JSON.stringify(couchOptions));

            let couch = new CouchAPI(couchOptions);

            let sayMessage = null;
            controller.log(`Movie name or id ${match}`);
            couch.search(match, (err, searchResult) => {
                if (err && err.code === 'no_movies_found') {
                    sayMessage = `I didn't find anything`;
                } else {
                    movies = searchResult.movies.slice(0, 4);
                    sayMessage = _composeResponseMessage(movies);

                    bot.reply(message, sayMessage);
                    let actions = movies.map((m) => {
                        return {
                            "name": m.imdb,
                            "text": m.imdb,
                            "value": m.imdb,
                            "type": "button",
                        }
                    });

                    actions.push({
                        "name": "cancel",
                        "text": "cancel",
                        "value": "cancel",
                        "style": "danger",
                        "type": "button",
                    });

                    controller.log(JSON.stringify(actions));

                    bot.startConversation(message, function (err, convo) {

                        convo.ask({
                            attachments: [
                                {
                                    title: 'Which one do you wanna download?',
                                    callback_id: 'downloa_movies',
                                    attachment_type: 'default',
                                    actions: actions
                                }
                            ]
                        }, [{
                            default: true,
                            callback: function (reply, convo) {
                                if (reply.text === 'cancel') {
                                    convo.say(":upside_down_face:");
                                    convo.next();
                                    return;
                                }
                                couch.addMovie(reply.text, (err, result) => {
                                    if (err) {
                                        sayMessage = `This is not an IMDB id.. Don't play with me!`;
                                    } else {
                                        const movie = result.movie;
                                        const title = movie.title;
                                        const movieInfo = movie.info;
                                        const year = `(${(movieInfo && movieInfo.year) ? movieInfo.year : 'x'})`;
                                        const rating = `${(movieInfo && movieInfo.rating) ? movieInfo.rating.imdb[0] : ''}`;

                                        if (title) {
                                            sayMessage = `Added ${title} ${year} with IMDB rating: ${rating} to wanted list.`;
                                        } else {
                                            sayMessage = `Can't add this movie to wanted list. Check my console/logs..`;
                                        }
                                    }
                                    convo.say(sayMessage);
                                    convo.next();
                                });
                            }
                        }
                            ]);
                    });
                }
            });
        }
    });
};

function _composeResponseMessage(movies) {
    let message = ``;

    if (movies) {
        message += `I found the following `;
        message += `movie(s): \n`;
        for (const movie of movies) {
            const title = movie.titles[0];
            if (movie.type === 'movie' && movie.imdb) {
                message += `:movie_camera: <http://www.imdb.com/title/${movie.imdb}|${title} - ${movie.imdb}> \n`;
            }
        }

    } else {
        message += `No movies found :pensive:`;
    }

    return message;
}
