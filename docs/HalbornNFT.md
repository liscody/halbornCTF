# Solidity API

## HalbornNFT

### merkleRoot

```solidity
bytes32 merkleRoot
```

### price

```solidity
uint256 price
```

### idCounter

```solidity
uint256 idCounter
```

### initialize

```solidity
function initialize(bytes32 merkleRoot_, uint256 price_) external
```

### setPrice

```solidity
function setPrice(uint256 price_) public
```

### setMerkleRoot

```solidity
function setMerkleRoot(bytes32 merkleRoot_) public
```

### mintAirdrops

```solidity
function mintAirdrops(uint256 id, bytes32[] merkleProof) external
```

### mintBuyWithETH

```solidity
function mintBuyWithETH() external payable
```

### withdrawETH

```solidity
function withdrawETH(uint256 amount) external
```

### _authorizeUpgrade

```solidity
function _authorizeUpgrade(address) internal
```

