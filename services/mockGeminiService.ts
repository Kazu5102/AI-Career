
import { ChatMessage, StoredConversation, AnalysisData, AIType, IndividualAnalysisData, SkillMatchingResult } from '../types';

// ===================================================================================
//  This is a mock service for development and preview environments.
//  It simulates responses from the backend without making any real API calls.
// ===================================================================================


// --- Utility Functions ---
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const sampleAnalysisData: AnalysisData = {
    keyMetrics: {
        totalConsultations: 3,
        commonIndustries: ['IT', 'メーカー', 'サービス'],
    },
    commonChallenges: [
        { label: 'キャリアパスの悩み', value: 40 },
        { label: '未経験転職の不安', value: 30 },
        { label: 'ワークライフバランス', value: 20 },
        { label: 'スキル不足', value: 10 },
    ],
    careerAspirations: [
        { label: 'スキルアップ', value: 50 },
        { label: 'マネジメント職', value: 25 },
        { label: '社会貢献', value: 15 },
        { label: '独立・起業', value: 10 },
    ],
    commonStrengths: ['学習意欲', 'コミュニケーション能力', '課題解決能力', '正確性', '協調性'],
    overallInsights: `
### 1. 相談者の共通の悩み・課題 (Common Challenges)
- **キャリアの不確実性:** 多くの相談者が、将来のキャリアパスについて漠然とした不安を抱えています。特に、技術職と管理職の分岐点や、未経験分野への挑戦に関する悩みが顕著です。

### 2. キャリアにおける希望・目標の傾向 (Career Aspirations)
- **成長意欲の高さ:** 現状維持よりも、新しいスキルを習得し、自身の市場価値を高めたいというポジティブな意欲が伺えます。

### 3. 総合的なインサイトと提言 (Overall Insights & Recommendations)
- **自己分析のサポート強化:** 自身の強みや適性を客観的に把握できていないケースが多いため、自己分析を促すアセスメントツールや、キャリアコーチングの機会を提供することが有効です。
- **具体的な情報提供:** 未経験転職市場の動向や、マネジメントに必要なスキルセットなど、具体的で実践的な情報を提供することで、相談者の不安を解消し、次の一歩を後押しできます。
`
};

const sampleSkillMatchingResult: SkillMatchingResult = {
    analysisSummary: `
あなたは、**高い学習意欲**と**着実に物事を進める能力**を兼ね備えています。
新しい技術や知識を積極的に学ぶ姿勢は、変化の速い現代のキャリア市場において非常に大きな強みとなります。
また、対話の中から、他者と協力して目標を達成することに喜びを感じる**協調性**も伺えました。
`,
    recommendedRoles: [
        { role: 'Webデベロッパー', reason: '学習意欲と正確性を活かし、高品質なプロダクト開発に貢献できます。', matchScore: 85 },
        { role: 'プロジェクトコーディネーター', reason: 'コミュニケーション能力と計画性を活かし、チームの潤滑油として活躍できます。', matchScore: 78 },
        { role: 'テクニカルサポート', reason: '課題解決能力と丁寧な対話力で、顧客満足度向上に貢献できます。', matchScore: 72 },
    ],
    skillsToDevelop: [
        { skill: 'Git / GitHub', reason: 'チーム開発の基本ツール。バージョン管理能力は必須です。' },
        { skill: 'クラウドサービスの基礎知識 (AWS/GCP)', reason: '現代のWebサービス開発に不可欠なインフラ知識です。' },
    ],
    learningResources: [
        { title: 'Progate - Gitコース', type: 'course', url: 'https://prog-8.com/' },
        { title: 'Udemy - AWS認定クラウドプラクティショナー講座', type: 'course', url: 'https://www.udemy.com/' },
    ],
};

// --- Mock Service Functions ---

export const checkServerStatus = async (): Promise<{status: string}> => {
    await delay(200);
    console.log("[Mock] Server status check: OK");
    return { status: 'ok' };
};


export const getStreamingChatResponse = async (messages: ChatMessage[], aiType: AIType, aiName: string): Promise<ReadableStream<Uint8Array> | null> => {
    console.log("[Mock] getStreamingChatResponse called with:", { messages, aiType, aiName });
    await delay(1500);

    const responseText = "これはデモ用の応答です。AIがあなたの発言を分析し、最適な返信を生成している様子をシミュレートしています。実際の環境では、ここでAIからの返答がストリーミングされます。";
    const chunks = responseText.split(/(、|。)/).filter(Boolean);
    const encoder = new TextEncoder();
    let isClosed = false;
    
    const stream = new ReadableStream({
        async pull(controller) {
            if (isClosed) return;

            if (chunks.length > 0) {
                const chunk = chunks.shift();
                controller.enqueue(encoder.encode(chunk));
                await delay(100);
            } else {
                controller.close();
                isClosed = true;
            }
        },
        cancel() {
            isClosed = true;
        }
    });

    return stream;
};

export const generateSummary = async (chatHistory: ChatMessage[], aiType: AIType, aiName: string): Promise<string> => {
    console.log("[Mock] generateSummary called");
    await delay(2000);
    return `
### デモ用サマリー
- **状況**: これはモックデータです。
- **課題**: サーバー機能が使えないプレビュー環境でも動作確認ができるようにしています。
- **希望**: UIの確認や改善をスムーズに進めること。
    `;
};

export const reviseSummary = async (originalSummary: string, correctionRequest: string): Promise<string> => {
    console.log("[Mock] reviseSummary called");
    await delay(1500);
    return originalSummary + `\n\n### 修正依頼 (デモ)\n- ${correctionRequest}`;
};

export const analyzeConversations = async (summaries: StoredConversation[]): Promise<AnalysisData> => {
    console.log("[Mock] analyzeConversations called");
    await delay(2500);
    return {
        ...sampleAnalysisData,
        keyMetrics: {
            ...sampleAnalysisData.keyMetrics,
            totalConsultations: summaries.length
        }
    };
};

export const analyzeIndividualConversations = async (conversations: StoredConversation[], userId: string): Promise<IndividualAnalysisData> => {
    console.log("[Mock] analyzeIndividualConversations called for user:", userId);
    await delay(2500);
    return {
        userId,
        totalConsultations: conversations.length,
        consultations: conversations.map(c => ({
            dateTime: new Date(c.date).toLocaleString('ja-JP'),
            estimatedDurationMinutes: 15 + Math.floor(Math.random() * 15)
        })),
        keyThemes: ['キャリアパスの悩み', 'スキルアップ', '自己分析'],
        detectedStrengths: ['学習意欲', '協調性', '課題発見能力'],
        areasForDevelopment: ['ポートフォリオ作成', '面接対策'],
        suggestedNextSteps: ['具体的な職種研究', '情報収集の継続'],
        overallSummary: `ユーザー **${userId}** のデモ用個別分析レポートです。
        
- **相談の軌跡**: 複数回の相談を通じて、自己理解が深まっている様子が伺えます。
- **今後の展望**: 具体的なアクションプランの策定が次のステップです。
        `,
        skillMatchingResult: sampleSkillMatchingResult,
        hiddenSkills: [
            { skill: '潜在的なリーダーシップ', reason: 'チームでの成果を重視する発言から、将来的にリーダーシップを発揮する可能性があります。' }
        ]
    };
};

export const generateSummaryFromText = async (textToAnalyze: string): Promise<string> => {
    console.log("[Mock] generateSummaryFromText called");
    await delay(2000);
    return `
### インポートされたテキストのデモサマリー
- **内容**: ${textToAnalyze.substring(0, 100)}...
- **分析**: テキスト内容をAIが分析し、構造化したサマリーを生成する機能のデモです。
    `;
};

export const performSkillMatching = async (conversations: StoredConversation[]): Promise<SkillMatchingResult> => {
    console.log("[Mock] performSkillMatching called");
    await delay(3000);
    return sampleSkillMatchingResult;
};
