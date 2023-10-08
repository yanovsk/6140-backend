import { ObjectId } from "mongodb";
import DocCollection, { BaseDoc } from "../framework/doc";
import { BadValuesError, NotAllowedError, NotFoundError } from "./errors";

interface DailyPostAndMsg {
  Date: Date;
  postContent: string;
  dailyMessage: string;
}

export interface AIAssistantDoc extends BaseDoc {
  owner: ObjectId;
  weeklyLearningGoal: string;
  learningCycleExpDate: Date;
  dailyPostsAndMsgs: DailyPostAndMsg[];
}

export default class AIAssistantConcept {
  public readonly AIAssistant = new DocCollection<AIAssistantDoc>("AIAssistant");

  async createAIAssistant(owner: ObjectId) {
    try {
      const AIAssistant = await this.AIAssistant.createOne({ owner });
      return { msg: "AI Assistant created!", AIAssistant: AIAssistant };
    } catch (error) {
      throw new BadValuesError(`Error creating AI Assistant for owner ${owner}`);
    }
  }

  async getAIAssistantByUserID(owner: ObjectId) {
    const AIAssistant = await this.AIAssistant.readOne({ owner });
    if (!AIAssistant) {
      throw new NotFoundError(`AI Assistant not found for user ${owner}`);
    }
    return AIAssistant;
  }

  async setWeeklyLearningCycle(userID: ObjectId, goal: string, expDate: Date, dailyContent: DailyPostAndMsg[]) {
    try {
      const AIAssistant = await this.getAIAssistantByUserID(userID);

      if (!AIAssistant) {
        throw new NotFoundError(`No AI Assistant found for user ${userID}`);
      }

      const update = {
        weeklyLearningGoal: goal,
        learningCycleExpDate: expDate,
        dailyPostsAndMsgs: dailyContent,
      };
      await this.AIAssistant.updateOne({ _id: AIAssistant._id }, update);
      const AIAssistantCycle = await this.getAIAssistantByUserID(userID);

      return { msg: "Weekly learning objectives are set!", cycle: AIAssistantCycle };
    } catch (error) {
      throw new NotAllowedError(`Error setting weekly learning cycle for user ${userID}`);
    }
  }
}
