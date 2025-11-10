import "dotenv/config"
import { StateGraph, MessagesAnnotation, START, END } from '@langchain/langgraph';
import { ChatAlibabaTongyi } from "@langchain/community/chat_models/alibaba_tongyi";
import { HumanMessage } from "@langchain/core/messages";

if (!process.env.AI_API_KEY) {
  throw new Error("请先设置密钥");
}
// 初始化模型
const qwenTurbo = new ChatAlibabaTongyi({
  model: process.env.AI_MODEL_NAME || "qwen-turbo",
  alibabaApiKey: process.env.AI_API_KEY,
});
// 创建节点
const chatNode = async (state: typeof MessagesAnnotation.State) => {
  const res = await qwenTurbo.invoke(state.messages);
  return { messages: [res] };
}

// 创建图
const chatbotGraph = new StateGraph(MessagesAnnotation)
  .addNode("chatbot", chatNode)
  .addEdge(START, "chatbot")
  .addEdge("chatbot", END);

// 编译图
const app = chatbotGraph.compile();

const chatMain = async () => {
  const messages = [new HumanMessage("你好！")];
  const res1 = await app.invoke({ messages });
  console.log('用户:', '你好！')
  console.log('AI:', res1)
  const res2 = await app.invoke({ messages: [new HumanMessage("今天成都天气如何")] });
  console.log('用户:', '今天成都天气如何')
  console.log('AI:', res2)
};
chatMain()
