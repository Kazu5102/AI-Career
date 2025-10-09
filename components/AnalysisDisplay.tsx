import React from 'react';
import { marked } from 'marked';
import { AnalysisData, UserAnalysisCache, ChartDataPoint, ConsultationEntry, SkillMatchingResult, TrajectoryAnalysisData, RecommendedRole, SkillToDevelop, LearningResource, HiddenPotentialData } from '../types';
import DoughnutChart from './charts/DoughnutChart';
import BarChartIcon from './icons/BarChartIcon';
import PieChartIcon from './icons/PieChartIcon';
import TrendingUpIcon from './icons/TrendingUpIcon';
import ChatIcon from './icons/ChatIcon';
import EditIcon from './icons/EditIcon';
import CheckIcon from './icons/CheckIcon';
import CalendarIcon from './icons/CalendarIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import LightbulbIcon from './icons/LightbulbIcon';
import LinkIcon from './icons/LinkIcon';
import BrainIcon from './icons/BrainIcon';
import SparklesIcon from './icons/SparklesIcon';


interface AnalysisDisplayProps {
    cache: (UserAnalysisCache & { comprehensive?: AnalysisData }) | null | undefined;
}

const chartColors = [ '#0ea5e9', '#34d399', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1' ];

const createMarkup = (markdownText: string | undefined) => {
    if (!markdownText) return { __html: '' };
    return { __html: marked.parse(markdownText, { breaks: true, gfm: true }) as string };
};

// --- Data Validation Helpers ---
const isValidString = (val: any): val is string => typeof val === 'string' && val.length > 0;
const isValidNumber = (val: any): val is number => typeof val === 'number';
const isValidStringArray = (arr: any): arr is string[] => Array.isArray(arr) && arr.every(item => typeof item === 'string');
const isObject = (val: any): val is object => typeof val === 'object' && val !== null;

// --- Reusable Card Components (with enhanced type safety) ---
const KeyTakeawaysCard: React.FC<{ takeaways: string[] | undefined }> = ({ takeaways }) => {
    const safeTakeaways = isValidStringArray(takeaways) ? takeaways : [];
    if (safeTakeaways.length === 0) {
        return null;
    }
    return (
        <div className="bg-sky-50 p-6 rounded-xl shadow-md border border-sky-200">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-sky-100 text-sky-600 p-2 rounded-lg"><SparklesIcon /></div>
                <h3 className="text-lg font-bold text-slate-800">分析ハイライト</h3>
            </div>
            <ul className="space-y-2 list-disc list-inside text-slate-700">
                {safeTakeaways.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
        </div>
    );
};


const MetricCard: React.FC<{ title: string; value: string | number | undefined; icon: React.ReactNode; subValue?: string[] }> = ({ title, value, icon, subValue }) => (
    <div className="bg-white p-4 rounded-xl shadow-md flex items-start gap-4">
        <div className="bg-sky-100 text-sky-600 p-3 rounded-lg">{icon}</div>
        <div>
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value ?? 'N/A'}</p>
            {isValidStringArray(subValue) && (
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-1">
                    {subValue.map((item, index) => <span key={index} className="bg-slate-100 px-2 py-0.5 rounded-full">{item}</span>)}
                </div>
            )}
        </div>
    </div>
);

const ChartSection: React.FC<{ title: string; data: ChartDataPoint[] | undefined; icon: React.ReactNode }> = ({ title, data, icon }) => {
    const chartData = (Array.isArray(data) ? data : [])
        .filter(d => isObject(d) && isValidString(d.label) && isValidNumber(d.value));
        
    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center gap-3 mb-4"><div className="text-slate-500">{icon}</div><h3 className="text-lg font-bold text-slate-800">{title}</h3></div>
            {chartData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="relative h-48 w-48 mx-auto"><DoughnutChart labels={chartData.map(d => d.label)} data={chartData.map(d => d.value)} colors={chartColors} /></div>
                    <ul className="space-y-2 text-sm">{chartData.map((item, index) => <li key={item.label} className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: chartColors[index % chartColors.length] }}></span><span className="text-slate-600">{item.label}</span></div><span className="font-semibold text-slate-800">{item.value.toFixed(1)}%</span></li>)}</ul>
                </div>
            ) : (
                <p className="text-sm text-slate-500">チャートデータを生成できませんでした。</p>
            )}
        </div>
    );
};

const InfoListCard: React.FC<{ title: string; items: string[] | undefined; icon: React.ReactNode; iconBgColor: string, iconColor: string }> = ({ title, items, icon, iconBgColor, iconColor }) => {
    const safeItems = isValidStringArray(items) ? items : [];
    return (
     <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex items-center gap-3 mb-4"><div className={`p-2 rounded-lg ${iconBgColor} ${iconColor}`}>{icon}</div><h3 className="text-lg font-bold text-slate-800">{title}</h3></div>
        <div className="flex flex-wrap gap-2">
            {safeItems.length > 0 ? safeItems.map(item => <span key={item} className="bg-slate-100 text-slate-700 text-sm font-medium px-3 py-1 rounded-full">{item}</span>)
             : <p className="text-sm text-slate-500">該当する項目はありませんでした。</p>}
        </div>
    </div>
    );
};

const ConsultationList: React.FC<{consultations: ConsultationEntry[] | undefined}> = ({consultations}) => {
    const safeConsultations = (Array.isArray(consultations) ? consultations : [])
        .filter(c => isObject(c) && isValidString(c.dateTime) && isValidNumber(c.estimatedDurationMinutes));
        
    return (
    <div className="bg-white p-6 rounded-xl shadow-md"><div className="flex items-center gap-3 mb-4"><div className="text-slate-500"><CalendarIcon /></div><h3 className="text-lg font-bold text-slate-800">相談期間</h3></div><ul className="space-y-2 max-h-48 overflow-y-auto pr-2">{safeConsultations.map((c, index) => <li key={index} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded-md"><div className="flex items-center gap-2"><span className="font-semibold text-slate-800">{c.dateTime}</span></div><span className="text-slate-600 font-medium">約{c.estimatedDurationMinutes}分</span></li>)}{safeConsultations.length === 0 && <p className="text-sm text-slate-500">相談履歴の詳細データがありません。</p>}</ul></div>
    );
};

// --- Section Components for Individual Analysis ---
const TrajectorySection: React.FC<{ data: TrajectoryAnalysisData | undefined }> = ({ data }) => {
    if (!data) return <div className="text-center text-slate-500 p-4">相談の軌跡分析はまだ実行されていません。</div>;
    return <div className="space-y-6">
        <KeyTakeawaysCard takeaways={data.keyTakeaways} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><MetricCard title="相談件数" value={data.totalConsultations} icon={<BarChartIcon />} /></div>
        <ConsultationList consultations={data.consultations} />
        <InfoListCard title="キーテーマ" items={data.keyThemes} icon={<ChatIcon />} iconBgColor="bg-sky-100" iconColor="text-sky-600" />
        <InfoListCard title="検出された強み" items={data.detectedStrengths} icon={<TrendingUpIcon />} iconBgColor="bg-emerald-100" iconColor="text-emerald-600" />
        <InfoListCard title="今後の成長領域" items={data.areasForDevelopment} icon={<EditIcon />} iconBgColor="bg-amber-100" iconColor="text-amber-600" />
        <InfoListCard title="提案される次のステップ" items={data.suggestedNextSteps} icon={<CheckIcon />} iconBgColor="bg-violet-100" iconColor="text-violet-600" />
        <div className="bg-white p-6 rounded-xl shadow-md"><h3 className="text-lg font-bold text-slate-800 mb-4">総合サマリー</h3><article className="prose prose-slate max-w-none" dangerouslySetInnerHTML={createMarkup(data.overallSummary)} /></div>
    </div>;
};

const SkillMatchingSection: React.FC<{ data: SkillMatchingResult | undefined }> = ({ data }) => {
    if (!data) return <div className="text-center text-slate-500 p-4">適性診断はまだ実行されていません。</div>;

    const recommendedRoles = (Array.isArray(data.recommendedRoles) ? data.recommendedRoles : [])
        .filter((r): r is RecommendedRole => isObject(r) && isValidString(r.role) && isValidString(r.reason) && isValidNumber(r.matchScore));
    const skillsToDevelop = (Array.isArray(data.skillsToDevelop) ? data.skillsToDevelop : [])
        .filter((s): s is SkillToDevelop => isObject(s) && isValidString(s.skill) && isValidString(s.reason));
    const learningResources = (Array.isArray(data.learningResources) ? data.learningResources : [])
        .filter((l): l is LearningResource => isObject(l) && isValidString(l.title) && isValidString(l.type) && isValidString(l.provider));


    return <div className="space-y-6">
        <KeyTakeawaysCard takeaways={data.keyTakeaways} />
        <div className="bg-white p-6 rounded-xl shadow-md"><h3 className="text-xl font-bold text-slate-800 border-b-2 border-slate-200 pb-2 mb-4">キャリアプロファイル分析</h3><article className="prose prose-slate max-w-none prose-sm" dangerouslySetInnerHTML={createMarkup(data.analysisSummary)} /></div>
        <div className="bg-white p-6 rounded-xl shadow-md"><div className="flex items-center gap-3 mb-4"><div className="bg-sky-100 text-sky-600 p-2 rounded-lg"><BriefcaseIcon /></div><h3 className="text-lg font-bold text-slate-800">推奨される職種</h3></div><div className="space-y-4">{recommendedRoles.length > 0 ? recommendedRoles.map(role => <div key={role.role} className="bg-slate-50 border border-slate-200 p-4 rounded-lg"><div className="flex justify-between items-start gap-4"><h4 className="font-bold text-md text-sky-800">{role.role}</h4><div className="text-right flex-shrink-0"><p className="text-xs text-slate-500">マッチ度</p><p className="font-bold text-lg text-sky-600">{role.matchScore}%</p></div></div><div className="w-full bg-slate-200 rounded-full h-2.5 my-2"><div className="bg-sky-500 h-2.5 rounded-full" style={{ width: `${role.matchScore}%` }}></div></div><p className="text-sm text-slate-600 mt-2">{role.reason}</p></div>) : <p className="text-sm text-slate-500">推奨される職種はありませんでした。</p>}</div></div>
        <div className="bg-white p-6 rounded-xl shadow-md"><div className="flex items-center gap-3 mb-4"><div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg"><LightbulbIcon /></div><h3 className="text-lg font-bold text-slate-800">伸ばすと良いスキル</h3></div><div className="space-y-3">{skillsToDevelop.length > 0 ? skillsToDevelop.map(skill => <div key={skill.skill} className="bg-slate-50 p-3 rounded-lg"><h4 className="font-semibold text-emerald-800">{skill.skill}</h4><p className="text-sm text-slate-600">{skill.reason}</p></div>) : <p className="text-sm text-slate-500">特に提案されたスキルはありませんでした。</p>}</div></div>
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-violet-100 text-violet-600 p-2 rounded-lg"><LinkIcon /></div>
                <h3 className="text-lg font-bold text-slate-800">おすすめ学習リソース</h3>
            </div>
            <p className="text-xs text-slate-500 bg-slate-100 p-2 rounded-md mb-4">
                リンク切れを防ぎ、常に最新の情報にアクセスできるよう、直接のリンクの代わりに検索リンクを提供しています。タイトルと提供元をご確認の上、公式サイトからアクセスしてください。
            </p>
            <div className="space-y-2">
                {learningResources.length > 0 ? learningResources.map(res => {
                    const searchQuery = encodeURIComponent(`${res.provider} ${res.title}`);
                    const searchUrl = `https://www.google.com/search?q=${searchQuery}`;
                    return (
                        <a href={searchUrl} target="_blank" rel="noopener noreferrer" key={res.title} className="block bg-slate-50 p-3 rounded-lg hover:bg-slate-100 group">
                            <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-violet-800 group-hover:underline">{res.title}</h4>
                                <span className="text-xs font-medium bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">{res.type}</span>
                            </div>
                            <p className="text-sm text-slate-600 mt-1">提供元: <span className="font-semibold">{res.provider}</span></p>
                        </a>
                    );
                }) : <p className="text-sm text-slate-500">おすすめの学習リソースはありませんでした。</p>}
            </div>
        </div>
    </div>;
};

const HiddenPotentialSection: React.FC<{ data: HiddenPotentialData | undefined }> = ({ data }) => {
    if (!data) return <div className="text-center text-slate-500 p-4">隠れた可能性の分析はまだ実行されていません。</div>;
    
    const hiddenSkills = (Array.isArray(data.hiddenSkills) ? data.hiddenSkills : [])
        .filter((s): s is SkillToDevelop => isObject(s) && isValidString(s.skill) && isValidString(s.reason));


    return <div className="bg-yellow-50 border-2 border-dashed border-yellow-300 p-6 rounded-xl shadow-md">
        <div className="flex items-center gap-3 mb-4"><div className="bg-yellow-100 text-yellow-600 p-2 rounded-lg"><BrainIcon /></div><h3 className="text-lg font-bold text-yellow-800">コンサルタント向け: 隠れた可能性</h3></div>
        <p className="text-sm text-yellow-700 mb-4">クライアント本人も気づいていない、または言語化できていない潜在的な強みです。</p>
        <div className="space-y-3">{hiddenSkills.length > 0 ? hiddenSkills.map(skill => <div key={skill.skill} className="bg-white/70 p-3 rounded-lg"><h4 className="font-semibold text-yellow-900">{skill.skill}</h4><p className="text-sm text-slate-600">{skill.reason}</p></div>)
        : <p className="text-sm text-slate-500">特筆すべき隠れた可能性はありませんでした。</p>}</div>
    </div>;
};

// --- Main Component ---
const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ cache }) => {
    if (!cache) return <div className="text-center text-slate-500 p-4">分析データを表示する準備ができました。左のツールキットから分析を実行してください。</div>;
    
    // Comprehensive Analysis View
    if (cache.comprehensive) {
        const data = cache.comprehensive;
        const keyMetrics = data?.keyMetrics;
        
        return (
            <div className="space-y-6">
                 <KeyTakeawaysCard takeaways={data?.keyTakeaways} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <MetricCard title="総相談件数" value={keyMetrics?.totalConsultations} icon={<BarChartIcon />} />
                    <MetricCard title="主な業界" value={(isValidStringArray(keyMetrics?.commonIndustries) && keyMetrics.commonIndustries.length > 0) ? keyMetrics.commonIndustries[0] : 'N/A'} subValue={keyMetrics?.commonIndustries} icon={<TrendingUpIcon />} />
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <ChartSection title="共通の悩み・課題" data={data?.commonChallenges} icon={<PieChartIcon />} />
                    <ChartSection title="キャリアにおける希望" data={data?.careerAspirations} icon={<PieChartIcon />} />
                </div>
                <InfoListCard title="相談者によく見られる強み" items={data?.commonStrengths} icon={<CheckIcon />} iconBgColor="bg-emerald-100" iconColor="text-emerald-600" />
                <div className="bg-white p-6 rounded-xl shadow-md"><h3 className="text-lg font-bold text-slate-800 mb-4">総合的なインサイトと提言</h3><article className="prose prose-slate max-w-none" dangerouslySetInnerHTML={createMarkup(data?.overallInsights)} /></div>
            </div>
        );
    }

    // Individual Analysis View
    return (
        <div className="space-y-8">
            <section><h2 className="text-2xl font-bold text-slate-800 border-b-2 border-sky-200 pb-2">相談の軌跡</h2><div className="mt-4"><TrajectorySection data={cache.trajectory} /></div></section>
            <section><h2 className="text-2xl font-bold text-slate-800 border-b-2 border-sky-200 pb-2">適性診断</h2><div className="mt-4"><SkillMatchingSection data={cache.skillMatching} /></div></section>
            <section><h2 className="text-2xl font-bold text-slate-800 border-b-2 border-sky-200 pb-2">隠れた可能性</h2><div className="mt-4"><HiddenPotentialSection data={cache.hiddenPotential} /></div></section>
        </div>
    );
};

export default AnalysisDisplay;