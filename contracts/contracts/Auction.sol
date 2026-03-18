// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./ArtNFT.sol";

/**
 * @title Auction
 * @dev 拍卖合约，处理艺术品竞拍逻辑
 */
contract Auction is ReentrancyGuard, AccessControl {
    // 角色定义
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant AUCTION_HOUSE_ROLE = keccak256("AUCTION_HOUSE_ROLE");

    // NFT合约引用
    ArtNFT public artNFT;

    // 拍卖状态
    enum AuctionStatus {
        Pending,    // 待开始
        Active,     // 进行中
        Ended,      // 已结束
        Cancelled,  // 已取消
        Settled     // 已结算
    }

    // 拍卖信息结构
    struct AuctionInfo {
        uint256 auctionId;
        uint256 tokenId;
        address seller;
        uint256 startingPrice;  // 起拍价 (wei)
        uint256 reservePrice;   // 保留价
        uint256 minIncrement;   // 最小加价幅度
        uint256 startTime;
        uint256 endTime;
        uint256 highestBid;     // 当前最高出价
        address highestBidder;  // 当前最高出价者
        uint256 depositAmount;  // 保证金金额
        AuctionStatus status;
        uint256 createdAt;
    }

    // 出价记录
    struct Bid {
        address bidder;
        uint256 amount;
        uint256 timestamp;
    }

    // 拍卖ID计数器
    uint256 private _auctionIdCounter;

    // auctionId => AuctionInfo
    mapping(uint256 => AuctionInfo) public auctions;

    // auctionId => Bid[] 出价历史
    mapping(uint256 => Bid[]) public bidHistory;

    // auctionId => address => uint256 用户保证金
    mapping(uint256 => mapping(address => uint256)) public deposits;

    // 平台手续费比例 (基点, 100 = 1%)
    uint256 public platformFeeRate = 250; // 2.5%

    // 平台收入
    uint256 public platformRevenue;

    // NFT合约地址
    address public nftContractAddress;

    // 事件
    event AuctionCreated(
        uint256 indexed auctionId,
        uint256 indexed tokenId,
        address indexed seller,
        uint256 startingPrice,
        uint256 endTime
    );
    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount
    );
    event AuctionEnded(
        uint256 indexed auctionId,
        address winner,
        uint256 finalPrice
    );
    event AuctionCancelled(uint256 indexed auctionId);
    event AuctionSettled(
        uint256 indexed auctionId,
        address seller,
        address buyer,
        uint256 price
    );
    event DepositRefunded(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount
    );

    constructor(address _nftContract) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(AUCTION_HOUSE_ROLE, msg.sender);
        nftContractAddress = _nftContract;
        artNFT = ArtNFT(_nftContract);
    }

    /**
     * @dev 创建拍卖
     * @param tokenId NFT ID
     * @param startingPrice 起拍价
     * @param reservePrice 保留价
     * @param minIncrement 最小加价
     * @param duration 持续时间(秒)
     */
    function createAuction(
        uint256 tokenId,
        uint256 startingPrice,
        uint256 reservePrice,
        uint256 minIncrement,
        uint256 duration
    ) external returns (uint256) {
        require(
            IERC721(nftContractAddress).ownerOf(tokenId) == msg.sender,
            "Not the owner"
        );
        require(duration >= 1 hours, "Duration too short");
        require(startingPrice > 0, "Starting price must be positive");

        uint256 auctionId = _auctionIdCounter++;

        // 转移NFT到合约
        IERC721(nftContractAddress).transferFrom(
            msg.sender,
            address(this),
            tokenId
        );

        auctions[auctionId] = AuctionInfo({
            auctionId: auctionId,
            tokenId: tokenId,
            seller: msg.sender,
            startingPrice: startingPrice,
            reservePrice: reservePrice,
            minIncrement: minIncrement,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            highestBid: 0,
            highestBidder: address(0),
            depositAmount: startingPrice / 10, // 保证金为起拍价的10%
            status: AuctionStatus.Pending,
            createdAt: block.timestamp
        });

        emit AuctionCreated(
            auctionId,
            tokenId,
            msg.sender,
            startingPrice,
            block.timestamp + duration
        );

        return auctionId;
    }

    /**
     * @dev 开始拍卖
     * @param auctionId 拍卖ID
     */
    function startAuction(uint256 auctionId) external onlyRole(AUCTION_HOUSE_ROLE) {
        AuctionInfo storage auction = auctions[auctionId];
        require(auction.status == AuctionStatus.Pending, "Invalid status");
        
        auction.status = AuctionStatus.Active;
        auction.startTime = block.timestamp;
    }

    /**
     * @dev 出价
     * @param auctionId 拍卖ID
     */
    function placeBid(uint256 auctionId) external payable nonReentrant {
        AuctionInfo storage auction = auctions[auctionId];
        
        require(auction.status == AuctionStatus.Active, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.sender != auction.seller, "Seller cannot bid");
        
        uint256 bidAmount = msg.value;
        
        // 检查是否需要保证金
        if (auction.highestBid == 0) {
            // 第一次出价需要满足起拍价
            require(bidAmount >= auction.startingPrice, "Bid below starting price");
        } else {
            // 后续出价需要高于当前最高价 + 最小加价
            require(
                bidAmount >= auction.highestBid + auction.minIncrement,
                "Bid too low"
            );
        }

        // 记录出价
        bidHistory[auctionId].push(Bid({
            bidder: msg.sender,
            amount: bidAmount,
            timestamp: block.timestamp
        }));

        // 更新最高出价
        auction.highestBid = bidAmount;
        auction.highestBidder = msg.sender;

        // 延长拍卖时间(如果出价在最后5分钟)
        if (auction.endTime - block.timestamp <= 5 minutes) {
            auction.endTime = block.timestamp + 5 minutes;
        }

        emit BidPlaced(auctionId, msg.sender, bidAmount);
    }

    /**
     * @dev 结束拍卖
     * @param auctionId 拍卖ID
     */
    function endAuction(uint256 auctionId) external nonReentrant {
        AuctionInfo storage auction = auctions[auctionId];
        
        require(auction.status == AuctionStatus.Active, "Invalid status");
        require(block.timestamp >= auction.endTime, "Auction not ended");
        require(
            msg.sender == auction.seller || 
            hasRole(AUCTION_HOUSE_ROLE, msg.sender),
            "Not authorized"
        );

        auction.status = AuctionStatus.Ended;

        // 如果有出价且达到保留价，转移NFT给最高出价者
        if (auction.highestBidder != address(0) && 
            auction.highestBid >= auction.reservePrice) {
            
            // 计算手续费
            uint256 fee = (auction.highestBid * platformFeeRate) / 10000;
            uint256 sellerProceeds = auction.highestBid - fee;

            // 转账给卖家
            (bool success, ) = payable(auction.seller).call{value: sellerProceeds}("");
            require(success, "Transfer to seller failed");

            // 记录平台收入
            platformRevenue += fee;

            // 转移NFT
            IERC721(nftContractAddress).transferFrom(
                address(this),
                auction.highestBidder,
                auction.tokenId
            );

            emit AuctionSettled(
                auctionId,
                auction.seller,
                auction.highestBidder,
                auction.highestBid
            );
        } else {
            // 没有出价或未达保留价，NFT返还给卖家
            IERC721(nftContractAddress).transferFrom(
                address(this),
                auction.seller,
                auction.tokenId
            );
        }

        emit AuctionEnded(auctionId, auction.highestBidder, auction.highestBid);
    }

    /**
     * @dev 取消拍卖
     * @param auctionId 拍卖ID
     */
    function cancelAuction(uint256 auctionId) external {
        AuctionInfo storage auction = auctions[auctionId];
        
        require(auction.status == AuctionStatus.Pending, "Invalid status");
        require(
            msg.sender == auction.seller || 
            hasRole(AUCTION_HOUSE_ROLE, msg.sender),
            "Not authorized"
        );
        require(auction.highestBid == 0, "Cannot cancel with bids");

        auction.status = AuctionStatus.Cancelled;

        // 返还NFT给卖家
        IERC721(nftContractAddress).transferFrom(
            address(this),
            auction.seller,
            auction.tokenId
        );

        emit AuctionCancelled(auctionId);
    }

    /**
     * @dev 获取拍卖信息
     */
    function getAuctionInfo(uint256 auctionId) external view returns (AuctionInfo memory) {
        return auctions[auctionId];
    }

    /**
     * @dev 获取出价历史
     */
    function getBidHistory(uint256 auctionId) external view returns (Bid[] memory) {
        return bidHistory[auctionId];
    }

    /**
     * @dev 获取所有活跃拍卖
     */
    function getActiveAuctions() external view returns (uint256[] memory) {
        uint256 count = 0;
        
        for (uint256 i = 0; i < _auctionIdCounter; i++) {
            if (auctions[i].status == AuctionStatus.Active) {
                count++;
            }
        }

        uint256[] memory activeAuctions = new uint256[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < _auctionIdCounter; i++) {
            if (auctions[i].status == AuctionStatus.Active) {
                activeAuctions[index] = i;
                index++;
            }
        }

        return activeAuctions;
    }

    /**
     * @dev 设置平台手续费率
     */
    function setPlatformFeeRate(uint256 newRate) external onlyRole(ADMIN_ROLE) {
        require(newRate <= 1000, "Fee too high"); // 最高10%
        platformFeeRate = newRate;
    }

    /**
     * @dev 提取平台收入
     */
    function withdrawRevenue() external onlyRole(ADMIN_ROLE) {
        uint256 amount = platformRevenue;
        platformRevenue = 0;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Withdrawal failed");
    }

    // 接收ETH
    receive() external payable {}
}
