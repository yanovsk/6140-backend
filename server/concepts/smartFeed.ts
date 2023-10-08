import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";

export interface SmartFeedDoc extends BaseDoc {
  userId: ObjectId;
  displayedPosts: ObjectId[];
  feedFilters: string[];
}

export default class SmartFeedConcept {
  public readonly smartFeed = new DocCollection<SmartFeedDoc>("smartFeed");

  async updateSmartFilters(userId: ObjectId, filters: string[]) {
    const smartFeed = await this.smartFeed.updateOne({ userId }, { feedFilters: filters });
    return { msg: "Filters generated!", smartFeed: smartFeed };
  }

  async createSmartFeed(userId: ObjectId) {
    const smartFeed = await this.smartFeed.createOne({ userId });
    return { msg: "Smart feed created!", smartFeed: smartFeed };
  }

  async getPosts(userId: ObjectId, allPosts: { postId: ObjectId; tags: string[] }[]) {
    const feed = await this.smartFeed.readOne({ userId });
    const feedFilters = feed?.feedFilters;

    if (feedFilters) {
      //if posts includes at least one tag from the filter array then this post is not included in the feed
      const filteredPosts = allPosts.filter((post) => !post.tags.some((tag) => feedFilters.includes(tag)));
      return filteredPosts.map((post) => post.postId);
    } else {
      return allPosts.map((post) => post.postId);
    }
  }
}
