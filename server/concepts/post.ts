import { Filter, ObjectId } from "mongodb";

import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface PostDoc extends BaseDoc {
  author: ObjectId;
  content: string;
  tags: string[];
  timestamp: Date;
}

export default class PostConcept {
  public readonly posts = new DocCollection<PostDoc>("posts");

  async create(author: ObjectId, content: string, tags: string[]) {
    const timestamp = new Date();
    const _id = await this.posts.createOne({ author, content, tags, timestamp });
    return { msg: "Post successfully created!", post: await this.posts.readOne({ _id }) };
  }

  async getPosts(query: Filter<PostDoc>) {
    const posts = await this.posts.readMany(query, {
      sort: { dateUpdated: -1 },
    });
    return posts;
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
    //iterating thru all the followiwngs of the user
    for (const id of followingsIds) {
      //for each following, getting posts for past 7days
      const posts = await this.getRecentPostsByAuthor(id);
      allPosts.push(...posts);
      const postIdandTags = posts.map((post) => ({ postId: post._id, tags: post.tags }));
      postsIdandTags.push(...postIdandTags);
    }
    return { allPosts, postsIdandTags };
  }

  async update(_id: ObjectId, update: Partial<PostDoc>) {
    this.sanitizeUpdate(update);
    await this.posts.updateOne({ _id }, update);
    return { msg: "Post successfully updated!", post: await this.posts.readOne({ _id }) };
  }

  async delete(_id: ObjectId) {
    await this.posts.deleteOne({ _id });
    return { msg: "Post deleted successfully!" };
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
