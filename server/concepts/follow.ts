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
    const followings = await this.following.readMany({ follower, type });
    console.log("followings", follower);
    return followings.map((f) => f.followee);
  }

  async getAllFollowers(followee: ObjectId, type: "user" | "collection") {
    const followers = await this.following.readMany({ followee, type });
    return followers.map((f) => f.follower);
  }

  private async isNotFollowing(follower: ObjectId, followee: ObjectId, type: "user" | "collection") {
    if (follower == followee) {
      throw new SelfFollowError();
    }

    const follow = await this.following.readOne({ follower, followee, type });
    if (follow !== null) {
      throw new AlreadyFollowingError(follower, followee);
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
