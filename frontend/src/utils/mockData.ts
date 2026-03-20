import type { Auction } from '@/types'

// 辅助函数：生成随机的未来结束时间（默认 3 天后）
const getRandomEndTime = () => {
  const days = 3 + Math.random() * 2
  return Date.now() + days * 24 * 60 * 60 * 1000
}

export const mockAuctions: Auction[] = [
  {
    auctionId: 'mock-a1',
    tokenId: '1',
    artwork: { 
      tokenId: '1',
      name: '数字之镜', 
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000',
      description: '探索数字 world 与现实世界的交汇点，反映科技对人类意识的重塑。',
      creator: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      isVerified: true
    },
    highestBid: '1.2',
    startingPrice: '0.5',
    minIncrement: '0.1',
    status: 1, // 1 为进行中
    endTime: getRandomEndTime()
  },
  {
    auctionId: 'mock-a2',
    tokenId: '2',
    artwork: { 
      tokenId: '2',
      name: '赛博霓虹', 
      imageUrl: 'https://images.unsplash.com/photo-1633167606207-d840b5070fc2?auto=format&fit=crop&q=80&w=1000',
      description: '未来都市的夜晚，霓虹灯火映射出的赛博朋克幻想。',
      creator: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      isVerified: true
    },
    highestBid: '2.5',
    startingPrice: '1.0',
    minIncrement: '0.2',
    status: 1,
    endTime: getRandomEndTime()
  },
  {
    auctionId: 'mock-a3',
    tokenId: '3',
    artwork: { 
      tokenId: '3',
      name: '量子纠缠', 
      imageUrl: 'https://images.unsplash.com/photo-1635241936322-69dd58ef3fa0?auto=format&fit=crop&q=80&w=1000',
      description: '表现微观世界中粒子间的神秘联系，抽象而深邃。',
      creator: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
      isVerified: false
    },
    highestBid: '0.8',
    startingPrice: '0.3',
    minIncrement: '0.05',
    status: 1,
    endTime: getRandomEndTime()
  },
  {
    auctionId: 'mock-a4', 
    tokenId: '4',
    artwork: { 
      tokenId: '4',
      name: '以太之花', 
      imageUrl: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=1000',
      description: '在以太坊网络中绽放的虚拟花朵，象征着数字生命的诞生。',
      creator: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      isVerified: true
    },
    highestBid: '3.7',
    startingPrice: '2.0',
    minIncrement: '0.5',
    status: 1,
    endTime: getRandomEndTime()
  },
  {
    auctionId: 'mock-a5',
    tokenId: '5',
    artwork: { 
      tokenId: '5',
      name: '云端漫步', 
      imageUrl: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&q=80&w=1000',
      description: '轻盈的云朵与超现实的建筑，带您进入数字世界的梦幻之境。',
      creator: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      isVerified: false
    },
    highestBid: '1.5',
    startingPrice: '0.8',
    minIncrement: '0.1',
    status: 1,
    endTime: getRandomEndTime()
  },
  {
    auctionId: 'mock-a6',
    tokenId: '6',
    artwork: { 
      tokenId: '6',
      name: '几何律动', 
      imageUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&q=80&w=1000',
      description: '严谨的几何图形与灵动的色彩对比，展现理智与感性的碰撞。',
      creator: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      isVerified: false
    },
    highestBid: '0.9',
    startingPrice: '0.5',
    minIncrement: '0.05',
    status: 1,
    endTime: getRandomEndTime()
  },
  {
    auctionId: 'mock-a7',
    tokenId: '7',
    artwork: { 
      tokenId: '7',
      name: '永恒瞬间', 
      imageUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=1000',
      description: '捕捉时间流逝中的一个切片，将其固化为永恒的数字艺术。',
      creator: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
      isVerified: true
    },
    highestBid: '5.0',
    startingPrice: '3.0',
    minIncrement: '1.0',
    status: 1,
    endTime: getRandomEndTime()
  },
  {
    auctionId: 'mock-a8',
    tokenId: '8',
    artwork: { 
      tokenId: '8',
      name: '极地幻想', 
      imageUrl: 'https://images.unsplash.com/photo-1518066000714-58c45f1a2c0a?auto=format&fit=crop&q=80&w=1000',
      description: '极光笼罩下的冰雪世界，充满神秘与未知的魅力。',
      creator: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      isVerified: false
    },
    highestBid: '4.1',
    startingPrice: '3.5',
    minIncrement: '0.2',
    status: 1,
    endTime: getRandomEndTime()
  },
  {
    auctionId: 'mock-a9',
    tokenId: '9',
    artwork: { 
      tokenId: '9',
      name: '流光溢彩', 
      imageUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1000',
      description: '绚丽的流体艺术，展现色彩在空间中的自然流动与交融。',
      creator: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      isVerified: false
    },
    highestBid: '1.8',
    startingPrice: '1.2',
    minIncrement: '0.1',
    status: 1,
    endTime: getRandomEndTime()
  },
  {
    auctionId: 'mock-a10',
    tokenId: '10',
    artwork: { 
      tokenId: '10',
      name: '极简主义 - 圆', 
      imageUrl: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&q=80&w=1000',
      description: '极致的简约，探讨圆形在几何空间中的平衡与美感。',
      creator: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
      isVerified: false
    },
    highestBid: '0.6',
    startingPrice: '0.4',
    minIncrement: '0.05',
    status: 1,
    endTime: getRandomEndTime()
  },
  {
    auctionId: 'mock-a11',
    tokenId: '11',
    artwork: { 
      tokenId: '11',
      name: '城市雨夜', 
      imageUrl: 'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?auto=format&fit=crop&q=80&w=1000',
      description: '雨后都市的街头，霓虹灯在湿润地面上的倒影，宁静而富有诗意。',
      creator: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      isVerified: false
    },
    highestBid: '2.3',
    startingPrice: '1.5',
    minIncrement: '0.2',
    status: 1,
    endTime: getRandomEndTime()
  },
  {
    auctionId: 'mock-a12',
    tokenId: '12',
    artwork: { 
      tokenId: '12',
      name: '虚空之境', 
      imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=1000',
      description: '超现实主义风格，展现一个超脱现实的纯净空间。',
      creator: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      isVerified: false
    },
    highestBid: '3.5',
    startingPrice: '2.8',
    minIncrement: '0.3',
    status: 1,
    endTime: getRandomEndTime()
  },
  {
    auctionId: 'mock-a13',
    tokenId: '13',
    artwork: { 
      tokenId: '13',
      name: '自然之语', 
      imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=1000',
      description: '森林深处的光影，是大自然最真诚的独白。',
      creator: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      isVerified: false
    },
    highestBid: '1.4',
    startingPrice: '1.0',
    minIncrement: '0.1',
    status: 1,
    endTime: getRandomEndTime()
  },
  {
    auctionId: 'mock-a14',
    tokenId: '14',
    artwork: { 
      tokenId: '14',
      name: '星际迷航', 
      imageUrl: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?auto=format&fit=crop&q=80&w=1000',
      description: '对深邃星空的无限遐想，探索未知的宇宙边界。',
      creator: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
      isVerified: false
    },
    highestBid: '5.2',
    startingPrice: '4.5',
    minIncrement: '0.5',
    status: 1,
    endTime: getRandomEndTime()
  },
  {
    auctionId: 'mock-a15',
    tokenId: '15',
    artwork: { 
      tokenId: '15',
      name: '时光剪影', 
      imageUrl: 'https://images.unsplash.com/photo-1493306454983-c5c073fba6bd?auto=format&fit=crop&q=80&w=1000',
      description: '定格那些即将消逝的美好瞬间，将其转化为永恒的数字艺术。',
      creator: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      isVerified: false
    },
    highestBid: '0.8',
    startingPrice: '0.5',
    minIncrement: '0.05',
    status: 1,
    endTime: getRandomEndTime()
  },
  {
    auctionId: 'mock-a16',
    tokenId: '16',
    artwork: { 
      tokenId: '16',
      name: '极地之光', 
      imageUrl: 'https://images.unsplash.com/photo-1531366930491-8155d0553bb5?auto=format&fit=crop&q=80&w=1000',
      description: '壮丽的极光，是大自然在夜空中书写的绚丽篇章。',
      creator: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      isVerified: false
    },
    highestBid: '4.7',
    startingPrice: '4.0',
    minIncrement: '0.4',
    status: 1,
    endTime: getRandomEndTime()
  },
  {
    auctionId: 'mock-a17',
    tokenId: '17',
    artwork: { 
      tokenId: '17',
      name: '沙漠之魂', 
      imageUrl: 'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?auto=format&fit=crop&q=80&w=1000',
      description: '广袤荒漠中的坚韧与孤独，展现生命的另一种形态。',
      creator: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      isVerified: false
    },
    highestBid: '1.9',
    startingPrice: '1.2',
    minIncrement: '0.1',
    status: 1,
    endTime: getRandomEndTime()
  },
  {
    auctionId: 'mock-a18',
    tokenId: '18',
    artwork: { 
      tokenId: '18',
      name: '禅意空间', 
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1000',
      description: '将东方禅意与现代数字艺术结合，创造一个宁静致远的冥想空间。',
      creator: '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1',
      isVerified: false
    },
    highestBid: '2.5',
    startingPrice: '1.8',
    minIncrement: '0.2',
    status: 1,
    endTime: getRandomEndTime()
  }
]
