import { ethers, getNamedAccounts } from "hardhat"

const AMOUNT = ethers.parseEther("0.02")

async function getWeth() {
  const { deployer } = await getNamedAccounts()
  // 调用deposit方法，将eth兑换成weth
  // 需要abi，合约地址
  // 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
  const iWeth = await ethers.getContractAt("IWeth", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2")

  const tx = await iWeth.deposit({ value: AMOUNT })
  await tx.wait(1)
  const wethBalance = await iWeth.balanceOf(deployer)
  console.log("拥有的weth数量：", wethBalance)
}

export { getWeth, AMOUNT }
