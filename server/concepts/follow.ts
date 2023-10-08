import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { NotAllowedError, NotFoundError } from "./errors";

export interface FollowDoc extends BaseDoc {
  follower: ObjectId;
  followee: ObjectId;
  type: "user" | "collection";
}

export default class FollowConcept {
  public readonly following = new DocCollection<FollowDoc>("following");

  async follow(follower: ObjectId, followee: ObjectId, type: "user" | "collection") {
    await this.isNotFollowing(follower, followee, type);
    await this.following.createOne({ follower, followee, type });
    return { msg: "Followed!" };
  }

  async unfollow(follower: ObjectId, followee: ObjectId, type: "user" | "collection") {
    const follow = await this.following.popOne({ follower, followee, type });
    if (follow === null) {
      throw new FollowingNotFoundError(follower, followee);
    }
    return { msg: "Unfollowed!" };
  }

  async getAllFollowing(follower: ObjectId, type: "user" | "collection") {
    try {
      const followings = await this.following.readMany({ follower, type });
      console.log("followings", follower);
      return followings.map((f) => f.followee);
    } catch (error) {
      throw new NotFoundError(`Error retrieving followings for user ${follower}`);
    }
  }

  async getAllFollowers(followee: ObjectId, type: "user" | "collection") {
    try {
      const followers = await this.following.readMany({ followee, type });
      return followers.map((f) => f.follower);
    } catch (error) {
      throw new NotFoundError(`Error retrieving followers for user ${followee}`);
    }
  }

  private async isNotFollowing(follower: ObjectId, followee: ObjectId, type: "user" | "collection") {
    try {
      if (follower.equals(followee)) {
        throw new SelfFollowError();
      }

      const follow = await this.following.readOne({ follower, followee, type });
      if (follow !== null) {
        throw new AlreadyFollowingError(follower, followee);
      }
    } catch (error) {
      if (error instanceof AlreadyFollowingError || error instanceof SelfFollowError) {
        throw error; // rethrow to keep the original message
      }
      throw new NotAllowedError("Error checking following status");
    }
  }
}

export class FollowingNotFoundError extends NotFoundError {
  constructor(
    public readonly follower: ObjectId,
    public readonly followee: ObjectId,
  ) {
    super("Following between {0} and {1} does not exist!", follower, followee);
  }
}

export class AlreadyFollowingError extends NotAllowedError {
  constructor(
    public readonly follower: ObjectId,
    public readonly followee: ObjectId,
  ) {
    super("{0} is already following {1}!", follower, followee);
  }
}

export class SelfFollowError extends NotAllowedError {
  constructor() {
    super("You cannot follow yourself");
  }
}
