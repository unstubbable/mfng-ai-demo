import * as React from 'react';
import gitHubLogo from './github-mark-white.svg';

export function Header(): React.ReactNode {
  return (
    <header className="flex items-center justify-between bg-zinc-800 px-4 py-3 text-zinc-50 shadow md:px-6">
      <div>
        <h1 className="text-xl font-bold">AI SDK with Generative UI</h1>
        <h2 className="text-sm">Deployed on AWS Lambda &amp; CloudFront</h2>
      </div>
      <a
        href="https://github.com/unstubbable/mfng-ai-demo"
        title="MFNG AI Demo GitHub Repo"
        className="flex-shrink-0"
      >
        <img src={gitHubLogo} className="h-8 w-8" alt="GitHub Logo" />
      </a>
    </header>
  );
}
