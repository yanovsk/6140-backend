import AIAssistantConcept from "./concepts/AIAssistant";
import FollowConcept from "./concepts/follow";
import PostConcept from "./concepts/post";
import SmartCollectionConcept from "./concepts/smartCollection";
import SmartFeedConcept from "./concepts/smartFeed";
import SmartSearchConcept from "./concepts/smartSearch";
import UserConcept from "./concepts/user";
import WebSessionConcept from "./concepts/websession";

// App Definition using concepts
export const WebSession = new WebSessionConcept();
export const User = new UserConcept();
export const Post = new PostConcept();
export const Follow = new FollowConcept();
export const SmartFeed = new SmartFeedConcept();
export const SmartCollection = new SmartCollectionConcept();
export const AIAssistant = new AIAssistantConcept();
export const SmartSearch = new SmartSearchConcept();
