// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {MerkleProofUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol";
import {MulticallUpgradeable} from "./libraries/Multicall.sol";

contract HalbornNFT is Initializable, ERC721Upgradeable, UUPSUpgradeable, OwnableUpgradeable, MulticallUpgradeable {
    bytes32 public merkleRoot;

    uint256 public price;
    uint256 public idCounter;

    function initialize(bytes32 merkleRoot_, uint256 price_) external initializer {
        __ERC721_init("Halborn NFT", "HNFT");
        __UUPSUpgradeable_init();
        __Ownable_init();
        __Multicall_init();

        setMerkleRoot(merkleRoot_);
        setPrice(price_);
    }

    function setPrice(uint256 price_) public onlyOwner {
        require(price_ != 0, "Price cannot be 0");
        price = price_;
    }

    function setMerkleRoot(bytes32 merkleRoot_) public {
        merkleRoot = merkleRoot_;
    }

    function mintAirdrops(uint256 id, bytes32[] calldata merkleProof) external {
        require(!_exists(id), "Token already minted"); // fix
        bytes32 node = keccak256(abi.encodePacked(msg.sender, id));
        bool isValidProof = MerkleProofUpgradeable.verifyCalldata(merkleProof, merkleRoot, node);
        require(isValidProof, "Invalid proof.");

        _safeMint(msg.sender, id, "");
    }

    function mintBuyWithETH() external payable {
        require(msg.value == price, "Invalid Price");

        unchecked {
            idCounter++;
        }

        _safeMint(msg.sender, idCounter, "");
    }

    function withdrawETH(uint256 amount) external onlyOwner {
        (bool success, ) = payable(owner()).call{value: amount}(""); // fix
        require(success, "Transfer failed");
    }

    function _authorizeUpgrade(address) internal override {}
}
