import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";

export interface SmartFeedDoc extends BaseDoc {
  userId: ObjectId;
  displayedPosts: ObjectId[];
  allPosts: { [postId: string]: string[] }; // Map of post ID to tags
  feedFilters: string[];
}

export default class SmartFeedConcept {
  public readonly smartFeeds = new DocCollection<SmartFeedDoc>("smartFeeds");

  async generateFiltersFromInput(userId: ObjectId, input: string) {
    // CALLS TO LLM TO CREATE FILTERS from natural language (will be created by next deadline)
    const generatedFilters = [input];

    await this.smartFeeds.updateOne({ userId }, { feedFilters: generatedFilters });
    return { msg: "Filters generated!" };
  }

  async addToAllPosts(userId: ObjectId, newPosts: { [postId: string]: string[] }) {
    const feed = await this.smartFeeds.readOne({ userId });

    if (feed !== null) {
      // Merge existing allPosts with newPosts
      const updatedAllPosts = { ...feed.allPosts, ...newPosts };

      // Keep last 100 posts; assuming Object.keys returns keys in insertion order
      const trimmedAllPosts = Object.fromEntries(Object.entries(updatedAllPosts).slice(-100));

      await this.smartFeeds.updateOne({ userId }, { allPosts: trimmedAllPosts });
      return { msg: "Posts added to allPosts and trimmed to recent 100!" };
    } else {
      throw "feed doesn't exist for this user";
    }
  }

  async applyFiltersToContent(userId: ObjectId) {
    const feed = await this.smartFeeds.readOne({ userId });

    if (feed !== null) {
      const { allPosts, feedFilters } = feed;

      const displayedPosts = Object.keys(allPosts)
        .filter((postId) => allPosts[postId].some((tag) => feedFilters.includes(tag)))
        .map((postId) => new ObjectId(postId));

      await this.smartFeeds.updateOne({ userId }, { displayedPosts });
      return { msg: "Feed has been filtered!" };
    } else {
      throw "feed doesn't exist for this user";
    }
  }

  async resetDisplayedPostsToAll(userId: ObjectId) {
    const feed = await this.smartFeeds.readOne({ userId });

    if (feed !== null) {
      const allPostIds = Object.keys(feed.allPosts).map((postId) => new ObjectId(postId));
      await this.smartFeeds.updateOne({ userId }, { displayedPosts: allPostIds });
      return { msg: "Displayed posts reset to all posts!" };
    } else {
      throw "feed doesn't exist for this user";
    }
  }

  async removePostFromFeed(userId: ObjectId, postId: ObjectId) {
    const feed = await this.smartFeeds.readOne({ userId });

    if (feed !== null) {
      // Remove post from displayedPosts
      const updatedDisplayedPosts = feed.displayedPosts.filter((p) => !p.equals(postId));

      // Remove post from allPosts
      const updatedAllPosts = { ...feed.allPosts };
      delete updatedAllPosts[postId.toHexString()];

      await this.smartFeeds.updateOne({ userId }, { displayedPosts: updatedDisplayedPosts, allPosts: updatedAllPosts });
      return { msg: "Post removed from both displayedPosts and allPosts!" };
    } else {
      throw "feed doesn't exist for this user";
    }
  }
}
