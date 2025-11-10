import "dotenv/config"
import { ChatAlibabaTongyi } from "@langchain/community/chat_models/alibaba_tongyi";
import { HumanMessage } from "@langchain/core/messages";

if (!process.env.AI_API_KEY) {
  throw new Error("请先设置密钥");
}
const qwenTurbo = new ChatAlibabaTongyi({
  model: process.env.AI_MODEL_NAME || "qwen-turbo",
  alibabaApiKey: process.env.AI_API_KEY,
});

const chatMain = async () => {
  const messages = [new HumanMessage("你好！")];
  const res = await qwenTurbo.invoke(messages);
  console.log(res)
};
chatMain()
