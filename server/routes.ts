import { ObjectId } from "mongodb";

import { Router } from "./framework/router";

import { Follow, Post, SmartCollection, SmartFeed, User, WebSession } from "./app";
import { PostDoc } from "./concepts/post";
import { UserDoc } from "./concepts/user";
import { WebSessionDoc } from "./concepts/websession";
import { getExpressRouter } from "./framework/router";
import { assignSmartCollection, evaluatePostContent, getSmartTags } from "./gpt_helpers";
import Responses from "./responses";

class Routes {
  /**
   * User
   */
  @Router.get("/session")
  async getSessionUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.getUserById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await User.getUsers();
  }

  @Router.get("/users/:username")
  async getUser(username: string) {
    return await User.getUserByUsername(username);
  }

  @Router.post("/users")
  async createUser(session: WebSessionDoc, username: string, password: string) {
    WebSession.isLoggedOut(session);
    //also creating feed for this user
    const user = await User.create(username, password);
    if (user.user) {
      //as soon as user is created we create an empty smart feed for it
      await SmartFeed.createSmartFeed(user.user._id);
      return user;
    } else {
      return "User creation failed";
    }
  }

  @Router.patch("/users")
  async updateUser(session: WebSessionDoc, update: Partial<UserDoc>) {
    const user = WebSession.getUser(session);
    return await User.update(user, update);
  }

  @Router.delete("/users")
  async deleteUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    WebSession.end(session);
    return await User.delete(user);
  }

  @Router.post("/login")
  async logIn(session: WebSessionDoc, username: string, password: string) {
    const u = await User.authenticate(username, password);
    WebSession.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: WebSessionDoc) {
    WebSession.end(session);
    return { msg: "Logged out!" };
  }

  /**
   * Post
   */

  @Router.get("/posts")
  async getPosts(author?: string) {
    let posts;
    if (author) {
      const id = (await User.getUserByUsername(author))._id;
      posts = await Post.getByAuthor(id);
    } else {
      posts = await Post.getPosts({});
    }
    return Responses.posts(posts);
  }
  //standard controller for handling user creating new post
  @Router.post("/posts")
  async createPost(session: WebSessionDoc, content: string) {
    const user = WebSession.getUser(session);
    //getting tags using gpt-4
    const isEducational = await evaluatePostContent(content);
    //checking if the content of the post is educational

    if (isEducational) {
      //if so, proceeding with getting the tags
      const tags = await getSmartTags(content);
      const createdPost = await Post.create(user, content, tags);

      //getting all the exists smart collections (their topics)
      const smartCollections = await SmartCollection.getAllSmartCollections();
      const smartCollectionsNames = smartCollections.map((collec) => collec.collectionTopic);

      //getting GPT to assign the collectio to the user input
      const response = await assignSmartCollection(smartCollectionsNames, content);
      console.log("res", response);
      if (createdPost.post) {
        let topic = response.collectionTopic;
        if (response.isNewTopic) {
          //creating new smart collection
          await SmartCollection.create(response.newTopicName, tags, response.newTopicName.replace(/\s+/g, "_").toLowerCase(), []);
          topic = response.newTopicName;
        }
        const collectionId = await SmartCollection.getCollectionIdbyTopic(topic);
        const smartCollections = await SmartCollection.addPostToCollection(collectionId._id, createdPost.post._id);
        return { msg: createdPost.msg, post: await Responses.post(createdPost.post), tags: tags, smartCollections: smartCollections };
      }
    } else {
      return { msg: "post is not educational. rewrite it" };
    }
  }

  @Router.patch("/posts/:_id")
  async updatePost(session: WebSessionDoc, _id: ObjectId, update: Partial<PostDoc>) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    //checking if the text in the update is educational
    if (update.content) {
      const isEducational = await evaluatePostContent(update.content);
      if (isEducational) {
        const tags = await getSmartTags(update.content);
        update.tags = tags;
        return await Post.update(_id, update);
      } else {
        return { msg: "Updated post contains no educational content. Please edit the post and try again. " };
      }
    }
  }

  @Router.delete("/posts/:_id")
  async deletePost(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return Post.delete(_id);
  }

  /**
   * Follow
   */

  @Router.post("/follow/:username")
  async followUser(session: WebSessionDoc, username: string) {
    const followerid = WebSession.getUser(session);
    const followeeid = await User.getUserByUsername(username);
    await User.userExists(followeeid._id);
    return await Follow.follow(followerid, followeeid._id, "user");
  }

  @Router.delete("/unfollow/:username")
  async unfollowUser(session: WebSessionDoc, username: string) {
    const followerid = WebSession.getUser(session);
    const followeeid = await User.getUserByUsername(username);
    await User.userExists(followeeid._id);
    return await Follow.unfollow(followerid, followeeid._id, "user");
  }

  @Router.get("/following/:username")
  async getUserFollowingById(username: string) {
    const user = await User.getUserByUsername(username);
    await User.userExists(user._id);
    return await Follow.getAllFollowing(user._id, "user");
  }

  @Router.get("/followers/:username")
  async getUserFollowersById(username: string) {
    const user = await User.getUserByUsername(username);
    await User.userExists(user._id);
    return await Follow.getAllFollowers(user._id, "user");
  }

  /**
   * Smart Collection
   */

  //create a collection
  @Router.post("/smartcollection/create")
  async createSmartCollection(topic: string, collectionname: string, tags: string[], posts: ObjectId[]) {
    return await SmartCollection.create(topic, tags, collectionname, posts);
  }

  // Get a specific SmartCollection by ID.
  @Router.get("/smartcollection/:collectionname")
  async getSmartCollectionById(collectionname: string) {
    return await SmartCollection.getByName(collectionname);
  }

  @Router.post("/smartcollection/follow/:collectionname")
  async followSmartCollection(session: WebSessionDoc, collectionname: string) {
    const followerId = WebSession.getUser(session);
    await SmartCollection.collectionExistsByName(collectionname);
    const smartCollection = await SmartCollection.getCollectionIdbyName(collectionname);
    return await Follow.follow(followerId, smartCollection._id, "collection");
  }

  @Router.delete("/smartcollection/unfollow/:collectionname")
  async unfollowSmartCollection(session: WebSessionDoc, collectionname: string) {
    const followerId = WebSession.getUser(session);
    await SmartCollection.collectionExistsByName(collectionname);
    const smartCollection = await SmartCollection.getCollectionIdbyName(collectionname);
    return await Follow.unfollow(followerId, smartCollection._id, "collection");
  }

  // Get a specific SmartCollection by ID.
  @Router.get("/smartcollection/posts/:collectionname")
  async getSmartCollectionPosts(collectionname: string) {
    return await SmartCollection.getPostsByName(collectionname);
  }

  /**
   * Smart Feed
   */

  @Router.get("/smartfeed/")
  async getSmartFeed(session: WebSessionDoc) {
    //simply return all the posts in the users feed
    const userId = WebSession.getUser(session);
    const followingsIds = await Follow.getAllFollowing(userId, "user");
    //sending the posts to the Smart Feed to get ids of posts filtered according to the current filter
    const { allPosts, postsIdandTags } = await Post.getAllPostsOfFollowings(followingsIds);
    console.log("all", allPosts);
    const filteredPostsIds = await SmartFeed.getPosts(userId, postsIdandTags);
    const filteredFeed = allPosts.filter((post) => filteredPostsIds.includes(post._id));
    return filteredFeed;
  }

  //update filters and return set of posts based on those filters
  @Router.post("/smartfeed/update")
  async updateSmartFeed(session: WebSessionDoc, userInput: string) {
    const tags = await getSmartTags(userInput);
    const userId = WebSession.getUser(session);
    return await SmartFeed.updateSmartFilters(userId, tags);
  }

  // /**
  //  * Generate filters for the authenticated user's SmartFeed based on input.
  //  */
  // @Router.post("/smartfeed/generatefilters")
  // async generateFiltersAndApplyFiltersForUserSmartFeed(session: WebSessionDoc, input: string) {
  //   // TODO
  //   return { session, input };
  // }

  // /**
  //  * Add posts to the 'allPosts' field of the authenticated user's SmartFeed.
  //  */
  // @Router.patch("/smartfeed/addposts")
  // async addPostsToFeed(session: WebSessionDoc, newPosts: { [postId: string]: string[] }) {
  //   // TODO
  //   return { session, newPosts };
  // }

  // /**
  //  * Reset the 'displayedPosts' field of the authenticated user's SmartFeed to include all posts in 'allPosts'.
  //  */
  // @Router.post("/smartfeed/reset")
  // async resetUserSmartFeedDisplayedPosts(session: WebSessionDoc) {
  //   // TODO
  //   return { session };
  // }

  // @Router.delete("/smartfeed/removepost/:postId")
  // async removePostFromUserSmartFeed(session: WebSessionDoc, postId: ObjectId) {
  //   // TODO
  //   return { session, postId };
  // }

  // /**
  //  * Set learning objectives for the authenticated user.
  //  */
  // @Router.post("/aiassistant/setlearningobjectives")
  // async setLearningObjectives(session: WebSessionDoc, learningObjective: string) {
  //   // TODO
  //   return { session, learningObjective };
  // }

  // /**
  //  * Get weekly reset time for AiAssistant.
  //  */
  // @Router.get("/aiassistant/weeklyresettime")
  // async getWeeklyResetTime() {
  //   // TODO
  // }

  // /**
  //  * Fetch AI-generated posts for the authenticated user.
  //  */
  // @Router.get("/aiassistant/aigeneratedposts")
  // async getAiGeneratedPosts(session: WebSessionDoc) {
  //   // TODO
  //   return { session };
  // }

  // /**
  //  * Fetch daily messages from AiAssistant for the authenticated user.
  //  */
  // @Router.get("/aiassistant/dailymsgs")
  // async getDailyMessages(session: WebSessionDoc) {
  //   // TODO
  //   return { session };
  // }

  // @Router.post("/smartsearch/search")
  // async performSmartSearch(query: string, searchedProfile: ObjectId) {
  //   // TODO
  //   return { query, searchedProfile };
  // }

  // /**
  //  * Fetch the search results based on the query.
  //  */
  // @Router.get("/smartsearch/results")
  // async getSearchResults(queryId: ObjectId) {
  //   // TODO
  //   return queryId;
  // }

  // /**
  //  * Fetch the available posts for the search space.
  //  * I.e. all posts from the account being searched (or smart collection)
  //  */
  // @Router.get("/smartsearch/searchspace")
  // async getSearchSpace(searchedProfile: ObjectId) {
  //   // TODO
  //   return { searchedProfile };
  // }

  // //Few additional methods for post and user

  // @Router.patch("/posts/:_id/schedule")
  // async schedulePost(session: WebSessionDoc, _id: ObjectId, date: string) {
  //   // TODO
  //   return { session, _id, date };
  // }

  // @Router.patch("/users/:username/learningobjective")
  // async updateLearningObjective(session: WebSessionDoc, learningObjective: string) {
  //   // TODO
  //   return { session, learningObjective };
  // }

  // /**
  //  * Get the search history of a specific user.
  //  */
  // @Router.get("/users/:username/searchhistory")
  // async getSearchHistory(session: WebSessionDoc) {
  //   // TODO
  //   return session;
  // }
}

export default getExpressRouter(new Routes());
