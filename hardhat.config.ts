import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "hardhat-deploy"
import "dotenv/config"
// import { ProxyAgent, setGlobalDispatcher } from "undici"

// 如果要在实时网络上使用hardhat，需要设置代理
// const proxyAgent = new ProxyAgent("http://127.0.0.1:33574")
// setGlobalDispatcher(proxyAgent)

// env
const env = process.env
const mainnetUrl = env.MAINNET_URL || ""
const sepoliaUrl = env.SEPOLIA_URL || ""
const sepoliaPrivateKey = env.SEPOLIA_PRIVATE_KEY || ""
const sepoliaEtherscanKey = env.SEPOLIA_ETHERSCAN_API_KEY || ""

const config: HardhatUserConfig = {
  solidity: {
    compilers: [{ version: "0.8.20" }, { version: "0.6.12" }, { version: "0.4.19" }]
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
      /*
       * 在以太坊开发中，"fork"通常指的是创建一个以太坊区块链的副本。
       * 这通常在开发和测试过程中使用，以便在不影响主网络的情况下进行实验和调试。
       * 在Hardhat这个开发环境中，"fork"可以用来从现有的以太坊网络（例如主网络或测试网络）创建一个本地的可操作副本。
       */
      forking: {
        url: mainnetUrl
      }
    },
    localhost: {
      chainId: 31337,
      forking: {
        url: mainnetUrl
      }
    },
    sepolia: {
      chainId: 11155111,
      url: sepoliaUrl,
      accounts: [sepoliaPrivateKey]
    }
  },
  gasReporter: {
    enabled: false,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true
  },
  etherscan: {
    apiKey: {
      sepolia: sepoliaEtherscanKey
    }
  },
  namedAccounts: {
    deployer: {
      default: 0
    },
    player: {
      default: 1
    }
  },
  mocha: {
    timeout: 200000
  }
}

export default config
