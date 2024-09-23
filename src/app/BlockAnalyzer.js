'use client';

import React, { useState } from 'react';
import axios from 'axios';

const ETHERSCAN_API_KEY = 'DKGGM74F3YE7XWHGRH3HVHMRDEMIB8YJS4';
const GAIA_API_ENDPOINT = 'https://llama.us.gaianet.network/v1';
const GAIA_API_KEY = ''; // Empty or any value
const LLM_MODEL = 'llama';
const EMBEDDING_MODEL = 'nomic-embed';

const BlockAnalyzer = () => {
  const [blockNumber, setBlockNumber] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getBlockTransactions = async (blockNum) => {
    try {
      const hexBlockNum = `0x${parseInt(blockNum).toString(16)}`;
      const url = `https://api.etherscan.io/api?module=proxy&action=eth_getBlockByNumber&tag=${hexBlockNum}&boolean=true&apikey=${ETHERSCAN_API_KEY}`;
      const response = await axios.get(url);
      console.log('Etherscan API response:', response.data);
      
      if (response.data.error) {
        throw new Error(`Etherscan API error: ${response.data.error.message}`);
      }
      
      if (response.data.result === null) {
        throw new Error(`Block ${blockNum} not found or not yet mined`);
      }
      
      if (response.data && response.data.result && response.data.result.transactions) {
        return response.data.result.transactions;
      } else {
        throw new Error('Invalid response structure from Etherscan API');
      }
    } catch (error) {
      console.error('Error fetching block transactions:', error);
      throw error;
    }
  };
  

  const analyzeTransactions = (transactions) => {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      throw new Error('No transactions found for this block');
    }
    const totalValue = transactions.reduce((sum, tx) => {
      const value = parseInt(tx.value, 16);
      return isNaN(value) ? sum : sum + value;
    }, 0);
    return {
      totalTransactions: transactions.length,
      totalValueWei: totalValue,
      totalValueEth: totalValue / 1e18,
    };
  };

  const sendToGaia = async (analysisResults) => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GAIA_API_KEY}`
    };

    const payload = {
      model: LLM_MODEL,
      prompt: `Analyze the following Ethereum block data: ${JSON.stringify(analysisResults)}`,
      max_tokens: 150
    };

    try {
      const response = await axios.post(`${GAIA_API_ENDPOINT}/completions`, payload, { headers });
      return response.data;
    } catch (error) {
      console.error('Error sending data to Gaia:', error);
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

      const gaiaResponse = await sendToGaia(analysisResults);
      console.log('Gaia response:', gaiaResponse);
      // You can update the UI with the Gaia response here if needed
    } catch (err) {
      setError(err.message || 'An error occurred while fetching or analyzing data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Ethereum Block Analyzer</h1>
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          value={blockNumber}
          onChange={(e) => setBlockNumber(e.target.value)}
          placeholder="Enter block number"
          className="px-4 py-2 border rounded mr-2"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </form>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {analysis && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Analysis Results</h2>
          <p>Total Transactions: {analysis.totalTransactions}</p>
          <p>Total Value (Wei): {analysis.totalValueWei}</p>
          <p>Total Value (ETH): {analysis.totalValueEth.toFixed(4)}</p>
        </div>
      )}
    </div>
  );
};

export default BlockAnalyzer;
