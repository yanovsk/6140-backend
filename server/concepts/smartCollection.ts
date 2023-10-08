import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotFoundError } from "./errors";

export interface SmartCollectionDoc extends BaseDoc {
  collectionTopic: string;
  collectionTags: string[];
  containedPosts: ObjectId[];
  collectionName: string; //like a username
}

// return await SmartCollection.create(topic, collectionId, tags, posts);

export default class SmartCollectionConcept {
  public readonly smartCollections = new DocCollection<SmartCollectionDoc>("smartCollections");

  async create(collectionTopic: string, collectionTags: string[], collectionName: string, containedPosts: ObjectId[]) {
    try {
      const _id = await this.smartCollections.createOne({
        collectionTopic: collectionTopic,
        collectionTags: collectionTags,
        containedPosts: containedPosts,
        collectionName: collectionName,
      });
      const smartCollection = await this.smartCollections.readOne({ _id });
      if (!smartCollection) {
        throw new NotFoundError("SmartCollection could not be retrieved after creation.");
      }
      return { msg: "SmartCollection successfully created!", smartCollection: smartCollection };
    } catch (error) {
      throw new BadValuesError(`Error creating SmartCollection`);
    }
  }

  async getById(_id: ObjectId) {
    const SmartCollection = await this.smartCollections.readOne({ _id });
    if (SmartCollection === null) {
      throw new NotFoundError("no collection found");
    }
    return { msg: "collection retrieved", smartCollection: SmartCollection };
  }
  async getByName(name: string) {
    const SmartCollection = await this.smartCollections.readOne({ collectionName: name });
    if (SmartCollection === null) {
      throw new NotFoundError("no collection found");
    }
    return { msg: "collection retrieved", smartCollection: SmartCollection };
  }
  async getCollectionIdbyTopic(topic: string) {
    console.log("searching for", topic);
    const SmartCollection = await this.smartCollections.readOne({ collectionTopic: topic });
    if (SmartCollection === null) {
      throw new NotFoundError("no collection found");
    }
    return { msg: "collection retrieved", _id: SmartCollection._id };
  }
  async addPostToCollection(collectionId: ObjectId, postId: ObjectId) {
    try {
      const { posts } = await this.getPostsById(collectionId);
      const validatedPosts = posts ?? [];
      const updatedPosts = [...validatedPosts, postId];
      await this.smartCollections.updateOne({ _id: collectionId }, { containedPosts: updatedPosts });
      return { msg: "Collection retrieved", posts: await this.getPostsById(collectionId) };
    } catch (error) {
      throw new BadValuesError(`Error adding post to collection: `);
    }
  }

  async getCollectionIdbyName(name: string) {
    const SmartCollection = await this.smartCollections.readOne({ collectionName: name });
    if (SmartCollection === null) {
      throw new NotFoundError("no collection found");
    }
    return { msg: "collection retrieved", _id: SmartCollection._id };
  }

  async collectionExistsById(_id: ObjectId) {
    const SmartCollection = await this.smartCollections.readOne({ _id });
    if (SmartCollection === null) {
      throw new NotFoundError("no collection found");
    }
    return { msg: "Collection exists" };
  }

  async collectionExistsByName(name: string) {
    const SmartCollection = await this.smartCollections.readOne({ collectionName: name });
    if (SmartCollection === null) {
      throw new NotFoundError("no collection found");
    }
    return { msg: "Collection exists" };
  }

  async getPostsById(_id: ObjectId) {
    const SmartCollection = await this.smartCollections.readOne({ _id });
    if (SmartCollection === null) {
      throw new NotFoundError("no collection found");
    }
    return { msg: "Posts of smart collection retrieved", posts: SmartCollection.containedPosts };
  }

  async getPostsByName(name: string) {
    const SmartCollection = await this.smartCollections.readOne({ collectionName: name });
    if (SmartCollection === null) {
      throw new NotFoundError("no collection found");
    }
    if (SmartCollection.containedPosts.length === 0) {
      return { msg: "smart collection has no posts" };
    } else {
      return { msg: "Posts of smart collection retrieved", posts: SmartCollection.containedPosts };
    }
  }

  async getAllSmartCollections() {
    const SmartCollections = await this.smartCollections.readMany({});

    if (SmartCollections === null) {
      throw new NotFoundError("couldn't retrieve smart colleciton");
    }

    return SmartCollections;
  }
}
