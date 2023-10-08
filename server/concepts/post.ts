import { Filter, ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

export interface PostDoc extends BaseDoc {
  author: ObjectId;
  content: string;
  tags: string[];
  timestamp: Date;
}

export default class PostConcept {
  public readonly posts = new DocCollection<PostDoc>("posts");

  async create(author: ObjectId, content: string, tags: string[]) {
    try {
      const timestamp = new Date();
      const _id = await this.posts.createOne({ author, content, tags, timestamp });
      const post = await this.posts.readOne({ _id });
      if (!post) {
        throw new NotFoundError(`Post with ID ${_id} was not found after creation.`);
      }
      return { msg: "Post successfully created!", post };
    } catch (error) {
      throw new BadValuesError("Error creating post");
    }
  }

  async getPosts(query: Filter<PostDoc>) {
    const posts = await this.posts.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return posts;
  }

  async getPostById(_id: ObjectId) {
    const post = await this.posts.readOne({ _id });
    if (!post) {
      throw new NotFoundError(`Post with ID ${_id} not found.`);
    }
    return post;
  }

  async getSmartTagsByPostId(_id: ObjectId) {
    const post = await this.posts.readOne({ _id });
    if (!post) {
      throw new NotFoundError(`Post ${_id} does not exist!`);
    }
    return post;
  }

  async getByAuthor(author: ObjectId) {
    return await this.getPosts({ author });
  }

  async getRecentPostsByAuthor(author: ObjectId) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const posts = await this.posts.readMany(
      { author, timestamp: { $gte: sevenDaysAgo } },
      {
        sort: { timestamp: -1 },
      },
    );
    return posts;
  }

  async getAllPostsOfFollowings(followingsIds: ObjectId[]) {
    const allPosts = [];
    const postsIdandTags = [];

    // Get all posts in parallel
    const allRecentPosts = await Promise.all(followingsIds.map((id) => this.getRecentPostsByAuthor(id)));

    // Flatten the results and extract post ids and tags
    for (const posts of allRecentPosts) {
      allPosts.push(...posts);
      postsIdandTags.push(...posts.map((post) => ({ postId: post._id, tags: post.tags })));
    }

    return { allPosts, postsIdandTags };
  }

  async update(_id: ObjectId, update: Partial<PostDoc>) {
    this.sanitizeUpdate(update);
    await this.posts.updateOne({ _id }, update);
    const updatedPost = await this.posts.readOne({ _id });
    if (!updatedPost) {
      throw new NotFoundError(`Post with ID ${_id} not found after update.`);
    }
    return { msg: "Post successfully updated!", post: updatedPost };
  }

  async delete(_id: ObjectId) {
    try {
      const result = await this.posts.deleteOne({ _id });
      if (result.deletedCount === 0) {
        throw new NotFoundError(`Post with ID ${_id} could not be deleted because it was not found.`);
      }
      return { msg: "Post deleted successfully!" };
    } catch (error) {
      throw new NotFoundError("Error deleting post");
    }
  }

  async isAuthor(user: ObjectId, _id: ObjectId) {
    const post = await this.posts.readOne({ _id });
    if (!post) {
      throw new NotFoundError(`Post ${_id} does not exist!`);
    }
    if (post.author.toString() !== user.toString()) {
      throw new PostAuthorNotMatchError(user, _id);
    }
  }

  private sanitizeUpdate(update: Partial<PostDoc>) {
    // Make sure the update cannot change the author.
    const allowedUpdates = ["content", "tags"];
    for (const key in update) {
      if (!allowedUpdates.includes(key)) {
        throw new NotAllowedError(`Cannot update '${key}' field!`);
      }
    }
  }
}

export class PostAuthorNotMatchError extends NotAllowedError {
  constructor(
    public readonly author: ObjectId,
    public readonly _id: ObjectId,
  ) {
    super("{0} is not the author of post {1}!", author, _id);
  }
}
