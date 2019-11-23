
exports.getPosts = ((req, res, next)=>{

    res.status(200).json({posts: [{title: 'Creating REST APIs with Node.js & TypeScript', content: 'A WebAPI consisting of endpoints to a request–response message system (JSON/XML) exposed as an HTTP-based server', url: 'https://www.reddit.com/r/learnjavascript/comments/dzqbay/creating_rest_apis_with_nodejs_typescript_part_1/'}]});
});

exports.createPost = ( req, res, next) => {
    //Create post in db
    const title = req.body.title;
    const content = req.body.content;
    const url = req.body.url;
    
    // console.log(title);
    // console.log(content);
    console.log(req.body);

    res.status(201).json({
        message: 'Post Created!',
        post: {id: new Date().toISOString(), title: title, content: content, url: url}
    })
};

