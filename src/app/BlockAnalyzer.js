'use client';

import React, { useState } from 'react';
import axios from 'axios';

const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;
const GAIA_API_ENDPOINT = 'https://llama.us.gaianet.network/v1';
const GAIA_MODEL_NAME = 'llama';
const GAIA_EMBED_MODEL = 'nomic-embed';

const BlockAnalyzer = () => {
  const [blockNumber, setBlockNumber] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gaiaResponse, setGaiaResponse] = useState(null);

  const getBlockTransactions = async (blockNum) => {
    try {
      const hexBlockNum = `0x${parseInt(blockNum).toString(16)}`;
      const url = `https://api.etherscan.io/api?module=proxy&action=eth_getBlockByNumber&tag=${hexBlockNum}&boolean=true&apikey=${ETHERSCAN_API_KEY}`;
      const response = await axios.get(url);
      
      console.log('Full API response:', response.data);
  
      if (response.data.jsonrpc === '2.0' && response.data.result === null) {
        throw new Error(`Block ${blockNum} not found or has no transactions.`);
      }
  
      if (!response.data.result || !Array.isArray(response.data.result.transactions)) {
        throw new Error(`Invalid API response: ${JSON.stringify(response.data)}`);
      }
      
      return response.data.result.transactions;
    } catch (error) {
      console.error('Error in getBlockTransactions:', error);
      throw error;
    }
  };
  
  
  

  const analyzeTransactions = (transactions) => {
    const totalValue = transactions.reduce((sum, tx) => sum + parseInt(tx.value, 16), 0);
    return {
      totalTransactions: transactions.length,
      totalValueWei: totalValue,
      totalValueEth: totalValue / 1e18,
    };
  };

  const sendToGaia = async (analysisResults) => {
    try {
      const prompt = `Analyze the following Ethereum block data:
        Total Transactions: ${analysisResults.totalTransactions}
        Total Value (Wei): ${analysisResults.totalValueWei}
        Total Value (ETH): ${analysisResults.totalValueEth.toFixed(4)}
        
        Provide insights on this block's activity compared to average Ethereum block metrics.`;

      const response = await axios.post(GAIA_API_ENDPOINT, {
        model: GAIA_MODEL_NAME,
        prompt: prompt,
        max_tokens: 150,
        temperature: 0.7,
      });

      return response.data;
    } catch (error) {
      console.error('Error in sendToGaia:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setAnalysis(null);
  
    try {
      const transactions = await getBlockTransactions(blockNumber);
      const analysisResults = analyzeTransactions(transactions);
      setAnalysis(analysisResults);
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
  

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-4xl font-bold mb-6 text-center text-blue-600">Ethereum Block Analyzer</h1>
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex items-center">
          <input
            type="text"
            value={blockNumber}
            onChange={(e) => setBlockNumber(e.target.value)}
            placeholder="Enter block number"
            className="flex-grow px-4 py-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-6 py-2 rounded-r hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </form>

      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

      {analysis && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">Analysis Results</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-100 p-4 rounded">
              <p className="font-semibold">Total Transactions</p>
              <p className="text-2xl">{analysis.totalTransactions}</p>
            </div>
            <div className="bg-gray-100 p-4 rounded">
              <p className="font-semibold">Total Value (ETH)</p>
              <p className="text-2xl">{analysis.totalValueEth.toFixed(4)}</p>
            </div>
          </div>
          <div className="mt-4 bg-gray-100 p-4 rounded">
            <p className="font-semibold">Total Value (Wei)</p>
            <p className="text-lg break-all">{analysis.totalValueWei}</p>
          </div>
        </div>
      )}

      {gaiaResponse && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">AI Insights</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{gaiaResponse.choices[0].text.trim()}</p>
        </div>
      )}
    </div>
  );
};

export default BlockAnalyzer;
