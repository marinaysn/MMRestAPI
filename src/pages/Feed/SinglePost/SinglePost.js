import React, { Component } from 'react';

import Image from '../../../components/Image/Image';
import './SinglePost.css';

class SinglePost extends Component {
  state = {
    title: '',
    author: '',
    date: '',
    image: '',
    content: ''
  };

  componentDidMount() {
    const postId = this.props.match.params.postId;

    const graphqlQuery = {
      query: `{
      singlePost(id: "${postId}"){
        title
        content
        creator{
          name
        }
        createdAt,
        imageUrl
      }
    }
      `
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
        //console.log(resData.post.imageUrl);
        console.log('=============');
        console.log(resData);

        if (resData.errors) {
          throw new Error('Cannot fetch post!!!')
        }

        this.setState({
          title: resData.data.singlePost.title,
          author: resData.data.singlePost.creator.name,
          image: 'http://localhost:8080/' + resData.data.singlePost.imageUrl,
          date: new Date(resData.data.singlePost.createdAt).toLocaleDateString('en-US'),
          content: resData.data.singlePost.content
        });
      })
      .catch(err => {
        console.log(err);
      });
  }

  render() {
    return (
      <section className="single-post">
        <h1>{this.state.title}</h1>
        <h2>
          Created by {this.state.author} on {this.state.date}
        </h2>
        <div className="single-post__image">
          <Image contain imageUrl={this.state.image} />
        </div>
        <p>{this.state.content}</p>
      </section>
    );
  }
}

export default SinglePost;
