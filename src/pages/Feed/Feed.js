import React, { Component, Fragment } from 'react';

import Post from '../../components/Feed/Post/Post';
import Button from '../../components/Button/Button';
import FeedEdit from '../../components/Feed/FeedEdit/FeedEdit';
import Input from '../../components/Form/Input/Input';
import Paginator from '../../components/Paginator/Paginator';
import Loader from '../../components/Loader/Loader';
import ErrorHandler from '../../components/ErrorHandler/ErrorHandler';
import './Feed.css';

//Global Variable to control Pegination
const ITEMS_PER_PAGE = 5;

class Feed extends Component {
  state = {
    isEditing: false,
    posts: [],
    totalPosts: 0,
    editPost: null,
    status: '',
    postPage: 1,
    postsLoading: true,
    editLoading: false
  };

  componentDidMount() {

    const graphqlQuery = {
      query:`
        query{
          user{
            status
          }
        }
      `
    }
    fetch('http://localhost:8080/graphql',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + this.props.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(graphqlQuery)
      })
      .then(res => {
        return res.json();
      })
      .then(resData => {

        if (resData.errors) {
          throw new Error(
            "Cannot create user!"
          );
        }

        this.setState({ status: resData.data.user.status });
      })
      .catch(this.catchError);

    this.loadPosts();
  }

  addPost = post => {
    this.setState(prevState => {
      const updatedPosts = [...prevState.posts];
      if (prevState.postPage === 1) {
        if (prevState.posts.length >= 5) {
          updatedPosts.pop();
        }
        updatedPosts.unshift(post);
      }
      return {
        posts: updatedPosts,
        totalPosts: prevState.totalPosts + 1
      };
    });
  }

  updatePost = post => {
    this.setState(prevState => {
      const updatedPosts = [...prevState.posts];
      const updatedPostIndex = updatedPosts.findIndex(p => p._id === post._id)

      if (updatedPostIndex > -1) {
        updatedPosts[updatedPostIndex] = post;
      }
      return {
        posts: updatedPosts
      };
    });
  };

  deletePost = post => {
    this.setState(prevState => {
      const updatedPosts = [...prevState.posts];
      const updatedPostIndex = updatedPosts.findIndex(p => p._id === post._id);
      if (updatedPostIndex > -1) {
        updatedPosts[updatedPostIndex] = post;
      }
      return {
        posts: updatedPosts
      };
    });
  };


  loadPosts = direction => {
    if (direction) {
      this.setState({ postsLoading: true, posts: [] });
    }
    let page = this.state.postPage;

  //  console.log(page);

    if (direction === 'next') {

      page++;
      this.setState({ postPage: page });
    }
    if (direction === 'previous') {
      page--;
      this.setState({ postPage: page });
    }

    const graphqlQuery = {
      query: `
      query FetchPosts($page: Int) {
      posts(page: $page){
        posts {
          _id
          title
          content
          creator{
            name
          }
          createdAt
          imageUrl
        }
        totalPosts
      }
    }
      `, variables:{
        page: page
      }
    }

    fetch('http://localhost:8080/graphql', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + this.props.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(graphqlQuery)
    })
      .then(res => {

        return res.json();
      })
      .then(resData => {

       // console.log(resData);

        if (resData.errors) {
          throw new Error(
            "Fail to fetch posts!"
          );
        }

        this.setState({
          posts: resData.data.posts.posts.map(post => {
            return {
              ...post,
              imagePath: post.imageUrl
            }
          }),
          totalPosts: resData.data.posts.totalPosts,
          postsLoading: false
        });
      })
      .catch(this.catchError);
  };

  statusUpdateHandler = event => {

    event.preventDefault();

    // const graphqlQuery = {
    //   query:`
    //   mutation {
    //     updateStatus(status: "${this.state.status}"){
    //       status
    //     }
    //   }`
    // }

    const graphqlQuery = {
      query: `
      mutation UpdateUserStatus($userStatus: String){
        updateStatus(status: $userStatus){
          status
        }
      }`, variables: {
        userStatus : this.state.status
      }
    }
    
    console.log(graphqlQuery);

    fetch('http://localhost:8080/graphql',
      {
        method: 'POST',
        body: JSON.stringify(graphqlQuery),
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + this.props.token
        }
      })
      .then(res => {

        return res.json();
      })
      .then(resData => {
       

        if (resData.errors) {
          throw new Error(
            "Cannot update status!"
          );
        }

        console.log(resData);
      })
      .catch(this.catchError);
  };

  newPostHandler = () => {
    this.setState({ isEditing: true });
  };

  startEditPostHandler = postId => {
    this.setState(prevState => {
      const loadedPost = { ...prevState.posts.find(p => p._id === postId) };

      return {
        isEditing: true,
        editPost: loadedPost
      };
    });
  };

  cancelEditHandler = () => {
    this.setState({ isEditing: false, editPost: null });
  };

  finishEditHandler = postData => {
    this.setState({
      editLoading: true
    });
    // Set up data (with image!)
    const formData = new FormData();
    formData.append('image', postData.image);
    if(this.state.editPost){
      formData.append('oldPath', this.state.editPost.imagePath)
    }

    fetch('http://localhost:8080/post-image',
      {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + this.props.token

        },
        body: formData
      })
      .then( res => res.json())
      .then(fileData =>{

        let  imageUrl = fileData.filePath;
        postData.imageUrl = imageUrl;
        

        let graphqlQuery = {
          query: `
          mutation{
            createPost(
              postInput: {title: "${postData.title}", 
              content: "${postData.content}", 
                imageUrl: "${postData.imageUrl}"}){
              _id
              title
              content
              imageUrl
              creator {
                name
              }
              createdAt
              updatedAt
            }
          }
          `
        }

        console.log(this.state.editPost);

        if(this.state.editPost){
          graphqlQuery = {
            query: `
            mutation{
              updatePost(id:"${this.state.editPost._id}",
                postInput: {title: "${postData.title}", 
                content: "${postData.content}", 
                  imageUrl: "${postData.imageUrl}"}){
                _id
                title
                content
                imageUrl
                creator {
                  name
                }
                createdAt
                updatedAt
              }
            }
            `
          }

        }
        return fetch('http://localhost:8080/graphql',
          {
            method: 'POST',
            headers: {
              Authorization: 'Bearer ' + this.props.token,
              'Content-Type': 'application/json'
    
            },
            body: JSON.stringify(graphqlQuery)
          })         
      })
      .then(res => {
        return res.json();
      })
      .then(resData => {

        if (resData.errors && (resData.errors[0].code === 422 || resData.errors[0].code === 500)) {
          throw new Error(
            resData.errors[0].message
          );
        }

        if (resData.errors) {
          throw new Error(
            "Cannot create user!"
          );
        }

      //  console.log(resData);

        let resDatafield = 'createPost'

        if(this.state.editPost){
          resDatafield = 'updatePost'
        }
        
        const post = {
          _id: resData.data[resDatafield]._id,
          title: resData.data[resDatafield].title,
          content: resData.data[resDatafield].content,
          creator: resData.data[resDatafield].creator,
          createdAt: resData.data[resDatafield].createdAt,
          imagePath: resData.data[resDatafield].imageUrl
        };
       
          this.setState(prevState => {
            let updatedPosts = [...prevState.posts];
            if (prevState.editPost) {
              const postIndex = prevState.posts.findIndex(
                p => p._id === prevState.editPost._id
              );
              updatedPosts[postIndex] = post;
            } else {

              if (prevState.posts.length >= ITEMS_PER_PAGE) {
                updatedPosts.pop();
            }


              updatedPosts.unshift(post);
            }
            return {
              posts: updatedPosts,
              isEditing: false,
              editPost: null,
              editLoading: false
            };
          
        });
      })
      .catch(err => {
        console.log(err);
        this.setState({
          isEditing: false,
          editPost: null,
          editLoading: false,
          error: err
        });
      });
  };

  statusInputChangeHandler = (input, value) => {
    this.setState({ status: value });
  };

  deletePostHandler = postId => {
    this.setState({ postsLoading: true });
    console.log(postId);

    const graphqlQuery = {
      query:`
        mutation{
          deletePost(id: "${postId}")
        }
      `
    }

    fetch('http://localhost:8080/graphql',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + this.props.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(graphqlQuery)
      })
      .then(res => {

        return res.json();
      })
      .then(resData => {

        if (resData.errors) {
          throw new Error(
            "Cannot delete!"
          );
        }

        this.loadPosts();
      })
      .catch(err => {
        console.log(err);
        this.setState({ postsLoading: false });
      });
  };

  errorHandler = () => {
    this.setState({ error: null });
  };

  catchError = error => {
    this.setState({ error: error });
  };

  render() {
    return (
      <Fragment>
        <ErrorHandler error={this.state.error} onHandle={this.errorHandler} />
        <FeedEdit
          editing={this.state.isEditing}
          selectedPost={this.state.editPost}
          loading={this.state.editLoading}
          onCancelEdit={this.cancelEditHandler}
          onFinishEdit={this.finishEditHandler}
        />
        <section className="feed__status">
          <form onSubmit={this.statusUpdateHandler}>
            <Input
              type="text"
              placeholder="Your status"
              control="input"
              onChange={this.statusInputChangeHandler}
              value={this.state.status}
            />
            <Button mode="flat" type="submit">
              Update
            </Button>
          </form>
        </section>
        <section className="feed__control">
          <Button mode="raised" design="accent" onClick={this.newPostHandler}>
            New Post
          </Button>
        </section>
        <section className="feed">
          {this.state.postsLoading && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Loader />
            </div>
          )}
          {this.state.posts.length <= 0 && !this.state.postsLoading ? (
            <p style={{ textAlign: 'center' }}>No posts found.</p>
          ) : null}
          {!this.state.postsLoading && (
            <Paginator
              onPrevious={this.loadPosts.bind(this, 'previous')}
              onNext={this.loadPosts.bind(this, 'next')}
              lastPage={Math.ceil(this.state.totalPosts / ITEMS_PER_PAGE)}
              currentPage={this.state.postPage}
            >
              {this.state.posts.map(post => (
                <Post
                  key={post._id}
                  id={post._id}
                  author={post.creator.name}
                  date={new Date(post.createdAt).toLocaleDateString('en-US')}
                  title={post.title}
                  image={post.imageUrl}
                  content={post.content}
                  onStartEdit={this.startEditPostHandler.bind(this, post._id)}
                  onDelete={this.deletePostHandler.bind(this, post._id)}
                />
              ))}
            </Paginator>
          )}
        </section>
      </Fragment>
    );
  }
}

export default Feed;
