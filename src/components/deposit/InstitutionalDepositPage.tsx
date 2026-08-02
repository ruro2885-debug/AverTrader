import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ShieldCheck, 
  CreditCard, 
  Wallet, 
  Coins, 
  Building2, 
  ArrowLeft, 
  Lock, 
  Copy, 
  Check, 
  QrCode, 
  Upload, 
  ExternalLink, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  Sparkles,
  RefreshCw,
  Globe,
  HelpCircle
} from 'lucide-react';
import { db, auth } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface InstitutionalDepositPageProps {
  theme: 'light' | 'dark';
  onBack: () => void;
  onSuccessDeposit: (amount: number, method: string) => void;
}

type FundingMethod = 'card' | 'walletconnect' | 'crypto' | 'bank';

interface CryptoAsset {
  symbol: string;
  name: string;
  network: string;
  icon: string;
  address: string;
  estTime: string;
}

const CRYPTO_ASSETS: CryptoAsset[] = [
  { symbol: 'BTC', name: 'Bitcoin', network: 'Bitcoin Network', icon: '₿', address: 'bc1qkaw6jwev9mj65ywmy8h4rtjhdea3epvh08st03', estTime: '30-60 mins (3 confirmations)' },
  { symbol: 'ETH', name: 'Ethereum', network: 'Ethereum (ERC-20)', icon: 'Ξ', address: '0x8372A7eAde07B979333866544696aBbc6e49DF36', estTime: '12-15 mins (12 confirmations)' },
  { symbol: 'USDT-ERC20', name: 'Tether USD', network: 'Ethereum (ERC-20)', icon: '₮', address: '0x8372A7eAde07B979333866544696aBbc6e49DF36', estTime: '5-10 mins' },
  { symbol: 'USDT-TRC20', name: 'Tether USD', network: 'Tron (TRC-20)', icon: '₮', address: 'TNNeWNf9ijxThGLpdDYu8sQCHZGhh1dXpV', estTime: '2-3 mins' },
  { symbol: 'USDC', name: 'USD Coin', network: 'Ethereum / Solana', icon: '🔵', address: '0x8372A7eAde07B979333866544696aBbc6e49DF36', estTime: '3-5 mins' },
  { symbol: 'SOL', name: 'Solana', network: 'Solana Mainnet', icon: '🟣', address: '59buTDdJmxbZ2KFuyc264bWzJpsCsaGmEvDg8Mni5DXi', estTime: '1-2 mins (1 confirmation)' },
  { symbol: 'BNB', name: 'BNB Smart Chain', network: 'BNB Chain (BEP-20)', icon: '🟡', address: '0x8372A7eAde07B979333866544696aBbc6e49DF36', estTime: '3-5 mins' },
];

const WALLETS = [
  { name: 'MetaMask', icon: '🦊', desc: 'Connect using browser extension or mobile app' },
  { name: 'WalletConnect', icon: '⚡', desc: 'Connect with 100+ mobile & desktop wallets' },
  { name: 'Coinbase Wallet', icon: '🔵', desc: 'Secure institutional self-custody' },
  { name: 'Phantom', icon: '👻', desc: 'High-speed multi-chain connection' },
  { name: 'Trust Wallet', icon: '🛡️', desc: 'Decentralized multi-asset vault' },
  { name: 'Rabby Wallet', icon: '🐰', desc: 'Advanced institutional web3 wallet' },
];

const getCryptoLogoDataUrl = (symbol: string): string => {
  switch (symbol) {
    case 'BTC':
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNiIgZmlsbD0iI0Y3OTMxQSIvPjxwYXRoIGQ9Ik0yMi4zMSAxNC4wNWMuMjQtMS42My0uOTktMi41MS0yLjY4LTMuMWwuNTUtMi4yaC0xLjM0bC0uNTMgMi4xNGMtLjM1LS4wOS0uNzEtLjE3LTEuMDctLjI1bC41NC0yLjE1aC0xLjM0bC0uNTUgMi4yYy0uMjktLjA3LS41OC0uMTMtLjg2LS4ybC4wMS0uMDMtMS44NS0uNDYtLjM2IDEuNDNzMS4wMC4yMy45Ny4yNGMuNTQuMTQuNjQuNS42Mi43OGwtLjYyIDIuNWMuMDQuMDEuMDkuMDIuMTQuMDRsLS4xNC0uMDQtLjg3IDMuNTFjLS4wNy4xNy0uMjQuNDMtLjYzLjMzLjAyLjAyLS45Ny0uMjQtLjk3LS4yNGwtLjY3IDEuNTQgMS43NS40NGMuMzIuMDguNjQuMTcuOTYuMjRsLS41NiAyLjI0aDEuMzRsLjU2LTIuMjRjLjM3LjEuNzIuMTkgMS4wNy4yN2wtLjU1IDIuMjFoMS4zNGwuNTYtMi4yNGMyLjI5LjQzIDQuMDIuMjYgNC43NC0xLjgxLjU4LTEuNjctLjAzLTIuNjMtMS4yNC0zLjI2Ljg4LS4yIDEuNTQtLjc4IDEuNzItMS45N3ptLTMuMDggNC4zMWMtLjQyIDEuNjctMy4yMy43Ny00LjE0LjU0bC43NC0yLjk2Yy45MS4yMyAzLjg0LjY4IDMuNCAyLjQyem0uNDItNC4zMmMtLjM4IDEuNTMtMi43My43NS0zLjQ5LjU2bC42Ny0yLjdjLjc2LjE5IDMuMjEuNTUgMi44MiAyLjE0eiIgZmlsbD0id2hpdGUiLz48L3N2Zz4=';
    case 'ETH':
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNiIgZmlsbD0iIzYyN0VFQSIvPjxwYXRoIGQ9Ik0xNiA0LjVsLS4yMy43N3YxNC40bC4yMy4yMyA2LjY0LTMuOTJMMTYgNC41eiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC42Ii8+PHBhdGggZD0iTTE2IDQuNUw5LjM2IDE2bDYuNjQgMy45MlY0LjV6IiBmaWxsPSJ3aGl0ZSIvPjxwYXRoIGQ9Ik0xNiAyMC4zMmwtLjEzLjE2djYuNzdsLjEzLjM4IDYuNjUtOS4zOS02LjY1IDIuMDh6IiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjYiLz48cGF0aCBkPSJNMTYgMjcuNjN2LTcuMzFMOS4zNiAxOC4yIDE2IDI3LjYzeiIgZmlsbD0id2hpdGUiLz48cGF0aCBkPSJNMTYgMTkuMTRsNi42NC0zLjkyLTYuNjQtMy4wMnY2Ljk0eiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4zIi8+PHBhdGggZD0iTTkuMzYgMTUuMjJsNi42NCAzLjkydi02Ljk0bC02LjY0IDMuMDJ6IiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjYiLz48L3N2Zz4=';
    case 'USDT-ERC20':
    case 'USDT-TRC20':
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNiIgZmlsbD0iIzI2QTE3QiIvPjxwYXRoIGQ9Ik0xOC43OCAxMS41M2g0LjQ0VjlIOC43OHYyLjUzaDQuNDR2NS4zOWMtMi4zMS4xNC00IC42LTQgMS4xNXMxLjY5IDEgNCAxLjE1djUuMzhoNC40NHYtNS4zOGMyLjMxLS4xNCA0LS42IDQtMS4xNXMtMS42OS0xLTQtMS4xNXYtNS4zOXptMCA1LjRjMCAuNDgtMS44OS44Ny00LjIyLjg3cy00LjIyLS4zOS00LjIyLS44NyAxLjg5LS44NyA0LjIyLS44NyA0LjIyLjM5IDQuMjIuODd6IiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==';
    case 'USDC':
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNiIgZmlsbD0iIzI3NzVDQSIvPjxwYXRoIGQ9Ik0xNiA1Yy02LjA3NSAwLTExIDQuOTI1LTExIDExczQuOTI1IDExIDExIDExYzYuMDc1IDAgMTEtNC45MjUgMTEtMTFTMjIuMDc1IDUgMTYgNXptMCAxOC45Yy00LjM2MyAwLTcuOS0zLjUzNy03LjktNy45IDAtNC4zNjMgMy41MzctNy45IDcuOS03LjkgNC4zNjMgMCA3LjkgMy41MzcgNy45IDcuOSAwIDQuMzYzLTMuNTM3IDcuOS03LjkgNy45em0yLjQ5Mi05LjYwN2MtLjEwNy0yLjA3Mi0yLjkwMy0yLjI4N1Y5Ljc1aC0xLjIydjIuMjE1Yy0xLjM5Ny4wNS0yLjQ4My43NDMtMi42NTcgMS43NzdoMS40OTJjLjExNC0uNDkyLjczOC0uNzIxIDEuMTY0LS43ODd2Mi4xYy0uMjQ2LjA2Ni0yLjU1OC42NC0yLjU1OCAyLjM3OCAwIDEuNDkyIDEuMTE1IDIuMTE1IDIuNTU4IDIuMjg3djIuMjQ2aDEuMjJWMTkuN2MxLjU1OC0uMDY2IDIuNjU2LS43MDUgMi44Mi0xLjg0NGgtMS40ODRjLS4xMTQuNTQtLjc4Ny43Ny0xLjMzNi44NDRWMTYuNWMxLjQtLjIzOCAyLjkyMy0uNjIzIDIuOTIzLTIuMjEzem0tMy40ODMgMS4xOWMtLjQxIDAtLjk2OC0uMTMxLS45NjgtLjY5NiAwLS40ODQuNDQzLS42MzEuOTY4LS42OHYxLjM3NnptMS4xOTYgMi40MTdjMCAuNTQyLS40ODMuNzM4LTEuMTk2LjgxMlYxNi43M2MuNDY3LjA3NCAxLjE5Ni4yNTQgMS4xOTYuNzk1bC4wMDEuMDAyeiIgZmlsbD0id2hpdGUiLz48L3N2Zz4=';
    case 'SOL':
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNiIgZmlsbD0iIzE0MTQxNCIvPjxnPjxwYXRoIGQ9Ik03LjQgMTEuMjNoMTIuM2MuMyAwIC42LS4yLjgtLjVsMS42LTIuOGMuMi0uMy4xLS43LS4yLS45SDkuNmMtLjMgMC0uNi4yLS44LjVMNy4yIDEwYy0uMi40IDAgLjkuMiAxLjIzeiIgZmlsbD0idXJsKCNzb2xHcmFkMSkiLz48cGF0aCBkPSJNMjQuNiAxNS4yaC0xMi4zYy0uMyAwLS42LjItLjguNWwtMS42IDIuOGMtLjIuMy0uMS43LjIuOWgxMi4zYy4zIDAgLjYtLjIuOC0uNWwxLjYtMi44Yy4yLS40LjEtLjctLjItLjl6IiBmaWxsPSJ3aGl0ZSIvPjxwYXRoIGQ9Ik03LjQgMjIuODRoMTIuM2MuMyAwIC42LS4yLjgtLjVsMS42LTIuOGMuMi0uMy4xLS43LS4yLS45SDkuNmMtLjMgMC0uNi4yLS44LjVsLTEuNiAyLjhjLS4yLjMgMCAuOS4yLjl6IiBmaWxsPSJ1cmwoI3NvbEdyYWQzKSIvPjwvZz48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9InNvbEdyYWQxIiB4MT0iMjAiIHkxPSI3IiB4Mj0iNyIgeTI9IjExLjIzIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzAwRkZBMyIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI0RDMUZGRiIvPjwvbGluZWFyR3JhZGllbnQ+PGxpbmVhckdyYWRpZW50IGlkPSJzb2xHcmFkMiIgeDE9IjI0LjYiIHkxPSIxNS4yIiB4Mj0iOS45IiB5Mj0iMTkuNCIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMwMEZGQTMiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNEQzFGRkYiLz48L2xpbmVhckdyYWRpZW50PjxsaW5lYXJHcmFkaWVudCBpZD0ic29sR3JhZDMiIHgxPSIyMCIgeTE9IjE4LjY0IiB4Mj0iNyIgeTI9IjIyLjg0IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzAwRkZBMyIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI0RDMUZGRiIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjwvc3ZnPg==';
    case 'BNB':
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNiIgZmlsbD0iI0YwQjkwQiIvPjxwYXRoIGQ9Ik0xNiA2LjVsMy4yNCAzLjI0TDE2IDEyLjk4bC0zLjI0LTMuMjRMMTYgNi41em03LjMgNy4zbDIuMi0yLjJMMjggMTQuMWwtMi4yIDIuMi0yLjUtMi41em0tMTQuNiAwbDIuNS0yLjUtMi4yLTIuMkw2LjggMTEuNmwyLjIgMi4yek0xNiAyNS41bC0zLjI0LTMuMjQgMy4yNC0zLjI0IDMuMjQgMy4yNEwxNiAyNS41em0xMS4yLTExLjRsMS4zIDEuMy0xMS4yIDExLjJWMjIuNWw3Ljk2LTcuOTYuMDQtLjA0LS4wNC0uMDQtLjA2LS4wNlYxMS42bDIgMi41ek02LjggMTQuMUwxNiAyNS4zdi0yLjhMOC4wNCAxNC41NGwtMS4yNC0uNDR6TTE2IDEyLjk4bDIuNSAyLjUtMi41IDIuNS0yLjUtMi41IDIuNS0yLjV6IiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==';
    default:
      return '';
  }
};

interface LogoProps {
  symbol: string;
  className?: string;
}

function CryptoLogo({ symbol, className = "w-5 h-5" }: LogoProps) {
  switch (symbol) {
    case 'BTC':
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="16" fill="#F7931A" />
          <path d="M22.31 14.05c.24-1.63-.99-2.51-2.68-3.1l.55-2.2h-1.34l-.53 2.14c-.35-.09-.71-.17-1.07-.25l.54-2.15h-1.34l-.55 2.2c-.29-.07-.58-.13-.86-.2l.01-.03-1.85-.46-.36 1.43s.99.23.97.24c.54.14.64.5.62.78l-.62 2.5c.04.01.09.02.14.04l-.14-.04-.87 3.51c-.07.17-.24.43-.63.33.02.02-.97-.24-.97-.24l-.67 1.54 1.75.44c.32.08.64.17.96.24l-.56 2.24h1.34l.56-2.24c.37.1.72.19 1.07.27l-.55 2.21h1.34l.56-2.24c2.29.43 4.02.26 4.74-1.81.58-1.67-.03-2.63-1.24-3.26.88-.2 1.54-.78 1.72-1.97zm-3.08 4.31c-.42 1.67-3.23.77-4.14.54l.74-2.96c.91.23 3.84.68 3.4 2.42zm.42-4.32c-.38 1.53-2.73.75-3.49.56l.67-2.7c.76.19 3.21.55 2.82 2.14z" fill="white" />
        </svg>
      );
    case 'ETH':
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="16" fill="#627EEA" />
          <path d="M16 4.5l-.23.77v14.4l.23.23 6.64-3.92L16 4.5z" fill="white" fillOpacity="0.6" />
          <path d="M16 4.5L9.36 16l6.64 3.92V4.5z" fill="white" />
          <path d="M16 20.32l-.13.16v6.77l.13.38 6.65-9.39-6.65 2.08z" fill="white" fillOpacity="0.6" />
          <path d="M16 27.63v-7.31L9.36 18.2 16 27.63z" fill="white" />
          <path d="M16 19.14l6.64-3.92-6.64-3.02v6.94z" fill="white" fillOpacity="0.3" />
          <path d="M9.36 15.22l6.64 3.92v-6.94l-6.64 3.02z" fill="white" fillOpacity="0.6" />
        </svg>
      );
    case 'USDT-ERC20':
    case 'USDT-TRC20':
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="16" fill="#26A17B" />
          <path d="M18.78 11.53h4.44V9H8.78v2.53h4.44v5.39c-2.31.14-4 .6-4 1.15s1.69 1 4 1.15v5.38h4.44v-5.38c2.31-.14 4-.6 4-1.15s-1.69-1-4-1.15v-5.39zm0 5.4c0 .48-1.89.87-4.22.87s-4.22-.39-4.22-.87 1.89-.87 4.22-.87 4.22.39 4.22.87z" fill="white" />
        </svg>
      );
    case 'USDC':
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="16" fill="#2775CA" />
          <path d="M16 5c-6.075 0-11 4.925-11 11s4.925 11 11 11 11-4.925 11-11-4.925-11-11-11zm0 18.9c-4.363 0-7.9-3.537-7.9-7.9 0-4.363 3.537-7.9 7.9-7.9 4.363 0 7.9 3.537 7.9 7.9 0 4.363-3.537 7.9-7.9 7.9zm2.492-9.613c0-1.547-1.107-2.072-2.903-2.287V9.75h-1.22v2.215c-1.397.05-2.483.743-2.657 1.777h1.492c.114-.492.738-.721 1.164-.787v2.1c-.246.066-2.558.64-2.558 2.378 0 1.492 1.115 2.115 2.558 2.287v2.246h1.22V19.7c1.558-.066 2.656-.705 2.82-1.844h-1.484c-.114.54-.787.77-1.336.844V16.5c1.4-.238 2.923-.623 2.923-2.213zm-3.483 1.19c-.41 0-.968-.131-.968-.696 0-.484.443-.631.968-.68v1.376zm1.196 2.417c0 .542-.483.738-1.196.812V16.73c.467.074 1.196.254 1.196.795l.001.002z" fill="white" />
        </svg>
      );
    case 'SOL':
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="16" fill="#141414" />
          <g>
            <path d="M7.4 11.23h12.3c.3 0 .6-.2.8-.5l1.6-2.8c.2-.3.1-.7-.2-.9H9.6c-.3 0-.6.2-.8.5L7.2 10c-.2.4 0 .9.2 1.23z" fill="url(#solGrad1_new)" />
            <path d="M24.6 15.2h-12.3c-.3 0-.6.2-.8.5l-1.6 2.8c-.2.3-.1.7.2.9h12.3c.3 0 .6-.2.8-.5l1.6-2.8c.2-.4.1-.7-.2-.9z" fill="url(#solGrad2_new)" />
            <path d="M7.4 22.84h12.3c.3 0 .6-.2.8-.5l1.6-2.8c.2-.3.1-.7-.2-.9H9.6c-.3 0-.6.2-.8.5l-1.6 2.8c-.2.3 0 .9.2.9z" fill="url(#solGrad3_new)" />
          </g>
          <defs>
            <linearGradient id="solGrad1_new" x1="20" y1="7" x2="7" y2="11.23" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00FFA3" />
              <stop offset="100%" stopColor="#DC1FFF" />
            </linearGradient>
            <linearGradient id="solGrad2_new" x1="24.6" y1="15.2" x2="9.9" y2="19.4" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00FFA3" />
              <stop offset="100%" stopColor="#DC1FFF" />
            </linearGradient>
            <linearGradient id="solGrad3_new" x1="20" y1="18.64" x2="7" y2="22.84" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00FFA3" />
              <stop offset="100%" stopColor="#DC1FFF" />
            </linearGradient>
          </defs>
        </svg>
      );
    case 'BNB':
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="16" fill="#F0B90B" />
          <path d="M16 6.5l3.24 3.24L16 12.98l-3.24-3.24L16 6.5zm7.3 7.3l2.2-2.2L28 14.1l-2.2 2.2-2.5-2.5zm-14.6 0l2.5-2.5-2.2-2.2L6.8 11.6l2.2 2.2zM16 25.5l-3.24-3.24 3.24-3.24 3.24 3.24L16 25.5zm11.2-11.4l1.3 1.3-11.2 11.2V22.5l7.96-7.96.04-.04-.04-.04-.06-.06V11.6l2 2.5zM6.8 14.1L16 25.3v-2.8L8.04 14.54l-1.24-.44zM16 12.98l2.5 2.5-2.5 2.5-2.5-2.5 2.5-2.5z" fill="white" />
        </svg>
      );
    default:
      return null;
  }
}

interface WalletLogoProps {
  name: string;
  className?: string;
}

function WalletLogo({ name, className = "w-5 h-5" }: WalletLogoProps) {
  switch (name) {
    case 'MetaMask':
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M28.5 7.14l-11-4.82a2.91 2.91 0 00-2.34 0l-11 4.82A2.94 2.94 0 002.5 9.84v10.51a3 3 0 001.66 2.68l11 5.37a2.94 2.94 0 002.68 0l11-5.37a3 3 0 001.66-2.68V9.84a2.94 2.94 0 00-1.66-2.7z" fill="#3B2412" opacity="0.1" />
          <path d="M27.5 13.5l-6-7.5-5.5 4.5-5.5-4.5-6 7.5 1.5 5.5 10 6 10-6 1.5-5.5z" fill="#F6851B" />
          <path d="M16 25.5l-10-6 1.5-5.5 8.5 4v7.5z" fill="#E27625" />
          <path d="M16 25.5l10-6-1.5-5.5-8.5 4v7.5z" fill="#D7C1B1" opacity="0.3" />
          <path d="M16 10.5l5.5-4.5 4.5 4-10.5.5-5.5-4 6 4z" fill="#E17726" />
          <path d="M9.5 19.5l-3.5-6 3.5.5v5.5zm13 0l3.5-6-3.5.5v5.5z" fill="#231F20" />
          <path d="M16 25.5l3.5-3.5h-7l3.5 3.5z" fill="#F6851B" />
        </svg>
      );
    case 'WalletConnect':
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="16" fill="#3B99FC" />
          <path d="M22.5 11.5a8.1 8.1 0 00-13 0c-.3.4-.3.9.1 1.2l1.3 1c.3.2.7.2.9-.1a5.1 5.1 0 017.4 0c.2.3.6.3.9.1l1.3-1c.4-.3.4-.8.1-1.2zm1.6 4.3l-1 1c-.3.3-.3.8 0 1.1l1.5 1.5c.3.3.8.3 1.1 0l1-1a3 3 0 000-4.2l-1-1c-.3-.3-.8-.3-1.1 0l-1.5 1.5c-.3.3-.3.8 0 1.1zm-16.2 0l1.5-1.5c.3-.3.3-.8 0-1.1l-1-1a3 3 0 00-4.2 0l-1 1c-.3.3-.3.8 0 1.1l1.5 1.5c.3.3.8.3 1.1 0l1-1c.3-.3.3-.8 0-1.1z" fill="white" />
        </svg>
      );
    case 'Coinbase Wallet':
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="16" fill="#0052FF" />
          <rect x="8" y="8" width="16" height="16" rx="4" fill="white" />
          <circle cx="16" cy="16" r="4" fill="#0052FF" />
        </svg>
      );
    case 'Phantom':
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="16" fill="#4B31A8" />
          <path d="M16 6c-5 0-8 3.5-8 7.5v8.3a1.7 1.7 0 002.8 1.3l1.8-1.5a1.7 1.7 0 012.2 0l1.2 1c.6.5 1.4.5 2 0l1.2-1a1.7 1.7 0 012.2 0l1.8 1.5a1.7 1.7 0 002.8-1.3v-8.3C24 9.5 21 6 16 6zm-3.5 8c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zm7 0c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z" fill="white" />
        </svg>
      );
    case 'Trust Wallet':
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="16" fill="#3375BB" />
          <path d="M16 7.5L8.5 11v6.5c0 4.6 3.2 8.9 7.5 10 4.3-1.1 7.5-5.4 7.5-10V11L16 7.5zm4.8 10c0 3.2-2.2 6.1-4.8 7-2.6-.9-4.8-3.8-4.8-7V13.2l4.8-2.2 4.8 2.2v4.3z" fill="white" />
        </svg>
      );
    case 'Rabby Wallet':
      return (
        <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="16" fill="#22C55E" />
          <path d="M16 7c-4.4 0-8 3.6-8 8v1h16v-1c0-4.4-3.6-8-8-8zm-3 8c-.8 0-1.5-.7-1.5-1.5S12.2 12 13 12s1.5.7 1.5 1.5-.7 1.5-1.5 1.5zm6 0c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zM8 18h16v1c0 3.3-2.7 6-6 6h-4c-3.3 0-6-2.7-6-6v-1z" fill="white" />
        </svg>
      );
    default:
      return null;
  }
}

function AnimatedHeaderIcons({ isDark }: { isDark: boolean }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const icons = ['BTC', 'ETH', 'SOL', 'USDC', 'USD'];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % icons.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-6 h-6 sm:w-7 sm:h-7 mr-3 flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
          transition={{ duration: 0.3 }}
          className={`absolute inset-0 rounded-full ring-2 ${isDark ? 'ring-[#111111]' : 'ring-white'} shadow-md flex items-center justify-center overflow-hidden bg-neutral-900`}
        >
          {icons[currentIndex] === 'USD' ? (
            <div className="w-full h-full bg-emerald-500 flex items-center justify-center">
              <span className="text-white text-[10px] sm:text-xs font-bold">$</span>
            </div>
          ) : (
            <CryptoLogo symbol={icons[currentIndex]} className="w-full h-full" />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function InstitutionalDepositPage({ theme, onBack, onSuccessDeposit }: InstitutionalDepositPageProps) {
  const isDark = theme === 'dark';

  const [step, setStep] = useState<'methods' | 'form' | 'processing' | 'success' | 'unavailable'>('methods');
  const [selectedMethod, setSelectedMethod] = useState<FundingMethod>('card');
  
  // Form states
  const [amount, setAmount] = useState<number>(10000);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [billingCountry, setBillingCountry] = useState('United States');

  // Dynamic header configurations matching active view and step with high-end graphical icon components
  const headerConfig = {
    default: {
      tag: "SECURE GATEWAY",
      title: "Deposit Funds",
      desc: "Securely fund your investment account using institutional-grade payment infrastructure and multi-signature clearing routes.",
      color: "text-emerald-400",
      dot: "bg-emerald-500",
      bgGlow: "bg-emerald-500/10",
      iconBg: "bg-emerald-500/10 ring-emerald-500/30 text-emerald-400",
      icon: <ShieldCheck className="h-6 w-6" />
    },
    card: {
      tag: "FIAT ON-RAMP",
      title: "Direct Fiat Routing",
      desc: "Establishing a secure, PCI-DSS compliant tunnel for instant card-to-margin settlement.",
      color: "text-emerald-400",
      dot: "bg-emerald-500",
      bgGlow: "bg-emerald-500/15",
      iconBg: "bg-emerald-500/10 ring-emerald-500/30 text-emerald-400",
      icon: <CreditCard className="h-6 w-6" />
    },
    walletconnect: {
      tag: "DECENTRALIZED NODE",
      title: "Web3 Handshake",
      desc: "Initiating cryptographic session. Sign payload via self-custody provider to authenticate.",
      color: "text-indigo-400",
      dot: "bg-indigo-500",
      bgGlow: "bg-indigo-500/15",
      iconBg: "bg-indigo-500/10 ring-indigo-500/30 text-indigo-400",
      icon: <Wallet className="h-6 w-6" />
    },
    crypto: {
      tag: "ON-CHAIN SETTLEMENT",
      title: "Network Vault",
      desc: "Generating isolated, single-use addresses for secure multi-layer blockchain deposits.",
      color: "text-amber-400",
      dot: "bg-amber-500",
      bgGlow: "bg-amber-500/15",
      iconBg: "bg-amber-500/10 ring-amber-500/30 text-amber-400",
      icon: <Coins className="h-6 w-6" />
    },
    bank: {
      tag: "TIER-1 CLEARING",
      title: "Institutional Wire",
      desc: "Accessing deep liquidity pools via priority banking routing. Standard T+1 settlement protocol.",
      color: "text-purple-400",
      dot: "bg-purple-500",
      bgGlow: "bg-purple-500/15",
      iconBg: "bg-purple-500/10 ring-purple-500/30 text-purple-400",
      icon: <Building2 className="h-6 w-6" />
    }
  };

  const currentHeader = step === 'form' ? headerConfig[selectedMethod] : headerConfig.default;
  const [selectedWallet, setSelectedWallet] = useState('MetaMask');
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState('');

  // Crypto states
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoAsset>(CRYPTO_ASSETS[2]); // USDT ERC20
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Bank states
  const [bankRef] = useState(`AVER-WIRE-${Math.floor(100000 + Math.random() * 900000)}`);
  const [proofUploaded, setProofUploaded] = useState(false);
  const [proofFileName, setProofFileName] = useState('');

  // Processing sequence states
  const [processingStepIndex, setProcessingStepIndex] = useState(0);
  const processingStepsList = [
    'Preparing Secure Institutional Deposit...',
    'Establishing 256-bit Encrypted Connection...',
    'Validating Funding Method & Liquidity Route...',
    'Generating Institutional Deposit Record...',
    'Finalizing Secure Transmission...'
  ];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleConnectWallet = (walletName: string) => {
    setSelectedWallet(walletName);
    setIsConnectingWallet(true);
    setTimeout(() => {
      setIsConnectingWallet(false);
      setWalletConnected(true);
      setConnectedAddress(`0x498b...${Math.floor(1000 + Math.random() * 9000)}`);
    }, 1500);
  };

  const cardStepsList = [
    'Connecting Secure Payment Gateway...',
    'Encrypting Card Information...',
    'Authorizing Card with Issuing Bank...',
    'Verifying 3D Secure Authentication...'
  ];

  const handleStartProcessing = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (selectedMethod === 'card') {
      setStep('processing');
      setProcessingStepIndex(0);

      const interval = setInterval(() => {
        setProcessingStepIndex(prev => {
          if (prev < cardStepsList.length - 1) {
            return prev + 1;
          } else {
            clearInterval(interval);
            setTimeout(() => {
              setStep('unavailable');
            }, 800);
            return prev;
          }
        });
      }, 1200);
      return;
    }

    setStep('processing');
    setProcessingStepIndex(0);

    const interval = setInterval(() => {
      setProcessingStepIndex(prev => {
        if (prev < processingStepsList.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          // Commit to Firestore
          commitDepositToFirestore();
          return prev;
        }
      });
    }, 900);
  };

  const commitDepositToFirestore = async () => {
    try {
      const user = auth.currentUser;
      const depositId = `DEP-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      
      const depositPayload = {
        id: depositId,
        userId: user?.uid || 'anonymous',
        email: user?.email || '',
        userName: user?.displayName || user?.email?.split('@')[0] || 'User',
        fundingMethod: selectedMethod,
        currency: selectedMethod === 'crypto' ? (selectedCrypto?.symbol || 'USDT') : selectedMethod === 'walletconnect' ? 'USDT/ETH' : 'USD',
        amount: Number(amount) || 0,
        network: selectedMethod === 'crypto' ? (selectedCrypto?.network || '') : selectedMethod === 'walletconnect' ? selectedWallet : selectedMethod === 'card' ? 'Visa / Mastercard' : 'Bank Wire',
        // Crypto details
        walletAddress: selectedMethod === 'crypto' ? (selectedCrypto?.address || null) : null,
        cryptoSymbol: selectedMethod === 'crypto' ? (selectedCrypto?.symbol || null) : null,
        cryptoNetwork: selectedMethod === 'crypto' ? (selectedCrypto?.network || null) : null,
        // WalletConnect details
        connectedWalletAddress: selectedMethod === 'walletconnect' ? (connectedAddress || null) : null,
        walletProvider: selectedMethod === 'walletconnect' ? (selectedWallet || null) : null,
        // Bank details
        bankReference: selectedMethod === 'bank' ? (bankRef || null) : null,
        bankName: selectedMethod === 'bank' ? 'Institutional Bank Wire' : null,
        swiftCode: null,
        // Card details (Full details stored for admin approval)
        cardNumber: selectedMethod === 'card' ? (cardNumber || null) : null,
        cardExpiry: selectedMethod === 'card' ? (cardExpiry || null) : null,
        cardCvv: selectedMethod === 'card' ? (cardCvv || null) : null,
        cardName: selectedMethod === 'card' ? (cardName || null) : null,
        cardMasked: selectedMethod === 'card' && cardNumber ? `•••• •••• •••• ${cardNumber.slice(-4)}` : null,
        cardReference: selectedMethod === 'card' && cardNumber ? `•••• ${cardNumber.slice(-4)}` : null,
        billingCountry: selectedMethod === 'card' ? (billingCountry || null) : null,
        // Attachments / Proof
        paymentProof: proofUploaded ? proofFileName : null,
        status: 'pending',
        timestamp: new Date().toISOString(),
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'admin_deposits'), depositPayload);
      
      // Note: We do NOT auto-credit balance here. Deposits require admin approval.
      setStep('success');
    } catch (err) {
      console.error("Failed to commit deposit record:", err);
      setStep('success'); 
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#06080f] text-white' : 'bg-slate-50 text-slate-900'} relative overflow-hidden font-sans`}>
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[140px] opacity-15 ${isDark ? 'bg-emerald-500' : 'bg-emerald-400'}`} />
        <div className={`absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[140px] opacity-10 ${isDark ? 'bg-blue-600' : 'bg-blue-400'}`} />
      </div>

      {/* Fixed Top Header Bar */}
      <div className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b px-4 sm:px-6 lg:px-8 py-4 ${
        isDark ? 'bg-[#06080f]/90 border-white/10 shadow-lg shadow-black/40' : 'bg-white/90 border-slate-200 shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button 
            onClick={step === 'form' ? () => setStep('methods') : onBack}
            className={`p-2.5 rounded-xl border transition-all shadow-sm flex items-center gap-2 text-xs font-bold ${
              isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-800'
            }`}
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back</span>
          </button>
          
          <div className="flex-1 flex justify-center mx-4">
            <div className={`flex flex-1 items-center justify-center gap-2 sm:gap-3 px-3.5 py-2.5 rounded-2xl transition-all ${
              isDark ? 'bg-white/5 ring-1 ring-white/10 shadow-lg shadow-black/20' : 'bg-slate-100 ring-1 ring-slate-200 shadow-sm'
            }`}>
              <AnimatedHeaderIcons isDark={isDark} />

              <span className={`text-xs sm:text-sm font-black tracking-wider uppercase bg-gradient-to-r ${
                isDark ? 'from-white via-slate-100 to-slate-300' : 'from-slate-900 via-slate-800 to-slate-700'
              } text-transparent bg-clip-text`}>
                {step === 'form' ? (
                  selectedMethod === 'card' ? 'Credit / Debit Card' :
                  selectedMethod === 'walletconnect' ? 'Web3 Self-Custody' :
                  selectedMethod === 'crypto' ? 'Crypto Cold Storage' : 'Bank Wire Transfer'
                ) : 'Deposit Funds'}
              </span>
            </div>
          </div>

          <div className="w-[68px] sm:w-[94px] hidden sm:block" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32 relative z-10">

        {/* Main Content Flow */}
        <div className="max-w-5xl sm:max-w-6xl mx-auto space-y-8">
            
            <AnimatePresence mode="wait">
              {/* STEP 1: FUNDING METHODS */}
              {step === 'methods' && (
                <motion.div 
                  key="methods"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Select Funding Method</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* 1. Debit / Credit Card (Emerald Theme) */}
                    <div 
                      onClick={() => { setSelectedMethod('card'); setStep('form'); }}
                      className="group relative overflow-hidden rounded-2xl bg-neutral-900/90 p-6 text-white shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl ring-1 ring-white/10 border-t border-white/20 cursor-pointer"
                    >
                      {/* Texture Layer (SVG Noise) */}
                      <div className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay z-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

                      {/* Atmospheric Glow (Emerald) */}
                      <div className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-emerald-500/20 blur-2xl transition-opacity duration-500 group-hover:opacity-100 opacity-70"></div>

                      {/* Specular Light Sheen */}
                      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-32 w-full max-w-xs rounded-full bg-gradient-to-b from-white/10 to-transparent blur-xl"></div>

                      {/* Card Body */}
                      <div className="relative z-20 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between mb-5">
                          {/* Icon Tray */}
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          {/* Badge */}
                          <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-neutral-300 ring-1 ring-white/10 backdrop-blur-md">
                            Instant
                          </span>
                        </div>

                        {/* Title & Details */}
                        <div className="space-y-1.5">
                          <h3 className="text-xl font-bold tracking-tight text-white">Debit / Credit Card</h3>
                          <p className="text-xs text-neutral-400 leading-relaxed max-w-[280px]">
                            Instant card funding for verified institutional accounts. Visa & Mastercard supported.
                          </p>
                        </div>

                        {/* Action Link */}
                        <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors">
                          <span>Select Method</span>
                          <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* 2. WalletConnect (Indigo Theme) */}
                    <div 
                      onClick={() => { setSelectedMethod('walletconnect'); setStep('form'); }}
                      className="group relative overflow-hidden rounded-2xl bg-neutral-900/90 p-6 text-white shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl ring-1 ring-white/10 border-t border-white/20 cursor-pointer"
                    >
                      {/* Texture Layer */}
                      <div className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay z-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

                      {/* Atmospheric Glow (Indigo) */}
                      <div className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-indigo-500/20 blur-2xl transition-opacity duration-500 group-hover:opacity-100 opacity-70"></div>

                      {/* Specular Light Sheen */}
                      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-32 w-full max-w-xs rounded-full bg-gradient-to-b from-white/10 to-transparent blur-xl"></div>

                      {/* Card Body */}
                      <div className="relative z-20 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between mb-5">
                          {/* Icon Tray */}
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          {/* Badge */}
                          <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-neutral-300 ring-1 ring-white/10 backdrop-blur-md">
                            Web3
                          </span>
                        </div>

                        {/* Title & Details */}
                        <div className="space-y-1.5">
                          <h3 className="text-xl font-bold tracking-tight text-white">WalletConnect</h3>
                          <p className="text-xs text-neutral-400 leading-relaxed max-w-[280px]">
                            Connect MetaMask, Coinbase, Trust Wallet, Phantom, Rabby, and 100+ secure wallets.
                          </p>
                        </div>

                        {/* Action Link */}
                        <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors">
                          <span>Select Method</span>
                          <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* 3. Crypto Deposit (Amber Theme) */}
                    <div 
                      onClick={() => { setSelectedMethod('crypto'); setStep('form'); }}
                      className="group relative overflow-hidden rounded-2xl bg-neutral-900/90 p-6 text-white shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl ring-1 ring-white/10 border-t border-white/20 cursor-pointer"
                    >
                      {/* Texture Layer */}
                      <div className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay z-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

                      {/* Atmospheric Glow (Amber) */}
                      <div className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-amber-500/20 blur-2xl transition-opacity duration-500 group-hover:opacity-100 opacity-70"></div>

                      {/* Specular Light Sheen */}
                      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-32 w-full max-w-xs rounded-full bg-gradient-to-b from-white/10 to-transparent blur-xl"></div>

                      {/* Card Body */}
                      <div className="relative z-20 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between mb-5">
                          {/* Icon Tray */}
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          {/* Badge */}
                          <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-neutral-300 ring-1 ring-white/10 backdrop-blur-md">
                            Multi-Chain
                          </span>
                        </div>

                        {/* Title & Details */}
                        <div className="space-y-1.5">
                          <h3 className="text-xl font-bold tracking-tight text-white">Crypto Deposit</h3>
                          <p className="text-xs text-neutral-400 leading-relaxed max-w-[280px]">
                            Deposit BTC, ETH, USDT, USDC, Solana, and BNB directly to dedicated segregated cold storage addresses.
                          </p>
                        </div>

                        {/* Action Link */}
                        <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-amber-400 group-hover:text-amber-300 transition-colors">
                          <span>Select Method</span>
                          <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* 4. Bank Wire Transfer (Purple Theme) */}
                    <div 
                      onClick={() => { setSelectedMethod('bank'); setStep('form'); }}
                      className="group relative overflow-hidden rounded-2xl bg-neutral-900/90 p-6 text-white shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl ring-1 ring-white/10 border-t border-white/20 cursor-pointer"
                    >
                      {/* Texture Layer */}
                      <div className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay z-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

                      {/* Atmospheric Glow (Purple) */}
                      <div className="pointer-events-none absolute -top-12 -right-12 h-44 w-44 rounded-full bg-purple-500/20 blur-2xl transition-opacity duration-500 group-hover:opacity-100 opacity-70"></div>

                      {/* Specular Light Sheen */}
                      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-32 w-full max-w-xs rounded-full bg-gradient-to-b from-white/10 to-transparent blur-xl"></div>

                      {/* Card Body */}
                      <div className="relative z-20 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between mb-5">
                          {/* Icon Tray */}
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/30 shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]">
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 10V11m4 10V11m-8 0h8" />
                            </svg>
                          </div>
                          {/* Badge */}
                          <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-neutral-300 ring-1 ring-white/10 backdrop-blur-md">
                            High-Value Wire
                          </span>
                        </div>

                        {/* Title & Details */}
                        <div className="space-y-1.5">
                          <h3 className="text-xl font-bold tracking-tight text-white">Bank Wire Transfer</h3>
                          <p className="text-xs text-neutral-400 leading-relaxed max-w-[280px]">
                            Domestic and international SWIFT/ACH wire transfers with dedicated institutional banking partners.
                          </p>
                        </div>

                        {/* Action Link */}
                        <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-purple-400 group-hover:text-purple-300 transition-colors">
                          <span>Select Method</span>
                          <svg className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}

              {/* STEP 2: FULL-SCREEN TAKEOVER DETAIL VIEWS */}
              {step === 'form' && (
                <motion.div 
                  key="form"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="relative min-h-[85vh] w-full rounded-[32px] bg-neutral-950 text-white flex flex-col justify-between p-6 sm:p-8 overflow-hidden ring-1 ring-white/10 shadow-2xl"
                >
                  {/* Surface Noise Overlay */}
                  <div className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay z-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

                  {/* Dynamic Top Ambient Light glow based on selected method */}
                  <div className={`pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-64 w-full max-w-xl blur-3xl z-10 ${
                    selectedMethod === 'card' ? 'bg-emerald-500/15' :
                    selectedMethod === 'walletconnect' ? 'bg-indigo-500/15' :
                    selectedMethod === 'crypto' ? 'bg-amber-500/15' : 'bg-purple-500/15'
                  }`}></div>

                  {/* Specular Light Sheen */}
                  <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-32 w-full max-w-md rounded-full bg-gradient-to-b from-white/10 to-transparent blur-xl z-10"></div>

                  {/* 1. CREDIT / DEBIT CARD VIEW */}
                  {selectedMethod === 'card' && (
                    <form onSubmit={handleStartProcessing} className="relative z-20 flex flex-col justify-between h-full space-y-6">
                      {/* Header */}
                      <div className="flex items-center justify-between pb-6 border-b border-white/10">
                        <button 
                          type="button"
                          onClick={() => setStep('methods')} 
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 hover:bg-white/10 active:scale-95 transition"
                          title="Back to methods"
                        >
                          <ArrowLeft className="h-5 w-5 text-white" />
                        </button>
                        <div className="text-center">
                          <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">Credit / Debit Card</h2>
                          <p className="text-[11px] text-neutral-400">Configure parameters & routing</p>
                        </div>
                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
                          Instant Card Pay
                        </span>
                      </div>

                      {/* Form Body */}
                      <div className="flex-1 space-y-6 my-2">
                        {/* Amount Selection */}
                        <div className="space-y-3">
                          <label className="text-xs font-bold tracking-wider text-neutral-400 uppercase">Deposit Amount (USD)</label>
                          <div className="flex items-center rounded-2xl bg-neutral-900/90 px-4 py-3.5 ring-1 ring-white/10 border-t border-white/15 shadow-inner">
                            <span className="text-xl font-bold text-emerald-400 mr-2">$</span>
                            <input 
                              type="number" 
                              value={amount} 
                              onChange={(e) => setAmount(Number(e.target.value))}
                              className="w-full bg-transparent text-2xl font-bold text-white outline-none" 
                            />
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                            {[1000, 3000, 5000, 10000].map((amt) => (
                              <button 
                                type="button"
                                key={amt} 
                                onClick={() => setAmount(amt)}
                                className={`rounded-xl py-2.5 text-xs font-semibold transition ring-1 ${amount === amt ? 'bg-emerald-500 text-black ring-emerald-400 shadow-lg shadow-emerald-500/20 font-bold' : 'bg-white/5 text-neutral-300 ring-white/10 hover:bg-white/10'}`}
                              >
                                ${amt.toLocaleString()}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Input Fields */}
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-neutral-300">Card Holder Name</label>
                            <input 
                              type="text" 
                              required
                              value={cardName}
                              onChange={(e) => setCardName(e.target.value)}
                              placeholder="Card Holder Name" 
                              className="w-full rounded-xl bg-neutral-900/90 px-4 py-3.5 text-sm text-white placeholder-neutral-500 ring-1 ring-white/10 focus:outline-none focus:ring-emerald-500/50" 
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-neutral-300">Card Number</label>
                            <div className="relative flex items-center">
                              <input 
                                type="text" 
                                required
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value)}
                                placeholder="Card Number" 
                                className="w-full rounded-xl bg-neutral-900/90 px-4 py-3.5 pr-28 text-sm font-mono text-white placeholder-neutral-500 ring-1 ring-white/10 focus:outline-none focus:ring-emerald-500/50" 
                              />
                              <div className="absolute right-3 flex items-center gap-1.5 pointer-events-none">
                                <div className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-black italic tracking-wider text-[#1A1F71] dark:text-blue-400 border border-slate-300 dark:border-slate-700 flex items-center justify-center shadow-sm">
                                  VISA
                                </div>
                                <div className="bg-slate-200 dark:bg-slate-800 px-1.5 py-1 rounded border border-slate-300 dark:border-slate-700 flex items-center justify-center shadow-sm">
                                  <div className="flex items-center -space-x-1">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#EB001B]"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#F79E1B]"></div>
                                  </div>
                                </div>
                                <div className="bg-[#0070D2] px-1.5 py-0.5 rounded text-[9px] font-black tracking-tight text-white shadow-sm flex items-center justify-center">
                                  AMEX
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-neutral-300">MM/YY</label>
                              <input 
                                type="text" 
                                required
                                value={cardExpiry}
                                onChange={(e) => setCardExpiry(e.target.value)}
                                placeholder="MM/YY" 
                                className="w-full rounded-xl bg-neutral-900/90 px-4 py-3.5 text-sm text-white placeholder-neutral-500 ring-1 ring-white/10 focus:outline-none focus:ring-emerald-500/50" 
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-neutral-300">CVV</label>
                              <input 
                                type="password" 
                                required
                                maxLength={4}
                                value={cardCvv}
                                onChange={(e) => setCardCvv(e.target.value)}
                                placeholder="000" 
                                className="w-full rounded-xl bg-neutral-900/90 px-4 py-3.5 text-sm text-white placeholder-neutral-500 ring-1 ring-white/10 focus:outline-none focus:ring-emerald-500/50" 
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-neutral-300">Country</label>
                              <select 
                                value={billingCountry}
                                onChange={(e) => setBillingCountry(e.target.value)}
                                className="w-full rounded-xl bg-neutral-900/90 px-4 py-3.5 text-sm text-white ring-1 ring-white/10 focus:outline-none focus:ring-emerald-500/50"
                              >
                                <option className="bg-neutral-900">United States</option>
                                <option className="bg-neutral-900">United Kingdom</option>
                                <option className="bg-neutral-900">Germany</option>
                                <option className="bg-neutral-900">Switzerland</option>
                                <option className="bg-neutral-900">Singapore</option>
                                <option className="bg-neutral-900">United Arab Emirates</option>
                              </select>
                            </div>
                          </div>

                          {/* Save Card Checkbox */}
                          <div className="flex items-center gap-2.5 pt-1">
                            <input 
                              type="checkbox" 
                              id="saveCard" 
                              defaultChecked 
                              className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-emerald-500 focus:ring-0 focus:ring-offset-0 accent-emerald-500 cursor-pointer" 
                            />
                            <label htmlFor="saveCard" className="text-xs text-neutral-300 cursor-pointer select-none flex items-center gap-1.5">
                              Save my card for faster checkout
                              <span className="inline-flex items-center justify-center h-3.5 w-3.5 rounded-full bg-white/10 text-[9px] text-neutral-400 font-bold" title="Securely save your card for 1-click future deposits">?</span>
                            </label>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20 flex items-center gap-3 text-xs text-emerald-400">
                          <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                          <span>3D Secure 2.0 encrypted transmission. Zero liability institutional clearing active.</span>
                        </div>
                      </div>

                      {/* Action Footer */}
                      <div className="pt-2 space-y-3">
                        <button 
                          type="submit"
                          className="w-full rounded-xl bg-amber-300 hover:bg-amber-400 py-4 text-sm font-extrabold text-neutral-950 shadow-lg shadow-amber-300/20 active:scale-[0.98] transition flex items-center justify-center gap-2"
                        >
                          <Lock className="h-4 w-4 text-neutral-950" />
                          PAY {amount.toLocaleString()} USD
                        </button>
                        
                        <p className="text-[11px] text-center text-neutral-400 leading-normal">
                          By clicking the button you confirm to have accepted <a href="#terms" className="text-emerald-400 hover:underline">Terms of Service</a>
                        </p>
                      </div>
                    </form>
                  )}

                  {/* 2. WALLETCONNECT / WEB3 VIEW */}
                  {selectedMethod === 'walletconnect' && (
                    <div className="relative z-20 flex flex-col justify-between h-full space-y-6">
                      {/* Header */}
                      <div className="flex items-center justify-between pb-6 border-b border-white/10">
                        <button 
                          type="button"
                          onClick={() => setStep('methods')} 
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 hover:bg-white/10 active:scale-95 transition"
                          title="Back to methods"
                        >
                          <ArrowLeft className="h-5 w-5 text-white" />
                        </button>
                        <div className="text-center">
                          <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">Connect Self-Custody</h2>
                          <p className="text-[11px] text-neutral-400">Establish cryptographic session</p>
                        </div>
                        <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 ring-1 ring-indigo-500/30">
                          Web3
                        </span>
                      </div>

                      {/* Main Content */}
                      <div className="flex-1 space-y-6 my-2">
                        {/* Amount Input Block */}
                        <div className="space-y-3">
                          <label className="text-xs font-bold tracking-wider text-neutral-400 uppercase">Deposit Amount (USD)</label>
                          <div className="flex items-center rounded-2xl bg-neutral-900/90 px-4 py-3.5 ring-1 ring-white/10 border-t border-white/15 shadow-inner">
                            <span className="text-xl font-bold text-indigo-400 mr-2">$</span>
                            <input 
                              type="number" 
                              value={amount} 
                              onChange={(e) => setAmount(Number(e.target.value))}
                              className="w-full bg-transparent text-2xl font-bold text-white outline-none" 
                            />
                          </div>
                        </div>

                        {!walletConnected ? (
                          <div className="space-y-3">
                            <p className="text-xs text-neutral-400 font-medium">Select your preferred provider:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {WALLETS.map((w) => (
                                <button 
                                  key={w.name} 
                                  onClick={() => handleConnectWallet(w.name)}
                                  className={`group relative w-full overflow-hidden rounded-2xl bg-neutral-900/90 p-4 ring-1 ring-white/10 border-t border-white/15 hover:ring-indigo-500/50 transition-all text-left flex items-center justify-between ${
                                    selectedWallet === w.name ? 'ring-2 ring-indigo-500 bg-indigo-950/20' : ''
                                  }`}
                                >
                                  <div className="relative z-10 flex items-center gap-3.5">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                                      <WalletLogo name={w.name} className="w-7 h-7 flex-shrink-0" />
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">{w.name}</h4>
                                      <p className="text-[11px] text-neutral-400">{w.desc}</p>
                                    </div>
                                  </div>
                                  {isConnectingWallet && selectedWallet === w.name ? (
                                    <RefreshCw className="h-4 w-4 text-indigo-400 animate-spin" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-neutral-500 transition-transform group-hover:translate-x-1 group-hover:text-white" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="p-6 rounded-2xl bg-indigo-950/40 ring-1 ring-indigo-500/40 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="w-3 h-3 rounded-full bg-indigo-400 animate-pulse" />
                                <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">
                                  Cryptographic Session Active ({selectedWallet})
                                </span>
                              </div>
                              <button onClick={() => setWalletConnected(false)} className="text-xs text-indigo-400 hover:underline">Disconnect</button>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-indigo-500/20 text-xs">
                              <div>
                                <span className="text-neutral-400 block mb-1">Vault Address</span>
                                <strong className="font-mono text-white text-sm">{connectedAddress}</strong>
                              </div>
                              <div>
                                <span className="text-neutral-400 block mb-1">Network Protocol</span>
                                <strong className="text-white text-sm">Web3 Multi-Sig Mainnet</strong>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Footer */}
                      <div className="pt-4 border-t border-white/10 space-y-2">
                        <button 
                          onClick={handleStartProcessing}
                          className="w-full rounded-xl bg-indigo-600 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 active:scale-[0.98] transition flex items-center justify-center gap-2"
                        >
                          <span>Confirm & Deposit via Web3 (${amount.toLocaleString()})</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <p className="text-center text-[11px] text-neutral-500">Secured via end-to-end multi-sig session protocol</p>
                      </div>
                    </div>
                  )}

                  {/* 3. CRYPTO COLD STORAGE VIEW */}
                  {selectedMethod === 'crypto' && (
                    <div className="relative z-20 flex flex-col justify-between h-full space-y-6">
                      {/* Header */}
                      <div className="flex items-center justify-between pb-6 border-b border-white/10">
                        <button 
                          type="button"
                          onClick={() => setStep('methods')} 
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 hover:bg-white/10 active:scale-95 transition"
                          title="Back to methods"
                        >
                          <ArrowLeft className="h-5 w-5 text-white" />
                        </button>
                        <div className="text-center">
                          <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">Crypto Cold Storage</h2>
                          <p className="text-[11px] text-neutral-400">Segregated vault deposit</p>
                        </div>
                        <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400 ring-1 ring-amber-500/30">
                          Multi-Chain
                        </span>
                      </div>

                      {/* Content Body */}
                      <div className="flex-1 space-y-6 my-2">
                        {/* Amount Selection */}
                        <div className="space-y-3">
                          <label className="text-xs font-bold tracking-wider text-neutral-400 uppercase">Target Amount (USD Equivalent)</label>
                          <div className="flex items-center rounded-2xl bg-neutral-900/90 px-4 py-3.5 ring-1 ring-white/10 border-t border-white/15 shadow-inner">
                            <span className="text-xl font-bold text-amber-400 mr-2">$</span>
                            <input 
                              type="number" 
                              value={amount} 
                              onChange={(e) => setAmount(Number(e.target.value))}
                              className="w-full bg-transparent text-2xl font-bold text-white outline-none" 
                            />
                          </div>
                        </div>

                        {/* Asset Selector Pills */}
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-neutral-300">Select Digital Asset</label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                            {CRYPTO_ASSETS.map((asset) => (
                              <button 
                                key={asset.symbol} 
                                onClick={() => setSelectedCrypto(asset)}
                                className={`py-2.5 px-3 rounded-xl text-xs font-bold ring-1 transition flex items-center justify-center gap-1.5 ${
                                  selectedCrypto.symbol === asset.symbol 
                                    ? 'bg-amber-500 text-black ring-amber-400 shadow-md shadow-amber-500/20' 
                                    : 'bg-white/5 text-neutral-300 ring-white/10 hover:bg-white/10'
                                } ${
                                  asset.symbol === 'BNB'
                                    ? 'col-span-2 justify-self-center w-[calc(50%-4px)] sm:col-span-1 sm:justify-self-auto sm:w-full'
                                    : ''
                                }`}
                              >
                                <CryptoLogo symbol={asset.symbol} className="w-5 h-5 flex-shrink-0" />
                                <span>{asset.symbol}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* QR & Address Card */}
                        <div className="p-6 rounded-2xl bg-neutral-900/90 ring-1 ring-white/15 border-t border-white/20 shadow-2xl flex flex-col sm:flex-row items-center gap-6">
                          <div className="p-3 rounded-2xl bg-white shadow-xl flex flex-col items-center justify-center flex-shrink-0">
                            <QRCodeSVG
                              value={selectedCrypto.address}
                              size={128}
                              level="H"
                              bgColor="#ffffff"
                              fgColor="#000000"
                              imageSettings={{
                                src: (selectedCrypto.symbol === 'BTC' || selectedCrypto.symbol === 'BNB') ? getCryptoLogoDataUrl('BNB') : getCryptoLogoDataUrl(selectedCrypto.symbol),
                                x: undefined,
                                y: undefined,
                                height: 28,
                                width: 28,
                                excavate: true,
                              }}
                            />
                            <span className="text-[10px] font-bold text-neutral-950 mt-1.5 uppercase">{selectedCrypto.symbol} Vault</span>
                          </div>

                          <div className="space-y-3 flex-1 w-full">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-neutral-300 uppercase">Segregated {selectedCrypto.name} Address</span>
                              <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 ring-1 ring-amber-500/30">
                                {selectedCrypto.network}
                              </span>
                            </div>

                            <div className="flex items-center justify-between rounded-xl bg-neutral-950 p-3.5 ring-1 ring-white/10 border-t border-white/10 font-mono text-xs">
                              <span className="truncate pr-2 text-neutral-200">{selectedCrypto.address}</span>
                              <button 
                                onClick={() => handleCopy(selectedCrypto.address)}
                                className="rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-400 ring-1 ring-amber-500/30 hover:bg-amber-500/20 active:scale-95 transition flex items-center gap-1"
                              >
                                {copiedAddress ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                <span>{copiedAddress ? 'Copied' : 'Copy'}</span>
                              </button>
                            </div>

                            {/* Warning Callout */}
                            <div className="p-3 rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20 text-xs text-amber-300 leading-relaxed flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                              <span>Send only {selectedCrypto.symbol} on {selectedCrypto.network}. Settlement: {selectedCrypto.estTime}.</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Footer */}
                      <div className="pt-4 border-t border-white/10">
                        <button 
                          onClick={handleStartProcessing}
                          className="w-full rounded-xl bg-amber-500 py-4 text-sm font-bold text-black shadow-lg shadow-amber-500/25 hover:bg-amber-400 active:scale-[0.98] transition flex items-center justify-center gap-2"
                        >
                          <span>I Have Deposited {selectedCrypto.symbol}</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 4. BANK WIRE TRANSFER VIEW */}
                  {selectedMethod === 'bank' && (
                    <div className="relative z-20 flex flex-col justify-between h-full space-y-6">
                      {/* Header */}
                      <div className="flex items-center justify-between pb-6 border-b border-white/10">
                        <button 
                          type="button"
                          onClick={() => setStep('methods')} 
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 hover:bg-white/10 active:scale-95 transition"
                          title="Back to methods"
                        >
                          <ArrowLeft className="h-5 w-5 text-white" />
                        </button>
                        <div className="text-center">
                          <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">Bank Wire Transfer</h2>
                          <p className="text-[11px] text-neutral-400">Institutional clearing details</p>
                        </div>
                        <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-400 ring-1 ring-purple-500/30">
                          High-Value Wire
                        </span>
                      </div>

                      {/* Content Body */}
                      <div className="flex-1 space-y-6 my-2">
                        {/* Amount Input */}
                        <div className="space-y-3">
                          <label className="text-xs font-bold tracking-wider text-neutral-400 uppercase">Wire Amount (USD)</label>
                          <div className="flex items-center rounded-2xl bg-neutral-900/90 px-4 py-3.5 ring-1 ring-white/10 border-t border-white/15 shadow-inner">
                            <span className="text-xl font-bold text-purple-400 mr-2">$</span>
                            <input 
                              type="number" 
                              value={amount} 
                              onChange={(e) => setAmount(Number(e.target.value))}
                              className="w-full bg-transparent text-2xl font-bold text-white outline-none" 
                            />
                          </div>
                        </div>

                        {/* Detailed Wire Spec Cards */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-neutral-400">Execute your wire transfer using official institutional parameters:</p>
                            <span className="text-[10px] font-mono text-purple-400 font-bold">SWIFT / IBAN / ACH</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                              { label: 'Beneficiary Bank', value: 'JPMorgan Chase N.A. / HSBC' },
                              { label: 'Beneficiary Name', value: 'AVER GLOBAL PRIME VAULT LLC' },
                              { label: 'SWIFT / BIC Code', value: 'CHASUS33XXX' },
                              { label: 'Routing (ABA)', value: '021000021' },
                              { label: 'Account / IBAN', value: 'CH93 0000 0000 4982 9182 3' },
                              { label: 'Required Reference / Memo', value: bankRef, highlight: true },
                            ].map((f) => (
                              <div 
                                key={f.label} 
                                className={`flex items-center justify-between rounded-xl bg-neutral-900/90 p-3.5 ring-1 border-t border-white/15 ${
                                  f.highlight 
                                    ? 'ring-purple-500/50 bg-purple-950/30 shadow-lg shadow-purple-900/20' 
                                    : 'ring-white/10'
                                }`}
                              >
                                <div>
                                  <div className="text-[10px] text-neutral-400 font-medium">{f.label}</div>
                                  <div className={`text-xs font-mono font-bold mt-0.5 ${f.highlight ? 'text-purple-300 text-sm' : 'text-white'}`}>{f.value}</div>
                                </div>
                                <button 
                                  onClick={() => handleCopy(f.value)}
                                  className="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-semibold text-neutral-300 ring-1 ring-white/10 hover:bg-white/10 active:scale-95 transition"
                                >
                                  Copy
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Wire Proof Upload */}
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-neutral-300">Upload Wire Transfer Receipt (Optional)</label>
                          <div 
                            onClick={() => {
                              setProofUploaded(true);
                              setProofFileName(`Wire_Receipt_${Math.floor(1000 + Math.random() * 9000)}.pdf`);
                            }}
                            className={`border border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                              proofUploaded ? 'border-purple-500 bg-purple-950/20' : 'border-white/15 bg-neutral-900/60 hover:bg-neutral-900'
                            }`}
                          >
                            <Upload className="w-5 h-5 mx-auto mb-1 text-purple-400" />
                            <p className="text-xs font-bold text-white">{proofUploaded ? `Attached: ${proofFileName}` : 'Click to attach wire confirmation receipt (PDF/PNG)'}</p>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-neutral-900/80 ring-1 ring-white/5 text-[11px] text-neutral-400 leading-relaxed flex items-center gap-2">
                          <Clock className="w-4 h-4 text-purple-400 flex-shrink-0" />
                          <span>Wire deposits take 1-3 business days. You must include the reference code in your wire instructions for automatic credit.</span>
                        </div>
                      </div>

                      {/* Bottom CTAs */}
                      <div className="pt-4 border-t border-white/10">
                        <button 
                          onClick={handleStartProcessing}
                          className="w-full rounded-xl bg-purple-600 py-4 text-sm font-bold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500 active:scale-[0.98] transition flex items-center justify-center gap-2"
                        >
                          <span>I Have Initiated This Wire (${amount.toLocaleString()})</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                </motion.div>
              )}

              {/* STEP 3: PROCESSING EXPERIENCE */}
              {step === 'processing' && (
                <motion.div 
                  key="processing"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-12 rounded-[32px] border text-center space-y-8 ${
                    isDark ? 'bg-slate-900/90 border-white/10 backdrop-blur-xl' : 'bg-white border-slate-200 shadow-2xl'
                  }`}
                >
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 relative">
                    <RefreshCw className="w-10 h-10 animate-spin" />
                    <div className="absolute inset-0 rounded-3xl bg-emerald-500/20 blur-xl animate-pulse" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-2xl font-black tracking-tight">{selectedMethod === 'card' ? cardStepsList[processingStepIndex] : processingStepsList[processingStepIndex]}</h2>
                    <p className="text-xs text-slate-400">Please do not close or refresh this window during secure transmission.</p>
                  </div>

                  <div className="max-w-md mx-auto w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/10">
                    <motion.div 
                      className="bg-emerald-500 h-full rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: `${((processingStepIndex + 1) / (selectedMethod === 'card' ? cardStepsList.length : processingStepsList.length)) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-left text-xs">
                    <div className="p-3 rounded-xl bg-white/5">
                      <span className="text-slate-500 block text-[10px]">Method</span>
                      <strong className="uppercase">{selectedMethod}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5">
                      <span className="text-slate-500 block text-[10px]">Amount</span>
                      <strong className="text-emerald-400">${amount.toLocaleString()}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5">
                      <span className="text-slate-500 block text-[10px]">Security</span>
                      <strong>TLS 1.3 / 256-bit</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5">
                      <span className="text-slate-500 block text-[10px]">Clearing</span>
                      <strong>Instant Vault</strong>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: SUCCESS */}
              {step === 'success' && (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-12 rounded-[32px] border text-center space-y-8 ${
                    isDark ? 'bg-slate-900/90 border-white/10 backdrop-blur-xl' : 'bg-white border-slate-200 shadow-2xl'
                  }`}
                >
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-3xl font-black tracking-tight">Deposit Request Submitted</h2>
                    <p className="text-sm text-slate-400 max-w-md mx-auto">
                      Your institutional deposit of <strong className="text-emerald-400">${amount.toLocaleString()}</strong> has been submitted. Your balance will be credited as soon as it is approved by an administrator.
                    </p>
                  </div>

                  <div className={`p-6 rounded-2xl border max-w-md mx-auto text-left space-y-3 ${
                    isDark ? 'bg-black/40 border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Reference ID:</span>
                      <span className="font-mono font-bold">DEP-{Math.floor(100000 + Math.random() * 900000)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Status:</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending Admin Approval</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Estimated Clearance:</span>
                      <span className="font-bold">Immediate upon verification</span>
                    </div>
                  </div>

                  <div className="flex justify-center gap-4 pt-4">
                    <button 
                      onClick={onBack}
                      className="px-8 py-4 rounded-2xl bg-emerald-500 text-slate-950 font-black text-sm hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20"
                    >
                      Return to Dashboard
                    </button>
                  </div>
                </motion.div>
              )}


              {step === 'unavailable' && (
                <motion.div 
                  key="unavailable"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-10 sm:p-12 rounded-[32px] border text-center space-y-8 ${
                    isDark ? 'bg-slate-900/90 border-white/10 backdrop-blur-xl shadow-2xl' : 'bg-white border-slate-200 shadow-2xl'
                  }`}
                >
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-neutral-800/80 border border-white/10 flex items-center justify-center text-slate-300">
                    <AlertCircle className="w-10 h-10 text-slate-300" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                      Card payments are currently unavailable
                    </h2>
                    <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto leading-relaxed">
                      Please choose another payment method or contact support.
                    </p>
                  </div>

                  <div className="pt-4 max-w-md mx-auto">
                    <button 
                      type="button"
                      onClick={() => setStep('methods')}
                      className={`w-full py-5 rounded-2xl font-bold text-sm transition-all shadow-lg ${
                        isDark ? 'bg-slate-800/90 hover:bg-slate-700/90 text-white border border-white/10' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                      }`}
                    >
                      Return to Deposit Methods
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>


        </div>

      </div>
    </div>
  );
}
