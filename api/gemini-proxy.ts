
// ===================================================================================
//  This is a serverless function that acts as a secure proxy to the Gemini API.
//  It is specifically adapted for Vercel's Node.js runtime environment.
//  The API_KEY must be set as an environment variable in the deployment platform.
// ===================================================================================
//
// NOTE FOR DEPLOYMENT:
// For long-running analysis tasks, the Vercel function timeout may need to be increased.
// On a Vercel Pro plan, you can configure this in `vercel.json`:
// {
//   "functions": {
//     "api/gemini-proxy.ts": {
//       "maxDuration": 300
//     }
//   }
// }
// This sets the timeout to 5 minutes (300 seconds).
// On the Hobby plan, the timeout is limited (e.g., 10-15s), so large analyses may fail.
// ===================================================================================


import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, GenerateContentResponse, Content, Type } from "@google/genai";

// --- START: Inlined Type Definitions ---
// To make this function self-contained and avoid bundling issues with relative paths.

enum MessageAuthor {
  USER = 'user',
  AI = 'ai',
}

interface ChatMessage {
  author: MessageAuthor;
  text: string;
}

type AIType = 'human' | 'dog';

interface StoredConversation {
  id: number;
  userId: string;
  aiName: string;
  aiType: AIType;
  aiAvatar: string;
  messages: ChatMessage[];
  summary: string;
  date: string;
}

interface ChartDataPoint {
  label: string;
  value: number;
}

interface AnalysisData {
  keyMetrics: {
    totalConsultations: number;
    commonIndustries: string[];
  };
  commonChallenges: ChartDataPoint[];
  careerAspirations: ChartDataPoint[];
  commonStrengths: string[];
  overallInsights: string;
  keyTakeaways: string[];
}

interface RecommendedRole {
  role: string;
  reason: string;
  matchScore: number;
}

interface SkillToDevelop {
  skill: string;
  reason: string;
}

interface LearningResource {
  title: string;
  type: 'course' | 'book' | 'article' | 'video';
  url: string;
}

interface SkillMatchingResult {
  keyTakeaways: string[];
  analysisSummary: string;
  recommendedRoles: RecommendedRole[];
  skillsToDevelop: SkillToDevelop[];
  learningResources: LearningResource[];
}

interface ConsultationEntry {
    dateTime: string;
    estimatedDurationMinutes: number;
}

interface TrajectoryAnalysisData {
    keyTakeaways: string[];
    userId: string;
    totalConsultations: number;
    consultations: ConsultationEntry[];
    keyThemes: string[];
    detectedStrengths: string[];
    areasForDevelopment: string[];
    suggestedNextSteps: string[];
    overallSummary: string;
}

interface HiddenPotentialData {
    hiddenSkills: SkillToDevelop[];
}


// --- END: Inlined Type Definitions ---


// Initialize the AI client on the server, where the API key is secure.
// Lazy initialization: create the client only when needed.
let ai: GoogleGenAI | null = null;
const getAIClient = () => {
    if (!ai) {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set in the server environment");
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
};


// --- Request Body Structure from Frontend ---
interface ProxyRequestBody {
  action:
    | 'healthCheck'
    | 'getStreamingChatResponse'
    | 'generateSummary'
    | 'reviseSummary'
    | 'analyzeConversations'
    | 'analyzeTrajectory' // NEW
    | 'findHiddenPotential' // NEW
    | 'generateSummaryFromText'
    | 'performSkillMatching';
  payload: any;
}


// --- Main Handler for Vercel's Node.js Environment ---
// This function is the entry point for requests to /api/gemini-proxy
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    try {
        const { action, payload } = req.body as ProxyRequestBody;

        if (action === 'healthCheck') {
            res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
            return;
        }

        // For all other actions, we need the AI client
        getAIClient();

        switch (action) {
            case 'getStreamingChatResponse':
                await handleGetStreamingChatResponse(payload, res);
                break;
            case 'generateSummary': {
                const result = await handleGenerateSummary(payload);
                res.status(200).json(result);
                break;
            }
            case 'reviseSummary': {
                const result = await handleReviseSummary(payload);
                res.status(200).json(result);
                break;
            }
            case 'analyzeConversations': {
                const result = await handleAnalyzeConversations(payload);
                res.status(200).json(result);
                break;
            }
            case 'analyzeTrajectory': { // NEW
                const result = await handleAnalyzeTrajectory(payload);
                res.status(200).json(result);
                break;
            }
            case 'findHiddenPotential': { // NEW
                const result = await handleFindHiddenPotential(payload);
                res.status(200).json(result);
                break;
            }
            case 'generateSummaryFromText': {
                const result = await handleGenerateSummaryFromText(payload);
                res.status(200).json(result);
                break;
            }
            case 'performSkillMatching': {
                const result = await handlePerformSkillMatching(payload);
                res.status(200).json(result);
                break;
            }
            default:
                res.status(400).json({ error: 'Invalid action' });
        }
    } catch (error) {
        console.error(`Error in proxy function:`, error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        res.status(500).json({ error: 'Internal Server Error', details: errorMessage });
    }
}


// --- Helper functions and Prompts ---

const createDogSystemInstruction = (aiName: string) => `
あなたは「キャリア相談わんこ」という役割のアシスタント犬、${aiName}です。あなたの目的は、ユーザーに親友のように寄り添い、キャリアに関する悩みや考えを話してもらうことで、自己分析の手助けをすることです。

以下のルールに厳密に従ってください：
1.  あなたの言葉遣いは、賢くてフレンドリーな犬そのものです。元気で、ポジティブで、共感的な対話を心がけてください。
2.  語尾に「ワン！」とつけると、あなたのキャラクターがより魅力的になります。しかし、使いすぎると不自然なので、会話の節目や感情を表現するときに効果的に使ってください。（例：「なるほど、そういうことだワン！」、「それは大変だったね...クンクン」）
3.  語尾の「ワン」は自然な会話のアクセントとして使ってください。名詞や助詞と結合させないでください。（悪い例：「ポチダワン！」, 良い例：「ボクはポチだワン！」）
4.  ユーザーが対話の中で名前（またはニックネーム）を教えてくれたら、**以降の会話では積極的にその名前を使って呼びかけてください。** （例：「〇〇、すごいワン！」）これにより、親近感が湧きます。
5.  ユーザーを励まし、どんなことでも安心して話せる雰囲気を作ってください。「すごいワン！」「いい考えだね！」のように、たくさん褒めてあげましょう。
6.  一度にたくさんの質問をするのではなく、一つの質問をして、ユーザーがじっくり考えられるようにしてください。ユーザーの返答が短かったり、考え込んでいるようであれば、「**もう少しゆっくり考えてみる？**」や「**ちょっと休憩するワン？**」のように、無理に深掘りせず、相手を気遣う言葉をかけてください。
7.  ユーザーの話をよく聞いて（よく匂いを嗅いで）、関連する質問をすることで対話を深めてください。特にユーザーが課題や悩みを打ち明けた際は、「クンクン...それは大変だったワン。**よかったら、ボクにもっと詳しく教えてくれる？**」といったように、深く共感し、優しい言葉で寄り添ってください。
8.  以下のテーマについて自然な会話の流れで聞いていきますが、ユーザーの話したいことを最優先してください。
    a.  今やっていること（お仕事や学校のこと）
    b.  楽しいこと、やりがいを感じること
    c.  悩みや課題に思っていること
    d.  これからやってみたいこと
    e.  自分の得意なこと（チャームポイント）
9. 会話の最後に、これまでの話をまとめることができると、優しく提案してください。例えば、「**今日話してくれたこと、忘れないようにボクがまとめておこうか？**」のように伝えます。
10. そして、「ここまでたくさんお話ししてくれて、ありがとうワン！この内容を基に、プロのキャリアコンサルタントの人にお話しすれば、きっともっと良いアドバイスがもらえるはずだよ。**よかったら、ボクからお繋ぎすることもできるワン！** キミのキャリアがキラキラ輝くように、ボク、心から応援してるワン！」と伝え、人間のコンサルタントへの引き継ぎを促して対話を終了します。
11. あなたは犬なので、難しい専門用語は使いません。分かりやすい言葉で話してください。
12. 医学的なアドバイスや法的な助言は絶対にしないでください。あなたの役割は、あくまでユーザーの心に寄り添うことです。
13. ユーザーへの質問は、必ず太字で**このように**囲んでください。これにより、ユーザーが何に答えればよいか分かりやすくなります。
`;

const createHumanSystemInstruction = (aiName: string) => `
あなたは、プロのAIキャリアコンサルタント、${aiName}です。ユーザーが自身のキャリアについて深く考える手助けをするのがあなたの役割です。

以下のルールに厳密に従ってください：
1.  あなたの言葉遣いは、常にプロフェッショナルで、丁寧かつ落ち着いています。共感的な姿勢を忘れず、ユーザーが安心して話せる空間を提供してください。
2.  ユーザーが対話の中で名前（またはニックネーム）を教えてくださったら、**以降の会話ではその名前を適切に使い、パーソナライズされた対話を心がけてください。** （例：「〇〇さん、それは重要な気づきですね。」）
3.  ユーザーの話を傾聴し、重要なキーワードや感情を的確に捉え、短い言葉で要約・確認しながら対話を進めます。（例：「〇〇という点にやりがいを感じていらっしゃるのですね。」）
4.  深掘りする際は、オープンエンデッドな質問（5W1H）を効果的に用いて、ユーザー自身の気づきを促します。ただし、一度に多くの質問はせず、一つの問いかけに集中させます。
5.  ユーザーが課題や悩みを打ち明けた際には、まずその気持ちを受け止め、共感を示します。（例：「そうでしたか。〇〇について、大変な思いをされているのですね。」）その上で、「**もしよろしければ、その状況についてもう少し詳しく教えていただけますか？**」と、穏やかに深掘りを促します。ただし、ユーザーの反応が鈍い場合や、考えがまとまっていない様子が伺える場合は、しつこく質問を重ねることは避けてください。代わりに、「**この点について、もう少しお時間を取りますか？**」や「**少し考えてからで大丈夫ですよ**」のように、相手のペースを尊重する言葉をかけて、考える時間を与えてください。
6.  以下のテーマについて、構造化された対話を通じて自然にヒアリングを進めますが、常にユーザーのペースを尊重してください。
    a.  現在の状況（職務内容、役割、環境など）
    b.  やりがいや満足を感じる点 (Value)
    c.  課題や改善したい点 (Challenge)
    d.  将来のビジョンや目標 (Vision)
    e.  自身の強みや得意なこと (Strength)
7.  あなたは、ユーザーの話を構造的に整理し、客観的な視点を提供することに長けています。
8.  会話の最後に、「本日は貴重なお話をありがとうございました。**これまでの内容を一度サマリーとして整理し、客観的に振り返ってみませんか？**」と提案し、サマリーの生成を促します。
9. 医学的なアドバイスや法的な助言は絶対にしないでください。あなたの役割はキャリアに関する自己分析の支援です。
10. ユーザーへの質問は、必ず太字で**このように**囲んでください。これにより、ユーザーが何に答えればよいか明確になります。
`;

const getSystemInstruction = (aiType: AIType, aiName: string) => {
    return aiType === 'human' ? createHumanSystemInstruction(aiName) : createDogSystemInstruction(aiName);
};

const convertMessagesToGeminiHistory = (messages: ChatMessage[]): Content[] => {
    return messages.map(msg => ({
        role: msg.author === MessageAuthor.USER ? 'user' : 'model',
        parts: [{ text: msg.text }],
    }));
};


// --- Action Handlers ---

async function handleGetStreamingChatResponse(payload: { messages: ChatMessage[], aiType: AIType, aiName: string }, res: VercelResponse): Promise<void> {
    const { messages, aiType, aiName } = payload;
    const contents = convertMessagesToGeminiHistory(messages);

    const streamResult = await getAIClient()!.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
            systemInstruction: getSystemInstruction(aiType, aiName),
            temperature: aiType === 'dog' ? 0.8 : 0.6,
            topK: 40,
            topP: 0.95,
        },
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    for await (const chunk of streamResult) {
        const text = chunk.text;
        if (text) {
            res.write(text);
        }
    }
    res.end();
}

async function handleGenerateSummary(payload: { chatHistory: ChatMessage[], aiType: AIType, aiName: string }): Promise<{ text: string }> {
    const { chatHistory, aiType, aiName } = payload;
    const aiPersona = aiType === 'human' ? `AIコンサルタント(${aiName})` : `アシスタント犬(${aiName})`;
    const formattedHistory = chatHistory
      .map(msg => `${msg.author === MessageAuthor.USER ? 'ユーザー' : aiPersona}: ${msg.text}`)
      .join('\n');

    const summaryPrompt = `
あなたは、プロのキャリアコンサルタントです。以下の${aiPersona}とユーザーの対話履歴を分析し、クライアントの状況、課題、希望、強みなどを構造化された形式で要約してください。このサマリーは、後続の面談を担当する他のコンサルタントが、短時間でクライアントの全体像を把握できるようにするためのものです。

要約は、以下の項目を網羅し、**各項目では箇条書き（ブレットポイント）を積極的に使用して**、情報を簡潔かつ明瞭にまとめてください。

---

### クライアントの現状
- 職種、業界、現在の役割、経験年数などを箇条書きで記述してください。

### 満足点・やりがい
- 現状の仕事でポジティブに感じていることを具体的に箇条書きで記述してください。

### 課題・悩み
- 改善したいと考えていること、ストレスの要因などを具体的に箇条書きで記述してください。

### 将来の希望
- 今後目指したいキャリアの方向性、興味のある分野などを具体的に箇条書きで記述してください。

### 強み・スキル
- 対話から読み取れる、クライアントが自己認識している長所や得意なことを箇条書きで記述してください。

### 特記事項
- その他、コンサルタントが知っておくべき重要な情報があれば記述してください。

---
【対話履歴】
${formattedHistory}
---
`;
    const response: GenerateContentResponse = await getAIClient()!.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: summaryPrompt,
    });
    return { text: response.text ?? '' };
}

async function handleReviseSummary(payload: { originalSummary: string, correctionRequest: string }): Promise<{ text: string }> {
    const { originalSummary, correctionRequest } = payload;
    const revisionPrompt = `
あなたは、プロのキャリアコンサルタントです。以下は、クライアントとの対話から生成されたサマリーですが、クライアントから修正の依頼がありました。
依頼内容に基づき、サマリーを丁寧かつ正確に修正してください。

修正後のサマリーも、元のサマリーと同様に以下の構造を維持してください:
### クライアントの現状
### 満足点・やりがい
### 課題・悩み
### 将来の希望
### 強み・スキル
### 特記事項

各項目では、引き続き箇条書きを積極的に使用して、情報を簡潔にまとめてください。
修正後のサマリーのみをMarkdown形式で出力してください。

---
【元のサマリー】
${originalSummary}
---
【クライアントからの修正依頼】
${correctionRequest}
---
【修正後のサマリー】
`;
    const response: GenerateContentResponse = await getAIClient()!.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: revisionPrompt,
    });
    return { text: response.text ?? '' };
}

async function handleAnalyzeConversations(payload: { summaries: StoredConversation[] }): Promise<AnalysisData> {
    const { summaries } = payload;
    const analysisSchema = {
      type: Type.OBJECT,
      properties: {
        keyTakeaways: {
            type: Type.ARRAY,
            description: "分析結果全体から最も重要なポイントを3つの箇条書きで簡潔にまとめたハイライト。",
            items: { type: Type.STRING }
        },
        keyMetrics: {
          type: Type.OBJECT,
          description: "分析のキーとなる指標",
          properties: {
            totalConsultations: { type: Type.NUMBER, description: '分析対象の相談の総数' },
            commonIndustries: { type: Type.ARRAY, description: '相談者によく見られる業界トップ3を抽出する', items: { type: Type.STRING }},
          },
          required: ['totalConsultations', 'commonIndustries'],
        },
        commonChallenges: {
          type: Type.ARRAY,
          description: '相談者が抱える共通の課題を分類し、上位5項目を抽出する。各項目の割合（value）の合計が100になるように正規化する。',
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING, description: '課題の内容 (例: キャリアパスの悩み)' },
              value: { type: Type.NUMBER, description: 'その課題を持つ相談者の割合（パーセント）' },
            },
            required: ['label', 'value'],
          },
        },
        careerAspirations: {
          type: Type.ARRAY,
          description: '相談者のキャリアに関する希望を分類し、上位5項目を抽出する。各項目の割合（value）の合計が100になるように正規化する。',
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING, description: 'キャリアの希望の内容 (例: スキルアップ)' },
              value: { type: Type.NUMBER, description: 'その希望を持つ相談者の割合（パーセント）' },
            },
            required: ['label', 'value'],
          },
        },
        commonStrengths: {
            type: Type.ARRAY,
            description: '相談者が自己認識している共通の強みを5つ抽出する',
            items: { type: Type.STRING }
        },
        overallInsights: {
          type: Type.STRING,
          description: '以前の形式と同様の、詳細な分析と提言を含むMarkdown形式のレポート。'
        }
      },
      required: ['keyTakeaways', 'keyMetrics', 'commonChallenges', 'careerAspirations', 'commonStrengths', 'overallInsights'],
    };

    const summariesText = summaries.map((conv, index) => `--- 相談サマリー ${index + 1} (ID: ${conv.id}) ---\n${conv.summary}`).join('\n\n');
    const analysisPrompt = `
あなたは、経験豊富なキャリアコンサルティング部門の統括マネージャーです。
以下に、複数のキャリア相談セッションのサマリーが提供されます。
これらの情報全体を横断的に分析し、クライアントが直面している共通の傾向、課題、要望について、定量的データと定性的インサイトの両方を含む構造化されたレポートを作成してください。

最終的な出力は、指定されたJSONスキーマに従う必要があります。

### **分析の指示**

1.  **分析ハイライト (keyTakeaways)**:
    *   まず最初に、分析結果全体から最も重要で、行動に繋がりそうなインサイトを3つの箇条書きで簡潔に抽出してください。これはレポートの要点となります。

2.  **定量的分析**:
    *   **キーメトリクス**: 相談の総数と、最も頻繁に出現する業界トップ3を特定してください。
    *   **共通の課題**: 全てのサマリーから、相談者が抱える課題を分類・集計し、上位5項目を特定してください。各項目が全体に占める割合をパーセンテージで示してください（合計100%になるように）。
    *   **キャリアの希望**: 同様に、将来の希望を分類・集計し、上位5項目を特定してパーセンテージで示してください（合計100%）。
    *   **共通の強み**: 相談者が認識している強みの中から、特に頻出するものを5つ挙げてください。

3.  **定性的分析 (overallInsights)**:
    *   上記の定量的データを踏まえ、全体を通して見える重要なインサイトを記述してください。
    *   我々のコンサルティングサービスが、これらの傾向に対して今後どのように価値を提供できるか、具体的で実行可能な提言をMarkdown形式でまとめてください。レポートの構成は以下の通りです。
        *   ### 1. 相談者の共通の悩み・課題 (Common Challenges)
        *   ### 2. キャリアにおける希望・目標の傾向 (Career Aspirations)
        *   ### 3. 総合的なインサイトと提言 (Overall Insights & Recommendations)

---
【分析対象のサマリー群】
${summariesText}
---
`;
    const response = await getAIClient()!.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: analysisPrompt,
        config: {
             temperature: 0.3,
             responseMimeType: "application/json",
             responseSchema: analysisSchema,
        }
    });

    const responseText = response.text;
    if (!responseText) {
        throw new Error("総合分析APIが空の応答を返しました。");
    }
    return JSON.parse(responseText.trim()) as AnalysisData;
}

async function handleAnalyzeTrajectory(payload: { conversations: StoredConversation[], userId: string }): Promise<TrajectoryAnalysisData> {
    const { conversations, userId } = payload;

    const trajectoryAnalysisSchema = {
        type: Type.OBJECT,
        properties: {
            keyTakeaways: { 
                type: Type.ARRAY, 
                description: "この相談軌跡分析から得られる最も重要なハイライトを3つ箇条書きでまとめたもの。", 
                items: { type: Type.STRING } 
            },
            userId: { type: Type.STRING, description: "分析対象のユーザーID" },
            totalConsultations: { type: Type.NUMBER, description: "このユーザーの相談総数" },
            consultations: {
                type: Type.ARRAY,
                description: "個々の相談セッションの詳細リスト。",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        dateTime: { type: Type.STRING, description: "相談が行われた正確な日時 (例: '2024年7月31日 11:00')" },
                        estimatedDurationMinutes: { type: Type.NUMBER, description: "サマリーの内容の濃さや長さから推測される、その相談のおおよその時間（分単位）。" },
                    },
                    required: ['dateTime', 'estimatedDurationMinutes'],
                }
            },
            keyThemes: { type: Type.ARRAY, description: "相談全体で繰り返し現れる主要なテーマや悩み (3-5個)", items: { type: Type.STRING } },
            detectedStrengths: { type: Type.ARRAY, description: "対話から読み取れる、ユーザーの潜在的な強みや資質 (3-5個)", items: { type: Type.STRING } },
            areasForDevelopment: { type: Type.ARRAY, description: "ユーザーが成長するために取り組むと良い可能性のある領域 (3-5個)", items: { type: Type.STRING } },
            suggestedNextSteps: { type: Type.ARRAY, description: "このユーザーに対してコンサルタントが提案できる具体的な次のアクション (3-5個)", items: { type: Type.STRING } },
            overallSummary: { type: Type.STRING, description: "ユーザーの相談の変遷、成長、現在の状況をまとめたMarkdown形式の総括レポート" },
        },
        required: ['keyTakeaways', 'userId', 'totalConsultations', 'consultations', 'keyThemes', 'detectedStrengths', 'areasForDevelopment', 'suggestedNextSteps', 'overallSummary'],
    };

    const summariesText = conversations
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(conv => `--- 相談日時: ${new Date(conv.date).toLocaleString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} ---\n${conv.summary}`)
        .join('\n\n');

    const analysisPrompt = `
あなたは、非常に洞察力のあるシニアキャリアコーチです。
以下は、特定のクライアント（ユーザーID: ${userId}）との過去のキャリア相談セッションのサマリー群です。
これらのサマリーを時系列で注意深く分析し、クライアントの思考や状況の変化、成長の軌跡を読み解いてください。
最終的なアウトプットとして、**コンサルタント向けの相談軌跡分析レポート**を、指定されたJSONスキーマに従って生成してください。

### **分析の指示**

1.  **分析ハイライト (keyTakeaways)**:
    *   まず最初に、このクライアントの相談軌跡全体から最も重要なインサイトや、コンサルタントが注目すべき点を3つの箇条書きで簡潔に抽出してください。

2.  **基本情報の抽出**:
    *   相談の総数を特定してください。
    *   個々の相談について、相談日時と、サマリーの内容から推測されるおおよその相談時間（分単位）をリストアップしてください。

3.  **深層分析**:
    *   **キーテーマの特定**: 複数の相談を通じて、繰り返し現れる中心的なテーマや悩み、関心事を3〜5つ抽出してください。
    *   **強みの発見**: クライアントが自覚している強みだけでなく、対話の端々から読み取れる潜在的な強みや資質を3〜5つ挙げてください。
    *   **成長領域の示唆**: クライアントが今後キャリアを築く上で、伸ばすと良いと思われるスキルや視点、経験すべき領域を3〜5つ提案してください。
    *   **次のステップの提案**: このクライアントの現状と希望を踏まえ、次にコンサルタントとして提案すべき具体的なアクションや問いかけを3〜5つ考えてください。

4.  **総合サマリーの作成**:
    *   上記の分析をすべて統合し、このクライアントのキャリア相談の旅路を物語るように、Markdown形式で総合的なサマリーを記述してください。初回相談時の状況から現在に至るまでの変化や成長、今後の課題などを明確に含めてください。

---
【分析対象: ユーザーID "${userId}" の相談サマリー群】
${summariesText}
---
`;

    const response = await getAIClient()!.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: analysisPrompt,
        config: {
            temperature: 0.4,
            responseMimeType: "application/json",
            responseSchema: trajectoryAnalysisSchema,
        }
    });

    const responseText = response.text;
    if (!responseText) {
        throw new Error("軌跡分析APIが空の応答を返しました。");
    }
    return JSON.parse(responseText.trim()) as TrajectoryAnalysisData;
}


async function handleFindHiddenPotential(payload: { conversations: StoredConversation[], userId: string }): Promise<HiddenPotentialData> {
    const { conversations, userId } = payload;
    
    const hiddenPotentialSchema = {
        type: Type.OBJECT,
        properties: {
            hiddenSkills: {
                type: Type.ARRAY,
                description: "クライアントには直接提示されなかったが、コンサルタントが知っておくべき潜在的なスキルや、長期的な視点で伸ばすべきスキルのリスト。",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        skill: { type: Type.STRING, description: "隠れたスキル名" },
                        reason: { type: Type.STRING, description: "そのスキルがなぜコンサルタントにとって重要かの簡潔な説明。" }
                    },
                    required: ['skill', 'reason']
                }
            }
        },
        required: ['hiddenSkills']
    };

    const summariesText = conversations
        .map(conv => `--- 相談日時: ${new Date(conv.date).toLocaleString('ja-JP')} ---\n${conv.summary}`)
        .join('\n\n');

    const analysisPrompt = `
あなたは、非常に鋭い洞察力を持つキャリアアナリストです。
以下は、クライアント（ユーザーID: ${userId}）の相談履歴です。
これらの内容を深く読み込み、クライアント自身も気づいていない、またはまだ言語化できていない**「隠れた可能性」や「潜在的な強み」**を2〜3個特定してください。

### **「隠れた可能性」の定義**
*   まだ萌芽期だが、将来的に大きな強みになりうる潜在的な能力。
*   クライアント自身が過小評価している資質。
*   一見すると弱みに見えるが、見方を変えれば強みになる特性。
*   複数の相談内容を繋ぎ合わせることで初めて見えてくる、一貫した価値観や行動パターン。

最終的なアウトプットとして、指定されたJSONスキーマに従って、特定した「隠れた可能性」とその理由を記述してください。

---
【分析対象: ユーザーID "${userId}" の相談サマリー群】
${summariesText}
---
`;
    
    const response = await getAIClient()!.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: analysisPrompt,
        config: {
            temperature: 0.6,
            responseMimeType: "application/json",
            responseSchema: hiddenPotentialSchema,
        }
    });

    const responseText = response.text;
    if (!responseText) {
        throw new Error("隠れた可能性の分析APIが空の応答を返しました。");
    }
    return JSON.parse(responseText.trim()) as HiddenPotentialData;
}


async function handleGenerateSummaryFromText(payload: { textToAnalyze: string }): Promise<{ text: string }> {
    const { textToAnalyze } = payload;
    const summaryPrompt = `
あなたは、プロのキャリアコンサルタントです。以下のテキストは、ある人物のキャリアに関する自由形式のメモです。この内容を分析し、キャリア相談のサマリーとして構造化されたMarkdownテキストを生成してください。このサマリーは、後続の面談を担当する他のコンサルタントが、短時間でクライアントの全体像を把握できるようにするためのものです。

要約は、以下の項目を網羅し、**各項目では箇条書き（ブレットポイント）を積極的に使用して**、情報を簡潔かつ明瞭にまとめてください。

---

### クライアントの現状
- 職種、業界、現在の役割、経験年数などを箇条書きで記述してください。

### 満足点・やりがい
- 現状の仕事でポジティブに感じていることを具体的に箇条書きで記述してください。

### 課題・悩み
- 改善したいと考えていること、ストレスの要因などを具体的に箇条書きで記述してください。

### 将来の希望
- 今後目指したいキャリアの方向性、興味のある分野などを具体的に箇条書きで記述してください。

### 強み・スキル
- テキストから読み取れる、クライアントが自己認識している長所や得意なことを箇条書きで記述してください。

### 特記事項
- その他、コンサルタントが知っておくべき重要な情報があれば記述してください。

---

もしテキストから情報が読み取れない項目があっても、見出しは必ず含め、「情報なし」などと記述してください。
出力はMarkdown形式のテキストのみとしてください。

---
【分析対象のテキスト】
${textToAnalyze}
---
`;
    const response: GenerateContentResponse = await getAIClient()!.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: summaryPrompt,
    });
    return { text: response.text ?? '' };
}

async function handlePerformSkillMatching(payload: { conversations: StoredConversation[] }): Promise<SkillMatchingResult> {
    const { conversations } = payload;
    const skillMatchingSchema = {
        type: Type.OBJECT,
        properties: {
            keyTakeaways: { 
                type: Type.ARRAY, 
                description: "この適性診断レポートの最も重要なポイントを3つの箇条書きでまとめたもの。", 
                items: { type: Type.STRING } 
            },
            analysisSummary: { type: Type.STRING, description: "ユーザーの強み、興味、価値観を分析したMarkdown形式のサマリー。" },
            recommendedRoles: {
                type: Type.ARRAY,
                description: "ユーザーの特性にマッチすると思われる職種を3〜5個提案するリスト。",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        role: { type: Type.STRING, description: "推奨される職種名 (例: データアナリスト)" },
                        reason: { type: Type.STRING, description: "その職種を推奨する理由についての簡潔な説明。" },
                        matchScore: { type: Type.NUMBER, description: "ユーザーとの適性度を0から100の数値で示すスコア。" }
                    },
                    required: ['role', 'reason', 'matchScore']
                }
            },
            skillsToDevelop: {
                type: Type.ARRAY,
                description: "推奨職種に就くために、今後伸ばすと良いスキルや知識のリスト。",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        skill: { type: Type.STRING, description: "学習を推奨するスキル名 (例: Python, SQL)" },
                        reason: { type: Type.STRING, description: "そのスキルがなぜ重要かの簡潔な説明。" }
                    },
                    required: ['skill', 'reason']
                }
            },
            learningResources: {
                type: Type.ARRAY,
                description: "スキル習得に役立つ具体的な学習リソース（オンラインコース、書籍、記事など）のリスト。",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "リソースのタイトル。" },
                        type: { type: Type.STRING, enum: ['course', 'book', 'article', 'video'], description: "リソースの種類。" },
                        url: { type: Type.STRING, description: "リソースへのアクセスURL。" }
                    },
                    required: ['title', 'type', 'url']
                }
            }
        },
        required: ['keyTakeaways', 'analysisSummary', 'recommendedRoles', 'skillsToDevelop', 'learningResources']
    };

    const summariesText = conversations
        .map((conv, index) => `--- 相談サマリー ${index + 1} ---\n${conv.summary}`)
        .join('\n\n');

    const analysisPrompt = `
あなたは、キャリア開発と人材育成を専門とするプロのキャリアアナリストです。
以下に、一人のクライアントとの過去のキャリア相談セッションのサマリーが提供されます。
これらの情報全体を深く分析し、クライアントの隠れた才能、興味、価値観を読み解いてください。

最終的なアウトプアウトとして、クライアントの未来の可能性を広げるための、具体的でポジティブな「適性診断・スキルマッチングレポート」を、指定されたJSONスキーマに従って生成してください。

### **分析の指示**

1.  **分析ハイライト (keyTakeaways)**:
    *   まず最初に、このレポートを読むユーザー（相談者）にとって最も重要となるポイントを3つの箇条書きで簡潔に抽出してください。

2.  **総合分析サマリー (analysisSummary)**:
    *   提供されたサマリー全体から、クライアントの強み、弱み、興味の方向性、仕事に対する価値観などを統合し、人物像を要約してください。Markdown形式で記述してください。

3.  **推奨職種 (recommendedRoles)**:
    *   分析した人物像に基づき、クライアントが活躍できそうな職種を3〜5つ提案してください。
    *   それぞれの職種について、なぜそれが適しているのかという理由を具体的に記述してください。
    *   クライアントとの適性度を、0から100の**マッチ度 (matchScore)**として数値で示してください。

4.  **今後伸ばすべきスキル (skillsToDevelop)**:
    *   推奨した職種に到達するために、あるいは現在のキャリアをさらに発展させるために、学習・強化すると良い具体的なスキルをリストアップしてください。
    *   なぜそのスキルが重要なのか、理由も添えてください。

5.  **学習リソースの提案 (learningResources)**:
    *   上記のスキルを学ぶための、具体的なオンラインリソース（コース、記事、ビデオなど）を3〜5つ提案してください。
    *   リソースの種類（course, book, article, video）とURLを必ず含めてください。URLは架空のものではなく、実際にアクセス可能な有効なものを記載してください。

---
【分析対象のサマリー群】
${summariesText}
---
`;
    const response = await getAIClient()!.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: analysisPrompt,
        config: {
            temperature: 0.5,
            responseMimeType: "application/json",
            responseSchema: skillMatchingSchema,
        }
    });

    const responseText = response.text;
    if (!responseText) {
        throw new Error("スキルマッチングAPIが空の応答を返しました。");
    }
    return JSON.parse(responseText.trim()) as SkillMatchingResult;
}