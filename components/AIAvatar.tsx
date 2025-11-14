import React from 'react';

// NEW: Kotetsu Avatar (Real dog photo)
export const KotetsuAvatar = () => (
    <img 
        src="data:image/jpeg;base64,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"
        alt="虎徹 (チワワとトイプードルのMIX)"
        className="w-full h-full object-cover"
    />
);

export const FemaleAvatar1 = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full object-cover">
        <defs>
            <radialGradient id="grad_female1_skin" cx="50%" cy="40%" r="60%"><stop offset="0%" stopColor="#fef3f1"/><stop offset="100%" stopColor="#fbe5e0"/></radialGradient>
            <linearGradient id="grad_female1_hair" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stopColor="#6d4c41"/><stop offset="100%" stopColor="#4e342e"/></linearGradient>
            <linearGradient id="grad_female1_shirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffffff"/><stop offset="100%" stopColor="#e8eaf6"/></linearGradient>
            <linearGradient id="grad_female1_blazer" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#374151"/><stop offset="100%" stopColor="#1f2937"/></linearGradient>
            <radialGradient id="grad_eye_brown" cx="60%" cy="40%" r="70%"><stop offset="0%" stopColor="#a1887f"/><stop offset="50%" stopColor="#6d4c41"/><stop offset="100%" stopColor="#3e2723"/></radialGradient>
        </defs>
        <path d="M40 200 C40 160, 70 140, 100 140 C130 140, 160 160, 160 200 Z" fill="url(#grad_female1_blazer)"/>
        <path d="M85 140 L115 140 L100 165 Z" fill="url(#grad_female1_shirt)"/>
        <rect x="95" y="130" width="10" height="15" fill="url(#grad_female1_skin)"/>
        <circle cx="100" cy="100" r="60" fill="url(#grad_female1_skin)"/>
        <path d="M 30 100 A 70 70 0 0 1 170 100" fill="url(#grad_female1_hair)"/>
        <path d="M 40 130 C 40 80, 70 40, 100 40 C 130 40, 160 80, 160 130 C 140 140, 60 140, 40 130 Z" fill="url(#grad_female1_hair)"/>
        <g>
            <circle cx="75" cy="90" r="12" fill="#fff"/>
            <circle cx="75" cy="90" r="10" fill="url(#grad_eye_brown)"/>
            <circle cx="78" cy="87" r="4" fill="#fff" fillOpacity="0.8"/>
            <circle cx="125" cy="90" r="12" fill="#fff"/>
            <circle cx="125" cy="90" r="10" fill="url(#grad_eye_brown)"/>
            <circle cx="128" cy="87" r="4" fill="#fff" fillOpacity="0.8"/>
        </g>
        <path d="M95 125 Q 100 130 105 125" stroke="#d5bba9" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <circle cx="60" cy="115" r="8" fill="#fecaca"/>
        <circle cx="140" cy="115" r="8" fill="#fecaca"/>
    </svg>
);

export const MaleAvatar1 = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full object-cover">
        <defs>
            <radialGradient id="grad_male1_skin" cx="50%" cy="40%" r="60%"><stop offset="0%" stopColor="#fbebe1"/><stop offset="100%" stopColor="#f8dcc8"/></radialGradient>
            <linearGradient id="grad_male1_hair" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stopColor="#4e342e"/><stop offset="100%" stopColor="#3e2723"/></linearGradient>
            <linearGradient id="grad_male1_shirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffffff"/><stop offset="100%" stopColor="#e8eaf6"/></linearGradient>
            <linearGradient id="grad_male1_sweater" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#312e81"/><stop offset="100%" stopColor="#1e1b4b"/></linearGradient>
            <radialGradient id="grad_eye_blue" cx="60%" cy="40%" r="70%"><stop offset="0%" stopColor="#a3daff"/><stop offset="50%" stopColor="#4d94ff"/><stop offset="100%" stopColor="#0d47a1"/></radialGradient>
        </defs>
        <path d="M30 200 C30 160, 60 140, 100 140 C140 140, 170 160, 170 200 Z" fill="url(#grad_male1_sweater)"/>
        <path d="M80 140 L120 140 L100 160 Z" fill="url(#grad_male1_shirt)"/>
        <rect x="94" y="130" width="12" height="15" fill="url(#grad_male1_skin)"/>
        <circle cx="100" cy="100" r="60" fill="url(#grad_male1_skin)"/>
        <path d="M 50 100 C 50 60, 70 40, 100 40 C 130 40, 150 60, 150 100" fill="url(#grad_male1_hair)"/>
        <g>
            <circle cx="75" cy="90" r="12" fill="#fff"/>
            <circle cx="75" cy="90" r="10" fill="url(#grad_eye_blue)"/>
            <circle cx="78" cy="87" r="4" fill="#fff" fillOpacity="0.8"/>
            <circle cx="125" cy="90" r="12" fill="#fff"/>
            <circle cx="125" cy="90" r="10" fill="url(#grad_eye_blue)"/>
            <circle cx="128" cy="87" r="4" fill="#fff" fillOpacity="0.8"/>
        </g>
        <path d="M90 125 Q 100 135 110 125" stroke="#d5bba9" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <circle cx="60" cy="115" r="8" fill="#fecaca"/>
        <circle cx="140" cy="115" r="8" fill="#fecaca"/>
    </svg>
);

export const FemaleAvatar2 = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full object-cover">
        <defs>
            <radialGradient id="grad_female2_skin" cx="50%" cy="40%" r="60%"><stop offset="0%" stopColor="#fef3f1"/><stop offset="100%" stopColor="#fbe5e0"/></radialGradient>
            <linearGradient id="grad_female2_hair" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stopColor="#4a4a4a"/><stop offset="100%" stopColor="#212121"/></linearGradient>
            <linearGradient id="grad_female2_shirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a3e635"/><stop offset="100%" stopColor="#65a30d"/></linearGradient>
            <radialGradient id="grad_eye_green" cx="60%" cy="40%" r="70%"><stop offset="0%" stopColor="#b2dfdb"/><stop offset="50%" stopColor="#4db6ac"/><stop offset="100%" stopColor="#00695c"/></radialGradient>
        </defs>
        <path d="M40 200 C40 160, 70 140, 100 140 C130 140, 160 160, 160 200 Z" fill="url(#grad_female2_shirt)"/>
        <rect x="95" y="130" width="10" height="15" fill="url(#grad_female2_skin)"/>
        <circle cx="100" cy="100" r="60" fill="url(#grad_female2_skin)"/>
        <path d="M40 100 C 40 60, 160 60, 160 100 C 160 130, 130 150, 100 150 C 70 150, 40 130, 40 100 Z" fill="url(#grad_female2_hair)"/>
        <path d="M60 40 Q 100 30 140 40" stroke="#666" strokeWidth="2" fill="none"/>
        <g>
            <circle cx="75" cy="95" r="12" fill="#fff"/>
            <circle cx="75" cy="95" r="10" fill="url(#grad_eye_green)"/>
            <circle cx="78" cy="92" r="4" fill="#fff" fillOpacity="0.8"/>
            <circle cx="125" cy="95" r="12" fill="#fff"/>
            <circle cx="125" cy="95" r="10" fill="url(#grad_eye_green)"/>
            <circle cx="128" cy="92" r="4" fill="#fff" fillOpacity="0.8"/>
        </g>
        <path d="M90 130 Q 100 120 110 130" stroke="#d5bba9" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <circle cx="60" cy="115" r="8" fill="#fecaca"/>
        <circle cx="140" cy="115" r="8" fill="#fecaca"/>
    </svg>
);

export const MaleAvatar2 = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full object-cover">
        <defs>
            <radialGradient id="grad_male2_skin" cx="50%" cy="40%" r="60%"><stop offset="0%" stopColor="#fef0e7"/><stop offset="100%" stopColor="#fbdcc6"/></radialGradient>
            <linearGradient id="grad_male2_hair" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stopColor="#f57c00"/><stop offset="100%" stopColor="#d84315"/></linearGradient>
            <linearGradient id="grad_male2_shirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f1f5f9"/><stop offset="100%" stopColor="#e0f2fe"/></linearGradient>
            <linearGradient id="grad_male2_jacket" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0891b2"/><stop offset="100%" stopColor="#0e7490"/></linearGradient>
            <radialGradient id="grad_eye_amber" cx="60%" cy="40%" r="70%"><stop offset="0%" stopColor="#ffe57f"/><stop offset="50%" stopColor="#ffc107"/><stop offset="100%" stopColor="#ff8f00"/></radialGradient>
        </defs>
        <path d="M30 200 C30 160, 60 140, 100 140 C140 140, 170 160, 170 200 Z" fill="url(#grad_male2_jacket)"/>
        <path d="M80 140 L120 140 L120 180 L80 180 Z" fill="url(#grad_male2_shirt)"/>
        <rect x="94" y="130" width="12" height="15" fill="url(#grad_male2_skin)"/>
        <circle cx="100" cy="100" r="60" fill="url(#grad_male2_skin)"/>
        <path d="M 50 100 C 50 60, 70 40, 100 40 C 130 40, 150 60, 150 100" fill="url(#grad_male2_hair)"/>
        <path d="M 80 40 C 90 30, 110 30, 120 40" fill="url(#grad_male2_hair)"/>
        <g>
            <circle cx="75" cy="95" r="12" fill="#fff"/>
            <circle cx="75" cy="95" r="10" fill="url(#grad_eye_amber)"/>
            <circle cx="78" cy="92" r="4" fill="#fff" fillOpacity="0.8"/>
            <circle cx="125" cy="95" r="12" fill="#fff"/>
            <circle cx="125" cy="95" r="10" fill="url(#grad_eye_amber)"/>
            <circle cx="128" cy="92" r="4" fill="#fff" fillOpacity="0.8"/>
        </g>
        <path d="M90 130 C 100 140 110 130, 110 130" stroke="#d5bba9" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <circle cx="60" cy="115" r="8" fill="#fecaca"/>
        <circle cx="140"cy="115" r="8" fill="#fecaca"/>
    </svg>
);

export const ShibaAvatar = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full object-cover">
        <path d="M 100,160 C 60,160 50,110 50,90 C 50,60 70,40 100,40 C 130,40 150,60 150,90 C 150,110 140,160 100,160 Z" fill="#f6e8d8" stroke="#a16207" strokeWidth="2"/>
        <path d="M 50,80 C 20,80 20,40 55,50 C 60,70 55,80 50,80" fill="#ca8a04" stroke="#854d0e" strokeWidth="2"/>
        <path d="M 150,80 C 180,80 180,40 145,50 C 140,70 145,80 150,80" fill="#ca8a04" stroke="#854d0e" strokeWidth="2"/>
        <ellipse cx="80" cy="85" rx="7" ry="9" fill="#27272a"/><ellipse cx="120" cy="85" rx="7" ry="9" fill="#27272a"/>
        <path d="M 95,105 C 90,115 110,115 105,105 Q 100,100 95,105 Z" fill="#27272a"/>
    </svg>
);

export const PoodleAvatar = () => (
     <svg viewBox="0 0 200 200" className="w-full h-full object-cover">
        <path d="M100 165c-22.1 0-40-17.9-40-40 0-15 10-30 20-40 10-10 20-15 40-15s30 5 40 15c10 10 20 25 20 40 0 22.1-17.9 40-40 40z" fill="#fffbeb" stroke="#d97706" strokeWidth="2"/>
        <circle cx="100" cy="70" r="35" fill="#fffbeb" stroke="#d97706" strokeWidth="2"/>
        <circle cx="65" cy="75" r="20" fill="#fffbeb" stroke="#d97706" strokeWidth="2"/>
        <circle cx="135" cy="75" r="20" fill="#fffbeb" stroke="#d97706" strokeWidth="2"/>
        <ellipse cx="85" cy="100" rx="6" ry="8" fill="#27272a"/><ellipse cx="115" cy="100" rx="6" ry="8" fill="#27272a"/>
        <path d="M97 115a5 5 0 016 0" stroke="#27272a" strokeWidth="2" fill="none" strokeLinecap="round"/>
     </svg>
);

export const CorgiAvatar = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full object-cover">
        <path d="M100 160c-35 0-50-40-50-60 0-30 20-40 50-40s50 10 50 40c0 20 15 60-50 60z" fill="#eab308" stroke="#a16207" strokeWidth="2"/>
        <path d="M65 50 c-20-25 10-40 20-15z M135 50 c20-25 -10-40 -20-15z" fill="#eab308" stroke="#a16207" strokeWidth="2" />
        <path d="M68 50 c0-15 12-15 12-5z M132 50 c0-15 -12-15 -12-5z" fill="#fef3c7"/>
        <circle cx="85" cy="95" r="7" fill="#27272a"/>
        <circle cx="115" cy="95" r="7" fill="#27272a"/>
        <path d="M95 110 c5 8 15 8 20 0" fill="none" stroke="#27272a" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

export const RetrieverAvatar = () => (
    <svg viewBox="0 0 200 200" className="w-full h-full object-cover">
        <path d="M100 160c-30 0-45-30-45-50 0-30 20-50 45-50s45 20 45 50c0 20 15 50-45 50z" fill="#fcd34d" stroke="#b45309" strokeWidth="2"/>
        <path d="M55 90c-15-5-15-40 0-45 10 5 15 35 0 45z M145 90c15-5 15-40 0-45 -10 5 -15 35 0 45z" fill="#fbbf24" stroke="#b45309" strokeWidth="2"/>
        <path d="M75 110c0-15 50-15 50 0" fill="#fffbeb" />
        <circle cx="80" cy="90" r="7" fill="#27272a"/>
        <circle cx="120" cy="90" r="7" fill="#27272a"/>
        <path d="M98 105a3 3 0 014 0" fill="#27272a"/>
    </svg>
);


interface AIAvatarProps {
  avatarKey: string;
  aiName: string;
  isLoading: boolean;
}

const AIAvatar: React.FC<AIAvatarProps> = ({ avatarKey, aiName, isLoading }) => {
  
  const renderAvatar = () => {
    switch (avatarKey) {
      case 'human_female_1':
        return <FemaleAvatar1 />;
      case 'human_male_1':
        return <MaleAvatar1 />;
      case 'human_female_2':
        return <FemaleAvatar2 />;
      case 'human_male_2':
        return <MaleAvatar2 />;
      case 'dog_shiba_1':
        return <ShibaAvatar />;
      case 'dog_poodle_1':
        return <PoodleAvatar />;
      case 'dog_corgi_1':
        return <CorgiAvatar />;
      case 'dog_retriever_1':
        return <RetrieverAvatar />;
      case 'dog_kotetsu_rare':
        return <KotetsuAvatar />;
      default:
        return <FemaleAvatar1 />;
    }
  };

  return (
    <div className="w-full h-full bg-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 relative overflow-hidden shadow-2xl">
      <div className="absolute inset-0 bg-grid-slate-700 [mask-image:linear-gradient(0deg,transparent,rgba(0,0,0,0.8))] opacity-50"></div>
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-slate-900/50 to-transparent"></div>
      
      <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-slate-700 shadow-2xl mb-6 bg-slate-900">
        {isLoading && (
          <div className="absolute inset-0 bg-sky-500/30 z-10 flex items-center justify-center backdrop-blur-sm">
             <div className="w-24 h-24 border-8 border-sky-300 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {renderAvatar()}
      </div>
      <h2 className="text-2xl font-bold text-white z-10">{aiName}</h2>
      <p className="text-slate-400 z-10">{isLoading ? '考え中...' : '相談受付中'}</p>
    </div>
  );
};

export default AIAvatar;