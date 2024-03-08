# Solidity API

## HalbornLoans

### token

```solidity
contract HalbornToken token
```

### nft

```solidity
contract HalbornNFT nft
```

### collateralPrice

```solidity
uint256 collateralPrice
```

### totalCollateral

```solidity
mapping(address => uint256) totalCollateral
```

### usedCollateral

```solidity
mapping(address => uint256) usedCollateral
```

### idsCollateral

```solidity
mapping(uint256 => address) idsCollateral
```

### constructor

```solidity
constructor(uint256 collateralPrice_) public
```

### initialize

```solidity
function initialize(address token_, address nft_) public
```

### depositNFTCollateral

```solidity
function depositNFTCollateral(uint256 id) external
```

### withdrawCollateral

```solidity
function withdrawCollateral(uint256 id) external
```

### getLoan

```solidity
function getLoan(uint256 amount) external
```

### returnLoan

```solidity
function returnLoan(uint256 amount) external
```

### _authorizeUpgrade

```solidity
function _authorizeUpgrade(address) internal
```

