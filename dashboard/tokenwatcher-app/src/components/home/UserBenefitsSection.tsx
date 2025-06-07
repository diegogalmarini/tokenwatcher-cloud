// src/components/home/UserBenefitsSection.tsx
import React from 'react';
import {
  CodeBracketIcon,
  ChartPieIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  SparklesIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';

const userBenefits = [
  {
    profile: 'For Developers',
    challenge: 'Building dApps requires monitoring smart contract interactions and specific on-chain events. Setting up and maintaining custom monitoring scripts or nodes diverts focus from core development tasks and can be complex.',
    solution: 'Get a "plug-and-play" solution to receive real-time alerts on relevant ERC-20 token transfers for your dApps or services, without managing complex infrastructure. Focus on development and react swiftly to on-chain events impacting your applications, with configurable webhooks for easy workflow integration.',
    icon: <CodeBracketIcon className="h-10 w-10 text-grey-600 mb-4" />,
  },
  {
    profile: 'For Blockchain Analysts',
    challenge: 'Tracking fund flows, identifying transaction patterns, and understanding market dynamics is tough with massive daily transaction volumes. Manually detecting relevant events in real-time is nearly impossible.',
    solution: 'Instantly spot large transactions or "whale" movements with configurable alerts for significant token transfers. The upcoming "Unified Dashboard" will further enhance event visualization and discovery, turning raw data into actionable insights.',
    icon: <ChartPieIcon className="h-10 w-10 text-grey-600 mb-4" />,
  },
  {
    profile: 'For Crypto Traders',
    challenge: 'Volatile crypto markets demand rapid decision-making based on real-time information. Missing large token movements can mean missed opportunities or unmanaged risks. The "need for immediacy" is paramount.',
    solution: 'Gain a competitive edge with "Real-Time and Configurable Alerts". Receive instant notifications via Slack, Discord (and soon Telegram/email) for critical token activities, enabling you to act fast.',
    icon: <ArrowTrendingUpIcon className="h-10 w-10 text-grey-600 mb-4" />,
  },
  {
    profile: 'For DAOs',
    challenge: 'DAOs manage treasuries and on-chain operations requiring transparency and vigilance. Manually monitoring governance token movements or treasury assets is inefficient and prone to oversight, yet DAOs "cannot manually monitor the chain effectively".',
    solution: 'Set up dedicated "watchers" for your specific tokens and relevant thresholds. Receive alerts for any activity needing attention, enhancing oversight of your assets and on-chain operations securely and efficiently.',
    icon: <UserGroupIcon className="h-10 w-10 text-grey-600 mb-4" />,
  },
  {
    profile: 'For Web3 Enthusiasts',
    challenge: 'Following specific projects, tokens, or airdrops often means constantly checking block explorers or multiple social feeds, leading to information overload and missed opportunities.',
    solution: 'Enjoy an "Easy to Use (Plug-and-Play)" experience with a freemium model, making it accessible to track tokens you care about and receive alerts on significant movements without the hassle.',
    icon: <SparklesIcon className="h-10 w-10 text-grey-600 mb-4" />,
  },
  {
    profile: 'For Project Teams & Founders',
    challenge: 'Launching and managing a token involves tracking ecosystem health, treasury movements for security and transparency, and understanding holder activity. Manually collating this data is resource-intensive.',
    solution: 'Automate the monitoring of your project\'s token with real-time alerts. Stay informed about market dynamics, large holder transactions, and exchange movements, allowing your team to focus on building and growth, backed by timely on-chain intelligence.',
    icon: <RocketLaunchIcon className="h-10 w-10 text-grey-600 mb-4" />,
  },
];

interface UserBenefitsSectionProps {
  isDark: boolean; // Añadimos isDark para consistencia en el fondo de la sección
}

export default function UserBenefitsSection({ isDark }: UserBenefitsSectionProps) {
  return (
    // Usamos isDark para el fondo de la sección principal
    <section className={`py-16 ${isDark ? "bg-[#262626]" : "bg-[#e8e8e8]"}`}>
      <div className="max-w-6xl mx-auto px-6">
        <h2 className={`text-3xl font-bold text-center mb-6 ${isDark ? "text-white" : "text-gray-900"}`}>
          Why TokenWatcher? Gain Your On-Chain Edge.
        </h2>
        <p className={`text-center text-lg ${isDark ? "text-gray-300" : "text-gray-700"} mb-4 max-w-3xl mx-auto`}>
          Monitoring large token transfers manually is slow and error-prone. Traditional solutions rely on expensive data feeds, require complex node maintenance, or simply can't keep up with the market's pace.
        </p>
        <p className={`text-center text-lg ${isDark ? "text-gray-300" : "text-gray-700"} mb-12 max-w-3xl mx-auto`}>
          TokenWatcher solves this by providing an easy, plug-and-play service for real-time, configurable alerts on the ERC-20 movements vital to your strategy—no devops required. See how we provide tailored insights whether you're developing, analyzing, trading, governing, or exploring Web3:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {userBenefits.map((benefit) => (
            <div
              key={benefit.profile}
              // Las cards internas usan su propio estilo dark/light que contrasta
              className="bg-white dark:bg-neutral-700 p-6 rounded-lg shadow-lg"
            >
              <div className="flex justify-center md:justify-start mb-4">
                 {benefit.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100 text-center md:text-left">
                {benefit.profile}
              </h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-1">The Challenge:</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {benefit.challenge}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-1">TokenWatcher Solution:</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {benefit.solution}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}