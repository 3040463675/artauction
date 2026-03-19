import { ethers } from "hardhat";

// =========================================================
// 🤖 智能竞拍机器人监听服务 (Ganache 本地环境专用)
// =========================================================

// 配置项
const AUCTION_CONTRACT_ADDRESS = "0x6B5B3DD61A7C87b30C1D9Fa309687127F1A8E928"; // TODO: 请替换为实际部署地址 (如果您重新部署了)
const TARGET_AUCTION_ID = 0; // 监听的目标拍卖品ID
const MAX_PRICE_LIMIT = ethers.parseEther("5.0"); // 机器人的心理价位上限 (5 ETH)

// 定义延迟函数
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log("=========================================");
  console.log("🤖 启动智能竞拍机器人监听服务...");
  console.log("=========================================\n");

  // 1. 获取 Ganache 账号
  const signers = await ethers.getSigners();
  // 提取 5 个账号作为机器人池 (避开第一个通常作为部署者/您的测试主账号)
  const botPool = signers.slice(1, 6); 
  
  console.log(`✅ 已加载 ${botPool.length} 个机器人账号。`);
  botPool.forEach((bot, i) => console.log(`   - 机器人 ${i+1}: ${bot.address}`));

  // 2. 连接合约
  const Auction = await ethers.getContractFactory("Auction");
  const auctionContract = Auction.attach(AUCTION_CONTRACT_ADDRESS);

  // 检查合约连接是否正常
  try {
    const info = await auctionContract.getAuctionInfo(TARGET_AUCTION_ID);
    console.log(`\n🎯 成功连接合约！正在监控拍卖品 ID: ${TARGET_AUCTION_ID}`);
    console.log(`💰 当前最高价: ${ethers.formatEther(info.highestBid)} ETH`);
    console.log(`👤 当前最高出价者: ${info.highestBidder}`);
  } catch (error) {
    console.error("\n❌ 无法连接到合约，请检查 AUCTION_CONTRACT_ADDRESS 是否正确，以及 Ganache 是否在运行！");
    process.exit(1);
  }

  console.log("\n👀 正在监听 BidPlaced 事件，准备随时反击...\n");
  console.log("------------------------------------------------------");

  // 记录上一次处理的出价，防止连环触发
  let lastProcessedBidHash = "";

  // 3. 监听 BidPlaced 事件
  // event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount);
  auctionContract.on("BidPlaced", async (auctionId, bidder, amount, event) => {
    // 过滤掉非目标拍卖品的事件
    if (Number(auctionId) !== TARGET_AUCTION_ID) return;

    // 防止同一个事件被重复处理
    if (event.transactionHash === lastProcessedBidHash) return;
    lastProcessedBidHash = event.transactionHash;

    console.log(`\n[${new Date().toLocaleTimeString()}] 🔔 链上异动！`);
    console.log(`   - 出价人: ${bidder}`);
    console.log(`   - 金额: ${ethers.formatEther(amount)} ETH`);

    // ==========================================
    // 💡 机器人的“四步心理活动”
    // ==========================================

    // 第一步：是不是我自己（机器人池里的账号）出的？
    const isBotBid = botPool.some(bot => bot.address.toLowerCase() === bidder.toLowerCase());
    if (isBotBid) {
      console.log("   👉 结论: 这是机器人同伴出的价，保持静默，不引发内战。");
      return;
    }

    console.log("   👉 结论: 真实玩家出价了！进入紧张状态...");

    // 第二步：预算评估
    const auctionInfo = await auctionContract.getAuctionInfo(TARGET_AUCTION_ID);
    const currentHighestBid = auctionInfo.highestBid;
    const minIncrement = auctionInfo.minIncrement;
    const nextBidAmount = currentHighestBid + minIncrement;

    if (nextBidAmount > MAX_PRICE_LIMIT) {
      console.log(`   ❌ 预算评估: 下一次出价需要 ${ethers.formatEther(nextBidAmount)} ETH，超过了 5 ETH 预算，放弃跟价。`);
      return;
    }
    console.log(`   ✅ 预算评估: 下一次出价 ${ethers.formatEther(nextBidAmount)} ETH，预算充足。`);

    // 第三步：情绪模拟 (50% 放弃概率)
    console.log("   🎲 正在掷硬币决定是否反击...");
    if (Math.random() < 0.5) {
      console.log("   🤷 情绪模拟: 掷到了反面。突然不想买了，随机放弃跟价。");
      return;
    }
    console.log("   🔥 情绪模拟: 掷到了正面！决定死磕到底！");

    // 第四步：假装思考一会儿 & 执行反击
    // 随机挑选一个机器人
    const selectedBot = botPool[Math.floor(Math.random() * botPool.length)];
    // 随机延迟 2~8 秒
    const delay = Math.floor(Math.random() * 6000) + 2000;
    
    console.log(`   🤔 机器人 [${selectedBot.address.slice(0,6)}] 正在假装思考 (${delay / 1000} 秒)...`);
    await sleep(delay);

    console.log(`   🚀 思考结束，发送真实交易上链...`);
    try {
      // 发送带 Value 的交易
      const tx = await auctionContract.connect(selectedBot).placeBid(
        TARGET_AUCTION_ID,
        { value: nextBidAmount }
      );
      
      console.log(`   ⏳ 交易已广播，等待出块... (TxHash: ${tx.hash})`);
      await tx.wait();
      console.log(`   🎉 反击成功！机器人已夺回最高价王座！`);
      console.log("------------------------------------------------------");

    } catch (error: any) {
      console.error(`   ❌ 反击失败: ${error.reason || error.message}`);
    }
  });

  // 保持脚本运行
  await new Promise(() => {});
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
