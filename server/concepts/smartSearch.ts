import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";

export interface SmartSearchDoc extends BaseDoc {
  searchingUserId: ObjectId; //id of the user doing the search
  searchedUserId: ObjectId; //user id being searched
  searchQuery: string;
  searchResults: ObjectId[];
}

interface postIdAndTag {
  postId: ObjectId;
  tags: string[];
}

export default class SmartSearchConcept {
  public readonly smartSearch = new DocCollection<SmartSearchDoc>("smartSearch");

  async search(searchingUserId: ObjectId, searchedUserId: ObjectId, searchQuery: string, searchSpace: postIdAndTag[], tagsToFind: string[]) {
    // Find matching postIds
    const matchingPosts: { post: ObjectId; matchCount: number }[] = [];

    // Iterate through each post and its tags to find matches
    searchSpace.forEach((postAndTag) => {
      let matchCount = 0; // To count the number of matched tags

      postAndTag.tags.forEach((tag) => {
        if (tagsToFind.includes(tag)) {
          matchCount++;
        }
      });

      // If there's a match, keep the post id and match count
      if (matchCount > 0) {
        matchingPosts.push({ post: postAndTag.postId, matchCount });
      }
    });

    //Sort the posts by relevance (descending order of matched tag count)
    matchingPosts.sort((a, b) => b.matchCount - a.matchCount);

    const searchResults = await matchingPosts.map((post) => post.post);

    await this.smartSearch.createOne({
      searchingUserId: searchingUserId,
      searchedUserId: searchedUserId,
      searchQuery: searchQuery,
      searchResults: searchResults,
    });

    //  Return the sorted postIds
    return searchResults;
  }

  async getSearchHistoryByUserId(searchingUserId: ObjectId) {
    return await this.smartSearch.readMany({ searchingUserId });
  }
}
