# Ethereum Block Analyzer

Ethereum Block Analyzer is a React-based web application that allows users to analyze Ethereum blocks and their transactions. It fetches block data from the Ethereum blockchain using the Etherscan API and provides additional insights using the Gaia AI API.

## Features

- Fetch and display transaction data for a specific Ethereum block
- Calculate total transactions and total value (in Wei and ETH) for the block
- Send analysis results to Gaia AI for further insights
- User-friendly interface with error handling

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js (v12.0.0 or later)
- npm (v6.0.0 or later)

## Installation

1. Clone the repository:
   git clone https://github.com/yourusername/ethereum-block-analyzer.git 
   cd ethereum-block-analyzer

2. Install the dependencies:
   npm install

3. Create a `.env` file in the root directory and add your Etherscan API key:
NEXT_PUBLIC_ETHERSCAN_API_KEY=your_etherscan_api_key_here

## Usage

1. Start the development server:
npm start

2. Open your browser and navigate to `http://localhost:3000`

3. Enter a block number in the input field and click "Analyze" to fetch and analyze the block data

## Configuration

The application uses the following configuration:

- Etherscan API endpoint: https://api.etherscan.io/api
- Gaia API endpoint: https://llama.us.gaianet.network/v1
- Gaia LLM Model: llama
- Gaia Embedding Model: nomic-embed

You can modify these configurations in the `BlockAnalyzer.js` file if needed.

## Contributing

Contributions to the Ethereum Block Analyzer are welcome. Please follow these steps to contribute:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature-name`)
3. Make your changes
4. Commit your changes (`git commit -am 'Add some feature'`)
5. Push to the branch (`git push origin feature/your-feature-name`)
6. Create a new Pull Request

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## Contact

If you have any questions or feedback, please open an issue on the GitHub repository.

## Acknowledgements

- [Etherscan](https://etherscan.io/) for providing the Ethereum blockchain data API
- [Gaia](https://www.gaianet.network/) for AI-powered analysis capabilities
- [React](https://reactjs.org/) for the front-end framework
- [Axios](https://axios-http.com/) for HTTP requests
