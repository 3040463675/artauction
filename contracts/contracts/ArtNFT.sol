// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title ArtNFT
 * @dev 艺术品NFT合约，用于铸造和管理艺术品NFT
 */
contract ArtNFT is ERC721, ERC721URIStorage, AccessControl {
    using Counters for Counters.Counter;

    // 角色定义
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant AUCTION_HOUSE_ROLE = keccak256("AUCTION_HOUSE_ROLE");

    // NFT计数器
    Counters.Counter private _tokenIdCounter;

    // 艺术品信息结构
    struct ArtInfo {
        uint256 tokenId;
        address creator;        // 创作者/卖家
        string name;           // 艺术品名称
        string description;    // 描述
        string imageUrl;       // 图片URL
        string ipfsHash;       // IPFS哈希
        uint256 createdAt;     // 创建时间
        bool isVerified;       // 是否已验证
        bool isOnAuction;      // 是否正在拍卖
    }

    // tokenId => ArtInfo
    mapping(uint256 => ArtInfo) public artInfoMap;

    // 艺术品数量
    uint256 public totalArtCount;

    // 事件
    event ArtMinted(
        uint256 indexed tokenId,
        address indexed creator,
        string name,
        string ipfsHash
    );
    event ArtVerified(uint256 indexed tokenId, address indexed verifier);
    event ArtOnAuction(uint256 indexed tokenId, bool status);

    constructor() ERC721("ArtAuctionNFT", "AANFT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(AUCTION_HOUSE_ROLE, msg.sender);
    }

    /**
     * @dev 铸造新的艺术品NFT
     * @param to 接收者地址
     * @param name 艺术品名称
     * @param description 描述
     * @param imageUrl 图片URL
     * @param ipfsHash IPFS哈希
     */
    function mintArt(
        address to,
        string memory name,
        string memory description,
        string memory imageUrl,
        string memory ipfsHash
    ) public returns (uint256) {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _safeMint(to, tokenId);

        // 存储艺术品信息
        artInfoMap[tokenId] = ArtInfo({
            tokenId: tokenId,
            creator: to,
            name: name,
            description: description,
            imageUrl: imageUrl,
            ipfsHash: ipfsHash,
            createdAt: block.timestamp,
            isVerified: false,
            isOnAuction: false
        });

        totalArtCount++;

        emit ArtMinted(tokenId, to, name, ipfsHash);

        return tokenId;
    }

    /**
     * @dev 验证艺术品
     * @param tokenId 艺术品ID
     */
    function verifyArt(uint256 tokenId) public onlyRole(AUCTION_HOUSE_ROLE) {
        require(_exists(tokenId), "Art does not exist");
        artInfoMap[tokenId].isVerified = true;
        emit ArtVerified(tokenId, msg.sender);
    }

    /**
     * @dev 设置艺术品拍卖状态
     * @param tokenId 艺术品ID
     * @param status 拍卖状态
     */
    function setAuctionStatus(uint256 tokenId, bool status) public onlyRole(AUCTION_HOUSE_ROLE) {
        require(_exists(tokenId), "Art does not exist");
        artInfoMap[tokenId].isOnAuction = status;
        emit ArtOnAuction(tokenId, status);
    }

    /**
     * @dev 获取艺术品信息
     * @param tokenId 艺术品ID
     */
    function getArtInfo(uint256 tokenId) public view returns (ArtInfo memory) {
        require(_exists(tokenId), "Art does not exist");
        return artInfoMap[tokenId];
    }

    /**
     * @dev 获取用户拥有的所有艺术品ID
     * @param owner 所有者地址
     */
    function getArtsByOwner(address owner) public view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokens = new uint256[](balance);
        uint256 index = 0;

        for (uint256 i = 0; i < _tokenIdCounter.current(); i++) {
            if (ownerOf(i) == owner) {
                tokens[index] = i;
                index++;
            }
        }

        return tokens;
    }

    // 重写函数
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
