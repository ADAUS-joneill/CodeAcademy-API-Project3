// database is let instead of const to allow us to modify it in test.js
let database = {
  users: {},
  articles: {},
  comments: {},
  nextCommentId: 1,
  nextArticleId: 1
};

const routes = {
  '/users': {
  'POST': getOrCreateUser
    },
  '/comments': {
      'POST': createComment
  },
  '/comments/:id': {
      'PUT': updateComment,
      'DELETE': deleteComment},
  '/comments/:id/upvote': {
      'PUT': upvoteComment},
  '/comments/:id/downvote': {
      'PUT': downvoteComment},
  '/users/:username': {
      'GET': getUser
  },
  '/articles': {
    'GET': getArticles,
    'POST': createArticle
  },
  '/articles/:id': {
    'GET': getArticle,
    'PUT': updateArticle,
    'DELETE': deleteArticle
  },
  '/articles/:id/upvote': {
    'PUT': upvoteArticle
  },
  '/articles/:id/downvote': {
    'PUT': downvoteArticle
  }
};

function downvoteComment(url, request) {
    // Set up constants for this function, including response object
    const id = Number(url.split('/').filter(segment => segment)[1]);
    const username = request.body && request.body.username;

    // Retrieve Comment from Database
    // Set up response code object
    let savedComment = database.comments[id];
    const response = {};

    // Check the truthiness of PUTed parameters
    if (savedComment && database.users[username]) {
        // DownVote the Comment for this user
        savedComment = downvote(savedComment, username);

        // Set up response code, success
        // Populate response body
        response.body = { comment: savedComment };
        response.status = 200;
    } else {
        // Set up response code, failure
        response.status = 400;
    }
    // Return response object
    return response;
}

function upvoteComment(url, request) {
    // Set up constants for this function, including response object
    const id = Number(url.split('/').filter(segment => segment)[1]);
    const username = request.body && request.body.username;

    // Retrieve Comment from Database
    // Set up response code object
    let savedComment = database.comments[id];
    const response = {};

    // Check the truthiness of PUTed parameters
    if (savedComment && database.users[username]) {
        // UpVote the Comment for this user
        savedComment = upvote(savedComment, username);

        // Set up response code, success
        // Populate response body
        response.body = { comment: savedComment };
        response.status = 200;
    } else {
        // Set up response code, failure
        response.status = 400;
    }
    // Return response object
    return response;
}

function removeArrayElement(array, element) {
    const index = array.indexOf(element);

    // If index is not present, indexOF returns a -1
    // This will result in last element of Array being removed
    // Check return value of 'indexOf' call, don't act on a -1
    // Return value
    if (index !== -1) {
        array.splice(index, 1);
    }
}

function deleteComment(url, request) {
    // Set up constants for this function, including response object
    const id = Number(url.split('/').filter(segment => segment)[1]);    
    const response = {};
    
    // Attempt to retrieve comment ID from database
    const savedComment = database.comments[id];

    // Attempt to retrieve referenced Artice from database
    const savedArticle = database.articles[savedComment.articleId];

    // Verify the 'truthiness' of DELETEd data
    if (savedComment && id) {
        // Set response status code, success
        response.status = 204;
        // Delete Comment, remove comment from user comments
        // Also remove comment from article comments
        database.comments[id] = null;
        removeArrayElement(savedArticle.commentIds, id);
        removeArrayElement(database.users[savedArticle.username].commentIds, id);
    } else {
        // Update response status code, failure
        response.status = 404;
    }
    // Return response object
    return response;
}

function updateComment(url, request) {
    // Set up constants for this function, including response object
    const id = Number(url.split('/').filter(segment => segment)[1]);
    const response = {};

    // Attempt to retrieve comment ID from database
    const savedComment = database.comments[id];
    const requestComment = request.body && request.body.comment;

    // Verify the 'truthiness' of PUTed data
    if (!id || !requestComment) {
        // Build response object, failure - missing PUTed data 
        // No body in this response
        response.status = 400;

    } else if (!savedComment) {
        // Build response object, failure - nonexistent comment based on PUTed Id
        // No body in this response
        response.status = 404;

    } else {
        // Update database as required
        savedComment.body = requestComment.body || savedComment.body;

        /// Build response indicating success, status code and response body
        response.body = { comment: savedComment };
        response.status = 200;
    }
    // Return with response object
    return response;
}

function createComment(url, request) {
    // Set up constants for this function, including response object
    const requestComment = request.body && request.body.comment;
    const response = {};

    // Verify the 'truthiness' of POSTed data, also look up the
    // article ID in the articles database array to verify validity of
    // the supplied article ID
    if (requestComment &&
        requestComment.body &&
        request.body.comment &&
        requestComment.username &&
        database.users[requestComment.username] &&
        requestComment.articleId &&
        requestComment.articleId in database.articles) {

        // Create object representing the comment, incredmenting the nextCommentId
        const comment = {
            id: database.nextCommentId++,
            body: requestComment.body,
            username: requestComment.username,
            articleId: requestComment.articleId,
            upvotedBy: [],
            downvotedBy: []
        };

        // Update database as required
        database.comments[comment.id] = comment;
        database.users[comment.username].commentIds.push(comment.id);
        database.articles[comment.articleId].commentIds.push(comment.id);

        // Build response indicating success, status code and response body
        response.body = { comment: comment };
        response.status = 201;
    } else {
        // Build response indicating failure, status code only
        response.status = 400;
    }
    // Return with response object
    return response;
}

function getUser(url, request) {
  const username = url.split('/').filter(segment => segment)[1];
  const user = database.users[username];
  const response = {};

  if (user) {
    const userArticles = user.articleIds.map(
        articleId => database.articles[articleId]);
    const userComments = user.commentIds.map(
        commentId => database.comments[commentId]);
    response.body = {
      user: user,
      userArticles: userArticles,
      userComments: userComments
    };
    response.status = 200;
  } else if (username) {
    response.status = 404;
  } else {
    response.status = 400;
  }

  return response;
}

function getOrCreateUser(url, request) {
  const username = request.body && request.body.username;
  const response = {};

  if (database.users[username]) {
    response.body = {user: database.users[username]};
    response.status = 200;
  } else if (username) {
    const user = {
      username: username,
      articleIds: [],
      commentIds: []
    };
    database.users[username] = user;

    response.body = {user: user};
    response.status = 201;
  } else {
    response.status = 400;
  }

  return response;
}

function getArticles(url, request) {
  const response = {};

  response.status = 200;
  response.body = {
    articles: Object.keys(database.articles)
        .map(articleId => database.articles[articleId])
        .filter(article => article)
        .sort((article1, article2) => article2.id - article1.id)
  };

  return response;
}

function getArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const article = database.articles[id];
  const response = {};

  if (article) {
    article.comments = article.commentIds.map(
      commentId => database.comments[commentId]);

    response.body = {article: article};
    response.status = 200;
  } else if (id) {
    response.status = 404;
  } else {
    response.status = 400;
  }

  return response;
}

function createArticle(url, request) {
  const requestArticle = request.body && request.body.article;
  const response = {};

  if (requestArticle && requestArticle.title && requestArticle.url &&
      requestArticle.username && database.users[requestArticle.username]) {
    const article = {
      id: database.nextArticleId++,
      title: requestArticle.title,
      url: requestArticle.url,
      username: requestArticle.username,
      commentIds: [],
      upvotedBy: [],
      downvotedBy: []
    };

    database.articles[article.id] = article;
    database.users[article.username].articleIds.push(article.id);

    response.body = {article: article};
    response.status = 201;
  } else {
    response.status = 400;
  }

  return response;
}

function updateArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const savedArticle = database.articles[id];
  const requestArticle = request.body && request.body.article;
  const response = {};

  if (!id || !requestArticle) {
    response.status = 400;
  } else if (!savedArticle) {
    response.status = 404;
  } else {
    savedArticle.title = requestArticle.title || savedArticle.title;
    savedArticle.url = requestArticle.url || savedArticle.url;

    response.body = {article: savedArticle};
    response.status = 200;
  }

  return response;
}

function deleteArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const savedArticle = database.articles[id];
  const response = {};

  if (savedArticle) {
    database.articles[id] = null;
    savedArticle.commentIds.forEach(commentId => {
      const comment = database.comments[commentId];
      database.comments[commentId] = null;
      const userCommentIds = database.users[comment.username].commentIds;
      userCommentIds.splice(userCommentIds.indexOf(id), 1);
    });
    const userArticleIds = database.users[savedArticle.username].articleIds;
    userArticleIds.splice(userArticleIds.indexOf(id), 1);
    response.status = 204;
  } else {
    response.status = 400;
  }

  return response;
}

function upvoteArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const username = request.body && request.body.username;
  let savedArticle = database.articles[id];
  const response = {};

  if (savedArticle && database.users[username]) {
    savedArticle = upvote(savedArticle, username);

    response.body = {article: savedArticle};
    response.status = 200;
  } else {
    response.status = 400;
  }

  return response;
}

function downvoteArticle(url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1]);
  const username = request.body && request.body.username;
  let savedArticle = database.articles[id];
  const response = {};

  if (savedArticle && database.users[username]) {
    savedArticle = downvote(savedArticle, username);

    response.body = {article: savedArticle};
    response.status = 200;
  } else {
    response.status = 400;
  }

  return response;
}

function upvote(item, username) {
  if (item.downvotedBy.includes(username)) {
    item.downvotedBy.splice(item.downvotedBy.indexOf(username), 1);
  }
  if (!item.upvotedBy.includes(username)) {
    item.upvotedBy.push(username);
  }
  return item;
}

function downvote(item, username) {
  if (item.upvotedBy.includes(username)) {
    item.upvotedBy.splice(item.upvotedBy.indexOf(username), 1);
  }
  if (!item.downvotedBy.includes(username)) {
    item.downvotedBy.push(username);
  }
  return item;
}

// Write all code above this line.

const http = require('http');
const url = require('url');

const port = process.env.PORT || 4000;
const isTestMode = process.env.IS_TEST_MODE;

const requestHandler = (request, response) => {
  const url = request.url;
  const method = request.method;
  const route = getRequestRoute(url);

  if (method === 'OPTIONS') {
    var headers = {};
    headers["Access-Control-Allow-Origin"] = "*";
    headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
    headers["Access-Control-Allow-Credentials"] = false;
    headers["Access-Control-Max-Age"] = '86400'; // 24 hours
    headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept";
    response.writeHead(200, headers);
    return response.end();
  }

  response.setHeader('Access-Control-Allow-Origin', null);
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.setHeader(
      'Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  if (!routes[route] || !routes[route][method]) {
    response.statusCode = 400;
    return response.end();
  }

  if (method === 'GET' || method === 'DELETE') {
    const methodResponse = routes[route][method].call(null, url);
    !isTestMode && (typeof saveDatabase === 'function') && saveDatabase();

    response.statusCode = methodResponse.status;
    response.end(JSON.stringify(methodResponse.body) || '');
  } else {
    let body = [];
    request.on('data', (chunk) => {
      body.push(chunk);
    }).on('end', () => {
      body = JSON.parse(Buffer.concat(body).toString());
      const jsonRequest = {body: body};
      const methodResponse = routes[route][method].call(null, url, jsonRequest);
      !isTestMode && (typeof saveDatabase === 'function') && saveDatabase();

      response.statusCode = methodResponse.status;
      response.end(JSON.stringify(methodResponse.body) || '');
    });
  }
};

const getRequestRoute = (url) => {
  const pathSegments = url.split('/').filter(segment => segment);

  if (pathSegments.length === 1) {
    return `/${pathSegments[0]}`;
  } else if (pathSegments[2] === 'upvote' || pathSegments[2] === 'downvote') {
    return `/${pathSegments[0]}/:id/${pathSegments[2]}`;
  } else if (pathSegments[0] === 'users') {
    return `/${pathSegments[0]}/:username`;
  } else {
    return `/${pathSegments[0]}/:id`;
  }
}

if (typeof loadDatabase === 'function' && !isTestMode) {
  const savedDatabase = loadDatabase();
  if (savedDatabase) {
    for (key in database) {
      database[key] = savedDatabase[key] || database[key];
    }
  }
}

const server = http.createServer(requestHandler);

server.listen(port, (err) => {
  if (err) {
    return console.log('Server did not start succesfully: ', err);
  }

  console.log(`Server is listening on ${port}`);
});