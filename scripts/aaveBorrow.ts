import { getNamedAccounts, ethers } from "hardhat"
import { getWeth, AMOUNT } from "./getWeth"
import {
  ILendingPoolAddressesProvider,
  ILendingPool,
  AggregatorV3Interface
} from "../typechain-types"

async function main() {
  await getWeth()
  const { deployer } = await getNamedAccounts()
  const { lendingPool, lendingPoolAddress } = await getLendingPool()
  console.log("借款池地址：", lendingPoolAddress)

  // 存款
  const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
  // 批准
  await approveERC20(wethTokenAddress, lendingPoolAddress, AMOUNT)
  console.log("存款中")
  await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0)
  console.log("存款成功")
  // 借钱！
  // 能借多少？ 已经借了多少？ 抵押了多少？
  const { totalCollateralETH, totalDebtETH, availableBorrowsETH } = await getBorrowUserData(
    lendingPool,
    deployer
  )
  const daiPrice = await getDaiPrice()

  const amountDaiToBorrow = Number(availableBorrowsETH) * 0.95 * (1 / Number(daiPrice))
  console.log(`你可以借：${amountDaiToBorrow.toString()} DAI`)
  const amountDaiToBorrowWei = ethers.parseEther(amountDaiToBorrow.toString())
  await borrowDai(
    "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    lendingPool,
    amountDaiToBorrowWei,
    deployer
  )
  // 还钱！
  await repay(amountDaiToBorrowWei, lendingPool, lendingPoolAddress, deployer)
  await getBorrowUserData(lendingPool, deployer)
}

async function getLendingPool() {
  const lendingPoolAddressProvider: ILendingPoolAddressesProvider = await ethers.getContractAt(
    "ILendingPoolAddressesProvider",
    "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5"
  )
  const lendingPoolAddress = await lendingPoolAddressProvider.getLendingPool()
  const lendingPool: ILendingPool = await ethers.getContractAt("ILendingPool", lendingPoolAddress)
  return { lendingPool, lendingPoolAddress }
}

async function approveERC20(
  contractAddress: string,
  spenderAddress: string,
  amountToSpend: bigint
) {
  const erc20Token = await ethers.getContractAt("IERC20", contractAddress)
  const tx = await erc20Token.approve(spenderAddress, amountToSpend)
  await tx.wait(1)
  console.log("批准成功")
}

async function getBorrowUserData(lendingPool: ILendingPool, account: string) {
  const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
    await lendingPool.getUserAccountData(account)
  console.log(`你拥有的ETH抵押物价值：${totalCollateralETH.toString()}`)
  console.log(`你所借的债务总和：${totalDebtETH.toString()}`)
  console.log(`你可以借的钱：${availableBorrowsETH.toString()}`)
  return { totalCollateralETH, totalDebtETH, availableBorrowsETH }
}

async function getDaiPrice() {
  // 使用Chainlink的价格预言机(喂价 dai/eth) https://docs.chain.link/docs/ethereum-addresses/
  // 用于计算抵押率
  const daiETHPriceFeed: AggregatorV3Interface = await ethers.getContractAt(
    "AggregatorV3Interface",
    "0x773616E4d11A78F511299002da57A0a94577F1f4"
  )
  const price = (await daiETHPriceFeed.latestRoundData()).answer
  console.log(`DAI/ETH价格：${price.toString()}`)
  return price
}

async function borrowDai(
  daiAddress: string,
  lendingPool: ILendingPool,
  amountDaiToBorrowWei: bigint,
  account: string
) {
  /** @dev ILendingPool: function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) external; */
  /** Stable Interest Rate: 1 Variable Interest Rate: 2 (New Aave -> variable) */
  const borrowTx = await lendingPool.borrow(daiAddress, amountDaiToBorrowWei, 2, 0, account)
  await borrowTx.wait(1)
  console.log("借款成功")
}

async function repay(
  amount: any,
  lendingPool: ILendingPool,
  lendingPoolAddress: string,
  account: string
) {
  await approveERC20("0x6B175474E89094C44Da98b954EedeAC495271d0F", lendingPoolAddress, amount)
  const repayTx = await lendingPool.repay("0x6B175474E89094C44Da98b954EedeAC495271d0F", amount, 2, account)
  await repayTx.wait(1)
  console.log("还款成功")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
