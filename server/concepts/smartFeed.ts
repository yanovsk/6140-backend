import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotFoundError } from "./errors";

export interface SmartFeedDoc extends BaseDoc {
  owner: ObjectId;
  displayedPosts: ObjectId[];
  feedFilters: string[];
}

export default class SmartFeedConcept {
  public readonly smartFeed = new DocCollection<SmartFeedDoc>("smartFeed");

  async updateSmartFilters(owner: ObjectId, filters: string[]) {
    try {
      const smartFeed = await this.smartFeed.updateOne({ owner }, { feedFilters: filters });
      if (!smartFeed) {
        throw new NotFoundError(`SmartFeed for owner ${owner} not found.`);
      }
      return { msg: "Filters generated!", smartFeed: smartFeed };
    } catch (error) {
      throw new BadValuesError(`Error updating smart filters for owner ${owner}`);
    }
  }

  async createSmartFeed(owner: ObjectId) {
    try {
      const smartFeed = await this.smartFeed.createOne({ owner });
      return { msg: "Smart feed created!", smartFeed: smartFeed };
    } catch (error) {
      throw new BadValuesError(`Error creating smart feed for owner ${owner}`);
    }
  }

  async getPosts(owner: ObjectId, allPosts: { postId: ObjectId; tags: string[] }[]) {
    try {
      const feed = await this.smartFeed.readOne({ owner });
      const feedFilters = feed?.feedFilters;

      if (!feed) {
        throw new NotFoundError(`SmartFeed for owner ${owner} not found.`);
      }

      if (feedFilters) {
        const filteredPosts = allPosts.filter((post) => !post.tags.some((tag) => feedFilters.includes(tag)));
        return filteredPosts.map((post) => post.postId);
      } else {
        return allPosts.map((post) => post.postId);
      }
    } catch (error) {
      throw new NotFoundError(`Error retrieving posts for owner ${owner}`);
    }
  }
}
