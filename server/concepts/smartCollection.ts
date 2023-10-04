import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";

export interface SmartCollectionDoc extends BaseDoc {
  collectionName: string;
  containedPosts: ObjectId[];
  collectionTopic: string;
  collectionFollowers: ObjectId[];
}

export default class SmartCollectionConcept {
  public readonly smartCollections = new DocCollection<SmartCollectionDoc>("smartCollections");

  async createCollection(collectionName: string, collectionTopic: string, containedPosts: ObjectId[]) {
    const _id = await this.smartCollections.createOne({
      collectionName: collectionName,
      containedPosts: containedPosts,
      collectionTopic: collectionTopic,
      collectionFollowers: [],
    });

    return { msg: "SmartCollection successfully created!", smartCollection: await this.smartCollections.readOne({ _id }) };
  }

  async addPostsToCollection(sc: SmartCollectionDoc, posts: ObjectId[]) {
    const updatedPosts = [...sc.containedPosts, ...posts];
    await this.smartCollections.updateOne({ _id: sc._id }, { containedPosts: updatedPosts });
    return { msg: "Posts added to SmartCollection!" };
  }

  async removePostFromCollection(sc: SmartCollectionDoc, post: ObjectId) {
    const updatedPosts = sc.containedPosts.filter((p) => !p.equals(post));
    await this.smartCollections.updateOne({ _id: sc._id }, { containedPosts: updatedPosts });
    return { msg: "Post removed from SmartCollection!" };
  }

  async followCollection(user: ObjectId, c: SmartCollectionDoc) {
    const updatedFollowers = [...c.collectionFollowers, user];
    await this.smartCollections.updateOne({ _id: c._id }, { collectionFollowers: updatedFollowers });
    return { msg: "Followed SmartCollection!" };
  }

  async unfollowCollection(user: ObjectId, c: SmartCollectionDoc) {
    const updatedFollowers = c.collectionFollowers.filter((f) => !f.equals(user));
    await this.smartCollections.updateOne({ _id: c._id }, { collectionFollowers: updatedFollowers });
    return { msg: "Unfollowed SmartCollection!" };
  }
}
