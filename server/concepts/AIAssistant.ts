import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";

interface DailyPostAndMsg {
  Date: Date;
  postContent: string;
  dailyMessage: string;
}

export interface AIAssistantDoc extends BaseDoc {
  userId: ObjectId;
  weeklyLearningGoal: string;
  learningCycleExpDate: Date;
  dailyPostsAndMsgs: DailyPostAndMsg[];
}

export default class AIAssistantConcept {
  public readonly AIAssistant = new DocCollection<AIAssistantDoc>("AIAssistant");

  //this function is called when user profile is created
  async createAIAssistant(userId: ObjectId) {
    const AIAssistant = await this.AIAssistant.createOne({ userId });
    return { msg: "AI Assistant created!", AIAssistant: AIAssistant };
  }

  async getAIAssistantByUserID(userId: ObjectId) {
    const AIAssistant = await this.AIAssistant.readOne({ userId });
    return AIAssistant;
  }

  async setWeeklyLearningCycle(userID: ObjectId, goal: string, expDate: Date, dailyContent: DailyPostAndMsg[]) {
    const AIAssistant = await this.getAIAssistantByUserID(userID);

    if (AIAssistant) {
      const _id = AIAssistant._id;
      const update = {
        weeklyLearningGoal: goal,
        learningCycleExpDate: expDate,
        dailyPostsAndMsgs: dailyContent,
      };
      await this.AIAssistant.updateOne({ _id }, update);
    }
    const AIAssistantCycle = await this.getAIAssistantByUserID(userID);

    return { msg: "weekly learning objectives are set!", cycle: AIAssistantCycle };
  }
}
