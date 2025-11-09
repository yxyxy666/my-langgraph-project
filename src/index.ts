import 'dotenv/config';
import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { messagesStateReducer } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';

// 定义状态结构
const StateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
});

// 初始化聊天模型
const model = new ChatOpenAI({
  model: process.env.OPENAI_MODEL_NAME,
  temperature: 0.7,
});

// 聊天节点 - 处理用户消息并生成回复
const chatNode = async (state: typeof StateAnnotation.State) => {
  console.log('🤖 正在处理消息...');

  try {
    // 调用 LLM 生成回复
    const response = await model.invoke(state.messages);

    return {
      messages: [response],
    };
  } catch (error) {
    console.error('❌ 模型调用失败:', error);

    // 返回错误消息
    return {
      messages: [
        new AIMessage({
          content:
            '抱歉，我遇到了一些技术问题。请检查你的 API 密钥配置或网络连接。',
        }),
      ],
    };
  }
};

// 构建图
const createChatGraph = () => {
  return new StateGraph(StateAnnotation)
    .addNode('chat', chatNode)
    .addEdge(START, 'chat')
    .addEdge('chat', END)
    .compile();
};

// 主函数
async function main() {
  console.log('🤖 LangGraph 助手已启动！\n');

  // 创建图实例
  const graph = createChatGraph();

  // 测试对话
  const testMessages = ['你好，请介绍一下自己', '今天天气怎么样？'];

  for (const userMessage of testMessages) {
    console.log(`用户: ${userMessage}`);

    try {
      // 调用图处理消息
      const result = await graph.invoke({
        messages: [new HumanMessage({ content: userMessage })],
      });

      // 获取最后一条消息（AI 的回复）
      const lastMessage = result.messages[result.messages.length - 1];
      console.log(`助手: ${lastMessage.content}\n`);
    } catch (error) {
      console.error('❌ 处理消息时出错:', error);
      console.log('助手: 抱歉，我无法处理这个请求。\n');
    }

    // 添加延迟，避免 API 限制
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log('✅ LangGraph 应用运行成功！');
}

// 环境检查函数
function checkEnvironment() {
  const requiredEnvVars = ['OPENAI_API_KEY'];
  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    console.error('❌ 缺少必要的环境变量:');
    missingVars.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    console.error('\n请在 .env 文件中设置这些变量，或者在环境中导出它们。');
    console.error('示例 .env 文件内容:');
    console.error('OPENAI_API_KEY=your_api_key_here');
    process.exit(1);
  }

  console.log('✅ 环境变量检查通过');
}

// API 密钥验证函数
async function validateApiKey() {
  console.log('🔍 验证 API 密钥...');

  try {
    const testModel = new ChatOpenAI({
      model: process.env.OPENAI_MODEL_NAME,
      maxTokens: 10,
    });

    await testModel.invoke([new HumanMessage({ content: 'Hello' })]);

    console.log('✅ API 密钥验证成功');
    return true;
  } catch (error) {
    console.error('❌ API 密钥验证失败:', String(error));
    console.error('\n请检查:');
    console.error('1. OPENAI_API_KEY 是否正确设置');
    console.error('2. API 密钥是否有效且有足够的配额');
    console.error('3. 网络连接是否正常');
    return false;
  }
}

// 启动应用
async function startApp() {
  try {
    // 检查环境
    checkEnvironment();

    // 验证 API 密钥
    const isValidKey = await validateApiKey();
    if (!isValidKey) {
      process.exit(1);
    }

    // 运行主程序
    await main();
  } catch (error) {
    console.error('❌ 应用启动失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件，启动应用
if (require.main === module) {
  startApp();
}

// 导出函数供其他模块使用
export { createChatGraph, checkEnvironment, validateApiKey };