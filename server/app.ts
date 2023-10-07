import FollowConcept from "./concepts/follow";
import PostConcept from "./concepts/post";
import SmartCollectionConcept from "./concepts/smartCollection";
import SmartFeedConcept from "./concepts/smartFeed";
import UserConcept from "./concepts/user";
import WebSessionConcept from "./concepts/websession";
// App Definition using concepts
export const WebSession = new WebSessionConcept();
export const User = new UserConcept();
export const Post = new PostConcept();
export const Follow = new FollowConcept();
export const SmartFeed = new SmartFeedConcept();
export const SmartCollection = new SmartCollectionConcept();
