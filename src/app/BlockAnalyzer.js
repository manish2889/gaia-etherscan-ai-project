'use client';

import React, { useState } from 'react';
import axios from 'axios';

const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;

// Gaia API Configuration based on public domains documentation
const GAIA_DOMAIN = {
  endpoint: 'https://llama8b.gaia.domains/v1',
  model: 'llama',
  embed_model: 'nomic-embed'
};

const GAIA_API_KEY = process.env.NEXT_PUBLIC_GAIA_API_KEY;

// Add validation for environment variables
if (!ETHERSCAN_API_KEY) {
  console.error('Warning: NEXT_PUBLIC_ETHERSCAN_API_KEY is not configured in environment variables');
}

if (!GAIA_API_KEY) {
  console.warn('Warning: NEXT_PUBLIC_GAIA_API_KEY is not configured in environment variables');
}

const NETWORKS = {
  mainnet: {
    name: 'Ethereum Mainnet',
    apiUrl: 'https://api.etherscan.io/api',
    blockExplorerUrl: 'https://etherscan.io',
  },
  sepolia: {
    name: 'Sepolia Testnet',
    apiUrl: 'https://api-sepolia.etherscan.io/api',
    blockExplorerUrl: 'https://sepolia.etherscan.io',
  },
  holesky: {
    name: 'Holesky Testnet',
    apiUrl: 'https://api-holesky.etherscan.io/api',
    blockExplorerUrl: 'https://holesky.etherscan.io',
  }
};

const BlockAnalyzer = () => {
  const [blockNumber, setBlockNumber] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('mainnet');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiSentiment, setAiSentiment] = useState(null);
  const [aiPredictions, setAiPredictions] = useState(null);
  const [theme, setTheme] = useState('light');

  const getBlockTransactions = async (blockNum) => {
    try {
      if (!ETHERSCAN_API_KEY) {
        throw new Error('Etherscan API key is not configured. Please check your environment variables.');
      }

      // Convert block number to hex for the API call
      const hexBlockNum = `0x${parseInt(blockNum).toString(16)}`;

      const url = `${NETWORKS[selectedNetwork].apiUrl}?module=proxy&action=eth_getBlockByNumber&tag=${hexBlockNum}&boolean=true&apikey=${ETHERSCAN_API_KEY}`;
      const response = await axios.get(url);
      
      console.log('API Response:', response.data); // Debug log

      if (response.data.status === '0' || response.data.message === 'NOTOK') {
        throw new Error(`API Error: ${response.data.result || 'Invalid API key or request'}`);
      }

      if (!response.data.result) {
        throw new Error(`Block ${blockNum} not found or has no transactions.`);
      }

      // For debugging
      console.log('Block data:', response.data.result);
      
      return response.data.result;
    } catch (error) {
      console.error('Error in getBlockTransactions:', error);
      throw new Error(`Failed to fetch block data: ${error.message}`);
    }
  };

  const analyzeTransactions = (block) => {
    console.log('Analyzing block:', block); // Debug log

    if (!block || !block.transactions) {
      throw new Error('Invalid block data: missing transactions');
    }

    const transactions = Array.isArray(block.transactions) ? block.transactions : [];
    console.log('Transactions:', transactions); // Debug log

    if (transactions.length === 0) {
      return {
        blockTimestamp: new Date(parseInt(block.timestamp || '0', 16) * 1000),
        totalTransactions: 0,
        totalValueWei: 0,
        totalValueEth: 0,
        uniqueAddresses: 0,
        maxValueEth: 0,
        minValueEth: 0,
        averageValueEth: 0,
        contractInteractions: 0,
        totalGasUsed: 0,
        averageGasPerTx: 0,
        blockGasLimit: parseInt(block.gasLimit || '0', 16),
        blockDifficulty: parseInt(block.difficulty || '0', 16),
        blockSize: block.size ? parseInt(block.size, 16) : 0,
        blockNumber: parseInt(block.number || '0', 16),
        blockHash: block.hash || '',
        parentHash: block.parentHash || '',
        miner: block.miner || '',
      };
    }

    const totalValue = transactions.reduce((sum, tx) => sum + parseInt(tx.value || '0', 16), 0);
    const uniqueAddresses = new Set();
    let maxValue = 0;
    let minValue = Infinity;
    let contractInteractions = 0;
    let totalGasUsed = 0;

    transactions.forEach(tx => {
      if (tx.from) uniqueAddresses.add(tx.from);
      if (tx.to) uniqueAddresses.add(tx.to);
      const value = parseInt(tx.value || '0', 16);
      maxValue = Math.max(maxValue, value);
      if (value > 0) minValue = Math.min(minValue, value);
      if (tx.input && tx.input.length > 2) contractInteractions++;
      totalGasUsed += parseInt(tx.gas || '0', 16);
    });

    return {
      blockTimestamp: new Date(parseInt(block.timestamp || '0', 16) * 1000),
      blockNumber: parseInt(block.number || '0', 16),
      blockHash: block.hash || '',
      parentHash: block.parentHash || '',
      miner: block.miner || '',
      totalTransactions: transactions.length,
      totalValueWei: totalValue,
      totalValueEth: totalValue / 1e18,
      uniqueAddresses: uniqueAddresses.size,
      maxValueEth: maxValue / 1e18,
      minValueEth: minValue === Infinity ? 0 : minValue / 1e18,
      averageValueEth: (totalValue / transactions.length) / 1e18,
      contractInteractions,
      totalGasUsed,
      averageGasPerTx: totalGasUsed / transactions.length,
      blockGasLimit: parseInt(block.gasLimit || '0', 16),
      blockDifficulty: parseInt(block.difficulty || '0', 16),
      blockSize: block.size ? parseInt(block.size, 16) : 0,
    };
  };

  const getAiAnalysis = async (analysisResults) => {
    try {
      if (!GAIA_API_KEY) {
        throw new Error('Developer API key required. Please configure a valid Gaia Developer API key to enable AI features.');
      }

      const headers = {
        'Authorization': `Bearer ${GAIA_API_KEY}`,
        'Content-Type': 'application/json'
      };

      const axiosConfig = {
        headers,
        timeout: 30000 // 30 seconds timeout
      };

      // Minimal prompt focusing only on key metrics
      const prompt = `Block metrics: ${analysisResults.totalTransactions} txs, ${analysisResults.totalValueEth.toFixed(2)} ETH total, ${((analysisResults.totalGasUsed / analysisResults.blockGasLimit) * 100).toFixed(1)}% gas used. Provide 3 bullet points: activity analysis, market sentiment, network impact.`;

      try {
        console.log('Sending request to Gaia API:', {
          endpoint: GAIA_DOMAIN.endpoint,
          model: GAIA_DOMAIN.model
        });
        
        const requestBody = {
          messages: [{
            role: "system",
            content: "You are a blockchain analyst. Respond in 3 brief bullet points."
          }, {
            role: "user",
            content: prompt
          }],
          model: GAIA_DOMAIN.model,
          temperature: 0.7,
          max_tokens: 150
        };

        const response = await axios.post(
          `${GAIA_DOMAIN.endpoint}/chat/completions`,
          requestBody,
          axiosConfig
        );

        if (response.data?.choices?.[0]?.message?.content) {
          const content = response.data.choices[0].message.content;
          const points = content.split('\n')
            .filter(line => line.trim())
            .map(line => line.replace(/^[•\-\*]\s*/, ''))
            .filter(line => line);

          return {
            analysis: points[0] || 'Analysis not available',
            sentiment: points[1] || 'Sentiment not available',
            predictions: points[2] || 'Predictions not available'
          };
        } else {
          throw new Error('Invalid response format from AI service');
        }
      } catch (error) {
        if (error.response?.status === 401) {
          console.error('Authentication error:', error.response.data);
          throw new Error('Authentication failed. Please ensure you have a valid Developer API key from the Gaia platform.');
        } else if (error.response?.status === 404) {
          console.error('Endpoint not found:', error.response.data);
          throw new Error('The AI service endpoint could not be found. Please check the API configuration.');
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('The AI service request timed out. Please try again.');
        } else if (error.response?.data) {
          console.error('API error response:', error.response.data);
          throw new Error(`AI service error: ${error.response.data.error || error.response.data.message || error.message}`);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error in getAiAnalysis:', error);
      throw new Error(`AI Analysis failed: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAnalysis(null);
    setAiAnalysis(null);
    setAiSentiment(null);
    setAiPredictions(null);
  
    try {
      const blockData = await getBlockTransactions(blockNumber);
      const analysisResults = analyzeTransactions(blockData);
      setAnalysis(analysisResults);
      
      // Only attempt AI analysis if API key is configured
      if (GAIA_API_KEY) {
        try {
          const aiResults = await getAiAnalysis(analysisResults);
          setAiAnalysis(aiResults.analysis);
          setAiSentiment(aiResults.sentiment);
          setAiPredictions(aiResults.predictions);
        } catch (aiError) {
          console.error('AI Analysis error:', aiError);
          setError(`AI Analysis unavailable: ${aiError.message}`);
          // Continue showing block analysis even if AI fails
        }
      } else {
        setError('AI features are currently disabled. Please configure a valid Gaia Developer API key to enable AI analysis.');
      }
    } catch (err) {
      if (err.message.includes('Block') && err.message.includes('not found')) {
        setError(`The block number ${blockNumber} was not found or has no transactions. Please check the block number and try again.`);
      } else {
        setError(`An error occurred: ${err.message}`);
      }
      console.error('Detailed error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900' : 'bg-gradient-to-br from-blue-50 via-white to-blue-50'}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <h1 className={`text-3xl sm:text-4xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} tracking-tight text-center sm:text-left`}>
              Ethereum Block Analyzer
            </h1>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-sm rounded-full ${
                theme === 'dark' ? 'bg-blue-900/50 text-blue-200' : 'bg-blue-100 text-blue-800'
              } backdrop-blur-sm`}>
                Pro
              </span>
              <span className={`px-3 py-1 text-sm rounded-full ${
                GAIA_API_KEY 
                  ? (theme === 'dark' ? 'bg-green-900/50 text-green-200' : 'bg-green-100 text-green-800')
                  : (theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600')
              } backdrop-blur-sm`}>
                {GAIA_API_KEY ? 'AI Powered' : 'AI Disabled'}
              </span>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`p-3 rounded-full transition-all duration-300 transform hover:scale-110 ${
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 shadow-lg shadow-gray-900/50'
                : 'bg-white hover:bg-gray-100 text-gray-800 shadow-lg'
            }`}
          >
            {theme === 'dark' ? '🌞' : '🌙'}
          </button>
        </div>

        <div className={`p-6 rounded-xl shadow-lg mb-8 ${
          theme === 'dark' ? 'bg-gray-800/30 backdrop-blur-sm border border-gray-700' : 'bg-white/80 backdrop-blur-sm border border-gray-200'
        }`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <select
                value={selectedNetwork}
                onChange={(e) => setSelectedNetwork(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg transition-all duration-200 ${
                  theme === 'dark' 
                    ? 'bg-gray-700/50 border-gray-600 text-gray-200 hover:border-blue-500' 
                    : 'bg-gray-50/50 border-gray-200 text-gray-900 hover:border-blue-500'
                } border-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                {Object.entries(NETWORKS).map(([key, network]) => (
                  <option key={key} value={key} className={
                    theme === 'dark' ? 'bg-gray-700' : 'bg-white'
                  }>
                    {network.name}
                  </option>
                ))}
              </select>
              <div className="flex">
                <input
                  type="text"
                  value={blockNumber}
                  onChange={(e) => {
                    const value = e.target.value.trim();
                    if (value === '' || /^\d+$/.test(value)) {
                      setBlockNumber(value);
                    }
                  }}
                  placeholder="Enter block number (e.g. 17000000)"
                  className={`flex-1 px-4 py-3 rounded-l-lg transition-all duration-200 ${
                    theme === 'dark'
                      ? 'bg-gray-700/50 border-gray-600 text-gray-200 placeholder-gray-400'
                      : 'bg-gray-50/50 border-gray-200 text-gray-900 placeholder-gray-500'
                  } border-2 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
                <button
                  type="submit"
                  disabled={loading || !blockNumber || !/^\d+$/.test(blockNumber)}
                  className={`px-6 py-3 rounded-r-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                    theme === 'dark'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/50'
                      : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg'
                  } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Analyzing...</span>
                    </span>
                  ) : (
                    'Analyze Block'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {error && (
          <div className={`p-4 rounded-lg mb-8 animate-fade-in ${
            theme === 'dark' ? 'bg-red-900/30 text-red-200 border border-red-800' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <p className="flex items-center">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="flex-1">{error}</span>
            </p>
          </div>
        )}

        {analysis && (
          <div className={`p-6 rounded-xl shadow-lg mb-8 transition-all duration-300 ${
            theme === 'dark' ? 'bg-gray-800/30 backdrop-blur-sm border border-gray-700' : 'bg-white/80 backdrop-blur-sm border border-gray-200'
          }`}>
            <h2 className={`text-2xl font-bold mb-6 ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            }`}>
              Analysis Results
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Block Time', value: analysis.blockTimestamp.toLocaleString() },
                { label: 'Total Transactions', value: analysis.totalTransactions.toLocaleString() },
                { label: 'Total Value (ETH)', value: analysis.totalValueEth.toFixed(4) },
                { label: 'Unique Addresses', value: analysis.uniqueAddresses.toLocaleString() },
                { label: 'Contract Interactions', value: analysis.contractInteractions.toLocaleString() },
                { label: 'Gas Usage', value: `${((analysis.totalGasUsed / analysis.blockGasLimit) * 100).toFixed(2)}%` },
                { label: 'Max Transaction (ETH)', value: analysis.maxValueEth.toFixed(4) },
                { label: 'Average Value (ETH)', value: analysis.averageValueEth.toFixed(4) }
              ].map((item, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg transition-all duration-300 hover:transform hover:scale-105 ${
                    theme === 'dark' ? 'bg-gray-700/50 hover:bg-gray-700/70' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <p className="text-sm font-medium opacity-75">{item.label}</p>
                  <p className="text-lg font-semibold mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Analysis sections with improved styling */}
        {[
          { title: 'AI Analysis', content: aiAnalysis },
          { title: 'Market Sentiment', content: aiSentiment },
          { title: 'AI Predictions', content: aiPredictions }
        ].map((section, index) => section.content && (
          <div
            key={index}
            className={`p-6 rounded-xl shadow-lg mb-8 transition-all duration-300 ${
              theme === 'dark' ? 'bg-gray-800/30 backdrop-blur-sm border border-gray-700' : 'bg-white/80 backdrop-blur-sm border border-gray-200'
            }`}>
            <h2 className={`text-2xl font-bold mb-4 ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            }`}>
              {section.title}
            </h2>
            <div className={`prose max-w-none ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {section.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlockAnalyzer;
