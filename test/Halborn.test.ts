import type { SnapshotRestorer } from "@nomicfoundation/hardhat-network-helpers";
import { takeSnapshot } from "@nomicfoundation/hardhat-network-helpers";

import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import type { HalbornLoans, HalbornNFT, HalbornToken } from "../typechain-types";
import { keccak256 } from "ethers/lib/utils";
import { MerkleTree } from "merkletreejs"; // MerkleTree.js
const { AddressZero } = ethers.constants;

describe("Halborn NFT", function () {
    let snapshotA: SnapshotRestorer;

    // Signers.
    let deployer: SignerWithAddress, owner: SignerWithAddress, user: SignerWithAddress;
    let user1: SignerWithAddress, user2: SignerWithAddress, user3: SignerWithAddress;

    let nft: HalbornNFT;
    let token: HalbornToken;
    let loans: HalbornLoans;

    const price = ethers.utils.parseEther("1");

    const targetTokenId = 1;

    before(async () => {
        // Getting of signers.
        [deployer, user, user1, user2, user3] = await ethers.getSigners();

        const leaf = ethers.utils.solidityPack(["address", "uint256"], [user1.address, targetTokenId]);
        const leaves = [leaf, user2.address, user3.address];
        const leafsNode = leaves.map((addr) => keccak256(addr));
        const merkleTree = new MerkleTree(leafsNode, keccak256, { sortPairs: true });
        const merkleRoot = "0x" + merkleTree.getRoot().toString("hex");

        // Variables.
        const merkleRoot_ = merkleRoot;
        const price_ = price;

        // Deployment.
        const HalbornNFT = await ethers.getContractFactory("HalbornNFT", deployer);
        nft = <HalbornNFT>await upgrades.deployProxy(HalbornNFT, [merkleRoot_, price_], { initializer: "initialize" });
        await nft.deployed();

        const HalbornToken = await ethers.getContractFactory("HalbornToken", deployer);
        token = <HalbornToken>await upgrades.deployProxy(HalbornToken, [], { initializer: "initialize" });
        await token.deployed();

        const collateralPrice_ = price;

        const HalbornLoans = await ethers.getContractFactory("HalbornLoans", deployer);
        loans = await HalbornLoans.deploy(collateralPrice_);
        await loans.deployed();

        // initialization

        await loans.initialize(token.address, nft.address);

        await token.setLoans(loans.address);

        console.log("HalbornNFT deployed to:", nft.address);
        console.log("HalbornToken deployed to:", token.address);
        console.log("HalbornLoans deployed to:", loans.address);

        owner = deployer;

        snapshotA = await takeSnapshot();
    });

    afterEach(async () => await snapshotA.restore());

    describe("# LOAN", function () {
        it("depositNFTCollateral", async () => {
            const leaf = ethers.utils.solidityPack(["address", "uint256"], [user1.address, targetTokenId]);
            const leaves = [leaf, user2.address, user3.address];
            const leafsNode = leaves.map((addr) => keccak256(addr));

            const merkleTree = new MerkleTree(leafsNode, keccak256, { sortPairs: true });
            const merkleRoot = "0x" + merkleTree.getRoot().toString("hex");

            expect(await nft.merkleRoot()).to.equal(merkleRoot);

            const claimerLeaf = leafsNode[0];
            const hexProof = merkleTree.getHexProof(claimerLeaf);

            await nft.connect(user1).mintAirdrops(targetTokenId, hexProof);
            expect(await nft.balanceOf(user1.address)).to.equal(1);

            await nft.connect(user1).approve(loans.address, targetTokenId);
            await loans.connect(user1).depositNFTCollateral(targetTokenId);
            expect(await nft.ownerOf(targetTokenId)).to.equal(loans.address);
        });

        it("withdrawCollateral", async () => {
            const leaf = ethers.utils.solidityPack(["address", "uint256"], [user1.address, targetTokenId]);
            const leaves = [leaf, user2.address, user3.address];
            const leafsNode = leaves.map((addr) => keccak256(addr));

            const merkleTree = new MerkleTree(leafsNode, keccak256, { sortPairs: true });
            const merkleRoot = "0x" + merkleTree.getRoot().toString("hex");

            expect(await nft.merkleRoot()).to.equal(merkleRoot);

            const claimerLeaf = leafsNode[0];
            const hexProof = merkleTree.getHexProof(claimerLeaf);

            await nft.connect(user1).mintAirdrops(targetTokenId, hexProof);
            expect(await nft.balanceOf(user1.address)).to.equal(1);

            await nft.connect(user1).approve(loans.address, targetTokenId);
            await loans.connect(user1).depositNFTCollateral(targetTokenId);
            expect(await nft.ownerOf(targetTokenId)).to.equal(loans.address);

            expect(await loans.totalCollateral(user1.address)).to.equal(price);

            // withdrawCollateral
            await loans.connect(user1).withdrawCollateral(targetTokenId);
            expect(await nft.ownerOf(targetTokenId)).to.equal(user1.address);
            expect(await loans.totalCollateral(user1.address)).to.equal(0);
        });

        it("getLoan", async () => {
            const leaf = ethers.utils.solidityPack(["address", "uint256"], [user1.address, targetTokenId]);
            const leaves = [leaf, user2.address, user3.address];
            const leafsNode = leaves.map((addr) => keccak256(addr));

            const merkleTree = new MerkleTree(leafsNode, keccak256, { sortPairs: true });
            const merkleRoot = "0x" + merkleTree.getRoot().toString("hex");

            expect(await nft.merkleRoot()).to.equal(merkleRoot);

            const claimerLeaf = leafsNode[0];
            const hexProof = merkleTree.getHexProof(claimerLeaf);

            await nft.connect(user1).mintAirdrops(targetTokenId, hexProof);
            expect(await nft.balanceOf(user1.address)).to.equal(1);

            await nft.connect(user1).approve(loans.address, targetTokenId);
            await loans.connect(user1).depositNFTCollateral(targetTokenId);
            expect(await nft.ownerOf(targetTokenId)).to.equal(loans.address);

            expect(await loans.totalCollateral(user1.address)).to.equal(price);

            const amount = price.div(4);

            // require(totalCollateral[msg.sender] - usedCollateral[msg.sender] < amount, "Not enough collateral");

            // consol totalCollateral
            console.log("totalCollateral", (await loans.totalCollateral(user1.address)).toString());
            // consol usedCollateral
            console.log("usedCollateral", (await loans.usedCollateral(user1.address)).toString());
            // consol amount
            console.log("amount", amount.toString());
            // getLoan

            await loans.connect(user1).getLoan(amount);

            // check user 1 balance of token
            expect(await token.balanceOf(user1.address)).to.equal(amount);
        });
    });


    it.only("returnLoan", async () => {
        const leaf = ethers.utils.solidityPack(["address", "uint256"], [user1.address, targetTokenId]);
        const leaves = [leaf, user2.address, user3.address];
        const leafsNode = leaves.map((addr) => keccak256(addr));

        const merkleTree = new MerkleTree(leafsNode, keccak256, { sortPairs: true });
        const merkleRoot = "0x" + merkleTree.getRoot().toString("hex");

        expect(await nft.merkleRoot()).to.equal(merkleRoot);

        const claimerLeaf = leafsNode[0];
        const hexProof = merkleTree.getHexProof(claimerLeaf);

        await nft.connect(user1).mintAirdrops(targetTokenId, hexProof);
        expect(await nft.balanceOf(user1.address)).to.equal(1);

        await nft.connect(user1).approve(loans.address, targetTokenId);
        await loans.connect(user1).depositNFTCollateral(targetTokenId);
        expect(await nft.ownerOf(targetTokenId)).to.equal(loans.address);

        expect(await loans.totalCollateral(user1.address)).to.equal(price);

        const amount = price.div(4);

        await loans.connect(user1).getLoan(amount);
        // check user 1 balance of token
        expect(await token.balanceOf(user1.address)).to.equal(amount);

        // check usedCollateral
        expect(await loans.usedCollateral(user1.address)).to.equal(amount);

        // check all minted token
        expect(await token.totalSupply()).to.equal(amount);

        await loans.connect(user1).returnLoan(amount);
        // check user 1 balance of token
        expect(await token.balanceOf(user1.address)).to.equal(0);

        // check usedCollateral
        expect(await loans.usedCollateral(user1.address)).to.equal(0);

        // check all minted token
        expect(await token.totalSupply()).to.equal(0);
    });

    describe("# NFT", function () {
        it("mint NFt AIRdrop ", async () => {
            const leaf = ethers.utils.solidityPack(["address", "uint256"], [user1.address, targetTokenId]);
            const leaves = [leaf, user2.address, user3.address];
            const leafsNode = leaves.map((addr) => keccak256(addr));

            const merkleTree = new MerkleTree(leafsNode, keccak256, { sortPairs: true });
            const merkleRoot = "0x" + merkleTree.getRoot().toString("hex");

            expect(await nft.merkleRoot()).to.equal(merkleRoot);

            const claimerLeaf = leafsNode[0];
            const hexProof = merkleTree.getHexProof(claimerLeaf);

            await nft.connect(user1).mintAirdrops(targetTokenId, hexProof);
            expect(await nft.balanceOf(user1.address)).to.equal(1);
        });

        it("Revert when token minted from air drop logic", async () => {
            const leaf = ethers.utils.solidityPack(["address", "uint256"], [user1.address, targetTokenId]);
            const leaves = [leaf, user2.address, user3.address];
            const leafsNode = leaves.map((addr) => keccak256(addr));

            const merkleTree = new MerkleTree(leafsNode, keccak256, { sortPairs: true });
            const merkleRoot = "0x" + merkleTree.getRoot().toString("hex");

            expect(await nft.merkleRoot()).to.equal(merkleRoot);

            const claimerLeaf = leafsNode[0];
            const hexProof = merkleTree.getHexProof(claimerLeaf);

            await nft.connect(user1).mintAirdrops(targetTokenId, hexProof);
            expect(await nft.balanceOf(user1.address)).to.equal(1);

            await expect(nft.connect(user2).mintBuyWithETH({ value: price })).to.be.rejectedWith(
                "ERC721: token already minted"
            );
        });

        it("Revert with 'Price cannot be 0'", async () => {
            await expect(nft.connect(owner).setPrice(0)).to.be.rejectedWith("Price cannot be 0");
        });
    });

    describe("# TOKEN", function () {
        it("mint NFt AIRdrop ", async () => {
            const addr = AddressZero;
            await expect(token.setLoans(addr)).to.be.rejectedWith("Zero Address");
        });
    });
});
