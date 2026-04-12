# commit.base - Onchain Habit Protocol 🎯

**commit.base** is a decentralized application (dApp) built on the Base Sepolia network that incentivizes personal growth through financial accountability. Users lock USDC into a smart contract while they commit to maintaining a daily habit. Through daily check-ins verified by an AI Agent, users build on-chain proof of their dedication.

If a user successfully checks in for 80% or more of their targeted duration, their staked amount is fully refunded. If they fail to meet the threshold, the staked USDC is automatically sent to a designated penalty or charity address.

## Features ✨
* **DeFi Accountability:** Connect your Web3 wallet and stake USDC to bind yourself to a commitment.
* **Smart Contract Execution:** Fully non-custodial lockup on the Base Sepolia network.
* **AI Agent Verification (x402):** Daily habits are managed and verified via a dedicated backend agent.
* **Multi-Language Support:** English and Turkish translations built-in.
* **Modern Premium UI:** Fully responsive glassmorphism design with a dark mode base theme and interactive dynamic background.

## Tech Stack 🛠️
* **Frontend:** React, Vite, wagmi, viem
* **Backend:** Node.js, Express (Agent Backend for verification logic)
* **Blockchain:** Base Sepolia Testnet, USDC Smart Contract

## Project Structure 📁
* `src/` - Contains the React frontend UI, components (`App.jsx`), global state & design system.
* `agent-backend/` - Node.js server that simulates the x402 AI Agent verification, processes check-ins, and manages state for active commitments.

## Getting Started 🚀

### 1. Prerequisites
Make sure you have Node.js and a valid Web3 Wallet (e.g., MetaMask, Coinbase Wallet) configured for the Base Sepolia Network. You'll also need some testnet ETH and testnet USDC on Base Sepolia.

### 2. Run the Agent Backend
Navigate to the `agent-backend` folder to start the backend verification service.
```bash
cd agent-backend
npm install
node server.js
```
The backend server will run on `http://localhost:3001` representing the x402 AI agent.

### 3. Run the Frontend App
Open a new terminal session, navigate to the project root, install dependencies, and start the Vite dev server.
```bash
npm install
npm run dev
```

### 4. Create Your Habit
- Visit the local URL provided by Vite (e.g., `http://localhost:5173`).
- Connect your wallet.
- Select your habit, duration, and stake amount.
- Enter a penalty address.
- Provide the required approvals, sign the contract, and stake your USDC!

## Logic & Rules 📜
* **Threshold Rules:** The application requires a rigid 80% completion rate.
* **Calendar Tracking:** Users get a dashboard to view the calendar, monitor their current streak, execute daily check-ins, and track successful completion over the specified days.
* **Resolution Workflow:** When the duration ends, the Agent decides whether the funds are routed back to the creator natively via the Refund smart contract mechanism or dispatched to the set Penalty Address.
