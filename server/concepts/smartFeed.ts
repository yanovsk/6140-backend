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
  // async addToAllPosts(userId: ObjectId, newPosts: { [postId: string]: string[] }) {
  //   const feed = await this.smartFeeds.readOne({ userId });

  //   if (feed !== null) {
  //     // Merge existing allPosts with newPosts
  //     const updatedAllPosts = { ...feed.allPosts, ...newPosts };

  //     // Keep last 100 posts; assuming  Object.keys returns keys in insertion order
  //     const trimmedAllPosts = Object.fromEntries(Object.entries(updatedAllPosts).slice(-100));

  //     await this.smartFeeds.updateOne({ userId }, { allPosts: trimmedAllPosts });
  //     return { msg: "Posts added to allPosts and trimmed to recent 100!" };
  //   } else {
  //     throw "feed doesn't exist for this user";
  //   }
  // }

  // async applyFiltersToContent(userId: ObjectId) {
  //   const feed = await this.smartFeeds.readOne({ userId });

  //   if (feed !== null) {
  //     const { allPosts, feedFilters } = feed;

  //     const displayedPosts = Object.keys(allPosts)
  //       .filter((postId) => allPosts[postId].some((tag) => feedFilters.includes(tag)))
  //       .map((postId) => new ObjectId(postId));

  //     await this.smartFeeds.updateOne({ userId }, { displayedPosts });
  //     return { msg: "Feed has been filtered!" };
  //   } else {
  //     throw "feed doesn't exist for this user";
  //   }
  // }

  // async resetDisplayedPostsToAll(userId: ObjectId) {
  //   const feed = await this.smartFeeds.readOne({ userId });

  //   if (feed !== null) {
  //     const allPostIds = Object.keys(feed.allPosts).map((postId) => new ObjectId(postId));
  //     await this.smartFeeds.updateOne({ userId }, { displayedPosts: allPostIds });
  //     return { msg: "Displayed posts reset to all posts!" };
  //   } else {
  //     throw "feed doesn't exist for this user";
  //   }
  // }

  // async removePostFromFeed(userId: ObjectId, postId: ObjectId) {
  //   const feed = await this.smartFeeds.readOne({ userId });

  //   if (feed !== null) {
  //     // Remove post from displayedPosts
  //     const updatedDisplayedPosts = feed.displayedPosts.filter((p) => !p.equals(postId));

  //     // Remove post from allPosts
  //     const updatedAllPosts = { ...feed.allPosts };
  //     delete updatedAllPosts[postId.toHexString()];

  //     await this.smartFeeds.updateOne({ userId }, { displayedPosts: updatedDisplayedPosts, allPosts: updatedAllPosts });
  //     return { msg: "Post removed from both displayedPosts and allPosts!" };
  //   } else {
  //     throw "feed doesn't exist for this user";
  //   }
  // }
}
