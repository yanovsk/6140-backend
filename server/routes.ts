import { ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Friend, Post, User, WebSession } from "./app";
import { PostDoc, PostOptions } from "./concepts/post";
import { UserDoc } from "./concepts/user";
import { WebSessionDoc } from "./concepts/websession";
import Responses from "./responses";

class Routes {
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
    return await User.create(username, password);
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

  @Router.post("/posts")
  async createPost(session: WebSessionDoc, content: string, options?: PostOptions) {
    const user = WebSession.getUser(session);
    const created = await Post.create(user, content, options);
    return { msg: created.msg, post: await Responses.post(created.post) };
  }

  @Router.patch("/posts/:_id")
  async updatePost(session: WebSessionDoc, _id: ObjectId, update: Partial<PostDoc>) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return await Post.update(_id, update);
  }

  @Router.delete("/posts/:_id")
  async deletePost(session: WebSessionDoc, _id: ObjectId) {
    const user = WebSession.getUser(session);
    await Post.isAuthor(user, _id);
    return Post.delete(_id);
  }

  @Router.get("/friends")
  async getFriends(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.idsToUsernames(await Friend.getFriends(user));
  }

  @Router.delete("/friends/:friend")
  async removeFriend(session: WebSessionDoc, friend: string) {
    const user = WebSession.getUser(session);
    const friendId = (await User.getUserByUsername(friend))._id;
    return await Friend.removeFriend(user, friendId);
  }

  @Router.get("/friend/requests")
  async getRequests(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await Responses.friendRequests(await Friend.getRequests(user));
  }

  @Router.post("/friend/requests/:to")
  async sendFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.sendRequest(user, toId);
  }

  @Router.delete("/friend/requests/:to")
  async removeFriendRequest(session: WebSessionDoc, to: string) {
    const user = WebSession.getUser(session);
    const toId = (await User.getUserByUsername(to))._id;
    return await Friend.removeRequest(user, toId);
  }

  @Router.put("/friend/accept/:from")
  async acceptFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.acceptRequest(fromId, user);
  }

  @Router.put("/friend/reject/:from")
  async rejectFriendRequest(session: WebSessionDoc, from: string) {
    const user = WebSession.getUser(session);
    const fromId = (await User.getUserByUsername(from))._id;
    return await Friend.rejectRequest(fromId, user);
  }

  //initial outline of the design of your RESTful routes
  //returns here are just for the linter

  //create a smartcollection
  @Router.post("/smartcollections")
  async createSmartCollection(topic: string) {
    return topic;
  }

  // Get a specific SmartCollection by ID.
  @Router.get("/smartcollections/:_id")
  async getSmartCollectionById(_id: ObjectId) {
    // TODO
    return _id;
  }

  //Add posts to a SmartCollection.
  @Router.patch("/smartcollections/:_id/addposts")
  async addPostsToSmartCollection(_id: ObjectId, posts: ObjectId[]) {
    // TODO
    return { _id, posts };
  }

  //Remove a post from a SmartCollection (user can only remove their owen post).
  @Router.patch("/smartcollections/:_id/removepost")
  async removePostFromSmartCollection(_id: ObjectId, post: ObjectId) {
    // TODO
    return { _id, post };
  }

  //Follow a SmartCollection.
  @Router.post("/smartcollections/:_id/follow")
  async followSmartCollection(session: WebSessionDoc, _id: ObjectId) {
    // TODO
    return { session, _id };
  }

  //Unfollow a SmartCollection.
  @Router.post("/smartcollections/:_id/unfollow")
  async unfollowSmartCollection(session: WebSessionDoc, _id: ObjectId) {
    // TODO
    return { session, _id };
  }

  /**
   * Generate filters for the authenticated user's SmartFeed based on input.
   */
  @Router.post("/smartfeed/generatefilters")
  async generateFiltersAndApplyFiltersForUserSmartFeed(session: WebSessionDoc, input: string) {
    // TODO
    return { session, input };
  }

  /**
   * Add posts to the 'allPosts' field of the authenticated user's SmartFeed.
   */
  @Router.patch("/smartfeed/addposts")
  async addPostsToFeed(session: WebSessionDoc, newPosts: { [postId: string]: string[] }) {
    // TODO
    return { session, newPosts };
  }

  /**
   * Reset the 'displayedPosts' field of the authenticated user's SmartFeed to include all posts in 'allPosts'.
   */
  @Router.post("/smartfeed/reset")
  async resetUserSmartFeedDisplayedPosts(session: WebSessionDoc) {
    // TODO
    return { session };
  }

  @Router.delete("/smartfeed/removepost/:postId")
  async removePostFromUserSmartFeed(session: WebSessionDoc, postId: ObjectId) {
    // TODO
    return { session, postId };
  }

  /**
   * Set learning objectives for the authenticated user.
   */
  @Router.post("/aiassistant/setlearningobjectives")
  async setLearningObjectives(session: WebSessionDoc, learningObjective: string) {
    // TODO
    return { session, learningObjective };
  }

  /**
   * Get weekly reset time for AiAssistant.
   */
  @Router.get("/aiassistant/weeklyresettime")
  async getWeeklyResetTime() {
    // TODO
  }

  /**
   * Fetch AI-generated posts for the authenticated user.
   */
  @Router.get("/aiassistant/aigeneratedposts")
  async getAiGeneratedPosts(session: WebSessionDoc) {
    // TODO
    return { session };
  }

  /**
   * Fetch daily messages from AiAssistant for the authenticated user.
   */
  @Router.get("/aiassistant/dailymsgs")
  async getDailyMessages(session: WebSessionDoc) {
    // TODO
    return { session };
  }

  @Router.post("/smartsearch/search")
  async performSmartSearch(query: string, searchedProfile: ObjectId) {
    // TODO
    return { query, searchedProfile };
  }

  /**
   * Fetch the search results based on the query.
   */
  @Router.get("/smartsearch/results")
  async getSearchResults(queryId: ObjectId) {
    // TODO
    return queryId;
  }

  /**
   * Fetch the available posts for the search space.
   * I.e. all posts from the account being searched (or smart collection)
   */
  @Router.get("/smartsearch/searchspace")
  async getSearchSpace(searchedProfile: ObjectId) {
    // TODO
    return { searchedProfile };
  }

  //Few additional methods for post and user

  @Router.patch("/posts/:_id/schedule")
  async schedulePost(session: WebSessionDoc, _id: ObjectId, date: string) {
    // TODO
    return { session, _id, date };
  }

  @Router.patch("/users/:username/learningobjective")
  async updateLearningObjective(session: WebSessionDoc, learningObjective: string) {
    // TODO
    return { session, learningObjective };
  }

  /**
   * Get the search history of a specific user.
   */
  @Router.get("/users/:username/searchhistory")
  async getSearchHistory(session: WebSessionDoc) {
    // TODO
    return session;
  }
}

export default getExpressRouter(new Routes());
