import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import "./App.css";
import ChatWidget from "./components/ChatWidget";

function App() {
  const [wallet, setWallet] = useState(null);
  const [provider, setProvider] = useState(null);
  const [manualTips, setManualTips] = useState([]);
  const [aiTips, setAiTips] = useState([]);
  const [tokenBalances, setTokenBalances] = useState([]);
  const [loadingAITips, setLoadingAITips] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask!");
    const prov = new ethers.BrowserProvider(window.ethereum);
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    setWallet(accounts[0]);
    setProvider(prov);
  };

  const getAIPersonalizedTips = useCallback(async (address, balances) => {
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    if (!apiKey) return ["⚠️ API key missing"];

    const tokenInfo = balances.map(t => `${t.symbol}: ${t.amount}`).join(", ");
    const prompt = `You are a Web3 privacy expert. Wallet: ${address}. Tokens: ${tokenInfo}. Return 3 bullet points with personalized advice.`;

    try {
      setLoadingAITips(true);
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";

      const parsedTips = text
        .split("\n")
        .map(l => l.trim())
        .filter(l => l.length > 0)
        .map(l => {
          const cleaned = l.replace(/^[-•\d.]+\s*/, "");
          return cleaned ? `🤖 ${cleaned}` : null;
        })
        .filter(Boolean);

      return parsedTips.length > 0
        ? parsedTips
        : ["🤖 No actionable AI tips generated."];

    } catch (err) {
      console.error("AI error:", err);
      return ["⚠️ Failed to fetch AI tips."];
    } finally {
      setLoadingAITips(false);
    }
  }, []);

  const getRecommendations = useCallback(async (address) => {
    try {
      const tips = [];
      const balances = [];

      const ethBalance = await provider.getBalance(address);
      const eth = ethers.formatEther(ethBalance);
      balances.push({
        name: "Ethereum",
        symbol: "ETH",
        amount: eth,
        logo: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/eth.png",
      });
      tips.push(parseFloat(eth) > 1
        ? "🪙 You hold over 1 ETH — consider using a cold wallet."
        : "💡 Your ETH balance is low. Consider consolidating wallets.");

      const tokenList = [
        {
          name: "PrivacyX",
          symbol: "PRVX",
          address: "0x700509775B89e6695Da271c79c976d65846A0180",
          decimals: 18,
          logo: "https://raw.githubusercontent.com/Privacyx-org/prvx-assets/main/logo-PRVX-32x32.svg",
        },
        {
          name: "Tether", symbol: "USDT",
          address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
          decimals: 6,
          logo: "https://cryptologos.cc/logos/tether-usdt-logo.png?v=029",
        },
        {
          name: "Dai Stablecoin", symbol: "DAI",
          address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
          decimals: 18,
          logo: "https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png?v=029",
        },
      ];

      for (let token of tokenList) {
        const contract = new ethers.Contract(token.address, ["function balanceOf(address) view returns (uint256)"], provider);
        const rawBalance = await contract.balanceOf(address);
        const formatted = parseFloat(ethers.formatUnits(rawBalance, token.decimals));
        if (formatted > 0) {
          balances.push({
            name: token.name,
            symbol: token.symbol,
            amount: formatted.toFixed(4),
            logo: token.logo,
          });
          tips.push(`🔎 ${token.symbol} detected: ${formatted.toFixed(4)} — avoid reusing this address.`);
          if (token.symbol === "PRVX") tips.push("🧬 Use PRVX staking or mixer to enhance your privacy.");
        }
      }

      tips.push("🔍 Try using the PRVX Mixer to anonymize large transfers.");

      const aiTips = await getAIPersonalizedTips(address, balances);
      setTokenBalances(balances);
      setManualTips(tips);
      setAiTips(aiTips);
    } catch (err) {
      console.error("Error:", err);
      setManualTips(["❌ Failed to analyze wallet."]);
      setAiTips([]);
    }
  }, [provider, getAIPersonalizedTips]);

  useEffect(() => {
    if (wallet && provider) getRecommendations(wallet);
  }, [wallet, provider, getRecommendations]);

  const cardStyle = {
    border: "1px solid #4befa055",
    borderRadius: "12px",
    backgroundColor: darkMode ? "#1c1c1c" : "#ffffff",
    padding: "1.2rem",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    marginBottom: "2rem",
    transition: "all 0.3s ease"
  };

  return (
    <div className="App" style={{
      padding: "2rem",
      fontFamily: "Inter, sans-serif",
      backgroundColor: darkMode ? "#111" : "#f0f0f0",
      color: darkMode ? "#eee" : "#111",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "row",
      transition: "all 0.3s ease",
    }}>
      <div style={{ flex: 1, paddingRight: "2rem" }}>
        <div style={{ position: "absolute", top: "1rem", right: "1rem" }}>
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              background: "none",
              border: "1px solid #4befa0",
              color: "#4befa0",
              padding: "0.4rem 0.8rem",
              borderRadius: "999px",
              cursor: "pointer",
            }}
          >
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>

        <header style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          marginBottom: "2rem"
        }}>
          <img src="https://raw.githubusercontent.com/Privacyx-org/prvx-assets/main/logo-PRVX-32x32.svg" alt="PrivacyX" style={{ width: "36px", height: "36px" }} />
          <h1 style={{ color: "#4befa0", fontSize: "2.2rem", margin: 0 }}>Privacyx Guardian</h1>
        </header>

        {wallet && <p style={{ fontSize: "0.9rem", textAlign: "center" }}>🧾 {wallet}</p>}

        {!wallet ? (
          <div style={{ textAlign: "center" }}>
            <button onClick={connectWallet} style={{
              padding: "0.8rem 1.6rem",
              backgroundColor: "#4befa0",
              border: "none",
              borderRadius: "8px",
              fontSize: "1rem",
              fontWeight: "600",
              cursor: "pointer",
              color: "#000",
            }}>
              Connect Wallet
            </button>
          </div>
        ) : (
          <main style={{ maxWidth: "800px", margin: "1rem auto" }}>
            <section style={cardStyle}>
              <h2 style={{ color: "#4befa0", marginBottom: "1rem" }}>Token Summary</h2>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid #333" }}>
                    <th>Logo</th>
                    <th>Token</th>
                    <th>Symbol</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {tokenBalances.map((token, index) => (
                    <tr key={index} style={{ borderBottom: "1px solid #333" }}>
                      <td><img src={token.logo} alt={token.symbol} width="24" height="24" /></td>
                      <td>{token.name}</td>
                      <td>{token.symbol}</td>
                      <td>{token.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section style={cardStyle}>
              <h2 style={{ color: "#4befa0", marginBottom: "1rem" }}>Manual Tips</h2>
              <ul style={{ lineHeight: "1.6", paddingLeft: "1.2rem" }}>
                {manualTips.map((tip, index) => <li key={index}>{tip}</li>)}
              </ul>
            </section>

            <section style={cardStyle}>
              <h2 style={{ color: "#4befa0", marginBottom: "1rem" }}>AI Tips</h2>
              {loadingAITips ? (
                <p>⏳ Generating personalized tips...</p>
              ) : (
                <ul style={{ lineHeight: "1.6", paddingLeft: "1.2rem" }}>
                  {aiTips.map((tip, index) => <li key={index}>{tip}</li>)}
                </ul>
              )}
            </section>

            <section style={cardStyle}>
              <h2 style={{ color: "#4befa0", marginBottom: "1rem" }}>Chat with Privacyx Guardian</h2>
              <ChatWidget assistantName="Privacyx Guardian" />
            </section>
          </main>
        )}
      </div>

      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <img src="/agent-privacyx.png" alt="Privacyx AI Agent" style={{ maxWidth: "100%", maxHeight: "90vh", borderRadius: "12px" }} />
      </div>
    </div>
  );
}

export default App;

